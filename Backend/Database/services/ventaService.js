// Database/services/ventaService.js (CORREGIDO)
const mongoose = require('mongoose');
const Venta = require('../models/ventaModel');
const Devolucion = require('../models/devolucionModel');
const { Carrito, CarritoItem, Libro, Inventario } = require('../models');
const tarjetaService = require('./tarjetaService');
const emailService = require('../../src/utils/emailService');

class VentaService {
  /**
   * Calcular costo de envío según el tipo
   */
  _calcularCostoEnvio(tipoEnvio) {
    const COSTO_ENVIO_DOMICILIO = 7000;
    return tipoEnvio === 'domicilio' ? COSTO_ENVIO_DOMICILIO : 0;
  }

  /**
   * Mapea y valida la dirección de envío desde el request al schema requerido
   * @private
   * @param {Object} direccionEnvio - Dirección del request
   * @returns {Object} Dirección mapeada para el schema
   */
  _mapearDireccionEnvio(direccionEnvio) {
    if (!direccionEnvio) {
      throw new Error('La dirección de envío es obligatoria');
    }

    // Mapear campos que pueden venir con nombres diferentes
    const direccionMapeada = {
      direccion_completa: direccionEnvio.calle || direccionEnvio.direccion_completa || direccionEnvio.direccion,
      ciudad: direccionEnvio.ciudad,
      departamento: direccionEnvio.departamento || direccionEnvio.estado_provincia || direccionEnvio.estado,
      codigo_postal: direccionEnvio.codigo_postal,
      pais: direccionEnvio.pais || 'Colombia',
      referencia: direccionEnvio.referencias || direccionEnvio.referencia,
      telefono_contacto: direccionEnvio.telefono_contacto || direccionEnvio.telefono
    };

    // Validar campos obligatorios
    if (!direccionMapeada.direccion_completa) {
      throw new Error('La dirección completa es obligatoria (calle, carrera, etc.)');
    }

    if (!direccionMapeada.ciudad) {
      throw new Error('La ciudad es obligatoria');
    }

    if (!direccionMapeada.departamento) {
      throw new Error('El departamento/estado es obligatorio');
    }

    console.log('Dirección mapeada:', direccionMapeada);
    
    return direccionMapeada;
  }

  /**
   * Crear una venta desde un carrito CON MANEJO CORRECTO DE STOCK RESERVADO
   */
  async crearVenta(idUsuario, datosVenta) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      console.log('Iniciando creación de venta desde carrito con stock reservado');
      
      // 1. Obtener y validar el carrito
      const carrito = await Carrito.findOne({ 
        id_usuario: idUsuario, 
        estado: 'activo' 
      }).session(session);
      
      if (!carrito || carrito.n_item === 0) {
        throw new Error('No hay un carrito activo con productos');
      }
      
      // 2. Obtener items del carrito con información completa
      const items = await CarritoItem.find({ id_carrito: carrito._id })
        .populate('id_libro')
        .session(session);
      
      if (items.length === 0) {
        throw new Error('El carrito está vacío');
      }
      
      // 3. VALIDAR QUE TODAS LAS RESERVAS ESTÉN CORRECTAS
      console.log('Validando reservas existentes...');
      for (const item of items) {
        const reservaInfo = await this._verificarReservaItem(carrito._id, item.id_libro._id, session);
        
        if (!reservaInfo.valida) {
          throw new Error(`Reserva inválida para "${item.id_libro.titulo}": ${reservaInfo.mensaje}`);
        }
        
        if (reservaInfo.cantidadReservada < item.cantidad) {
          throw new Error(`Stock reservado insuficiente para "${item.id_libro.titulo}". Reservado: ${reservaInfo.cantidadReservada}, Necesario: ${item.cantidad}`);
        }
      }
      
      // 4. Calcular costo de envío
      const costoEnvio = this._calcularCostoEnvio(datosVenta.tipo_envio);
      
      // 5. Recalcular totales considerando impuesto opcional y envío
      const totalSinEnvio = carrito.totales.total_final;
      const totalConEnvio = totalSinEnvio + costoEnvio;
      
      // 6. Manejar impuesto opcional
      let totalFinalAPagar = totalConEnvio;
      let impuestoPagadoPorCliente = false;
      let montoImpuestoExcluido = 0;
      
      if (datosVenta.cliente_pagara_impuesto === true) {
        impuestoPagadoPorCliente = true;
        montoImpuestoExcluido = carrito.totales.total_impuestos;
        totalFinalAPagar = totalConEnvio - montoImpuestoExcluido;
        
        if (totalFinalAPagar < 0) {
          totalFinalAPagar = 0;
        }
      }
      
      // 7. Validar método de pago con el monto final
      const tarjeta = await this._validarMetodoPago(
        idUsuario, 
        datosVenta.id_tarjeta, 
        totalFinalAPagar
      );

      let direccionEnvioMapeada = null;
      if (datosVenta.direccion_envio) {
        direccionEnvioMapeada = this._mapearDireccionEnvio(datosVenta.direccion_envio);
      }
      
      let infoEnvio = {};
  
      if (datosVenta.tipo_envio === 'domicilio') {
        if (!direccionEnvioMapeada) {
          throw new Error('La dirección de envío es obligatoria para envío a domicilio');
        }
        
        infoEnvio = {
          tipo: 'domicilio',
          direccion: direccionEnvioMapeada,
          costo_envio: this._calcularCostoEnvio(direccionEnvioMapeada.ciudad, direccionEnvioMapeada.departamento),
          instrucciones_entrega: datosVenta.notas_envio || '',
          estado_envio: 'ENVIADO'
        };
      } else if (datosVenta.tipo_envio === 'recogida_tienda') {
        infoEnvio = {
          tipo: 'recogida_tienda',
          id_tienda_recogida: datosVenta.id_tienda_recogida,
          costo_envio: 0,
          estado_envio: 'EN PREPARACION'
        };
      }
      
      // 8. Preparar items de la venta
      const itemsVenta = items.map(item => ({
        id_libro: item.id_libro._id,
        snapshot: {
          titulo: item.id_libro.titulo,
          autor: item.id_libro.autor_nombre_completo,
          isbn: item.id_libro.ISBN,
          editorial: item.id_libro.editorial,
          imagen_portada: item.id_libro.imagen_portada
        },
        cantidad: item.cantidad,
        precios: {
          precio_unitario_base: item.precios.precio_base,
          descuento_aplicado: item.precios.total_descuentos,
          precio_unitario_final: item.precios.precio_con_impuestos,
          impuesto: item.precios.impuesto,
          subtotal: item.subtotal
        },
        // Nuevo: información de la tienda donde está reservado
        id_tienda_origen: item.metadatos?.id_tienda_reservado
      }));
      
      // 9. Crear la venta con información de impuesto
      const nuevaVenta = new Venta({
        id_cliente: idUsuario,
        id_carrito_origen: carrito._id,
        items: itemsVenta,
        totales: {
          subtotal_sin_descuentos: carrito.totales.subtotal_base,
          total_descuentos: carrito.totales.total_descuentos,
          subtotal_con_descuentos: carrito.totales.subtotal_con_descuentos,
          total_impuestos: impuestoPagadoPorCliente ? 0 : carrito.totales.total_impuestos,
          costo_envio: costoEnvio,
          total_final: totalFinalAPagar
        },
        pago: {
          metodo: tarjeta.tipo === 'debito' ? 'tarjeta_debito' : 'tarjeta_credito',
          id_tarjeta: tarjeta.id_tarjeta,
          ultimos_digitos: tarjeta.ultimos_digitos,
          marca_tarjeta: tarjeta.marca
        },
        envio: infoEnvio,
        descuentos_aplicados: carrito.codigos_carrito?.map(c => ({
          codigo: c.codigo,
          tipo: 'codigo_promocional'
        })) || [],
        impuesto_info: {
          pagado_por_cliente: impuestoPagadoPorCliente,
          monto_excluido: montoImpuestoExcluido,
          monto_incluido: impuestoPagadoPorCliente ? 0 : carrito.totales.total_impuestos
        }
      });
      
      // 10. Guardar la venta en la base de datos
      await nuevaVenta.save({ session });
      
      // 11. Procesar el pago
      try {
        await this._procesarPago(tarjeta, totalFinalAPagar, nuevaVenta.numero_venta);
        nuevaVenta.aprobarPago();
        await nuevaVenta.save({ session });
      } catch (errorPago) {
        nuevaVenta.rechazarPago(errorPago.message);
        await nuevaVenta.save({ session });
        throw new Error(`Error procesando el pago: ${errorPago.message}`);
      }
      
      // 12. CONVERTIR RESERVAS EN VENTAS DEFINITIVAS
      console.log('Convirtiendo reservas en ventas definitivas...');
      for (const item of items) {
        await this._convertirReservaEnVenta(
          carrito._id,
          item.id_libro._id,
          item.cantidad,
          idUsuario,
          nuevaVenta._id,
          session
        );
      }
      
      // 13. Si es recogida en tienda, crear registro de recogida
      if (datosVenta.tipo_envio === 'recogida_tienda') {
        await this._crearRecogidaTienda(nuevaVenta, datosVenta.id_tienda_recogida, session);
      }
      
      // 14. Limpiar carrito
      await CarritoItem.deleteMany({ id_carrito: carrito._id }).session(session);
      carrito.estado = 'convertido_a_compra';
      carrito.n_item = 0;
      carrito.totales = {
        subtotal_base: 0,
        total_descuentos: 0,
        subtotal_con_descuentos: 0,
        total_impuestos: 0,
        costo_envio: 0,
        total_final: 0
      };
      await carrito.save({ session });
      
      // 15. Confirmar transacción
      await session.commitTransaction();
      
      console.log('Venta creada exitosamente con stock correctamente manejado');
      
      // 16. Enviar confirmación por email (no bloqueante)
      this._enviarConfirmacionCompra(nuevaVenta, idUsuario).catch(err => 
        console.error('Error enviando email de confirmación:', err)
      );
      
      return nuevaVenta;
      
    } catch (error) {
      await session.abortTransaction();
      console.error('Error creando venta:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Verificar que la reserva de un item está correcta
   * @private
   */
  async _verificarReservaItem(idCarrito, idLibro, session) {
    try {
      // Buscar inventario con reservas de este carrito
      const inventario = await Inventario.findOne({
        id_libro: idLibro,
        'movimientos': {
          $elemMatch: {
            tipo: 'reserva',
            id_reserva: idCarrito
          }
        }
      }).session(session);
      
      if (!inventario) {
        return {
          valida: false,
          mensaje: 'No se encontró reserva para este libro',
          cantidadReservada: 0
        };
      }
      
      // Calcular cantidad reservada neta
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
      
      if (cantidadReservada <= 0) {
        return {
          valida: false,
          mensaje: 'La reserva fue liberada o es inválida',
          cantidadReservada: 0
        };
      }
      
      return {
        valida: true,
        mensaje: 'Reserva válida',
        cantidadReservada,
        inventario
      };
    } catch (error) {
      console.error('Error verificando reserva:', error);
      return {
        valida: false,
        mensaje: `Error verificando reserva: ${error.message}`,
        cantidadReservada: 0
      };
    }
  }

  /**
   * Convertir reserva en venta definitiva
   * @private
   */
  async _convertirReservaEnVenta(idCarrito, idLibro, cantidad, idUsuario, idVenta, session) {
    try {
      const reservaInfo = await this._verificarReservaItem(idCarrito, idLibro, session);
      
      if (!reservaInfo.valida || !reservaInfo.inventario) {
        throw new Error(`No se puede convertir reserva en venta para libro ${idLibro}`);
      }
      
      const inventario = reservaInfo.inventario;
      
      // Registrar salida definitiva (reduce del stock reservado, no del disponible)
      await inventario.registrarSalida(
        cantidad,
        'venta',
        idUsuario,
        idVenta,
        `Venta confirmada ${idVenta} - conversión de reserva carrito ${idCarrito}`
      );
      
      console.log(`Reserva convertida en venta: ${cantidad} unidades de libro ${idLibro}`);
    } catch (error) {
      console.error('Error convirtiendo reserva en venta:', error);
      throw error;
    }
  }

  /**
   * Crear registro de recogida en tienda
   * @private
   */
  async _crearRecogidaTienda(venta, idTienda, session) {
    try {
      // Solo importar cuando se necesite para evitar dependencias circulares
      const tiendaService = require('./tiendaService');
      
      // Crear recogida desde la venta
      const recogida = await tiendaService.crearRecogidaDesdeVenta(venta, idTienda);
      
      console.log(`Recogida creada para venta ${venta.numero_venta} en tienda ${idTienda}`);
      return recogida;
    } catch (error) {
      console.error('Error creando recogida en tienda:', error);
      // No es crítico, la venta puede continuar
      throw error;
    }
  }

  /**
   * Cancelar una venta CON DEVOLUCIÓN DE STOCK
   */
  async cancelarVenta(numeroVenta, motivo, solicitadaPor, idUsuario) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const venta = await Venta.findOne({ numero_venta: numeroVenta }).session(session);
      
      if (!venta) {
        throw new Error('Venta no encontrada');
      }
      
      // Validar permisos
      if (solicitadaPor === 'cliente' && venta.id_cliente.toString() !== idUsuario) {
        throw new Error('No tienes permisos para cancelar esta venta');
      }
      
      // Cancelar la venta (sin guardar)
      venta.cancelarVenta(motivo, solicitadaPor, idUsuario);
      
      // Guardar los cambios con la sesión
      await venta.save({ session });
      
      // Si el pago fue aprobado, procesar reembolso
      if (venta.pago.estado_pago === 'reembolsado') {
        await this._procesarReembolso(venta);
      }
      
      // DEVOLVER STOCK CORRECTAMENTE
      console.log('Devolviendo stock por cancelación de venta...');
      for (const item of venta.items) {
        await this._devolverStockPorCancelacion(
          item.id_libro,
          item.cantidad,
          item.id_tienda_origen, // Devolver a la tienda original si existe
          idUsuario,
          venta._id,
          session
        );
      }
      
      // Si había recogida asociada, cancelarla también
      if (venta.envio.tipo === 'recogida_tienda') {
        await this._cancelarRecogidaAsociada(venta._id, motivo, idUsuario, session);
      }
      
      await session.commitTransaction();
      
      // Enviar notificación
      this._enviarNotificacionCancelacion(venta).catch(err => 
        console.error('Error enviando notificación:', err)
      );
      
      return venta;
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Devolver stock por cancelación
   * @private
   */
  async _devolverStockPorCancelacion(idLibro, cantidad, idTiendaOriginal, idUsuario, idVenta, session) {
    try {
      let inventario;
      
      // Intentar devolver a la tienda original si se especifica
      if (idTiendaOriginal) {
        inventario = await Inventario.findOne({
          id_libro: idLibro,
          id_tienda: idTiendaOriginal
        }).session(session);
      }
      
      // Si no hay tienda original o no se encuentra, buscar cualquier inventario activo
      if (!inventario) {
        inventario = await Inventario.findOne({
          id_libro: idLibro,
          estado: 'disponible'
        }).session(session);
      }
      
      // Si aún no hay inventario, crear uno nuevo en una tienda activa
      if (!inventario) {
        const TiendaFisica = require('../models/tiendaFisicaModel');
        const tiendaActiva = await TiendaFisica.findOne({ estado: 'activa' }).session(session);
        
        if (tiendaActiva) {
          inventario = new Inventario({
            id_libro: idLibro,
            id_tienda: tiendaActiva._id,
            stock_total: 0,
            stock_disponible: 0,
            stock_reservado: 0
          });
        } else {
          throw new Error('No hay tiendas activas para devolver el stock');
        }
      }
      
      // Registrar entrada por devolución/cancelación
      await inventario.registrarEntrada(
        cantidad,
        'devolucion',
        idUsuario,
        `Cancelación de venta ${idVenta} - devolución de stock`
      );
      
      console.log(`Stock devuelto: ${cantidad} unidades de libro ${idLibro} a tienda ${inventario.id_tienda}`);
    } catch (error) {
      console.error('Error devolviendo stock por cancelación:', error);
      throw error;
    }
  }

  /**
   * Cancelar recogida asociada a una venta
   * @private
   */
  async _cancelarRecogidaAsociada(idVenta, motivo, idUsuario, session) {
    try {
      const RecogidaTienda = require('../models/recogidaTiendaModel');
      
      const recogida = await RecogidaTienda.findOne({ id_venta: idVenta }).session(session);
      
      if (recogida && !['RECOGIDO', 'CANCELADO', 'EXPIRADO'].includes(recogida.estado)) {
        recogida.cambiarEstado('CANCELADO', `Venta cancelada: ${motivo}`, idUsuario);
        await recogida.save({ session });
        
        console.log(`Recogida ${recogida.codigo_recogida} cancelada por venta cancelada`);
      }
    } catch (error) {
      console.error('Error cancelando recogida asociada:', error);
      // No es crítico, continuar con la cancelación de la venta
    }
  }

  // ==========================================
  // MÉTODOS PRIVADOS EXISTENTES (mantenidos)
  // ==========================================

  /**
   * Validar método de pago
   * @private
   */
  async _validarMetodoPago(idUsuario, idTarjeta, montoTotal) {
    const tarjeta = await tarjetaService.obtenerTarjetaPorId(idTarjeta, idUsuario);
    
    if (!tarjeta) {
      throw new Error('Tarjeta no encontrada');
    }
    
    if (!tarjeta.activa) {
      throw new Error('La tarjeta no está activa');
    }
    
    const verificacion = await tarjetaService.verificarTarjeta(idTarjeta);
    if (!verificacion.valida) {
      throw new Error(verificacion.mensaje);
    }
    
    if (tarjeta.tipo === 'debito') {
      if (tarjeta.saldo < montoTotal) {
        throw new Error(`Saldo insuficiente. Disponible: $${tarjeta.saldo.toLocaleString()}, Requerido: $${montoTotal.toLocaleString()}`);
      }
    }
    
    return tarjeta;
  }
  
  /**
   * Procesar pago
   * @private
   */
  async _procesarPago(tarjeta, monto, numeroVenta) {
    try {
      if (tarjeta.tipo === 'debito') {
        await tarjetaService.modificarSaldo(
          tarjeta.id_tarjeta,
          tarjeta.id_usuario,
          -monto,
          `Pago de orden ${numeroVenta}`
        );
      } else {
        console.log(`Procesando pago de $${monto} con tarjeta de crédito ${tarjeta.ultimos_digitos}`);
      }
      
      return true;
    } catch (error) {
      throw new Error(`Error procesando pago: ${error.message}`);
    }
  }
  
  /**
   * Enviar email de confirmación
   * @private
   */
  async _enviarConfirmacionCompra(venta, idUsuario) {
    try {
      const usuario = await mongoose.model('Usuario').findById(idUsuario);
      await emailService.sendPurchaseConfirmation(
        usuario.email,
        venta,
        usuario
      );
    } catch (error) {
      console.error('Error enviando confirmación:', error);
    }
  }
  
  // ==========================================
  // MÉTODOS PÚBLICOS EXISTENTES (mantenidos)
  // ==========================================

  async obtenerVentasCliente(idCliente, opciones = {}) {
    const ventas = await Venta.obtenerVentasCliente(idCliente, opciones);
    
    const totales = await Venta.aggregate([
      { $match: { id_cliente: new mongoose.Types.ObjectId(idCliente) } },
      {
        $group: {
          _id: null,
          total_compras: { $sum: 1 },
          monto_total: { $sum: '$totales.total_final' }
        }
      }
    ]);
    
    return {
      ventas,
      resumen: totales[0] || { total_compras: 0, monto_total: 0 }
    };
  }
  
  async obtenerDetalleVenta(numeroVenta, idUsuario = null) {
    const query = { numero_venta: numeroVenta };
    
    if (idUsuario) {
      query.id_cliente = idUsuario;
    }
    
    const venta = await Venta.findOne(query)
      .populate('id_cliente', 'nombres apellidos email telefono')
      .populate('items.id_libro', 'titulo autor_nombre_completo ISBN');
    
    if (!venta) {
      throw new Error('Venta no encontrada');
    }
    
    const devoluciones = await Devolucion.find({ id_venta: venta._id })
      .select('codigo_devolucion estado fecha_solicitud totales');
    
    return {
      venta: venta.toObject(),
      devoluciones
    };
  }
  
  async actualizarEstadoEnvio(numeroVenta, nuevoEstado, datosEnvio, idUsuario) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const venta = await Venta.findOne({ numero_venta: numeroVenta }).session(session);
      
      if (!venta) {
        throw new Error('Venta no encontrada');
      }
      
      switch (nuevoEstado) {
        case 'listo_para_envio':
          venta.marcarListoParaEnvio(idUsuario);
          break;
          
        case 'enviado':
          if (!datosEnvio.numero_guia) {
            throw new Error('Se requiere número de guía para marcar como enviado');
          }
          venta.marcarComoEnviado(datosEnvio, idUsuario);
          break;
          
        case 'entregado':
          venta.marcarComoEntregado(idUsuario, datosEnvio.fecha_entrega);
          break;
          
        default:
          throw new Error('Estado de envío no válido');
      }
      
      await venta.save({ session });
      
      if (nuevoEstado === 'enviado') {
        this._enviarNotificacionEnvio(venta).catch(err => 
          console.error('Error enviando notificación:', err)
        );
      }
      
      if (nuevoEstado === 'entregado') {
        this._enviarNotificacionEntrega(venta).catch(err => 
          console.error('Error enviando notificación:', err)
        );
      }
      
      await session.commitTransaction();
      
      return venta;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  async crearDevolucion(numeroVenta, itemsDevolucion, idCliente) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const venta = await Venta.findOne({ 
        numero_venta: numeroVenta,
        id_cliente: idCliente 
      }).session(session);
      
      if (!venta) {
        throw new Error('Venta no encontrada');
      }
      
      const devolucion = await Devolucion.crearDesdeVenta(
        venta,
        itemsDevolucion,
        idCliente
      );
      
      await devolucion.save({ session });
      
      for (const itemDev of itemsDevolucion) {
        const itemVenta = venta.items.id(itemDev.id_item_venta);
        if (itemVenta) {
          itemVenta.cantidad_devuelta += itemDev.cantidad;
        }
      }
      
      await venta.save({ session });
      
      await session.commitTransaction();
      
      this._enviarEmailDevolucion(devolucion, idCliente).catch(err => 
        console.error('Error enviando email de devolución:', err)
      );
      
      return devolucion;
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  async obtenerEstadisticasVentas(fechaInicio, fechaFin) {
    const estadisticas = await Venta.obtenerEstadisticas(
      new Date(fechaInicio),
      new Date(fechaFin)
    );
    
    const productosMasVendidos = await Venta.aggregate([
      {
        $match: {
          fecha_creacion: {
            $gte: new Date(fechaInicio),
            $lte: new Date(fechaFin)
          },
          estado: { $nin: ['cancelado', 'fallo_pago'] }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.id_libro',
          titulo: { $first: '$items.snapshot.titulo' },
          cantidad_vendida: { $sum: '$items.cantidad' },
          ingresos: { $sum: '$items.precios.subtotal' }
        }
      },
      { $sort: { cantidad_vendida: -1 } },
      { $limit: 10 }
    ]);
    
    return {
      ...estadisticas,
      productos_mas_vendidos: productosMasVendidos
    };
  }

  /**
   * Procesar reembolso
   * @private
   */
  async _procesarReembolso(venta) {
    try {
      const tarjeta = await tarjetaService.obtenerTarjetaPorId(venta.pago.id_tarjeta);
      
      if (tarjeta && tarjeta.tipo === 'debito') {
        await tarjetaService.modificarSaldo(
          tarjeta.id_tarjeta,
          venta.id_cliente,
          venta.totales.total_final,
          `Reembolso de orden ${venta.numero_venta}`
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error procesando reembolso:', error);
      throw error;
    }
  }
  
  // Métodos de notificación (mantenidos)
  async _enviarNotificacionCancelacion(venta) {
    const usuario = await mongoose.model('Usuario').findById(venta.id_cliente);
    await emailService.sendOrderCancellation(usuario.email, venta);
  }
  
  async _enviarNotificacionEnvio(venta) {
    const usuario = await mongoose.model('Usuario').findById(venta.id_cliente);
    await emailService.sendShippingNotification(usuario.email, venta);
  }
  
  async _enviarNotificacionEntrega(venta) {
    const usuario = await mongoose.model('Usuario').findById(venta.id_cliente);
    await emailService.sendDeliveryConfirmation(usuario.email, venta);
  }
  
  async _enviarEmailDevolucion(devolucion, idCliente) {
    const usuario = await mongoose.model('Usuario').findById(idCliente);
    await emailService.sendReturnConfirmation(usuario.email, devolucion);
  }
}

module.exports = new VentaService();