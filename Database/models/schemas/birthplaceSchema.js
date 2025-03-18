// Database/models/schemas/birthplaceSchema.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Esquema reutilizable para lugares de nacimiento
 * Proporciona estructura estandarizada para información geográfica de origen
 */
const birthplaceSchema = new Schema({
  pais: { 
    type: String, 
    required: [true, 'El país es obligatorio'],
    trim: true,
    index: true
  },
  
  /// División administrativa principal (estado, provincia, departamento, etc.)
  region: { 
    type: String,
    trim: true,
    index: true
  },
  
  // Ciudad o municipio
  ciudad: { 
    type: String, 
    required: [true, 'La ciudad es obligatoria'],
    trim: true,
    index: true
  },
  
  
  
});

// Método helper para normalizar datos de entrada
birthplaceSchema.methods.normalizar = function() {
  // Capitalizar primeras letras
  if (this.ciudad) this.ciudad = this.ciudad.charAt(0).toUpperCase() + this.ciudad.slice(1).toLowerCase();
  if (this.pais) this.pais = this.pais.charAt(0).toUpperCase() + this.pais.slice(1).toLowerCase();
  if (this.region) this.region = this.region.charAt(0).toUpperCase() + this.region.slice(1).toLowerCase();
  
  return this;
};

module.exports = birthplaceSchema;