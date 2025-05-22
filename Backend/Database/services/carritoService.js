// Database/services/carritoService.js
const mongoose = require('mongoose');
const { Carrito, Cliente } = require('../models');
const CarritoItem = require('../models/carritoItemsModel');
const Libro = require('../models/libroModel');

/**
 * Servicio de Carrito
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
   * Agregar un libro al carrito
   * @param {String} idUsuario - ID del usuario
   * @param {String} idLibro - ID del libro
   * @param {Number} cantidad - Cantidad a agregar
   * @returns {Promise<Object>} Resultado de la operación
   */
  async agregarLibroAlCarrito(idUsuario, idLibro, cantidad = 1) {
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
      const libro = await Libro.findById(idLibro);
      if (!libro) {
        throw new Error('Libro no encontrado');
      }
      
      console.log('Libro encontrado:', {
        id: libro._id,
        titulo: libro.titulo,
        precio: libro.precio,
        precio_info: libro.precio_info ? 'Tiene precio_info' : 'No tiene precio_info',
        stock: libro.stock,
        activo: libro.activo
      });
      
      if (!libro.activo) {
        throw new Error('El libro no está disponible');
      }
      
      if (libro.stock < cantidad) {
        throw new Error(`Stock insuficiente. Disponible: ${libro.stock}`);
      }
      
      // Obtener carrito del usuario
      const carrito = await Carrito.obtenerCarritoActivo(idUsuario);
      console.log('Carrito obtenido:', {
        id: carrito._id,
        id_usuario: carrito.id_usuario,
        n_item: carrito.n_item
      });
      
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
        
        await itemExistente.actualizarCantidad(nuevaCantidad);
        console.log(`Cantidad actualizada a ${nuevaCantidad}`);
      } else {
        // Crear nuevo item en el carrito con estructura de precios inicial
        const precioBase = libro.precio_info?.precio_base || libro.precio;
        console.log('Precio base determinado:', precioBase);
        
        const nuevoItem = new CarritoItem({
          id_carrito: carrito._id,
          id_libro: idLibro,
          cantidad: cantidad,
          precios: {
            precio_base: precioBase,
            precio_con_descuentos: precioBase, // Se calculará automáticamente
            precio_con_impuestos: precioBase, // Se calculará automáticamente
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
            disponible: libro.stock > 0
          }
        });
        
        console.log('Nuevo item creado, calculando precios...');
        
        // Calcular precios con descuentos automáticos e impuestos
        try {
          await nuevoItem.calcularPrecios([]);
          console.log('Precios calculados exitosamente');
        } catch (precioError) {
          console.error('Error calculando precios:', precioError);
          // Continuar con precios básicos si hay error
          nuevoItem.precios.precio_con_descuentos = precioBase;
          nuevoItem.precios.precio_con_impuestos = precioBase;
          await nuevoItem.save();
        }
        
        console.log('Nuevo item agregado al carrito:');
        console.log(`- Precio base: $${nuevoItem.precios.precio_base}`);
        console.log(`- Precio con descuentos: $${nuevoItem.precios.precio_con_descuentos}`);
        console.log(`- Precio con impuestos: $${nuevoItem.precios.precio_con_impuestos}`);
        console.log(`- Subtotal: $${nuevoItem.subtotal}`);
      }
      
      console.log('Actualizando totales del carrito...');
      // Actualizar totales del carrito
      await carrito.actualizarTotales();
      console.log('Totales actualizados exitosamente');
      
      return {
        exito: true,
        mensaje: `${cantidad} ejemplar(es) agregado(s) al carrito`,
        carrito: carrito.toObject()
      };
    } catch (error) {
      console.error('Error agregando libro al carrito:', error);
      throw error;
    }
  },

  /**
   * Actualizar cantidad de un item en el carrito
   * @param {String} idUsuario - ID del usuario
   * @param {String} idLibro - ID del libro
   * @param {Number} nuevaCantidad - Nueva cantidad
   * @returns {Promise<Object>} Resultado de la operación
   */
  async actualizarCantidadItem(idUsuario, idLibro, nuevaCantidad) {
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
      
      if (nuevaCantidad === 0) {
        // Eliminar item del carrito
        await CarritoItem.findByIdAndDelete(item._id);
        console.log('Item eliminado del carrito');
      } else {
        // Actualizar cantidad
        await item.actualizarCantidad(nuevaCantidad);
        console.log(`Cantidad actualizada a ${nuevaCantidad}`);
      }
      
      // Actualizar totales del carrito
      await carrito.actualizarTotales();
      
      return {
        exito: true,
        mensaje: nuevaCantidad === 0 ? 'Item eliminado del carrito' : `Cantidad actualizada a ${nuevaCantidad}`,
        carrito: carrito.toObject()
      };
    } catch (error) {
      console.error('Error actualizando cantidad:', error);
      throw error;
    }
  },

  /**
   * Quitar un libro del carrito
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
   * Vaciar carrito de un usuario
   * @param {String} idUsuario - ID del usuario
   * @returns {Promise<Object>} Resultado de la operación
   */
  async vaciarCarrito(idUsuario) {
    try {
      console.log('Vaciando carrito del usuario:', idUsuario);
      
      const carrito = await Carrito.obtenerCarritoActivo(idUsuario);
      await carrito.vaciar();
      
      return {
        exito: true,
        mensaje: 'Carrito vaciado exitosamente',
        carrito: carrito.toObject()
      };
    } catch (error) {
      console.error('Error vaciando carrito:', error);
      throw error;
    }
  },

  /**
   * Aplicar código de descuento al carrito
   * @param {String} idUsuario - ID del usuario
   * @param {String} codigoDescuento - Código del descuento
   * @returns {Promise<Object>} Resultado de la operación
   */
  async aplicarCodigoDescuento(idUsuario, codigoDescuento) {
    try {
      console.log(`Aplicando código ${codigoDescuento} al carrito del usuario ${idUsuario}`);
      
      const carrito = await Carrito.obtenerCarritoActivo(idUsuario);
      
      if (carrito.n_item === 0) {
        throw new Error('No se puede aplicar código a un carrito vacío');
      }
      
      // Verificar si el código ya está aplicado
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

  /**
   * Quitar código de descuento del carrito
   * @param {String} idUsuario - ID del usuario
   * @param {String} codigoDescuento - Código del descuento
   * @returns {Promise<Object>} Resultado de la operación
   */
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

  /**
   * Confirmar cambios de precio en items del carrito
   * @param {String} idUsuario - ID del usuario
   * @param {String} idLibro - ID del libro (opcional, si no se especifica confirma todos)
   * @returns {Promise<Object>} Resultado de la operación
   */
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

  /**
   * Calcular total del carrito
   * @param {String} idUsuario - ID del usuario
   * @returns {Promise<Object>} Totales del carrito
   */
  async calcularTotalCarrito(idUsuario) {
    try {
      const carrito = await Carrito.obtenerCarritoActivo(idUsuario);
      await carrito.actualizarTotales();
      
      const stats = await CarritoItem.obtenerEstadisticasItems(carrito._id);
      
      return {
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

  // MÉTODOS ADMINISTRATIVOS (simplificados, manteniendo solo los esenciales)

  /**
   * Obtener todos los carritos con filtros y paginación
   */
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

  /**
   * Obtener estadísticas de carritos para administradores
   */
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

  /**
   * Quitar un producto específico de todos los carritos
   */
  async quitarProductoDeCarritos(idLibro, razon = 'Producto descontinuado') {
    try {
      console.log(`Quitando libro ${idLibro} de todos los carritos. Razón: ${razon}`);
      
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        const items = await CarritoItem.find({ id_libro: idLibro }).session(session);
        const carritosAfectados = [...new Set(items.map(item => item.id_carrito.toString()))];
        
        await CarritoItem.deleteMany({ id_libro: idLibro }).session(session);
        
        for (const idCarrito of carritosAfectados) {
          const carrito = await Carrito.findById(idCarrito).session(session);
          if (carrito) {
            await carrito.actualizarTotales();
          }
        }
        
        await session.commitTransaction();
        session.endSession();
        
        console.log(`Libro eliminado de ${carritosAfectados.length} carritos`);
        
        return {
          exito: true,
          mensaje: `Producto eliminado de ${carritosAfectados.length} carritos`,
          carritos_afectados: carritosAfectados.length,
          items_eliminados: items.length
        };
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error('Error quitando producto de carritos:', error);
      throw error;
    }
  },

  /**
   * Vaciar carrito de un cliente específico (admin)
   */
  async vaciarCarritoCliente(idUsuario) {
    try {
      console.log('Admin vaciando carrito del usuario:', idUsuario);
      
      const carrito = await Carrito.findOne({ id_usuario: idUsuario, estado: 'activo' });
      if (!carrito) {
        throw new Error('Carrito no encontrado');
      }
      
      await carrito.vaciar();
      
      return {
        exito: true,
        mensaje: 'Carrito del cliente vaciado exitosamente',
        carrito: carrito.toObject()
      };
    } catch (error) {
      console.error('Error vaciando carrito de cliente:', error);
      throw error;
    }
  },

  /**
   * Vaciar todos los carritos activos
   */
  async vaciarTodosLosCarritos() {
    try {
      console.log('Vaciando todos los carritos activos');
      
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        const carritosActivos = await Carrito.find({ estado: 'activo' }).session(session);
        
        for (const carrito of carritosActivos) {
          await carrito.vaciar();
        }
        
        await session.commitTransaction();
        session.endSession();
        
        console.log(`${carritosActivos.length} carritos vaciados`);
        
        return {
          exito: true,
          mensaje: `${carritosActivos.length} carritos vaciados exitosamente`,
          carritos_afectados: carritosActivos.length
        };
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error('Error vaciando todos los carritos:', error);
      throw error;
    }
  },

  /**
   * Obtener el producto más popular en carritos
   */
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