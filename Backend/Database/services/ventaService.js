// Database/services/ventaService.js
const mongoose = require('mongoose');
const Venta = require('../models/ventaModel');
const Devolucion = require('../models/devolucionModel');
const { Carrito, CarritoItem, Libro, Inventario } = require('../models');
const tarjetaService = require('./tarjetaService');
const emailService = require('../../src/utils/emailService');

class VentaService {
  /**
   * Crear una venta desde un carrito
   * @param {String} idUsuario - ID del usuario que realiza la compra
   * @param {Object} datosVenta - Datos de la venta (método de pago, envío, etc.)
   * @returns {Promise<Object>} Venta creada
   */
  async crearVenta(idUsuario, datosVenta) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
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
      
      // 3. Validar disponibilidad de stock
      for (const item of items) {
        const inventario = await Inventario.findOne({ 
          id_libro: item.id_libro._id 
        }).session(session);
        
        if (!inventario || inventario.stock_disponible < item.cantidad) {
          throw new Error(`Stock insuficiente para: ${item.id_libro.titulo}`);
        }
      }
      
      // 4. Validar método de pago
      const tarjeta = await this._validarMetodoPago(
        idUsuario, 
        datosVenta.id_tarjeta, 
        carrito.totales.total_final
      );
      
      // 5. Preparar items de la venta
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
        }
      }));
      
      // 6. Crear la venta
      const nuevaVenta = new Venta({
        id_cliente: idUsuario,
        id_carrito_origen: carrito._id,
        items: itemsVenta,
        totales: {
          subtotal_sin_descuentos: carrito.totales.subtotal_base,
          total_descuentos: carrito.totales.total_descuentos,
          subtotal_con_descuentos: carrito.totales.subtotal_con_descuentos,
          total_impuestos: carrito.totales.total_impuestos,
          costo_envio: carrito.totales.costo_envio,
          total_final: carrito.totales.total_final
        },
        pago: {
          metodo: tarjeta.tipo === 'debito' ? 'tarjeta_debito' : 'tarjeta_credito',
          id_tarjeta: tarjeta.id_tarjeta,
          ultimos_digitos: tarjeta.ultimos_digitos,
          marca_tarjeta: tarjeta.marca
        },
        envio: {
          tipo: datosVenta.tipo_envio,
          direccion: datosVenta.direccion_envio,
          id_tienda_recogida: datosVenta.id_tienda_recogida,
          costo: carrito.totales.costo_envio,
          notas_envio: datosVenta.notas_envio
        },
        descuentos_aplicados: carrito.codigos_carrito?.map(c => ({
          codigo: c.codigo,
          tipo: 'codigo_promocional'
        })) || []
      });
      
      // 7. Procesar el pago
      try {
        await this._procesarPago(tarjeta, carrito.totales.total_final, nuevaVenta.numero_venta);
        await nuevaVenta.aprobarPago();
      } catch (errorPago) {
        await nuevaVenta.rechazarPago(errorPago.message);
        await nuevaVenta.save({ session });
        throw new Error(`Error procesando el pago: ${errorPago.message}`);
      }
      
      await nuevaVenta.save({ session });
      
      // 8. Actualizar inventario
      for (const item of items) {
        const inventario = await Inventario.findOne({ 
          id_libro: item.id_libro._id 
        }).session(session);
        
        await inventario.registrarSalida(
          item.cantidad,
          'venta',
          idUsuario,
          nuevaVenta._id,
          `Venta ${nuevaVenta.numero_venta}`
        );
      }
      
      // 9. Limpiar carrito
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
      
      // 10. Confirmar transacción
      await session.commitTransaction();
      
      // 11. Enviar confirmación por email (no bloqueante)
      this._enviarConfirmacionCompra(nuevaVenta, idUsuario).catch(err => 
        console.error('Error enviando email de confirmación:', err)
      );
      
      return nuevaVenta;
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  /**
   * Validar método de pago
   * @private
   */
  async _validarMetodoPago(idUsuario, idTarjeta, montoTotal) {
    // Obtener y validar tarjeta
    const tarjeta = await tarjetaService.obtenerTarjetaPorId(idTarjeta, idUsuario);
    
    if (!tarjeta) {
      throw new Error('Tarjeta no encontrada');
    }
    
    if (!tarjeta.activa) {
      throw new Error('La tarjeta no está activa');
    }
    
    // Verificar que no esté expirada
    const verificacion = await tarjetaService.verificarTarjeta(idTarjeta);
    if (!verificacion.valida) {
      throw new Error(verificacion.mensaje);
    }
    
    // Para tarjetas de débito, verificar saldo
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
        // Descontar del saldo
        await tarjetaService.modificarSaldo(
          tarjeta.id_tarjeta,
          tarjeta.id_usuario,
          -monto,
          `Pago de orden ${numeroVenta}`
        );
      } else {
        // Para tarjetas de crédito, aquí se integraría con el procesador de pagos
        // Por ahora simulamos que siempre es exitoso
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
  
  /**
   * Obtener ventas de un cliente
   */
  async obtenerVentasCliente(idCliente, opciones = {}) {
    const ventas = await Venta.obtenerVentasCliente(idCliente, opciones);
    
    // Calcular totales
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
  
  /**
   * Obtener detalle de una venta
   */
  async obtenerDetalleVenta(numeroVenta, idUsuario = null) {
    const query = { numero_venta: numeroVenta };
    
    // Si se proporciona usuario, verificar que sea el dueño
    if (idUsuario) {
      query.id_cliente = idUsuario;
    }
    
    const venta = await Venta.findOne(query)
      .populate('id_cliente', 'nombres apellidos email telefono')
      .populate('items.id_libro', 'titulo autor_nombre_completo ISBN');
    
    if (!venta) {
      throw new Error('Venta no encontrada');
    }
    
    // Obtener devoluciones asociadas
    const devoluciones = await Devolucion.find({ id_venta: venta._id })
      .select('codigo_devolucion estado fecha_solicitud totales');
    
    return {
      venta: venta.toObject(),
      devoluciones
    };
  }
  
  /**
   * Cancelar una venta
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
      
      // Cancelar la venta
      await venta.cancelarVenta(motivo, solicitadaPor, idUsuario);
      
      // Si el pago fue aprobado, procesar reembolso
      if (venta.pago.estado_pago === 'reembolsado') {
        await this._procesarReembolso(venta);
      }
      
      // Devolver stock
      for (const item of venta.items) {
        const inventario = await Inventario.findOne({ 
          id_libro: item.id_libro 
        }).session(session);
        
        if (inventario) {
          await inventario.registrarEntrada(
            item.cantidad,
            'devolucion',
            idUsuario,
            `Cancelación de venta ${venta.numero_venta}`
          );
        }
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
   * Procesar reembolso
   * @private
   */
  async _procesarReembolso(venta) {
    try {
      // Obtener tarjeta original
      const tarjeta = await tarjetaService.obtenerTarjetaPorId(venta.pago.id_tarjeta);
      
      if (tarjeta && tarjeta.tipo === 'debito') {
        // Devolver dinero a la tarjeta
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
  
  /**
   * Actualizar estado de envío
   */
  async actualizarEstadoEnvio(numeroVenta, nuevoEstado, datosEnvio, idUsuario) {
    const venta = await Venta.findOne({ numero_venta: numeroVenta });
    
    if (!venta) {
      throw new Error('Venta no encontrada');
    }
    
    switch (nuevoEstado) {
      case 'listo_para_envio':
        await venta.marcarListoParaEnvio(idUsuario);
        break;
        
      case 'enviado':
        if (!datosEnvio.numero_guia) {
          throw new Error('Se requiere número de guía para marcar como enviado');
        }
        await venta.marcarComoEnviado(datosEnvio, idUsuario);
        // Enviar notificación de envío
        this._enviarNotificacionEnvio(venta).catch(err => 
          console.error('Error enviando notificación:', err)
        );
        break;
        
      case 'entregado':
        await venta.marcarComoEntregado(idUsuario, datosEnvio.fecha_entrega);
        // Enviar notificación de entrega
        this._enviarNotificacionEntrega(venta).catch(err => 
          console.error('Error enviando notificación:', err)
        );
        break;
        
      default:
        throw new Error('Estado de envío no válido');
    }
    
    return venta;
  }
  
  /**
   * Crear solicitud de devolución
   */
  async crearDevolucion(numeroVenta, itemsDevolucion, idCliente) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Obtener la venta
      const venta = await Venta.findOne({ 
        numero_venta: numeroVenta,
        id_cliente: idCliente 
      }).session(session);
      
      if (!venta) {
        throw new Error('Venta no encontrada');
      }
      
      // Crear devolución
      const devolucion = await Devolucion.crearDesdeVenta(
        venta,
        itemsDevolucion,
        idCliente
      );
      
      await devolucion.save({ session });
      
      // Actualizar cantidades devueltas en la venta
      for (const itemDev of itemsDevolucion) {
        const itemVenta = venta.items.id(itemDev.id_item_venta);
        if (itemVenta) {
          itemVenta.cantidad_devuelta += itemDev.cantidad;
        }
      }
      
      await venta.save({ session });
      
      await session.commitTransaction();
      
      // Enviar email con QR
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
  
  /**
   * Obtener estadísticas de ventas (admin)
   */
  async obtenerEstadisticasVentas(fechaInicio, fechaFin) {
    const estadisticas = await Venta.obtenerEstadisticas(
      new Date(fechaInicio),
      new Date(fechaFin)
    );
    
    // Productos más vendidos
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
  
  // Métodos de notificación
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