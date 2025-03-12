// USUARIO ROOT
const rootSchema = Usuario.discriminator('root', new Schema({
    id_root: {
      type: String,
      required: true,
      unique: true
    }
  }));
  
  // USUARIO ADMINISTRADOR
  const administradorSchema = Usuario.discriminator('administrador', new Schema({
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
      type: String,
      required: true
    },
    genero: {
      type: String,
      enum: ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir']
    }
  }));
  
  // USUARIO CLIENTE
  const clienteSchema = Usuario.discriminator('cliente', new Schema({
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
      type: String,
      required: true
    },
    genero: {
      type: String,
      enum: ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir']
    },
    preferencias: {
      temas: [{
        type: String,
        enum: ['Novela', 'Ciencia Ficción', 'Historia', 'Biografía', 'Poesía', 'Infantil', 'Autoayuda', 'Académico', 'Otros']
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
    Root: mongoose.model('root'),
    Administrador: mongoose.model('administrador'),
    Cliente: mongoose.model('cliente'),
    Visitante: mongoose.model('visitante')
  };