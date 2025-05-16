const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mensajeSchema = new Schema({
  id_mensaje: {
    type: String,
    default: function() {
      return new mongoose.Types.ObjectId().toString();
    },
    unique: true,
    index: true
  },
  
  // Participantes
  id_cliente: {
    type: Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true,
    index: true
  },
  
  id_admin: {
    type: Schema.Types.ObjectId,
    ref: 'Administrador',
    index: true
  },
  
  // Contenid
  mensaje: {
    type: String,
    required: true
  },
  
  // Metadatos
  fecha_envio: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  leido: {
    type: Boolean,
    default: false
  },
  
  // Direccionalidad
  direccion: {
    type: String,
    enum: ['cliente_a_admin', 'admin_a_cliente'],
    required: true
  },
  
  // Adjuntos (opcional)
  adjuntos: [{
    nombre: String,
    url: String,
    tipo: String
  }]
});

// ÍNDICES COMPUESTOS
mensajeSchema.index({ id_cliente: 1, fecha_envio: -1 });
mensajeSchema.index({ id_admin: 1, fecha_envio: -1 });

// MÉTODOS ESTÁTICOS

// Obtener conversación completa
mensajeSchema.statics.obtenerConversacion = function(idCliente, idAdmin = null) {
  const query = { id_cliente: idCliente };
  
  if (idAdmin) {
    query.id_admin = idAdmin;
  }
  
  return this.find(query)
    .sort({ fecha_envio: 1 });
};

// Obtener mensajes no leídos
mensajeSchema.statics.obtenerNoLeidos = function(idUsuario, esAdmin = false) {
  const query = esAdmin 
    ? { id_admin: idUsuario, leido: false, direccion: 'cliente_a_admin' }
    : { id_cliente: idUsuario, leido: false, direccion: 'admin_a_cliente' };
  
  return this.find(query)
    .sort({ fecha_envio: 1 });
};

// Marcar como leídos
mensajeSchema.statics.marcarComoLeidos = function(idUsuario, esAdmin = false) {
  const query = esAdmin 
    ? { id_admin: idUsuario, leido: false, direccion: 'cliente_a_admin' }
    : { id_cliente: idUsuario, leido: false, direccion: 'admin_a_cliente' };
  
  return this.updateMany(
    query,
    { leido: true }
  );
};

// Enviar mensaje
mensajeSchema.statics.enviarMensaje = async function(emisor, receptor, contenido, adjuntos = []) {
  const esCliente = emisor.tipo_usuario === 'cliente';
  
  return new this({
    id_cliente: esCliente ? emisor._id : receptor._id,
    id_admin: esCliente ? receptor._id : emisor._id,
    mensaje: contenido,
    direccion: esCliente ? 'cliente_a_admin' : 'admin_a_cliente',
    adjuntos: adjuntos
  }).save();
};

const Mensaje = mongoose.model('Mensaje', mensajeSchema);

module.exports = Mensaje;