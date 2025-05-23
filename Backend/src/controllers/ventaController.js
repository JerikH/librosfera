// src/controllers/ventaController.js
const ventaService = require('../../Database/services/ventaService');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Crear nueva venta desde carrito
 * @route   POST /api/v1/ventas
 * @access  Private/Cliente
 */
const crearVenta = catchAsync(async (req, res, next) => {
  try {
    const {
      id_tarjeta,
      tipo_envio,
      direccion_envio,
      id_tienda_recogida,
      notas_envio
    } = req.body;

    // Validaciones básicas
    if (!id_tarjeta) {
      return next(new AppError('Debe seleccionar un método de pago', 400));
    }

    if (!tipo_envio || !['domicilio', 'recogida_tienda'].includes(tipo_envio)) {
      return next(new AppError('Tipo de envío no válido', 400));
    }

    if (tipo_envio === 'domicilio' && !direccion_envio) {
      return next(new AppError('Debe proporcionar una dirección de envío', 400));
    }

    if (tipo_envio === 'recogida_tienda' && !id_tienda_recogida) {
      return next(new AppError('Debe seleccionar una tienda para recoger', 400));
    }

    // Crear venta
    const nuevaVenta = await ventaService.crearVenta(req.user._id, {
      id_tarjeta,
      tipo_envio,
      direccion_envio,
      id_tienda_recogida,
      notas_envio
    });

    // Registrar actividad
    await req.logActivity('venta', 'crear_venta', {
      entidad_afectada: {
        tipo: 'venta',
        id: nuevaVenta._id,
        numero_venta: nuevaVenta.numero_venta
      },
      detalles: {
        total: nuevaVenta.totales.total_final,
        cantidad_items: nuevaVenta.items.length,
        metodo_pago: nuevaVenta.pago.metodo,
        tipo_envio: nuevaVenta.envio.tipo
      },
      nivel_importancia: 'alto'
    });

    res.status(201).json({
      status: 'success',
      message: 'Venta creada exitosamente',
      data: {
        venta: nuevaVenta,
        numero_venta: nuevaVenta.numero_venta,
        total: nuevaVenta.totales.total_final,
        estado: nuevaVenta.estado
      }
    });
  } catch (error) {
    console.error('Error creando venta:', error);
    
    // Manejar errores específicos
    if (error.message.includes('Stock insuficiente')) {
      return next(new AppError(error.message, 409));
    }
    
    if (error.message.includes('Saldo insuficiente')) {
      return next(new AppError(error.message, 402));
    }
    
    if (error.message.includes('Tarjeta')) {
      return next(new AppError(error.message, 400));
    }
    
    return next(new AppError(`Error al procesar la venta: ${error.message}`, 500));
  }
});

/**
 * @desc    Obtener ventas del cliente
 * @route   GET /api/v1/ventas/mis-ventas
 * @access  Private/Cliente
 */
const obtenerMisVentas = catchAsync(async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      estado
    } = req.query;

    const resultado = await ventaService.obtenerVentasCliente(req.user._id, {
      page: parseInt(page),
      limit: parseInt(limit),
      estado
    });

    res.status(200).json({
      status: 'success',
      resultados: resultado.ventas.length,
      resumen: resultado.resumen,
      data: resultado.ventas
    });
  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    return next(new AppError('Error al obtener las ventas', 500));
  }
});

/**
 * @desc    Obtener detalle de una venta
 * @route   GET /api/v1/ventas/:numeroVenta
 * @access  Private/Cliente
 */
const obtenerDetalleVenta = catchAsync(async (req, res, next) => {
  try {
    const { numeroVenta } = req.params;
    
    // Si es cliente, solo puede ver sus propias ventas
    const idUsuario = req.user.tipo_usuario === 'cliente' ? req.user._id : null;
    
    const resultado = await ventaService.obtenerDetalleVenta(numeroVenta, idUsuario);

    res.status(200).json({
      status: 'success',
      data: resultado
    });
  } catch (error) {
    console.error('Error obteniendo detalle de venta:', error);
    
    if (error.message === 'Venta no encontrada') {
      return next(new AppError('Venta no encontrada', 404));
    }
    
    return next(new AppError('Error al obtener detalle de la venta', 500));
  }
});

/**
 * @desc    Cancelar una venta (cliente)
 * @route   PATCH /api/v1/ventas/:numeroVenta/cancelar
 * @access  Private/Cliente
 */
const cancelarVentaCliente = catchAsync(async (req, res, next) => {
  try {
    const { numeroVenta } = req.params;
    const { motivo } = req.body;

    if (!motivo) {
      return next(new AppError('Debe proporcionar un motivo para la cancelación', 400));
    }

    const ventaCancelada = await ventaService.cancelarVenta(
      numeroVenta,
      motivo,
      'cliente',
      req.user._id
    );

    await req.logActivity('venta', 'cancelar_venta_cliente', {
      entidad_afectada: {
        tipo: 'venta',
        id: ventaCancelada._id,
        numero_venta: ventaCancelada.numero_venta
      },
      detalles: {
        motivo,
        total_reembolsado: ventaCancelada.totales.total_final
      },
      nivel_importancia: 'alto'
    });

    res.status(200).json({
      status: 'success',
      message: 'Venta cancelada exitosamente',
      data: {
        numero_venta: ventaCancelada.numero_venta,
        estado: ventaCancelada.estado,
        reembolso: ventaCancelada.pago.estado_pago === 'reembolsado'
      }
    });
  } catch (error) {
    console.error('Error cancelando venta:', error);
    
    if (error.message.includes('No tienes permisos')) {
      return next(new AppError(error.message, 403));
    }
    
    if (error.message.includes('No se puede cancelar')) {
      return next(new AppError(error.message, 400));
    }
    
    return next(new AppError('Error al cancelar la venta', 500));
  }
});

/**
 * @desc    Crear solicitud de devolución
 * @route   POST /api/v1/ventas/:numeroVenta/devolucion
 * @access  Private/Cliente
 */
const crearDevolucion = catchAsync(async (req, res, next) => {
  try {
    const { numeroVenta } = req.params;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(new AppError('Debe especificar los items a devolver', 400));
    }

    // Validar cada item
    for (const item of items) {
      if (!item.id_item_venta || !item.cantidad || !item.motivo || !item.descripcion) {
        return next(new AppError('Cada item debe tener id, cantidad, motivo y descripción', 400));
      }
    }

    const devolucion = await ventaService.crearDevolucion(
      numeroVenta,
      items,
      req.user._id
    );

    await req.logActivity('devolucion', 'crear_devolucion', {
      entidad_afectada: {
        tipo: 'devolucion',
        id: devolucion._id,
        codigo_devolucion: devolucion.codigo_devolucion
      },
      detalles: {
        numero_venta: numeroVenta,
        cantidad_items: items.length,
        monto_estimado: devolucion.totales.monto_items_devolucion
      },
      nivel_importancia: 'alto'
    });

    res.status(201).json({
      status: 'success',
      message: 'Solicitud de devolución creada exitosamente',
      data: {
        codigo_devolucion: devolucion.codigo_devolucion,
        estado: devolucion.estado,
        fecha_limite: devolucion.fecha_limite_envio,
        qr_code: devolucion.qr_code.imagen_base64,
        url_rastreo: devolucion.qr_code.url_rastreo
      }
    });
  } catch (error) {
    console.error('Error creando devolución:', error);
    
    if (error.message.includes('Han pasado más de 8 días')) {
      return next(new AppError(error.message, 400));
    }
    
    if (error.message.includes('debe estar entregada')) {
      return next(new AppError(error.message, 400));
    }
    
    return next(new AppError('Error al crear la solicitud de devolución', 500));
  }
});

// CONTROLADORES ADMINISTRATIVOS

/**
 * @desc    Obtener todas las ventas (admin)
 * @route   GET /api/v1/ventas
 * @access  Private/Admin
 */
const obtenerVentas = catchAsync(async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      estado,
      cliente,
      numero_venta,
      fecha_desde,
      fecha_hasta,
      ordenar = '-fecha_creacion'
    } = req.query;

    const ventas = await ventaService.obtenerVentasAdmin({
      estado,
      cliente,
      numero_venta,
      fecha_desde,
      fecha_hasta
    }, {
      page: parseInt(page),
      limit: parseInt(limit),
      ordenar
    });

    res.status(200).json({
      status: 'success',
      resultados: ventas.length,
      data: ventas
    });
  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    return next(new AppError('Error al obtener las ventas', 500));
  }
});

/**
 * @desc    Actualizar estado de envío
 * @route   PATCH /api/v1/ventas/:numeroVenta/envio
 * @access  Private/Admin
 */
const actualizarEstadoEnvio = catchAsync(async (req, res, next) => {
  try {
    const { numeroVenta } = req.params;
    const { estado, ...datosEnvio } = req.body;

    const estadosValidos = ['listo_para_envio', 'enviado', 'entregado'];
    if (!estado || !estadosValidos.includes(estado)) {
      return next(new AppError('Estado de envío no válido', 400));
    }

    if (estado === 'enviado' && !datosEnvio.numero_guia) {
      return next(new AppError('Se requiere número de guía para marcar como enviado', 400));
    }

    const ventaActualizada = await ventaService.actualizarEstadoEnvio(
      numeroVenta,
      estado,
      datosEnvio,
      req.user._id
    );

    await req.logActivity('venta', 'actualizar_estado_envio', {
      entidad_afectada: {
        tipo: 'venta',
        id: ventaActualizada._id,
        numero_venta: ventaActualizada.numero_venta
      },
      detalles: {
        estado_nuevo: estado,
        numero_guia: datosEnvio.numero_guia
      },
      nivel_importancia: 'medio'
    });

    res.status(200).json({
      status: 'success',
      message: 'Estado de envío actualizado',
      data: {
        numero_venta: ventaActualizada.numero_venta,
        estado: ventaActualizada.estado,
        envio: ventaActualizada.envio
      }
    });
  } catch (error) {
    console.error('Error actualizando estado de envío:', error);
    return next(new AppError(`Error al actualizar envío: ${error.message}`, 400));
  }
});

/**
 * @desc    Cancelar venta (admin)
 * @route   DELETE /api/v1/ventas/:numeroVenta
 * @access  Private/Admin
 */
const cancelarVentaAdmin = catchAsync(async (req, res, next) => {
  try {
    const { numeroVenta } = req.params;
    const { motivo } = req.body;

    if (!motivo) {
      return next(new AppError('Debe proporcionar un motivo para la cancelación', 400));
    }

    const ventaCancelada = await ventaService.cancelarVenta(
      numeroVenta,
      motivo,
      'administrador',
      req.user._id
    );

    await req.logActivity('administracion', 'cancelar_venta_admin', {
      entidad_afectada: {
        tipo: 'venta',
        id: ventaCancelada._id,
        numero_venta: ventaCancelada.numero_venta
      },
      detalles: {
        motivo,
        cliente_afectado: ventaCancelada.id_cliente,
        total_reembolsado: ventaCancelada.totales.total_final
      },
      nivel_importancia: 'alto'
    });

    res.status(200).json({
      status: 'success',
      message: 'Venta cancelada por administrador',
      data: {
        numero_venta: ventaCancelada.numero_venta,
        estado: ventaCancelada.estado
      }
    });
  } catch (error) {
    console.error('Error cancelando venta (admin):', error);
    return next(new AppError('Error al cancelar la venta', 500));
  }
});

/**
 * @desc    Obtener estadísticas de ventas
 * @route   GET /api/v1/ventas/estadisticas
 * @access  Private/Admin
 */
const obtenerEstadisticas = catchAsync(async (req, res, next) => {
  try {
    const {
      fecha_inicio = new Date(new Date().setMonth(new Date().getMonth() - 1)),
      fecha_fin = new Date()
    } = req.query;

    const estadisticas = await ventaService.obtenerEstadisticasVentas(
      fecha_inicio,
      fecha_fin
    );

    res.status(200).json({
      status: 'success',
      data: estadisticas
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return next(new AppError('Error al obtener estadísticas', 500));
  }
});

/**
 * @desc    Agregar nota interna a una venta
 * @route   POST /api/v1/ventas/:numeroVenta/notas
 * @access  Private/Admin
 */
const agregarNotaInterna = catchAsync(async (req, res, next) => {
  try {
    const { numeroVenta } = req.params;
    const { nota } = req.body;

    if (!nota) {
      return next(new AppError('La nota no puede estar vacía', 400));
    }

    const venta = await ventaService.obtenerDetalleVenta(numeroVenta);
    
    if (!venta.venta) {
      return next(new AppError('Venta no encontrada', 404));
    }

    await venta.venta.agregarNotaInterna(nota, req.user._id);

    res.status(200).json({
      status: 'success',
      message: 'Nota agregada exitosamente'
    });
  } catch (error) {
    console.error('Error agregando nota:', error);
    return next(new AppError('Error al agregar nota', 500));
  }
});

module.exports = {
  // Cliente
  crearVenta,
  obtenerMisVentas,
  obtenerDetalleVenta,
  cancelarVentaCliente,
  crearDevolucion,
  
  // Admin
  obtenerVentas,
  actualizarEstadoEnvio,
  cancelarVentaAdmin,
  obtenerEstadisticas,
  agregarNotaInterna
};