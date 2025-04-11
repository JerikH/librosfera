const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const addressSchema = require('./schemas/addressSchema');

const tiendaFisicaSchema = new Schema({
  id_tienda: {
    type: String,
    default: function() {
      return new mongoose.Types.ObjectId().toString();
    },
    unique: true,
    index: true
  },
  
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  
  direccion: {
    type: addressSchema,
    required: true
  },
  
  telefono: {
    type: String,
    required: true
  },
  
  email: {
    type: String,
    required: true
  },
  
  horario: {
    lunes_viernes: String,
    sabado: String,
    domingo_festivos: String
  },
  
  // Coordenadas para Google Maps
  coordenadas: {
    latitud: Number,
    longitud: Number
  },
  
  // Si la tienda está activa y disponible para recogidas
  activa: {
    type: Boolean,
    default: true
  },
  
  // Capacidad de gestionar devoluciones
  acepta_devoluciones: {
    type: Boolean,
    default: true
  },
  
  // Fecha de apertura de la tienda
  fecha_apertura: {
    type: Date,
    default: Date.now
  }
});

// Método para obtener tiendas cercanas (simulado)
tiendaFisicaSchema.statics.obtenerTiendasCercanas = function(ciudad) {
  return this.find({ 
    'direccion.ciudad': ciudad,
    activa: true 
  });
};

// Método para verificar si un libro está disponible en esta tienda
tiendaFisicaSchema.methods.verificarDisponibilidadLibro = async function(idLibro, cantidad = 1) {
  const Inventario = mongoose.model('Inventario');
  
  const inventario = await Inventario.findOne({
    id_libro: idLibro,
    id_tienda: this._id,
    stock_disponible: { $gte: cantidad }
  });
  
  return !!inventario;
};

const TiendaFisica = mongoose.model('Tienda_Fisica', tiendaFisicaSchema);

module.exports = TiendaFisica;