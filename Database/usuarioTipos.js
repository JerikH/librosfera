const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Usuario = require('./usuario.model'); // Importamos el modelo base

// Esquema de dirección para reutilizar
const direccionSchema = new Schema({
  calle: { type: String, required: true },
  ciudad: { type: String, required: true },
  codigo_postal: { type: String, required: true },
  pais: { type: String, required: true }
});


// USUARIO ROOT
const Root = Usuario.discriminator('root', new Schema({
  id_root: {
    type: String,
    required: true,
    unique: true
  }
}));

// USUARIO ADMINISTRADOR
const Administrador = Usuario.discriminator('administrador', new Schema({
  DNI: {
    type: String,
    required: true,
    unique: true
  },
  nombres: {
    type: String,
    required: true
  },
  apellidos: {
    type: String,
    required: true
  },
  fecha_nacimiento: {
    type: Date,
    required: true
  },
  lugar_nacimiento: {
    type: String,
    required: true
  },
  direccion: {
    type: direccionSchema,
    required: true
  },
  genero: {
    type: String,
    enum: ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir']
  }
}));

// USUARIO CLIENTE
const Cliente = Usuario.discriminator('cliente', new Schema({
  id_cliente: {
    type: String,
    unique: true,
    required: true
  },
  DNI: {
    type: String,
    required: true,
    unique: true
  },
  nombres: {
    type: String,
    required: true
  },
  apellidos: {
    type: String,
    required: true
  },
  fecha_nacimiento: {
    type: Date,
    required: true
  },
  lugar_nacimiento: {
    type: String,
    required: true
  },
  direccion: {
    type: direccionSchema,
    required: true
  },
  genero: {
    type: String,
    enum: ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir']
  },
  preferencias: {
    temas: [{
      type: String,
      enum: ['Ficcion', 'No Ficción', 'Ciencia ficcion', 'Fantasía', 'Romance', 'Biografía', 'Historia', 'Ciencia', 'Filosofía', 'Arte', 'Tecnología']
    }],
    autores: [{
      type: String
    }]
  },
  suscrito_noticias: {
    type: Boolean,
    default: false
  }
}));

// Exportar todos los modelos
module.exports = {
  Usuario,   // Modelo base
  Root,
  Administrador,
  Cliente
};