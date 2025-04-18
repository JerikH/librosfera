const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const addressSchema = require('./schemas/addressSchema');

const devolucionSchema = new Schema({
  // Identificador único de la devolución
  id_devolucion: {
    type: String,
    default: function() {
      return new mongoose.Types.ObjectId().toString();
    },
    unique: true,
    index: true
  },
  
  // Transacción a la que está asociada la devolución
  id_transaccion: {
    type: Schema.Types.ObjectId,
    ref: 'Transaccion',
    required: true,
    index: true
  },
  
  // Usuario que solicita la devolución
  id_usuario: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    index: true
  },
  
  // Motivo principal de la devolución
  motivo: {
    type: String,
    enum: ['mal_estado', 'no_satisfactorio', 'retraso_entrega', 'otro'],
    required: true
  },
  
  // Descripción detallada del motivo
  descripcion: {
    type: String,
    trim: true
  },
  
  // Ítems que se están devolviendo
  items: [{
    id_libro: {
      type: Schema.Types.ObjectId,
      ref: 'Libro',
      required: true
    },
    cantidad: {
      type: Number,
      required: true,
      min: 1
    },
    titulo: String, // Para mantener el título incluso si el libro cambia
    precio_unitario: Number,
    subtotal: Number,
    estado_item: {
      type: String,
      enum: ['solicitado', 'en_revision', 'aceptado', 'rechazado'],
      default: 'solicitado'
    }
  }],
  
  // Fecha de solicitud
  fecha_solicitud: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Código QR o código único enviado al cliente para la devolución
  codigo_devolucion: {
    type: String,
    required: true,
    unique: true
  },
  
  // Estado general de la devolución
  estado: {
    type: String,
    enum: ['solicitada', 'en_proceso', 'aceptada', 'rechazada', 'completada'],
    default: 'solicitada',
    index: true
  },
  
  // Información de reembolso (si aplica)
  reembolso: {
    monto: Number,
    metodo: {
      type: String,
      enum: ['mismo_metodo_pago', 'saldo_cuenta', 'otro']
    },
    fecha_reembolso: Date,
    id_transaccion_reembolso: Schema.Types.ObjectId,
    notas: String
  },
  
  // Método de devolución
  metodo_devolucion: {
    type: String,
    enum: ['tienda_fisica', 'recogida_domicilio', 'envio_cliente'],
    required: true
  },
  
  // Tienda física donde se realizará la devolución (si aplica)
  id_tienda_devolucion: {
    type: Schema.Types.ObjectId,
    ref: 'Tienda_Fisica'
  },
  
  // Dirección para recogida a domicilio (si aplica)
  direccion_recogida: {
    type: [addressSchema]
  },
  
  // Fechas de procesamiento
  fechas: {
    aprobacion: Date,
    recepcion_items: Date,
    reembolso: Date
  },
  
  // Historial de cambios de estado
  historial: [{
    estado_anterior: String,
    estado_nuevo: String,
    fecha: {
      type: Date,
      default: Date.now
    },
    id_usuario_operacion: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    notas: String
  }],
  
  // Imágenes adjuntas del producto (opcional)
  imagenes: [String],
  
  // Notas internas
  notas_internas: String
});

// ÍNDICES
devolucionSchema.index({ fecha_solicitud: -1 });
devolucionSchema.index({ estado: 1, fecha_solicitud: -1 });
devolucionSchema.index({ id_transaccion: 1, estado: 1 });

// MIDDLEWARE
// Actualiza el historial cuando cambia el estado
devolucionSchema.pre('save', function(next) {
  if (this.isModified('estado')) {
    const estadoAnterior = this.modifiedPaths().includes('estado') 
      ? this._original.estado 
      : undefined;
      
    if (estadoAnterior && estadoAnterior !== this.estado) {
      this.historial.push({
        estado_anterior: estadoAnterior,
        estado_nuevo: this.estado,
        fecha: new Date()
      });
    }
  }
  next();
});

// MÉTODOS DE INSTANCIA

// Aprobar la devolución
devolucionSchema.methods.aprobar = async function(idUsuarioAdmin, notas = '') {
  if (this.estado !== 'solicitada') {
    throw new Error('Solo se pueden aprobar devoluciones en estado "solicitada"');
  }
  
  // Verificar que no hayan pasado más de 8 días desde la compra
  const Transaccion = mongoose.model('Transaccion');
  const transaccion = await Transaccion.findById(this.id_transaccion);
  
  if (!transaccion) {
    throw new Error('Transacción no encontrada');
  }
  
  const diasTranscurridos = Math.floor(
    (this.fecha_solicitud - transaccion.fecha_pago) / (1000 * 60 * 60 * 24)
  );
  
  if (diasTranscurridos > 8) {
    throw new Error('No se pueden hacer devoluciones pasados 8 días después de haber recibido el producto');
  }
  
  this.estado = 'aceptada';
  this.fechas.aprobacion = new Date();
  
  // Actualizar el estado de los items
  this.items.forEach(item => {
    item.estado_item = 'aceptado';
  });
  
  // Añadir al historial
  this.historial.push({
    estado_anterior: 'solicitada',
    estado_nuevo: 'aceptada',
    fecha: new Date(),
    id_usuario_operacion: idUsuarioAdmin,
    notas: notas || 'Devolución aprobada'
  });
  
  return this.save();
};

// Rechazar la devolución
devolucionSchema.methods.rechazar = async function(idUsuarioAdmin, motivo) {
  if (this.estado !== 'solicitada' && this.estado !== 'en_proceso') {
    throw new Error('Solo se pueden rechazar devoluciones en estado "solicitada" o "en_proceso"');
  }
  
  this.estado = 'rechazada';
  
  // Actualizar el estado de los items
  this.items.forEach(item => {
    item.estado_item = 'rechazado';
  });
  
  // Añadir al historial
  this.historial.push({
    estado_anterior: this.estado,
    estado_nuevo: 'rechazada',
    fecha: new Date(),
    id_usuario_operacion: idUsuarioAdmin,
    notas: motivo || 'Devolución rechazada'
  });
  
  return this.save();
};

// Registrar recepción de items
devolucionSchema.methods.registrarRecepcion = async function(idUsuarioAdmin, notas = '') {
  if (this.estado !== 'aceptada') {
    throw new Error('Solo se pueden recibir devoluciones en estado "aceptada"');
  }
  
  this.fechas.recepcion_items = new Date();
  
  // Añadir al historial
  this.historial.push({
    estado_anterior: this.estado,
    estado_nuevo: this.estado,
    fecha: new Date(),
    id_usuario_operacion: idUsuarioAdmin,
    notas: notas || 'Ítems recibidos'
  });
  
  return this.save();
};

// Procesar reembolso
devolucionSchema.methods.procesarReembolso = async function(montoReembolso, metodoReembolso, idUsuarioAdmin, notas = '') {
  if (this.estado !== 'aceptada' || !this.fechas.recepcion_items) {
    throw new Error('Solo se pueden reembolsar devoluciones aceptadas y recibidas');
  }
  
  this.reembolso = {
    monto: montoReembolso,
    metodo: metodoReembolso,
    fecha_reembolso: new Date(),
    notas: notas
  };
  
  this.fechas.reembolso = new Date();
  this.estado = 'completada';
  
  // Añadir al historial
  this.historial.push({
    estado_anterior: 'aceptada',
    estado_nuevo: 'completada',
    fecha: new Date(),
    id_usuario_operacion: idUsuarioAdmin,
    notas: `Reembolso procesado por ${montoReembolso}. ${notas}`
  });
  
  // Si el reembolso va al saldo del usuario, actualizarlo
  if (metodoReembolso === 'saldo_cuenta') {
    const Saldo = mongoose.model('Saldo');
    await Saldo.obtenerOCrearSaldo(this.id_usuario)
      .then(saldo => saldo.agregarFondos(
        montoReembolso, 
        'reembolso', 
        `Reembolso por devolución #${this.id_devolucion}`,
        this._id,
        idUsuarioAdmin
      ));
  }
  
  return this.save();
};

// MÉTODOS ESTÁTICOS

// Crear una nueva solicitud de devolución
devolucionSchema.statics.solicitarDevolucion = async function(idTransaccion, idUsuario, motivo, descripcion, items, metodoDevolucion, direccionOTienda) {
  // Verificar la transacción
  const Transaccion = mongoose.model('Transaccion');
  const transaccion = await Transaccion.findById(idTransaccion);
  
  if (!transaccion) {
    throw new Error('Transacción no encontrada');
  }
  
  // Verificar que el usuario sea el propietario de la transacción
  if (transaccion.id_usuario.toString() !== idUsuario.toString()) {
    throw new Error('El usuario no es propietario de esta transacción');
  }
  
  // Verificar que no hayan pasado más de 8 días
  const diasTranscurridos = Math.floor(
    (new Date() - transaccion.fecha_pago) / (1000 * 60 * 60 * 24)
  );
  
  if (diasTranscurridos > 8) {
    throw new Error('No se pueden hacer devoluciones pasados 8 días después de haber recibido el producto');
  }
  
  // Verificar que los items estén en la transacción
  for (const item of items) {
    const transaccionItem = transaccion.items.find(
      i => i.id_libro.toString() === item.id_libro.toString()
    );
    
    if (!transaccionItem) {
      throw new Error(`El libro ${item.id_libro} no está en esta transacción`);
    }
    
    if (item.cantidad > transaccionItem.cantidad) {
      throw new Error(`No se puede devolver más unidades (${item.cantidad}) que las compradas (${transaccionItem.cantidad})`);
    }
    
    // Añadir información adicional del item
    item.titulo = transaccionItem.titulo;
    item.precio_unitario = transaccionItem.precio_unitario;
    item.subtotal = transaccionItem.precio_unitario * item.cantidad;
  }
  
  // Generar código QR único
  const codigoDevolucion = `DEV-${idTransaccion}-${Date.now().toString(36)}`;
  
  // Crear objeto de devolución
  const devolucion = new this({
    id_transaccion: idTransaccion,
    id_usuario: idUsuario,
    motivo: motivo,
    descripcion: descripcion,
    items: items,
    codigo_devolucion: codigoDevolucion,
    metodo_devolucion: metodoDevolucion
  });
  
  // Agregar dirección o tienda según el método
  if (metodoDevolucion === 'tienda_fisica') {
    devolucion.id_tienda_devolucion = direccionOTienda;
  } else if (metodoDevolucion === 'recogida_domicilio') {
    devolucion.direccion_recogida = direccionOTienda;
  }
  
  await devolucion.save();
  
  // Actualizar la transacción para indicar que hay una devolución en proceso
  await Transaccion.findByIdAndUpdate(
    idTransaccion,
    { $set: { 'items.$[elem].estado_item': 'en_proceso_devolucion' } },
    { 
      arrayFilters: [{ 
        'elem.id_libro': { $in: items.map(item => item.id_libro) } 
      }] 
    }
  );
  
  return devolucion;
};

// Obtener devoluciones pendientes
devolucionSchema.statics.obtenerDevolucionesPendientes = function() {
  return this.find({
    estado: { $in: ['solicitada', 'en_proceso', 'aceptada'] }
  })
  .sort({ fecha_solicitud: 1 })
  .populate('id_usuario', 'nombre email')
  .populate('id_transaccion', 'id_transaccion fecha_pago');
};

// Obtener devoluciones de un usuario
devolucionSchema.statics.obtenerDevolucionesUsuario = function(idUsuario) {
  return this.find({ id_usuario: idUsuario })
    .sort({ fecha_solicitud: -1 });
};

// Validar código de devolución
devolucionSchema.statics.validarCodigoDevolucion = function(codigo) {
  return this.findOne({ codigo_devolucion: codigo });
};

const Devolucion = mongoose.model('Devolucion', devolucionSchema);

module.exports = Devolucion;