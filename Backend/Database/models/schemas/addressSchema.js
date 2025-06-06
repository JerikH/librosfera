// Database/models/schemas/addressSchema.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = new Schema({
  tipo: {
    type: String,
    enum: ['casa', 'trabajo', 'otro'],
    default: 'casa'
  },
  direccion_completa: {
    type: String,
    required: [true, 'La dirección completa es obligatoria'],
    trim: true,
    maxlength: [200, 'La dirección no puede exceder 200 caracteres']
  },
  ciudad: {
    type: String,
    required: [true, 'La ciudad es obligatoria'],
    trim: true,
    maxlength: [100, 'La ciudad no puede exceder 100 caracteres']
  },
  departamento: {
    type: String,
    required: [true, 'El departamento es obligatorio'],
    trim: true,
    maxlength: [100, 'El departamento no puede exceder 100 caracteres']
  },
  codigo_postal: {
    type: String,
    trim: true,
    maxlength: [20, 'El código postal no puede exceder 20 caracteres']
  },
  pais: {
    type: String,
    default: 'Colombia',
    trim: true,
    maxlength: [50, 'El país no puede exceder 50 caracteres']
  },
  telefono_contacto: {
    type: String,
    trim: true,
    maxlength: [20, 'El teléfono no puede exceder 20 caracteres'],
    match: [/^[\+]?[0-9\s\-\(\)]*$/, 'Formato de teléfono no válido']
  },
  referencia: {
    type: String,
    trim: true,
    maxlength: [500, 'La referencia no puede exceder 500 caracteres'],
    description: 'Puntos de referencia o indicaciones adicionales para encontrar la dirección'
  },
  predeterminada: {
    type: Boolean,
    default: false,
    description: 'Indica si esta es la dirección predeterminada del usuario'
  },
  activa: {
    type: Boolean,
    default: true,
    description: 'Indica si la dirección está activa y puede usarse'
  },
  fecha_creacion: {
    type: Date,
    default: Date.now
  },
  fecha_actualizacion: {
    type: Date,
    default: Date.now
  }
});

// Middleware pre-save para actualizar fecha de modificación
addressSchema.pre('save', function(next) {
  this.fecha_actualizacion = new Date();
  next();
});

// Método virtual para obtener dirección formateada
addressSchema.virtual('direccion_formateada').get(function() {
  let direccion = this.direccion_completa;
  
  if (this.ciudad) {
    direccion += `, ${this.ciudad}`;
  }
  
  if (this.departamento) {
    direccion += `, ${this.departamento}`;
  }
  
  if (this.codigo_postal) {
    direccion += ` ${this.codigo_postal}`;
  }
  
  if (this.pais && this.pais !== 'Colombia') {
    direccion += `, ${this.pais}`;
  }
  
  return direccion;
});

// Método virtual para validar si la dirección está completa
addressSchema.virtual('esta_completa').get(function() {
  return !!(this.direccion_completa && this.ciudad && this.departamento);
});

// Método para validar si la dirección es válida para envío
addressSchema.methods.esValidaParaEnvio = function() {
  return this.activa && this.esta_completa;
};

// Índices
addressSchema.index({ predeterminada: 1 });
addressSchema.index({ activa: 1 });
addressSchema.index({ ciudad: 1, departamento: 1 });

module.exports = addressSchema;