// Database/models/schemas/addressSchema.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Esquema reutilizable para direcciones
 * Puede ser utilizado en diferentes modelos que requieran información de dirección
 */
const addressSchema = new Schema({
  calle: { 
    type: String, 
    required: [true, 'La calle es obligatoria'] 
  },
  ciudad: { 
    type: String, 
    required: [true, 'La ciudad es obligatoria'] 
  },
  codigo_postal: { 
    type: String, 
    required: [true, 'El código postal es obligatorio'] 
  },
  pais: { 
    type: String, 
    required: [true, 'El país es obligatorio'] 
  },
  // Campos opcionales que pueden ser útiles
  estado_provincia: { 
    type: String
  },
  referencias: {
    type: String
  }
}, { _id: false }); // Evitar que cada dirección tenga su propio ID

module.exports = addressSchema;