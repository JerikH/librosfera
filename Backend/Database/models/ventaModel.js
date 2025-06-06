const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const addressSchema = require('./schemas/addressSchema');

// Esquema para los items de la venta
const ventaItemSchema = new Schema({
  id_libro: {
    type: Schema.Types.ObjectId,
    ref: 'Libro',
    required: true
  },
  
  // Información snapshot del producto al momento de la compra
  snapshot: {
    titulo: {
      type: String,
      required: true
    },
    autor: String,
    isbn: String,
    editorial: String,
    imagen_portada: String
  },
  
  cantidad: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Precios al momento de la compra
  precios: {
    precio_unitario_base: {
      type: Number,
      required: true
    },
    descuento_aplicado: {
      type: Number,
      default: 0
    },
    precio_unitario_final: {
      type: Number,
      required: true
    },
    impuesto: {
      tipo: String,
      porcentaje: Number,
      valor: Number
    },
    subtotal: {
      type: Number,
      required: true
    }
  },
  
  // Estado individual del item
  estado_item: {
    type: String,
    enum: ['procesando', 'preparando', 'enviado', 'entregado', 'devuelto', 'devolucion_parcial'],
    default: 'procesando'
  },
  
  // Para devoluciones parciales
  cantidad_devuelta: {
    type: Number,
    default: 0,
    min: 0
  }
});

const ventaSchema = new Schema({
  // Número de venta único y legible
  numero_venta: {
    type: String,
    default: function() {
      const fecha = new Date();
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `VTA-${año}${mes}-${random}`;
    }
  },
  
  // Cliente
  id_cliente: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    index: true
  },
  
  // Referencia al carrito original
  id_carrito_origen: {
    type: Schema.Types.ObjectId,
    ref: 'Carrito'
  },
  
  // Items de la venta
  items: [ventaItemSchema],
  
  // Totales y costos
  totales: {
    subtotal_sin_descuentos: {
      type: Number,
      required: true
    },
    total_descuentos: {
      type: Number,
      default: 0
    },
    subtotal_con_descuentos: {
      type: Number,
      required: true
    },
    total_impuestos: {
      type: Number,
      default: 0
    },
    costo_envio: {
      type: Number,
      default: 0
    },
    total_final: {
      type: Number,
      required: true
    }
  },
  
  // Información de pago
  pago: {
    metodo: {
      type: String,
      enum: ['tarjeta_debito', 'tarjeta_credito'],
      required: true
    },
    id_tarjeta: {
      type: String,
      required: true
    },
    ultimos_digitos: String,
    marca_tarjeta: String,
    fecha_pago: {
      type: Date,
      default: Date.now
    },
    referencia_pago: {
      type: String,
      default: function() {
        return `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
    },
    estado_pago: {
      type: String,
      enum: ['pendiente', 'procesando', 'aprobado', 'rechazado', 'reembolsado', 'reembolso_parcial'],
      default: 'pendiente'
    }
  },
  
  // Información de envío
  envio: {
    tipo: {
      type: String,
      enum: ['domicilio', 'recogida_tienda'],
      required: true
    },
    direccion: addressSchema,
    id_tienda_recogida: {
      type: Schema.Types.ObjectId,
      ref: 'Tienda_Fisica'
    },
    costo: {
      type: Number,
      default: 0
    },
    empresa_envio: String,
    numero_guia: String,
    fecha_envio: Date,
    fecha_entrega_estimada: Date,
    fecha_entrega_real: Date,
    notas_envio: String
  },

  impuesto_info: {
    pagado_por_cliente: {
      type: Boolean,
      default: false,
      description: 'Indica si el cliente pagará el impuesto por separado'
    },
    monto_excluido: {
      type: Number,
      default: 0,
      description: 'Monto del impuesto excluido del total si lo paga el cliente'
    },
    monto_incluido: {
      type: Number,
      default: 0,
      description: 'Monto del impuesto incluido en el total de la venta'
    },
    nota_impuesto: {
      type: String,
      default: '',
      description: 'Nota adicional sobre el manejo del impuesto'
    }
  },
  
  // Estado general de la venta
  estado: {
    type: String,
    enum: [
      'pendiente_pago',
      'pago_aprobado',
      'preparando',
      'listo_para_envio',
      'enviado',
      'en_transito',
      'entregado',
      'cancelado',
      'reembolsado',
      'fallo_pago'
    ],
    default: 'pendiente_pago',
    index: true
  },
  
  // Información de facturación
  facturacion: {
    requiere_factura: {
      type: Boolean,
      default: false
    },
    datos_fiscales: {
      razon_social: String,
      rfc: String,
      direccion_fiscal: addressSchema,
      email_fiscal: String
    },
    numero_factura: String,
    fecha_facturacion: Date,
    url_pdf: String,
    url_xml: String
  },
  
  // Códigos de descuento aplicados
  descuentos_aplicados: [{
    codigo: String,
    tipo: String,
    valor: Number,
    descripcion: String
  }],
  
  // Historial de eventos
  historial: [{
    evento: {
      type: String,
      required: true
    },
    fecha: {
      type: Date,
      default: Date.now
    },
    descripcion: String,
    usuario_responsable: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    metadata: Schema.Types.Mixed
  }],
  
  // Cancelación
  cancelacion: {
    fecha: Date,
    motivo: String,
    solicitada_por: {
      type: String,
      enum: ['cliente', 'administrador', 'sistema']
    },
    usuario_responsable: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario'
    }
  },
  
  // Notas internas
  notas_internas: [{
    fecha: {
      type: Date,
      default: Date.now
    },
    nota: String,
    usuario: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario'
    }
  }],
  
  // Timestamps
  fecha_creacion: {
    type: Date,
    default: Date.now
  },
  fecha_actualizacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion'
  }
});

// ÍNDICES
ventaSchema.index({ id_cliente: 1, fecha_creacion: -1 });
ventaSchema.index({ estado: 1, fecha_creacion: -1 });
ventaSchema.index({ 'pago.estado_pago': 1 });
ventaSchema.index({ 'envio.numero_guia': 1 });
ventaSchema.index({ numero_venta: 1 });

// MÉTODOS DE INSTANCIA

// Registrar evento en el historial (CORREGIDO: no guarda automáticamente)
ventaSchema.methods.registrarEvento = function(evento, descripcion, usuarioId = null, metadata = {}) {
  this.historial.push({
    evento,
    descripcion,
    usuario_responsable: usuarioId,
    metadata
  });
  
  return this; // Retornamos el objeto sin guardarlo
};

// Cambiar estado de la venta (CORREGIDO: no guarda automáticamente)
ventaSchema.methods.cambiarEstado = function(nuevoEstado, usuarioId, descripcion = '') {
  const estadoAnterior = this.estado;
  this.estado = nuevoEstado;
  
  this.registrarEvento(
    'cambio_estado',
    descripcion || `Estado cambiado de ${estadoAnterior} a ${nuevoEstado}`,
    usuarioId,
    { estado_anterior: estadoAnterior, estado_nuevo: nuevoEstado }
  );
  
  return this;
};

ventaSchema.methods.obtenerTotalAPagar = function() {
  return this.totales.total_final;
};

ventaSchema.methods.obtenerInfoImpuesto = function() {
  const info = {
    debe_pagar_impuesto_separado: this.impuesto_info.pagado_por_cliente,
    monto_impuesto: this.impuesto_info.pagado_por_cliente 
      ? this.impuesto_info.monto_excluido 
      : this.impuesto_info.monto_incluido,
    incluido_en_total: !this.impuesto_info.pagado_por_cliente,
    total_productos: this.totales.subtotal_con_descuentos,
    total_envio: this.totales.costo_envio,
    total_a_pagar: this.totales.total_final
  };
  
  if (this.impuesto_info.pagado_por_cliente) {
    info.mensaje = `El cliente debe pagar $${this.impuesto_info.monto_excluido.toLocaleString()} de impuesto por separado`;
  } else {
    info.mensaje = `El impuesto de $${this.impuesto_info.monto_incluido.toLocaleString()} está incluido en el total`;
  }
  
  return info;
};

// Aprobar pago (CORREGIDO: no guarda automáticamente)
ventaSchema.methods.aprobarPago = function(referenciaPago = null) {
  if (this.pago.estado_pago !== 'pendiente' && this.pago.estado_pago !== 'procesando') {
    throw new Error('El pago ya fue procesado');
  }
  
  this.pago.estado_pago = 'aprobado';
  this.pago.fecha_pago = new Date();
  if (referenciaPago) {
    this.pago.referencia_pago = referenciaPago;
  }
  
  this.cambiarEstado('pago_aprobado', null, 'Pago aprobado exitosamente');
  
  // Automáticamente pasar a preparando
  this.cambiarEstado('preparando', null, 'Orden en preparación');
  
  return this;
};

// Rechazar pago (CORREGIDO: no guarda automáticamente)
ventaSchema.methods.rechazarPago = function(motivo = '') {
  this.pago.estado_pago = 'rechazado';
  this.cambiarEstado('fallo_pago', null, `Pago rechazado: ${motivo}`);
  
  return this;
};

// Marcar como listo para envío (CORREGIDO: no guarda automáticamente)
ventaSchema.methods.marcarListoParaEnvio = function(usuarioId) {
  if (this.estado !== 'preparando') {
    throw new Error('La orden debe estar en preparación para marcarla como lista para envío');
  }
  
  this.cambiarEstado('listo_para_envio', usuarioId, 'Orden lista para ser enviada');
  
  return this;
};

// Marcar como enviado (CORREGIDO: no guarda automáticamente)
ventaSchema.methods.marcarComoEnviado = function(datosEnvio, usuarioId) {
  if (this.estado !== 'listo_para_envio' && this.estado !== 'preparando') {
    throw new Error('La orden debe estar lista para envío');
  }
  
  this.envio.fecha_envio = new Date();
  this.envio.numero_guia = datosEnvio.numero_guia;
  this.envio.empresa_envio = datosEnvio.empresa_envio;
  this.envio.fecha_entrega_estimada = datosEnvio.fecha_entrega_estimada;
  
  // Actualizar estado de todos los items
  this.items.forEach(item => {
    item.estado_item = 'enviado';
  });
  
  this.cambiarEstado('enviado', usuarioId, 'Orden enviada');
  
  return this;
};

// Marcar como entregado (CORREGIDO: no guarda automáticamente)
ventaSchema.methods.marcarComoEntregado = function(usuarioId, fechaEntrega = null) {
  if (this.estado !== 'enviado' && this.estado !== 'en_transito') {
    throw new Error('La orden debe estar enviada para marcarla como entregada');
  }
  
  this.envio.fecha_entrega_real = fechaEntrega || new Date();
  
  // Actualizar estado de todos los items
  this.items.forEach(item => {
    if (item.estado_item !== 'devuelto') {
      item.estado_item = 'entregado';
    }
  });
  
  this.cambiarEstado('entregado', usuarioId, 'Orden entregada exitosamente');
  
  return this;
};

// Cancelar venta (CORREGIDO: no guarda automáticamente)
ventaSchema.methods.cancelarVenta = function(motivo, solicitadaPor, usuarioId) {
  // Validar que se puede cancelar
  const estadosNoCancelables = ['enviado', 'en_transito', 'entregado', 'cancelado', 'reembolsado'];
  if (estadosNoCancelables.includes(this.estado)) {
    throw new Error(`No se puede cancelar una orden en estado: ${this.estado}`);
  }
  
  this.cancelacion = {
    fecha: new Date(),
    motivo,
    solicitada_por: solicitadaPor,
    usuario_responsable: usuarioId
  };
  
  // Si el pago fue aprobado, marcarlo para reembolso
  if (this.pago.estado_pago === 'aprobado') {
    this.pago.estado_pago = 'reembolsado';
  }
  
  this.cambiarEstado('cancelado', usuarioId, `Venta cancelada: ${motivo}`);
  
  return this;
};

// Agregar nota interna
ventaSchema.methods.agregarNotaInterna = function(nota, usuarioId) {
  this.notas_internas.push({
    nota,
    usuario: usuarioId
  });
  
  return this;
};

// Validar si se puede solicitar devolución
ventaSchema.methods.puedeSolicitarDevolucion = function() {
  if (this.estado !== 'entregado') {
    return { puede: false, razon: 'La orden debe estar entregada para solicitar devolución' };
  }
  
  const diasDesdeEntrega = Math.floor((new Date() - this.envio.fecha_entrega_real) / (1000 * 60 * 60 * 24));
  if (diasDesdeEntrega > 8) {
    return { puede: false, razon: 'Han pasado más de 8 días desde la entrega' };
  }
  
  return { puede: true };
};

// MÉTODOS ESTÁTICOS

// Obtener ventas de un cliente
ventaSchema.statics.obtenerVentasCliente = function(idCliente, opciones = {}) {
  const {
    page = 1,
    limit = 10,
    estado = null,
    ordenar = '-fecha_creacion'
  } = opciones;
  
  const query = { id_cliente: idCliente };
  if (estado) {
    query.estado = estado;
  }
  
  return this.find(query)
    .sort(ordenar)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('-notas_internas'); // No mostrar notas internas a clientes
};

// Obtener ventas para administradores
ventaSchema.statics.obtenerVentasAdmin = function(filtros = {}, opciones = {}) {
  const {
    page = 1,
    limit = 20,
    ordenar = '-fecha_creacion'
  } = opciones;
  
  const query = {};
  
  if (filtros.estado) query.estado = filtros.estado;
  if (filtros.cliente) query.id_cliente = filtros.cliente;
  if (filtros.numero_venta) query.numero_venta = new RegExp(filtros.numero_venta, 'i');
  if (filtros.fecha_desde) query.fecha_creacion = { $gte: new Date(filtros.fecha_desde) };
  if (filtros.fecha_hasta) {
    query.fecha_creacion = query.fecha_creacion || {};
    query.fecha_creacion.$lte = new Date(filtros.fecha_hasta);
  }
  
  return this.find(query)
    .populate('id_cliente', 'nombres apellidos email')
    .sort(ordenar)
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Obtener estadísticas de ventas
ventaSchema.statics.obtenerEstadisticas = async function(fechaInicio, fechaFin) {
  const stats = await this.aggregate([
    {
      $match: {
        fecha_creacion: {
          $gte: fechaInicio,
          $lte: fechaFin
        },
        estado: { $nin: ['cancelado', 'fallo_pago'] }
      }
    },
    {
      $group: {
        _id: null,
        total_ventas: { $sum: '$totales.total_final' },
        cantidad_ordenes: { $sum: 1 },
        ticket_promedio: { $avg: '$totales.total_final' },
        total_descuentos: { $sum: '$totales.total_descuentos' },
        total_envios: { $sum: '$totales.costo_envio' }
      }
    }
  ]);
  
  const ventasPorEstado = await this.aggregate([
    {
      $match: {
        fecha_creacion: {
          $gte: fechaInicio,
          $lte: fechaFin
        }
      }
    },
    {
      $group: {
        _id: '$estado',
        cantidad: { $sum: 1 },
        total: { $sum: '$totales.total_final' }
      }
    }
  ]);
  
  return {
    resumen: stats[0] || {
      total_ventas: 0,
      cantidad_ordenes: 0,
      ticket_promedio: 0,
      total_descuentos: 0,
      total_envios: 0
    },
    por_estado: ventasPorEstado
  };
};

const Venta = mongoose.model('Venta', ventaSchema);

module.exports = Venta;