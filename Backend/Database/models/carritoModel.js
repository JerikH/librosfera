const mongoose = require('mongoose');
const { metodoPagoSchema } = require('./schemas/metodoPagoSchema');
const addressSchema = require('./schemas/addressSchema');

const Schema = mongoose.Schema;
const carritoSchema = new Schema({
  // Identificador único del carrito
  id_carrito: {
    type: String,
    default: function() {
      return new mongoose.Types.ObjectId().toString();
    },
    unique: true,
    index: true
  },
  
  // Usuario al que pertenece el carrito
  id_usuario: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    index: true
  },
  
  // Total acumulado del carrito
  total: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Número total de items en el carrito
  n_item: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Estado del carrito
  estado: {
    type: String,
    enum: ['activo', 'en_proceso_compra', 'abandonado', 'convertido_a_compra'],
    default: 'activo'
  },
  
  // Fechas relevantes
  fecha_creacion: {
    type: Date,
    default: Date.now
  },
  
  ultima_actualizacion: {
    type: Date,
    default: Date.now
  },
  
  // Información de envío si ya se ha seleccionado
  info_envio: {
    direccion: {
      type: [addressSchema]
    },
    metodo_envio: {
      type: String,
      enum: ['domicilio', 'recogida_tienda']
    },
    tienda_recogida: String, // ID o nombre de la tienda si aplica
    notas_envio: String
  },
  
});

// Índices para operaciones comunes
carritoSchema.index({ id_usuario: 1, estado: 1 });
carritoSchema.index({ fecha_creacion: 1 });

// Middleware para actualizar fecha
carritoSchema.pre('save', function(next) {
  this.ultima_actualizacion = new Date();
  next();
});

// MÉTODOS DE INSTANCIA

// Actualizar totales del carrito
carritoSchema.methods.actualizarTotales = async function() {
  try {
    const CarritoItem = mongoose.model('Carrito_Items');
    
    // Calcular número de items
    const nItems = await CarritoItem.aggregate([
      { $match: { id_carrito: this._id } },
      { $group: { _id: null, total: { $sum: '$cantidad' } } }
    ]);
    
    // Calcular suma total
    const sumaTotal = await CarritoItem.aggregate([
      { $match: { id_carrito: this._id } },
      { $group: { _id: null, total: { $sum: '$subtotal' } } }
    ]);
    
    this.n_item = nItems.length > 0 ? nItems[0].total : 0;
    this.total = sumaTotal.length > 0 ? sumaTotal[0].total : 0;
    
    return this.save();
  } catch (error) {
    throw new Error(`Error al actualizar totales: ${error.message}`);
  }
};

// Vaciar carrito
carritoSchema.methods.vaciar = async function() {
  try {
    const CarritoItem = mongoose.model('Carrito_Items');
    await CarritoItem.deleteMany({ id_carrito: this._id });
    
    this.total = 0;
    this.n_item = 0;
    
    return this.save();
  } catch (error) {
    throw new Error(`Error al vaciar carrito: ${error.message}`);
  }
};

// Agregar dirección de envío
carritoSchema.methods.agregarDireccionEnvio = function(direccion, metodoEnvio, tiendaRecogida = null, notas = '') {
  this.info_envio = {
    direccion: direccion,
    metodo_envio: metodoEnvio,
    tienda_recogida: tiendaRecogida,
    notas_envio: notas
  };
  
  return this.save();
};



// Convertir a compra
carritoSchema.methods.convertirACompra = async function() {
  // Asegurarse de que el carrito tenga items
  const CarritoItem = mongoose.model('Carrito_Items');
  const itemsCount = await CarritoItem.countDocuments({ id_carrito: this._id });
  
  if (itemsCount === 0) {
    throw new Error('No se puede convertir un carrito vacío a compra');
  }
  
  // Verificar que tenga información de envío y método de pago
  if (!this.info_envio || !this.info_envio.metodo_envio) {
    throw new Error('Falta información de envío');
  }
  
  if (!this.metodo_pago || !this.metodo_pago.tipo) {
    throw new Error('Falta método de pago');
  }
  
  // Cambiar estado del carrito
  this.estado = 'convertido_a_compra';
  return this.save();
};

// MÉTODOS ESTÁTICOS

// Obtener carrito activo de un usuario
carritoSchema.statics.obtenerCarritoActivo = async function(idUsuario) {
  // Buscar carrito activo
  let carrito = await this.findOne({ 
    id_usuario: idUsuario, 
    estado: 'activo' 
  });
  
  // Si no existe, crear uno nuevo
  if (!carrito) {
    carrito = new this({
      id_usuario: idUsuario,
      estado: 'activo'
    });
    await carrito.save();
  }
  
  return carrito;
};

// Obtener carritos abandonados para seguimiento
carritoSchema.statics.obtenerCarritosAbandonados = function(diasInactividad = 3) {
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - diasInactividad);
  
  return this.find({
    estado: 'activo',
    ultima_actualizacion: { $lt: fechaLimite },
    n_item: { $gt: 0 }
  }).populate('id_usuario', 'email nombres');
};

const Carrito = mongoose.model('Carrito', carritoSchema);

module.exports = Carrito;