const mongoose = require('mongoose');
const Venta = require('../models/ventaModel');
const Devolucion = require('../models/devolucionModel');
const { Carrito, CarritoItem, Libro, Inventario } = require('../models');
const tarjetaService = require('./tarjetaService');
const emailService = require('../../src/utils/emailService');

class VentaService {
  /**
   * Calcular costo de envío según el tipo
   * @param {String} tipoEnvio - 'domicilio' o 'recogida_tienda'
   * @returns {Number} Costo del envío
   */
  _calcularCostoEnvio(tipoEnvio) {
    const COSTO_ENVIO_DOMICILIO = 7000;
    return tipoEnvio === 'domicilio' ? COSTO_ENVIO_DOMICILIO : 0;
  }
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
      
      // 3. Validar disponibilidad de stock y reservar
      for (const item of items) {
        const inventario = await Inventario.findOne({ 
          id_libro: item.id_libro._id 
        }).session(session);
        
        if (!inventario) {
          throw new Error(`No hay inventario registrado para: ${item.id_libro.titulo}`);
        }

        // Verificar stock disponible detalladamente
        if (inventario.stock_disponible < item.cantidad) {
          const razonFalta = this._determinarRazonFaltaStock(inventario, item.cantidad);
          throw new Error(`Stock insuficiente para "${item.id_libro.titulo}". ${razonFalta}`);
        }

        // Reservar el stock inmediatamente
        // await inventario.reservarEjemplares(
        //   item.cantidad,
        //   idUsuario,
        //   null, // reservaId
        //   `Reserva para venta - Usuario: ${idUsuario}`
        // );
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
        // El cliente pagará el impuesto por separado
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
        }
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
        envio: {
          tipo: datosVenta.tipo_envio,
          direccion: datosVenta.direccion_envio,
          id_tienda_recogida: datosVenta.id_tienda_recogida,
          costo: costoEnvio,
          notas_envio: datosVenta.notas_envio
        },
        descuentos_aplicados: carrito.codigos_carrito?.map(c => ({
          codigo: c.codigo,
          tipo: 'codigo_promocional'
        })) || [],
        // NUEVO: Información del impuesto
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
      
      // 12. Confirmar las reservas como ventas en el inventario
      for (const item of items) {
        const inventario = await Inventario.findOne({ 
          id_libro: item.id_libro._id 
        }).session(session);
        
        // Registrar salida definitiva (convierte reserva en venta)
        await inventario.registrarSalida(
          item.cantidad,
          'venta',
          idUsuario,
          nuevaVenta._id,
          `Venta confirmada ${nuevaVenta.numero_venta}`
        );
      }
      
      // 13. Limpiar carrito
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
      
      // 14. Confirmar transacción
      await session.commitTransaction();
      
      // 15. Enviar confirmación por email (no bloqueante)
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
   * Determinar la razón específica de falta de stock
   * @param {Object} inventario - Objeto de inventario
   * @param {Number} cantidadSolicitada - Cantidad solicitada
   * @returns {String} Descripción de la razón
   */
  _determinarRazonFaltaStock(inventario, cantidadSolicitada) {
    const stockTotal = inventario.stock_total;
    const stockDisponible = inventario.stock_disponible;
    const stockReservado = inventario.stock_reservado;
    
    if (stockTotal === 0) {
      return 'El libro está completamente agotado.';
    }
    
    if (stockDisponible === 0 && stockReservado > 0) {
      return `Todas las ${stockTotal} unidades están reservadas por otros usuarios.`;
    }
    
    if (stockDisponible > 0 && stockDisponible < cantidadSolicitada) {
      return `Solo hay ${stockDisponible} unidades disponibles de ${stockTotal} en total (${stockReservado} reservadas).`;
    }
    
    return `Stock insuficiente: disponible ${stockDisponible}, solicitado ${cantidadSolicitada}.`;
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
   * Obtener ventas de todos los clientes (admin)
   */
  async obtenerVentasAdmin(filtros = {},opciones = {}) {
    const ventas = await Venta.obtenerVentasAdmin(filtros, opciones);
    // Calcular totales
    const totales = await Venta.aggregate([
      {
        $group: {
          _id: null,
          total_ventas: { $sum: 1 },
          monto_total: { $sum: '$totales.total_final' }
        }
      }
    ]);

    return {
      ventas,
      resumen: totales[0] || { total_ventas: 0, monto_total: 0 }
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
      
      // Cancelar la venta (sin guardar)
      venta.cancelarVenta(motivo, solicitadaPor, idUsuario);
      
      // Guardar los cambios con la sesión
      await venta.save({ session });
      
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
      
      // Guardar con la sesión
      await venta.save({ session });
      
      // Si el estado es "enviado", enviar notificación
      if (nuevoEstado === 'enviado') {
        this._enviarNotificacionEnvio(venta).catch(err => 
          console.error('Error enviando notificación:', err)
        );
      }
      
      // Si el estado es "entregado", enviar notificación
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