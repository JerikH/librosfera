// Database/services/devolucionService.js
const mongoose = require('mongoose');
const Devolucion = require('../models/devolucionModel');
const Venta = require('../models/ventaModel');
const Inventario = require('../models/inventarioModel');
const tarjetaService = require('./tarjetaService');
const emailService = require('../../src/utils/emailService');
const path = require('path');
const fs = require('fs').promises;

class DevolucionService {
  /**
   * Obtener devoluciones de un cliente
   */
  async obtenerDevolucionesCliente(idCliente, opciones = {}) {
    const devoluciones = await Devolucion.obtenerDevolucionesCliente(idCliente, opciones);
    
    // Calcular estadísticas
    const estadisticas = await Devolucion.aggregate([
      { $match: { id_cliente: new mongoose.Types.ObjectId(idCliente) } },
      {
        $group: {
          _id: null,
          total_devoluciones: { $sum: 1 },
          monto_total_devuelto: { $sum: '$totales.monto_reembolsado' },
          devoluciones_pendientes: {
            $sum: {
              $cond: [
                { $in: ['$estado', ['solicitada', 'aprobada', 'esperando_envio', 'en_transito', 'recibida', 'en_inspeccion']] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    
    return {
      devoluciones,
      estadisticas: estadisticas[0] || {
        total_devoluciones: 0,
        monto_total_devuelto: 0,
        devoluciones_pendientes: 0
      }
    };
  }
  
  /**
   * Obtener detalle de una devolución
   */
  async obtenerDetalleDevolucion(codigoDevolucion, idCliente = null) {
    let devolucion;
    
    // Buscar por código de devolución o código QR
    if (codigoDevolucion.startsWith('QR-')) {
      devolucion = await Devolucion.buscarPorCodigoQR(codigoDevolucion);
    } else {
      devolucion = await Devolucion.buscarPorCodigo(codigoDevolucion);
    }
    
    if (!devolucion) {
      throw new Error('Devolución no encontrada');
    }
    
    // Si se proporciona idCliente, verificar que sea el dueño
    if (idCliente && devolucion.id_cliente.toString() !== idCliente) {
      throw new Error('No tienes permisos para ver esta devolución');
    }
    
    // Obtener venta asociada
    const venta = await Venta.findById(devolucion.id_venta)
      .select('numero_venta fecha_creacion totales envio');
    
    return {
      devolucion: devolucion.toObject(),
      venta_info: venta
    };
  }
  
  /**
   * Aprobar devolución (admin)
   */
  async aprobarDevolucion(codigoDevolucion, idUsuarioAdmin, notas = '') {
    const devolucion = await Devolucion.buscarPorCodigo(codigoDevolucion);
    
    if (!devolucion) {
      throw new Error('Devolución no encontrada');
    }
    
    await devolucion.aprobar(idUsuarioAdmin, notas);
    
    // Enviar notificación al cliente
    this._enviarNotificacionAprobacion(devolucion).catch(err =>
      console.error('Error enviando notificación:', err)
    );
    
    return devolucion;
  }
  
  /**
   * Rechazar devolución (admin)
   */
  async rechazarDevolucion(codigoDevolucion, idUsuarioAdmin, motivo) {
    const devolucion = await Devolucion.buscarPorCodigo(codigoDevolucion);
    
    if (!devolucion) {
      throw new Error('Devolución no encontrada');
    }
    
    if (!motivo) {
      throw new Error('Debe proporcionar un motivo para rechazar la devolución');
    }
    
    await devolucion.rechazar(idUsuarioAdmin, motivo);
    
    // Enviar notificación al cliente
    this._enviarNotificacionRechazo(devolucion, motivo).catch(err =>
      console.error('Error enviando notificación:', err)
    );
    
    return devolucion;
  }
  
  /**
   * Marcar devolución como recibida (admin)
   */
  async marcarComoRecibida(codigoDevolucion, idUsuarioAdmin, datosRecepcion = {}) {
    const devolucion = await Devolucion.buscarPorCodigo(codigoDevolucion);
    
    if (!devolucion) {
      throw new Error('Devolución no encontrada');
    }
    
    await devolucion.marcarComoRecibida(idUsuarioAdmin, datosRecepcion);
    
    return devolucion;
  }
  
  /**
   * Inspeccionar item de devolución (admin)
   */
  async inspeccionarItem(codigoDevolucion, idItem, datosInspeccion, idUsuarioAdmin) {
    const devolucion = await Devolucion.buscarPorCodigo(codigoDevolucion);
    
    if (!devolucion) {
      throw new Error('Devolución no encontrada');
    }
    
    const { resultado, notas, porcentajeReembolso } = datosInspeccion;
    
    if (!resultado || !['aprobado', 'rechazado', 'aprobado_parcial'].includes(resultado)) {
      throw new Error('Resultado de inspección no válido');
    }
    
    await devolucion.inspeccionarItem(
      idItem,
      resultado,
      idUsuarioAdmin,
      notas,
      porcentajeReembolso || (resultado === 'aprobado' ? 100 : 0)
    );
    
    // Si todos los items han sido inspeccionados, proceder con el reembolso
    if (devolucion.estado === 'reembolso_aprobado') {
      // Notificar al cliente sobre el resultado de la inspección
      this._enviarNotificacionInspeccion(devolucion).catch(err =>
        console.error('Error enviando notificación:', err)
      );
    }
    
    return devolucion;
  }
  
  /**
   * Procesar reembolso de devolución
   */
  async procesarReembolso(codigoDevolucion, idUsuarioAdmin) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const devolucion = await Devolucion.buscarPorCodigo(codigoDevolucion).session(session);
      
      if (!devolucion) {
        throw new Error('Devolución no encontrada');
      }
      
      // Obtener la venta original
      const venta = await Venta.findById(devolucion.id_venta).session(session);
      
      if (!venta) {
        throw new Error('Venta original no encontrada');
      }
      
      // Preparar datos de reembolso
      const datosReembolso = {
        metodo: 'tarjeta_original',
        id_tarjeta_original: venta.pago.id_tarjeta,
        referencia: `REF-${devolucion.codigo_devolucion}-${Date.now()}`,
        notas: `Reembolso por devolución ${devolucion.codigo_devolucion}`
      };
      
      await devolucion.procesarReembolso(datosReembolso, idUsuarioAdmin);
      
      // Procesar el reembolso real
      try {
        // Reembolsar a la tarjeta
        await tarjetaService.modificarSaldo(
          venta.pago.id_tarjeta,
          devolucion.id_cliente,
          devolucion.totales.monto_aprobado_reembolso,
          `Reembolso devolución ${devolucion.codigo_devolucion}`
        );
        
        // Marcar como completado
        await devolucion.completarReembolso(idUsuarioAdmin, datosReembolso.referencia);
        
      } catch (errorReembolso) {
        throw new Error(`Error procesando reembolso: ${errorReembolso.message}`);
      }
      
      // Actualizar inventario (devolver stock)
      for (const item of devolucion.items) {
        if (item.monto_reembolso > 0) {
          const inventario = await Inventario.findOne({
            id_libro: item.id_libro
          }).session(session);
          
          if (inventario) {
            await inventario.registrarEntrada(
              item.cantidad_a_devolver,
              'devolucion',
              idUsuarioAdmin,
              `Devolución ${devolucion.codigo_devolucion}`
            );
          }
        }
      }
      
      await session.commitTransaction();
      
      // Enviar notificación de reembolso completado
      this._enviarNotificacionReembolso(devolucion).catch(err =>
        console.error('Error enviando notificación:', err)
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
   * Cancelar devolución
   */
  async cancelarDevolucion(codigoDevolucion, idUsuario, motivo, esAdmin = false) {
    const devolucion = await Devolucion.buscarPorCodigo(codigoDevolucion);
    
    if (!devolucion) {
      throw new Error('Devolución no encontrada');
    }
    
    // Verificar permisos
    if (!esAdmin && devolucion.id_cliente.toString() !== idUsuario) {
      throw new Error('No tienes permisos para cancelar esta devolución');
    }
    
    await devolucion.cancelar(idUsuario, motivo);
    
    return devolucion;
  }
  
  /**
   * Agregar documento a devolución
   */
  async agregarDocumento(codigoDevolucion, archivo, tipo, idUsuario) {
    const devolucion = await Devolucion.buscarPorCodigo(codigoDevolucion);
    
    if (!devolucion) {
      throw new Error('Devolución no encontrada');
    }
    
    // Verificar permisos
    const esCliente = devolucion.id_cliente.toString() === idUsuario;
    if (!esCliente) {
      // Verificar si es admin
      const usuario = await mongoose.model('Usuario').findById(idUsuario);
      if (!['administrador', 'root'].includes(usuario.tipo_usuario)) {
        throw new Error('No tienes permisos para agregar documentos a esta devolución');
      }
    }
    
    // Guardar archivo
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../../uploads');
    const devolucionesDir = path.join(uploadDir, 'devoluciones', devolucion.codigo_devolucion);
    
    // Crear directorio si no existe
    await fs.mkdir(devolucionesDir, { recursive: true });
    
    const nombreArchivo = `${tipo}_${Date.now()}_${archivo.originalname}`;
    const rutaArchivo = path.join(devolucionesDir, nombreArchivo);
    
    await fs.rename(archivo.path, rutaArchivo);
    
    // Guardar referencia en la devolución
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const urlArchivo = `${baseUrl}/uploads/devoluciones/${devolucion.codigo_devolucion}/${nombreArchivo}`;
    
    await devolucion.agregarDocumento({
      tipo,
      url: urlArchivo,
      nombre_archivo: nombreArchivo,
      subido_por: esCliente ? 'cliente' : 'administrador'
    });
    
    return devolucion;
  }
  
  /**
   * Obtener devoluciones para administradores
   */
  async obtenerDevolucionesAdmin(filtros = {}, opciones = {}) {
    const {
      page = 1,
      limit = 20,
      ordenar = '-fecha_solicitud'
    } = opciones;
    
    const query = {};
    
    if (filtros.estado) query.estado = filtros.estado;
    if (filtros.cliente) query.id_cliente = filtros.cliente;
    if (filtros.codigo) query.codigo_devolucion = new RegExp(filtros.codigo, 'i');
    if (filtros.fecha_desde) query.fecha_solicitud = { $gte: new Date(filtros.fecha_desde) };
    if (filtros.fecha_hasta) {
      query.fecha_solicitud = query.fecha_solicitud || {};
      query.fecha_solicitud.$lte = new Date(filtros.fecha_hasta);
    }
    
    const devoluciones = await Devolucion.find(query)
      .populate('id_cliente', 'nombres apellidos email')
      .populate('id_venta', 'numero_venta fecha_creacion')
      .sort(ordenar)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Devolucion.countDocuments(query);
    
    return {
      devoluciones,
      paginacion: {
        total,
        pagina: page,
        limite: limit,
        totalPaginas: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * Obtener estadísticas de devoluciones (admin)
   */
  async obtenerEstadisticasDevoluciones(fechaInicio, fechaFin) {
    const estadisticas = await Devolucion.aggregate([
      {
        $match: {
          fecha_solicitud: {
            $gte: new Date(fechaInicio),
            $lte: new Date(fechaFin)
          }
        }
      },
      {
        $group: {
          _id: '$estado',
          cantidad: { $sum: 1 },
          monto_total: { $sum: '$totales.monto_aprobado_reembolso' }
        }
      }
    ]);
    
    // Motivos más comunes
    const motivosFrecuentes = await Devolucion.aggregate([
      {
        $match: {
          fecha_solicitud: {
            $gte: new Date(fechaInicio),
            $lte: new Date(fechaFin)
          }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.motivo',
          cantidad: { $sum: 1 }
        }
      },
      { $sort: { cantidad: -1 } },
      { $limit: 5 }
    ]);
    
    return {
      por_estado: estadisticas,
      motivos_frecuentes: motivosFrecuentes
    };
  }
  
  // Métodos de notificación privados
  async _enviarNotificacionAprobacion(devolucion) {
    const usuario = await mongoose.model('Usuario').findById(devolucion.id_cliente);
    await emailService.sendReturnApproval(usuario.email, devolucion);
  }
  
  async _enviarNotificacionRechazo(devolucion, motivo) {
    const usuario = await mongoose.model('Usuario').findById(devolucion.id_cliente);
    await emailService.sendReturnRejection(usuario.email, devolucion, motivo);
  }
  
  async _enviarNotificacionInspeccion(devolucion) {
    const usuario = await mongoose.model('Usuario').findById(devolucion.id_cliente);
    await emailService.sendInspectionResult(usuario.email, devolucion);
  }
  
  async _enviarNotificacionReembolso(devolucion) {
    const usuario = await mongoose.model('Usuario').findById(devolucion.id_cliente);
    await emailService.sendRefundConfirmation(usuario.email, devolucion);
  }
}

module.exports = new DevolucionService();