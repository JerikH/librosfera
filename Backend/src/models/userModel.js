const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Esquema de dirección (reutilizable)
const direccionSchema = new mongoose.Schema({
  calle: { type: String, required: true },
  ciudad: { type: String, required: true },
  codigo_postal: { type: String, required: true },
  pais: { type: String, required: true }
});

// Esquema de método de pago
const metodoPagoSchema = new mongoose.Schema({
  tipo: { type: String, required: true },
  ultimos_digitos: { type: String, required: true },
  nombre_titular: { type: String, required: true },
  fecha_expiracion: { type: String, required: true },
  predeterminado: { type: Boolean, default: false }
});

// Esquema de dirección de envío
const direccionEnvioSchema = new mongoose.Schema({
  alias: { type: String, required: true },
  direccion: { type: String, required: true },
  ciudad: { type: String, required: true },
  codigo_postal: { type: String, required: true },
  pais: { type: String, required: true },
  telefono: { type: String, required: true },
  predeterminada: { type: Boolean, default: false }
});

// Esquema de lista personalizada
const listaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  fecha_creacion: { type: Date, default: Date.now },
  libros: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Libro' }]
});

// Esquema de búsqueda reciente
const busquedaSchema = new mongoose.Schema({
  termino: { type: String, required: true },
  fecha: { type: Date, default: Date.now }
});

// Esquema principal de usuario
const usuarioSchema = new mongoose.Schema({
  usuario: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 3
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingrese un email válido']
  },
  fecha_registro: { 
    type: Date, 
    default: Date.now 
  },
  ultima_conexion: { 
    type: Date, 
    default: Date.now 
  },
  tipo_usuario: { 
    type: String, 
    enum: ['cliente', 'admin', 'root'],
    default: 'cliente'
  },
  estado: { 
    type: String, 
    enum: ['activo', 'inactivo', 'suspendido'],
    default: 'activo'
  },
  
  // Datos personales
  datos_personales: {
    nombres: { type: String, required: true },
    apellidos: { type: String, required: true },
    DNI: { type: String, required: true, unique: true },
    fecha_nacimiento: { type: Date },
    lugar_nacimiento: { type: String },
    direccion: { type: direccionSchema },
    telefono: { type: String },
    genero: { type: String, enum: ['M', 'F', 'Otro'] }
  },
  
  // Perfil de cliente (opcional)
  perfil_cliente: {
    preferencias: [{ type: String }],
    nivel_fidelidad: { 
      type: String, 
      enum: ['bronce', 'plata', 'oro', 'platino'],
      default: 'bronce'
    },
    puntos_fidelidad: { 
      type: Number, 
      default: 0,
      min: 0
    },
    metodos_pago: [metodoPagoSchema],
    direcciones_envio: [direccionEnvioSchema]
  },
  
  // Perfil de administrador (opcional)
  perfil_admin: {
    rol: { 
      type: String, 
      enum: ['gestor_inventario', 'servicio_cliente', 'marketing', 'superadmin']
    },
    permisos: [{ type: String }],
    departamento: { type: String },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
  },
  
  // Listas personalizadas
  listas: [listaSchema],
  
  // Historial de búsquedas recientes
  busquedas_recientes: [busquedaSchema]
}, {
  timestamps: true, // Agrega createdAt y updatedAt
  versionKey: false // Elimina el campo __v
});

// Middleware para hashear la contraseña antes de guardar
usuarioSchema.pre('save', async function(next) {
  // Solo hashear la contraseña si ha sido modificada o es nueva
  if (!this.isModified('password')) return next();
  
  try {
    // Generar un salt
    const salt = await bcrypt.genSalt(10);
    // Hashear la contraseña con el salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para validar contraseña
usuarioSchema.methods.validarPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Método para obtener perfil público (sin datos sensibles)
usuarioSchema.methods.obtenerPerfilPublico = function() {
  const perfilPublico = {
    id: this._id,
    usuario: this.usuario,
    email: this.email,
    tipo_usuario: this.tipo_usuario,
    datos_personales: {
      nombres: this.datos_personales.nombres,
      apellidos: this.datos_personales.apellidos
    }
  };
  
  return perfilPublico;
};

// Crear índices para mejorar el rendimiento en búsquedas frecuentes
usuarioSchema.index({ usuario: 1 });
usuarioSchema.index({ email: 1 });
usuarioSchema.index({ 'datos_personales.DNI': 1 });
usuarioSchema.index({ tipo_usuario: 1, estado: 1 });

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;