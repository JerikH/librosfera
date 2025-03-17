const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Opciones para el discriminador
const options = {
  discriminatorKey: 'tipo_usuario',
  collection: 'usuarios'
};

// Esquema base para todos los usuarios
const usuarioSchema = new Schema({
  usuario: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingrese un email válido']
  },
  fecha_registro: {
    type: Date,
    default: Date.now
  },
  ultimo_acceso: {
    type: Date
  },
  activo: {
    type: Boolean,
    default: true
  },
  tipo_usuario: {
    type: String,
    enum: ['cliente', 'administrador', 'root'],
    required: true
  }
}, options);

// Crear el modelo base
const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;