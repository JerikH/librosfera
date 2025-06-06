// Database/services/carritoService.js (CORREGIDO)
const mongoose = require('mongoose');
const { Carrito, Cliente, Inventario } = require('../models');
const CarritoItem = require('../models/carritoItemsModel');
const Libro = require('../models/libroModel');

/**
 * Servicio de Carrito con Sistema de Reservas Automáticas
 */
const carritoService = {
  /**
   * Obtener carrito activo de un usuario (crear si no existe)
   * @param {String} idUsuario - ID del usuario
   * @returns {Promise<Object>} Carrito del usuario
   */
  async obtenerCarritoUsuario(idUsuario) {
    try {
      console.log('Obteniendo carrito para usuario:', idUsuario);
      
      if (!mongoose.Types.ObjectId.isValid(idUsuario)) {
        throw new Error('ID de usuario inválido');
      }
      
      // Verificar que el usuario existe y es cliente
      const usuario = await Cliente.findById(idUsuario);
      if (!usuario) {
        throw new Error('Usuario no encontrado o no es cliente');
      }
      
      let carrito = await Carrito.obtenerCarritoActivo(idUsuario);
      
      // Obtener items del carrito
      const items = await CarritoItem.obtenerItemsCarrito(carrito._id);
      
      // Verificar y limpiar items expirados o con problemas
      await this._verificarYLimpiarItemsCarrito(carrito._id, items);
      
      // Verificar problemas en items
      await carrito.verificarProblemas();
      
      // Actualizar totales
      await carrito.actualizarTotales();
      
      return {
        carrito: carrito.toObject(),
        items: items.map(item => item.toObject())
      };
    } catch (error) {
      console.error('Error obteniendo carrito:', error);
      throw error;
    }
  },

  /**
   * Agregar un libro al carrito CON RESERVA AUTOMÁTICA
   * @param {String} idUsuario - ID del usuario
   * @param {String} idLibro - ID del libro
   * @param {Number} cantidad - Cantidad a agregar
   * @returns {Promise<Object>} Resultado de la operación
   */
  async agregarLibroAlCarrito(idUsuario, idLibro, cantidad = 1) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log(`Agregando ${cantidad} del libro ${idLibro} al carrito del usuario ${idUsuario}`);
      
      // Validaciones básicas
      if (!mongoose.Types.ObjectId.isValid(idUsuario) || !mongoose.Types.ObjectId.isValid(idLibro)) {
        throw new Error('IDs inválidos');
      }
      
      if (cantidad < 1 || cantidad > 3) {
        throw new Error('La cantidad debe estar entre 1 y 3');
      }
      
      // Verificar que el libro existe y está disponible
      const libro = await Libro.findById(idLibro).session(session);
      if (!libro) {
        throw new Error('Libro no encontrado');
      }
      
      if (!libro.activo) {
        throw new Error('El libro no está disponible');
      }

      // Obtener inventario (preferiblemente de la tienda más cercana o con más stock)
      const inventario = await this._obtenerMejorInventarioDisponible(idLibro, cantidad, session);
      
      if (!inventario) {
        throw new Error(`No hay stock suficiente de "${libro.titulo}" en ninguna tienda`);
      }
      
      // Obtener carrito del usuario
      const carrito = await Carrito.obtenerCarritoActivo(idUsuario);
      
      // Verificar límite de libros diferentes
      const librosDiferentes = await CarritoItem.distinct('id_libro', { id_carrito: carrito._id });
      if (librosDiferentes.length >= 5 && !librosDiferentes.some(id => id.equals(idLibro))) {
        throw new Error('No se pueden agregar más de 5 libros diferentes al carrito');
      }
      
      // Verificar si el libro ya está en el carrito
      const itemExistente = await CarritoItem.libroEnCarrito(carrito._id, idLibro);
      
      if (itemExistente) {
        // Actualizar cantidad del item existente
        const nuevaCantidad = itemExistente.cantidad + cantidad;
        if (nuevaCantidad > 3) {
          throw new Error('No se pueden tener más de 3 ejemplares del mismo libro');
        }
        
        // Verificar que hay suficiente stock disponible para la nueva cantidad total
        const reservaActual = await this._obtenerReservaExistente(carrito._id, idLibro, session);
        const stockNecesario = nuevaCantidad - (reservaActual?.cantidad || 0);
        
        if (stockNecesario > 0 && inventario.stock_disponible < stockNecesario) {
          throw new Error(`Stock insuficiente. Disponible: ${inventario.stock_disponible}, necesario: ${stockNecesario}`);
        }
        
        // Reservar stock adicional si es necesario
        if (stockNecesario > 0) {
          await inventario.reservarEjemplares(
            stockNecesario,
            idUsuario,
            carrito._id,
            `Carrito - aumentar cantidad de ${itemExistente.cantidad} a ${nuevaCantidad}`
          );
        }
        
        await itemExistente.actualizarCantidad(nuevaCantidad);
        console.log(`Cantidad actualizada a ${nuevaCantidad} y stock reservado`);
      } else {
        // Crear nuevo item en el carrito
        
        // RESERVAR STOCK PRIMERO
        await inventario.reservarEjemplares(
          cantidad,
          idUsuario,
          carrito._id,
          `Carrito - agregar ${cantidad} ejemplar(es) de "${libro.titulo}"`
        );
        
        // Crear item con estructura de precios
        const precioBase = libro.precio_info?.precio_base || libro.precio;
        
        const nuevoItem = new CarritoItem({
          id_carrito: carrito._id,
          id_libro: idLibro,
          cantidad: cantidad,
          precios: {
            precio_base: precioBase,
            precio_con_descuentos: precioBase,
            precio_con_impuestos: precioBase,
            impuesto: {
              tipo: 'ninguno',
              porcentaje: 0,
              valor_impuesto: 0
            },
            total_descuentos: 0
          },
          metadatos: {
            titulo_libro: libro.titulo,
            autor_libro: libro.autor_nombre_completo,
            imagen_portada: libro.imagen_portada,
            isbn: libro.ISBN,
            disponible: true,
            id_tienda_reservado: inventario.id_tienda // Guardar qué tienda tiene la reserva
          }
        });
        
        // Calcular precios con descuentos automáticos e impuestos
        try {
          await nuevoItem.calcularPrecios([]);
          console.log('Precios calculados exitosamente');
        } catch (precioError) {
          console.error('Error calculando precios:', precioError);
          // Si hay error en precios, liberar la reserva antes de fallar
          await inventario.liberarReserva(
            cantidad,
            idUsuario,
            carrito._id,
            'Error calculando precios - liberando reserva'
          );
          throw new Error(`Error calculando precios: ${precioError.message}`);
        }
        
        await nuevoItem.save({ session });
        console.log('Nuevo item agregado al carrito con stock reservado');
      }
      
      // Actualizar totales del carrito
      await carrito.actualizarTotales();
      
      await session.commitTransaction();
      
      return {
        exito: true,
        mensaje: `${cantidad} ejemplar(es) agregado(s) al carrito y reservado(s)`,
        carrito: carrito.toObject(),
        stock_info: {
          stock_reservado: cantidad,
          tienda_reserva: inventario.id_tienda
        }
      };
    } catch (error) {
      await session.abortTransaction();
      console.error('Error agregando libro al carrito:', error);
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Actualizar cantidad de un item en el carrito CON MANEJO DE RESERVAS
   * @param {String} idUsuario - ID del usuario
   * @param {String} idLibro - ID del libro
   * @param {Number} nuevaCantidad - Nueva cantidad
   * @returns {Promise<Object>} Resultado de la operación
   */
  async actualizarCantidadItem(idUsuario, idLibro, nuevaCantidad) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log(`Actualizando cantidad del libro ${idLibro} a ${nuevaCantidad}`);
      
      if (nuevaCantidad < 0 || nuevaCantidad > 3) {
        throw new Error('La cantidad debe estar entre 0 y 3');
      }
      
      const carrito = await Carrito.obtenerCarritoActivo(idUsuario);
      const item = await CarritoItem.libroEnCarrito(carrito._id, idLibro);
      
      if (!item) {
        throw new Error('Item no encontrado en el carrito');
      }
      
      const cantidadAnterior = item.cantidad;
      
      if (nuevaCantidad === 0) {
        // Eliminar item del carrito - LIBERAR TODA LA RESERVA
        await this._liberarReservaCompleta(carrito._id, idLibro, idUsuario, session);
        await CarritoItem.findByIdAndDelete(item._id).session(session);
        console.log('Item eliminado del carrito y reserva liberada');
      } else {
        // Actualizar cantidad - AJUSTAR RESERVA
        const diferencia = nuevaCantidad - cantidadAnterior;
        
        if (diferencia > 0) {
          // Aumentar cantidad - necesita más reserva
          const inventario = await this._obtenerInventarioDeReserva(carrito._id, idLibro, session);
          if (!inventario || inventario.stock_disponible < diferencia) {
            throw new Error(`Stock insuficiente para aumentar cantidad. Disponible: ${inventario?.stock_disponible || 0}`);
          }
          
          await inventario.reservarEjemplares(
            diferencia,
            idUsuario,
            carrito._id,
            `Carrito - aumentar de ${cantidadAnterior} a ${nuevaCantidad}`
          );
        } else if (diferencia < 0) {
          // Disminuir cantidad - liberar parte de la reserva
          const cantidadALiberar = Math.abs(diferencia);
          const inventario = await this._obtenerInventarioDeReserva(carrito._id, idLibro, session);
          
          if (inventario) {
            await inventario.liberarReserva(
              cantidadALiberar,
              idUsuario,
              carrito._id,
              `Carrito - disminuir de ${cantidadAnterior} a ${nuevaCantidad}`
            );
          }
        }
        
        await item.actualizarCantidad(nuevaCantidad);
        console.log(`Cantidad actualizada a ${nuevaCantidad} y reserva ajustada`);
      }
      
      // Actualizar totales del carrito
      await carrito.actualizarTotales();
      
      await session.commitTransaction();
      
      return {
        exito: true,
        mensaje: nuevaCantidad === 0 ? 'Item eliminado del carrito' : `Cantidad actualizada a ${nuevaCantidad}`,
        carrito: carrito.toObject()
      };
    } catch (error) {
      await session.abortTransaction();
      console.error('Error actualizando cantidad:', error);
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Quitar un libro del carrito CON LIBERACIÓN DE RESERVA
   * @param {String} idUsuario - ID del usuario
   * @param {String} idLibro - ID del libro
   * @returns {Promise<Object>} Resultado de la operación
   */
  async quitarLibroDelCarrito(idUsuario, idLibro) {
    try {
      return await this.actualizarCantidadItem(idUsuario, idLibro, 0);
    } catch (error) {
      console.error('Error quitando libro del carrito:', error);
      throw error;
    }
  },

  /**
   * Vaciar carrito de un usuario CON LIBERACIÓN DE TODAS LAS RESERVAS
   * @param {String} idUsuario - ID del usuario
   * @returns {Promise<Object>} Resultado de la operación
   */
  async vaciarCarrito(idUsuario) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log('Vaciando carrito del usuario:', idUsuario);
      
      const carrito = await Carrito.obtenerCarritoActivo(idUsuario);
      const items = await CarritoItem.find({ id_carrito: carrito._id }).session(session);
      
      // Liberar todas las reservas
      for (const item of items) {
        await this._liberarReservaCompleta(carrito._id, item.id_libro, idUsuario, session);
      }
      
      // Vaciar carrito
      await carrito.vaciar();
      
      await session.commitTransaction();
      
      console.log(`Carrito vaciado y ${items.length} reservas liberadas`);
      
      return {
        exito: true,
        mensaje: 'Carrito vaciado exitosamente y reservas liberadas',
        reservas_liberadas: items.length,
        carrito: carrito.toObject()
      };
    } catch (error) {
      await session.abortTransaction();
      console.error('Error vaciando carrito:', error);
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Confirmar compra - CONVERTIR RESERVAS EN VENTAS
   * @param {String} idUsuario - ID del usuario
   * @param {Object} datosVenta - Datos de la venta
   * @returns {Promise<Object>} Resultado de la operación
   */
  async confirmarCompra(idUsuario, datosVenta) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log('Confirmando compra y convirtiendo reservas en ventas');
      
      const carrito = await Carrito.obtenerCarritoActivo(idUsuario);
      const items = await CarritoItem.find({ id_carrito: carrito._id }).session(session);
      
      if (items.length === 0) {
        throw new Error('El carrito está vacío');
      }
      
      // Convertir todas las reservas en ventas definitivas
      for (const item of items) {
        const inventario = await this._obtenerInventarioDeReserva(carrito._id, item.id_libro, session);
        
        if (inventario && inventario.stock_reservado >= item.cantidad) {
          // Registrar salida definitiva (reduce del stock reservado)
          await inventario.registrarSalida(
            item.cantidad,
            'venta',
            idUsuario,
            null, // Se completará con el ID de transacción después
            `Venta confirmada desde carrito ${carrito._id}`
          );
        } else {
          throw new Error(`Error en reserva del libro: ${item.metadatos.titulo_libro}`);
        }
      }
      
      await session.commitTransaction();
      
      console.log('Reservas convertidas en ventas exitosamente');
      
      return {
        exito: true,
        mensaje: 'Compra confirmada y stock actualizado',
        items_procesados: items.length
      };
    } catch (error) {
      await session.abortTransaction();
      console.error('Error confirmando compra:', error);
      throw error;
    } finally {
      session.endSession();
    }
  },

  // ==========================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ==========================================

  /**
   * Obtener el mejor inventario disponible para un libro
   * @private
   */
  async _obtenerMejorInventarioDisponible(idLibro, cantidad, session) {
    const inventarios = await Inventario.find({
      id_libro: idLibro,
      stock_disponible: { $gte: cantidad },
      estado: 'disponible'
    })
    .populate('id_tienda', 'estado nombre')
    .session(session)
    .sort({ stock_disponible: -1 }); // Priorizar tiendas con más stock
    
    // Filtrar solo tiendas activas
    const inventariosActivos = inventarios.filter(inv => 
      inv.id_tienda && inv.id_tienda.estado === 'activa'
    );
    
    return inventariosActivos.length > 0 ? inventariosActivos[0] : null;
  },

  /**
   * Obtener inventario donde está la reserva
   * @private
   */
  async _obtenerInventarioDeReserva(idCarrito, idLibro, session) {
    // Buscar en los movimientos de inventario cuál tienda tiene la reserva de este carrito
    const inventarios = await Inventario.find({
      id_libro: idLibro,
      'movimientos': {
        $elemMatch: {
          tipo: 'reserva',
          id_reserva: idCarrito
        }
      }
    }).session(session);
    
    return inventarios.length > 0 ? inventarios[0] : null;
  },

  /**
   * Obtener reserva existente de un carrito para un libro
   * @private
   */
  async _obtenerReservaExistente(idCarrito, idLibro, session) {
    const inventario = await this._obtenerInventarioDeReserva(idCarrito, idLibro, session);
    
    if (!inventario) return null;
    
    // Calcular cantidad reservada sumando movimientos de reserva
    let cantidadReservada = 0;
    
    for (const movimiento of inventario.movimientos) {
      if (movimiento.id_reserva && movimiento.id_reserva.equals(idCarrito)) {
        if (movimiento.tipo === 'reserva') {
          cantidadReservada += movimiento.cantidad;
        } else if (movimiento.tipo === 'liberacion_reserva') {
          cantidadReservada -= movimiento.cantidad;
        }
      }
    }
    
    return {
      inventario,
      cantidad: cantidadReservada
    };
  },

  /**
   * Liberar reserva completa de un libro en el carrito
   * @private
   */
  async _liberarReservaCompleta(idCarrito, idLibro, idUsuario, session) {
    const reservaInfo = await this._obtenerReservaExistente(idCarrito, idLibro, session);
    
    if (reservaInfo && reservaInfo.cantidad > 0) {
      await reservaInfo.inventario.liberarReserva(
        reservaInfo.cantidad,
        idUsuario,
        idCarrito,
        `Carrito - eliminar item completamente`
      );
      
      console.log(`Liberada reserva de ${reservaInfo.cantidad} para libro ${idLibro}`);
    }
  },

  /**
   * Verificar y limpiar items del carrito con problemas
   * @private
   */
  async _verificarYLimpiarItemsCarrito(idCarrito, items) {
    try {
      for (const item of items) {
        // Verificar si el libro sigue existiendo y activo
        const libro = await Libro.findById(item.id_libro);
        
        if (!libro || !libro.activo) {
          console.log(`Eliminando item de libro inactivo/eliminado: ${item.id_libro}`);
          await this._liberarReservaCompleta(idCarrito, item.id_libro, item.id_carrito, null);
          await CarritoItem.findByIdAndDelete(item._id);
          continue;
        }
        
        // Verificar si aún hay reserva válida
        const reservaInfo = await this._obtenerReservaExistente(idCarrito, item.id_libro, null);
        
        if (!reservaInfo || reservaInfo.cantidad < item.cantidad) {
          console.log(`Problema con reserva del item ${item.id_libro}, actualizando...`);
          // Aquí podrías intentar re-reservar o eliminar el item
          // Por simplicidad, marcaremos el item como con problemas
          item.estado = 'sin_stock';
          item.mensaje_precio = 'Problema con la reserva - verificar disponibilidad';
          await item.save();
        }
      }
    } catch (error) {
      console.error('Error verificando items del carrito:', error);
    }
  },

  // ==========================================
  // MÉTODOS EXISTENTES (mantenidos)
  // ==========================================

  async aplicarCodigoDescuento(idUsuario, codigoDescuento) {
    try {
      console.log(`Aplicando código ${codigoDescuento} al carrito del usuario ${idUsuario}`);
      
      const carrito = await Carrito.obtenerCarritoActivo(idUsuario);
      
      if (carrito.n_item === 0) {
        throw new Error('No se puede aplicar código a un carrito vacío');
      }
      
      const yaAplicado = carrito.codigos_carrito.some(c => c.codigo === codigoDescuento);
      if (yaAplicado) {
        throw new Error('Este código ya está aplicado al carrito');
      }
      
      const resultado = await carrito.aplicarCodigoDescuento(codigoDescuento);
      
      return {
        exito: true,
        mensaje: resultado.mensaje,
        items_afectados: resultado.items_afectados,
        descuento_aplicado: resultado.descuento_aplicado,
        carrito: carrito.toObject()
      };
    } catch (error) {
      console.error('Error aplicando código:', error);
      throw error;
    }
  },

  async quitarCodigoDescuento(idUsuario, codigoDescuento) {
    try {
      console.log(`Quitando código ${codigoDescuento} del carrito del usuario ${idUsuario}`);
      
      const carrito = await Carrito.obtenerCarritoActivo(idUsuario);
      const resultado = await carrito.quitarCodigoDescuento(codigoDescuento);
      
      return {
        exito: true,
        mensaje: resultado.mensaje,
        items_afectados: resultado.items_afectados,
        carrito: carrito.toObject()
      };
    } catch (error) {
      console.error('Error quitando código:', error);
      throw error;
    }
  },

  async confirmarCambiosPrecio(idUsuario, idLibro = null) {
    try {
      console.log(`Confirmando cambios de precio para usuario ${idUsuario}`);
      
      const carrito = await Carrito.obtenerCarritoActivo(idUsuario);
      let query = { id_carrito: carrito._id, precio_cambiado: true };
      
      if (idLibro) {
        query.id_libro = idLibro;
      }
      
      const itemsConCambios = await CarritoItem.find(query);
      
      if (itemsConCambios.length === 0) {
        throw new Error('No hay cambios de precio pendientes');
      }
      
      let itemsConfirmados = 0;
      for (const item of itemsConCambios) {
        await item.confirmarCambioPrecio();
        itemsConfirmados++;
      }
      
      await carrito.actualizarTotales();
      
      return {
        exito: true,
        mensaje: `${itemsConfirmados} item(s) confirmado(s)`,
        items_confirmados: itemsConfirmados,
        carrito: carrito.toObject()
      };
    } catch (error) {
      console.error('Error confirmando cambios de precio:', error);
      throw error;
    }
  },

  async calcularTotalCarrito(idUsuario) {
    try {
      const carrito = await Carrito.obtenerCarritoActivo(idUsuario);
      await carrito.actualizarTotales();
      
      const stats = await CarritoItem.obtenerEstadisticasItems(carrito._id);
      
      return {
        totales: carrito.totales,
        subtotal: carrito.subtotal,
        descuentos: carrito.total_descuentos,
        costo_envio: carrito.info_envio?.costo_envio || 0,
        total: carrito.total,
        cantidad_items: stats.total_items,
        libros_diferentes: carrito.n_libros_diferentes,
        codigos_aplicados: carrito.codigos_carrito,
        problemas: {
          precio_cambiado: stats.items_con_precio_cambiado,
          sin_stock: stats.items_sin_stock
        }
      };
    } catch (error) {
      console.error('Error calculando total:', error);
      throw error;
    }
  },

  // Métodos administrativos mantenidos iguales...
  async listarCarritos(filtros = {}, pagina = 1, limite = 10) {
    try {
      console.log('Listando carritos con filtros:', JSON.stringify(filtros, null, 2));
      
      const skip = (pagina - 1) * limite;
      const query = {};
      
      if (filtros.estado) query.estado = filtros.estado;
      if (filtros.usuario) {
        const usuarios = await Cliente.find({
          $or: [
            { email: { $regex: filtros.usuario, $options: 'i' } },
            { nombres: { $regex: filtros.usuario, $options: 'i' } }
          ]
        }).select('_id');
        
        query.id_usuario = { $in: usuarios.map(u => u._id) };
      }
      
      if (filtros.fecha_desde) {
        query.fecha_creacion = { $gte: new Date(filtros.fecha_desde) };
      }
      
      if (filtros.fecha_hasta) {
        if (!query.fecha_creacion) query.fecha_creacion = {};
        query.fecha_creacion.$lte = new Date(filtros.fecha_hasta);
      }
      
      const total = await Carrito.countDocuments(query);
      const carritos = await Carrito.find(query)
        .populate('id_usuario', 'email nombres apellidos')
        .skip(skip)
        .limit(limite)
        .sort({ ultima_actualizacion: -1 });
      
      const totalPaginas = Math.ceil(total / limite) || 1;
      
      return {
        datos: carritos.map(c => c.toObject()),
        paginacion: {
          total,
          pagina,
          limite,
          totalPaginas
        }
      };
    } catch (error) {
      console.error('Error listando carritos:', error);
      throw error;
    }
  },

  async obtenerEstadisticasAdmin() {
    try {
      console.log('Obteniendo estadísticas administrativas de carritos');
      
      const estadisticasGenerales = await Carrito.obtenerEstadisticasAdmin();
      const libroMasPopular = await Carrito.obtenerLibroMasPopular();
      const carritosAbandonados = await Carrito.obtenerCarritosAbandonados();
      
      const totalProductosEnCarritos = await CarritoItem.aggregate([
        { $group: { _id: null, total: { $sum: '$cantidad' } } }
      ]);
      
      const valorPotencialTotal = await Carrito.aggregate([
        { $match: { estado: 'activo' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);
      
      return {
        estadisticas_generales: estadisticasGenerales,
        libro_mas_popular: libroMasPopular,
        carritos_abandonados: carritosAbandonados.length,
        total_productos_en_carritos: totalProductosEnCarritos.length > 0 ? totalProductosEnCarritos[0].total : 0,
        valor_potencial_total: valorPotencialTotal.length > 0 ? valorPotencialTotal[0].total : 0
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas admin:', error);
      throw error;
    }
  },

  async quitarProductoDeCarritos(idLibro, razon = 'Producto descontinuado') {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      console.log(`Quitando libro ${idLibro} de todos los carritos. Razón: ${razon}`);
      
      const items = await CarritoItem.find({ id_libro: idLibro }).session(session);
      const carritosAfectados = [...new Set(items.map(item => item.id_carrito.toString()))];
      
      // Liberar todas las reservas antes de eliminar los items
      for (const item of items) {
        await this._liberarReservaCompleta(item.id_carrito, idLibro, null, session);
      }
      
      await CarritoItem.deleteMany({ id_libro: idLibro }).session(session);
      
      for (const idCarrito of carritosAfectados) {
        const carrito = await Carrito.findById(idCarrito).session(session);
        if (carrito) {
          await carrito.actualizarTotales();
        }
      }
      
      await session.commitTransaction();
      
      console.log(`Libro eliminado de ${carritosAfectados.length} carritos y reservas liberadas`);
      
      return {
        exito: true,
        mensaje: `Producto eliminado de ${carritosAfectados.length} carritos y reservas liberadas`,
        carritos_afectados: carritosAfectados.length,
        items_eliminados: items.length
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async vaciarCarritoCliente(idUsuario) {
    try {
      console.log('Admin vaciando carrito del usuario:', idUsuario);
      return await this.vaciarCarrito(idUsuario); // Usar el método que ya maneja reservas
    } catch (error) {
      console.error('Error vaciando carrito de cliente:', error);
      throw error;
    }
  },

  async vaciarTodosLosCarritos() {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      console.log('Vaciando todos los carritos activos');
      
      const carritosActivos = await Carrito.find({ estado: 'activo' }).session(session);
      let totalReservasLiberadas = 0;
      
      for (const carrito of carritosActivos) {
        const items = await CarritoItem.find({ id_carrito: carrito._id }).session(session);
        
        // Liberar todas las reservas
        for (const item of items) {
          await this._liberarReservaCompleta(carrito._id, item.id_libro, null, session);
          totalReservasLiberadas++;
        }
        
        await carrito.vaciar();
      }
      
      await session.commitTransaction();
      
      console.log(`${carritosActivos.length} carritos vaciados y ${totalReservasLiberadas} reservas liberadas`);
      
      return {
        exito: true,
        mensaje: `${carritosActivos.length} carritos vaciados exitosamente y ${totalReservasLiberadas} reservas liberadas`,
        carritos_afectados: carritosActivos.length,
        reservas_liberadas: totalReservasLiberadas
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async obtenerProductoMasPopular() {
    try {
      console.log('Obteniendo producto más popular en carritos');
      
      const resultado = await Carrito.obtenerLibroMasPopular();
      
      if (!resultado) {
        return {
          mensaje: 'No hay productos en carritos actualmente'
        };
      }
      
      return {
        libro: resultado.libro[0],
        estadisticas: {
          total_en_carritos: resultado.total_en_carritos,
          carritos_diferentes: resultado.carritos_diferentes
        }
      };
    } catch (error) {
      console.error('Error obteniendo producto más popular:', error);
      throw error;
    }
  }
};

module.exports = carritoService;