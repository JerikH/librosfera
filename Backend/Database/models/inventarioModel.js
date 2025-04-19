const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const inventarioSchema = new Schema({
  // Identificador único del registro de inventario
  id_inventario: {
    type: String,
    default: function() {
      return new mongoose.Types.ObjectId().toString();
    },
    unique: true,
    index: true
  },
  
  // Referencia al libro asociado
  id_libro: {
    type: Schema.Types.ObjectId,
    ref: 'Libro',
    required: true,
    index: true
  },
  
  // Estado actual del inventario
  estado: {
    type: String,
    enum: ['disponible', 'agotado', 'baja_existencia', 'historico_agotado'],
    default: 'disponible',
    index: true
  },
  
  // Contadores de stock
  stock_total: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  
  stock_disponible: {
    type: Number,
    default: 0,
    min: 0
  },
  
  stock_reservado: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Umbral para alertas de bajo stock
  umbral_alerta: {
    type: Number,
    default: 5,
    min: 1
  },
  
  id_tienda: {
    type: Schema.Types.ObjectId,
    ref: 'Tienda_Fisica',
    index: true
  },
  
  // Registro de movimientos de inventario
  movimientos: [{
    tipo: {
      type: String,
      enum: ['entrada', 'salida', 'reserva', 'liberacion_reserva', 'ajuste', 'baja'],
      required: true
    },
    cantidad: {
      type: Number,
      required: true
    },
    fecha: {
      type: Date,
      default: Date.now
    },
    id_usuario: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    motivo: {
      type: String,
      enum: ['compra', 'venta', 'devolucion', 'perdida', 'daño', 'inventario_inicial', 'ajuste_auditoria', 'reserva', 'expiracion_reserva']
    },
    id_transaccion: {
      type: Schema.Types.ObjectId,
      ref: 'Transaccion'
    },
    id_reserva: {
      type: Schema.Types.ObjectId,
      ref: 'Reserva'
    },
    notas: String
  }],
  
  // Historial de cambios de estado
  historial_estados: [{
    estado_anterior: {
      type: String,
      enum: ['disponible', 'agotado', 'baja_existencia', 'historico_agotado']
    },
    estado_nuevo: {
      type: String,
      enum: ['disponible', 'agotado', 'baja_existencia', 'historico_agotado'],
      required: true
    },
    fecha_cambio: {
      type: Date,
      default: Date.now
    },
    razon: String,
    id_usuario: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario'
    }
  }],
  
  // Última fecha de auditoría física
  ultima_auditoria: {
    fecha: Date,
    id_usuario: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    resultados: {
      stock_sistema: Number,
      stock_fisico: Number,
      diferencia: Number,
      ajustado: Boolean
    }
  },
  
  // Metadatos
  fecha_creacion: {
    type: Date,
    default: Date.now
  },
  ultima_actualizacion: {
    type: Date,
    default: Date.now
  }
});

// ÍNDICES
// Para consultas frecuentes y optimización
inventarioSchema.index({ id_libro: 1, estado: 1 });
inventarioSchema.index({ stock_disponible: 1 });
inventarioSchema.index({ 'movimientos.fecha': 1 });

// PRE-SAVE MIDDLEWARE
// Actualizar fecha de modificación automáticamente
inventarioSchema.pre('save', function(next) {
  this.ultima_actualizacion = new Date();
  
  // Actualizar estado basado en niveles de stock
  if (this.stock_total === 0) {
    this.estado = 'agotado';
  } else if (this.stock_disponible <= this.umbral_alerta) {
    this.estado = 'baja_existencia';
  } else {
    this.estado = 'disponible';
  }
  
  next();
});

// MÉTODOS DE INSTANCIA

// Registrar entrada de nuevos ejemplares
inventarioSchema.methods.registrarEntrada = async function(cantidad, motivo, idUsuario, notas = '') {
  if (cantidad <= 0) {
    throw new Error('La cantidad debe ser mayor que cero');
  }
  
  const estadoAnterior = this.estado;
  
  // Actualizar contadores
  this.stock_total += cantidad;
  this.stock_disponible += cantidad;
  
  // Registrar el movimiento
  this.movimientos.push({
    tipo: 'entrada',
    cantidad: cantidad,
    fecha: new Date(),
    id_usuario: idUsuario,
    motivo: motivo,
    notas: notas
  });
  
  // Si cambió el estado, registrar el cambio
  if (this.estado !== estadoAnterior) {
    this.historial_estados.push({
      estado_anterior: estadoAnterior,
      estado_nuevo: this.estado,
      fecha_cambio: new Date(),
      razon: `Entrada de ${cantidad} ejemplares - ${motivo}`,
      id_usuario: idUsuario
    });
  }
  
  return this.save();
};

// Registrar salida de ejemplares (ventas, pérdidas, etc.)
inventarioSchema.methods.registrarSalida = async function(cantidad, motivo, idUsuario, idTransaccion = null, notas = '') {
  if (cantidad <= 0) {
    throw new Error('La cantidad debe ser mayor que cero');
  }
  
  if (cantidad > this.stock_disponible) {
    throw new Error('No hay suficiente stock disponible para esta operación');
  }
  
  const estadoAnterior = this.estado;
  
  // Actualizar contadores
  this.stock_total -= cantidad;
  this.stock_disponible -= cantidad;
  
  // Registrar el movimiento
  this.movimientos.push({
    tipo: 'salida',
    cantidad: cantidad,
    fecha: new Date(),
    id_usuario: idUsuario,
    motivo: motivo,
    id_transaccion: idTransaccion,
    notas: notas
  });
  
  // Si cambió el estado, registrar el cambio
  if (this.estado !== estadoAnterior) {
    this.historial_estados.push({
      estado_anterior: estadoAnterior,
      estado_nuevo: this.estado,
      fecha_cambio: new Date(),
      razon: `Salida de ${cantidad} ejemplares - ${motivo}`,
      id_usuario: idUsuario
    });
    
    // Si se agotó el stock, verificar si debe pasar a histórico agotado
    if (this.estado === 'agotado') {
      // Lógica para decidir si se marca como histórico_agotado
      // Por ejemplo, basado en el tiempo que lleva agotado o políticas de la tienda
    }
  }
  
  return this.save();
};

// Reservar ejemplares
inventarioSchema.methods.reservarEjemplares = async function(cantidad, idUsuario, idReserva, notas = '') {
  if (cantidad <= 0) {
    throw new Error('La cantidad debe ser mayor que cero');
  }
  
  if (cantidad > this.stock_disponible) {
    throw new Error('No hay suficiente stock disponible para reservar');
  }
  
  // Actualizar contadores
  this.stock_disponible -= cantidad;
  this.stock_reservado += cantidad;
  
  // Registrar el movimiento
  this.movimientos.push({
    tipo: 'reserva',
    cantidad: cantidad,
    fecha: new Date(),
    id_usuario: idUsuario,
    motivo: 'reserva',
    id_reserva: idReserva,
    notas: notas
  });
  
  return this.save();
};

// Liberar reserva de ejemplares
inventarioSchema.methods.liberarReserva = async function(cantidad, idUsuario, idReserva, notas = '') {
  if (cantidad <= 0) {
    throw new Error('La cantidad debe ser mayor que cero');
  }
  
  if (cantidad > this.stock_reservado) {
    throw new Error('La cantidad a liberar excede el stock reservado');
  }
  
  // Actualizar contadores
  this.stock_disponible += cantidad;
  this.stock_reservado -= cantidad;
  
  // Registrar el movimiento
  this.movimientos.push({
    tipo: 'liberacion_reserva',
    cantidad: cantidad,
    fecha: new Date(),
    id_usuario: idUsuario,
    motivo: 'expiracion_reserva',
    id_reserva: idReserva,
    notas: notas
  });
  
  return this.save();
};

// Marcar como histórico agotado
inventarioSchema.methods.marcarComoHistoricoAgotado = async function(idUsuario, razon = '') {
  if (this.estado !== 'agotado') {
    throw new Error('Solo se pueden marcar como histórico los libros agotados');
  }
  
  const estadoAnterior = this.estado;
  this.estado = 'historico_agotado';
  
  // Registrar el cambio de estado
  this.historial_estados.push({
    estado_anterior: estadoAnterior,
    estado_nuevo: 'historico_agotado',
    fecha_cambio: new Date(),
    razon: razon || 'Marcado como histórico agotado',
    id_usuario: idUsuario
  });
  
  // Actualizar también el estado en el modelo de Libro
  await mongoose.model('Libro').findByIdAndUpdate(
    this.id_libro,
    { categoria_historico: true }
  );
  
  return this.save();
};

// Realizar auditoría de inventario
inventarioSchema.methods.registrarAuditoria = async function(stockFisico, idUsuario, ajustarAutomaticamente = false) {
  const diferencia = stockFisico - this.stock_total;
  
  this.ultima_auditoria = {
    fecha: new Date(),
    id_usuario: idUsuario,
    resultados: {
      stock_sistema: this.stock_total,
      stock_fisico: stockFisico,
      diferencia: diferencia,
      ajustado: ajustarAutomaticamente
    }
  };
  
  // Si se debe ajustar automáticamente
  if (ajustarAutomaticamente && diferencia !== 0) {
    const estadoAnterior = this.estado;
    
    // Actualizar stock
    this.stock_total = stockFisico;
    this.stock_disponible = Math.max(0, this.stock_disponible + diferencia);
    
    // Registrar el movimiento
    this.movimientos.push({
      tipo: 'ajuste',
      cantidad: Math.abs(diferencia),
      fecha: new Date(),
      id_usuario: idUsuario,
      motivo: 'ajuste_auditoria',
      notas: `Ajuste por auditoría. Diferencia: ${diferencia}`
    });
    
    // Si cambió el estado, registrar el cambio
    if (this.estado !== estadoAnterior) {
      this.historial_estados.push({
        estado_anterior: estadoAnterior,
        estado_nuevo: this.estado,
        fecha_cambio: new Date(),
        razon: `Ajuste por auditoría. Stock físico: ${stockFisico}`,
        id_usuario: idUsuario
      });
    }
  }
  
  return this.save();
};

// MÉTODOS ESTÁTICOS

// Obtener libros con bajo stock
inventarioSchema.statics.obtenerBajoStock = function(limite = 20) {
  return this.find({ 
    estado: 'baja_existencia',
    stock_total: { $gt: 0 } 
  })
  .sort({ stock_disponible: 1 })
  .limit(limite)
  .populate('id_libro', 'titulo autor editorial ISBN');
};

// Obtener libros agotados
inventarioSchema.statics.obtenerAgotados = function(limite = 20) {
  return this.find({ 
    estado: 'agotado'
  })
  .sort({ ultima_actualizacion: -1 })
  .limit(limite)
  .populate('id_libro', 'titulo autor editorial ISBN');
};

// Obtener historial de movimientos para un libro
inventarioSchema.statics.obtenerHistorialLibro = function(idLibro, desde, hasta, tipoMovimiento = null) {
  const query = { id_libro: idLibro };
  
  if (desde || hasta) {
    query['movimientos.fecha'] = {};
    if (desde) query['movimientos.fecha'].$gte = desde;
    if (hasta) query['movimientos.fecha'].$lte = hasta;
  }
  
  const pipeline = [
    { $match: query },
    { $unwind: '$movimientos' },
    { $sort: { 'movimientos.fecha': -1 } }
  ];
  
  if (tipoMovimiento) {
    pipeline.push({ $match: { 'movimientos.tipo': tipoMovimiento } });
  }
  
  return this.aggregate(pipeline);
};

const Inventario = mongoose.model('Inventario', inventarioSchema);

module.exports = Inventario;