const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const libroSchema = new Schema({
  // Identificador único autogenerado para el libro
  id_libro: {
    type: String,
    default: function() {
      return new mongoose.Types.ObjectId().toString();
    },
    unique: true,
    index: true
  },
  
  // Información bibliográfica básica //////
  titulo: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  autor: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // ISBN/ISSN (sistema internacional de identificación de libros)
  ISBN: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Validación simple para ISBN-10 e ISBN-13
        return /^(?:\d[- ]?){9}[\dXx]$/.test(v) || /^(?:\d[- ]?){13}$/.test(v);
      },
      message: props => `${props.value} no es un formato válido de ISBN`
    }
  },
  
  // Información editorial y publicación
  editorial: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  genero: {
    type: String,
    required: true,
    index: true
  },
  
  idioma: {
    type: String,
    required: true,
    trim: true
  },
  
  fecha_publicacion: {
    type: Date,
    required: true
  },
  
  anio_publicacion: {
    type: Number,
    required: true,
    min: 1000,
    max: new Date().getFullYear()
  },
  
  numero_paginas: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Información comercial
  precio: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Estado del libro (nuevo o usado)
  estado: {
    type: String,
    enum: ['nuevo', 'usado'],
    required: true
  },
  
  // Control de inventario
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  
  categoria_historico: {
    type: Boolean,
    default: false,
    description: "Indica si el libro está en la categoría de histórico agotado"
  },
  
  // Información adicional para marketing y búsqueda
  descripcion: {
    type: String,
    trim: true
  },
  
  tabla_contenido: {
    type: String,
    trim: true
  },
  
  palabras_clave: [{
    type: String,
    trim: true
  }],
  
  // URLs de imágenes de portada y contraportada
  imagenes: {
    portada: String,
    contraportada: String,
    adicionales: [String]
  },
  
  // Control de versiones
  edicion: {
    numero: Number,
    descripcion: String
  },
  
  // Calificaciones y reseñas
  calificaciones: {
    promedio: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    cantidad: {
      type: Number,
      default: 0
    }
  },
  
  // Metadatos de sistema
  fecha_registro: {
    type: Date,
    default: Date.now
  },
  
  ultima_actualizacion: {
    type: Date,
    default: Date.now
  },
  
  // Campo para indicar si el libro está activo en el catálogo
  activo: {
    type: Boolean,
    default: true
  },
  
  // Códigos únicos para ejemplares individuales
  ejemplares: [{
    codigo: {
      type: String,
      required: true,
      unique: true
    },
    estado_fisico: {
      type: String,
      enum: ['excelente', 'bueno', 'aceptable', 'deteriorado'],
      default: 'excelente'
    },
    ubicacion: String,
    disponible: {
      type: Boolean,
      default: true
    },
    fecha_adquisicion: {
      type: Date,
      default: Date.now
    }
  }]
});

// ÍNDICES COMPUESTOS
// Para búsquedas combinadas frecuentes
libroSchema.index({ autor: 1, titulo: 1 });
libroSchema.index({ genero: 1, autor: 1 });
libroSchema.index({ estado: 1, precio: 1 });
libroSchema.index({ anio_publicacion: 1, genero: 1 });

// MIDDLEWARES
// Actualizar fecha cada vez que se modifica el documento
libroSchema.pre('save', function(next) {
  this.ultima_actualizacion = new Date();
  next();
});

// MÉTODOS VIRTUALES
// Calcular disponibilidad de ejemplares
libroSchema.virtual('ejemplares_disponibles').get(function() {
  return this.ejemplares.filter(ejemplar => ejemplar.disponible).length;
});

// MÉTODOS DE INSTANCIA
// Agregar un nuevo ejemplar al libro
libroSchema.methods.agregarEjemplar = function(codigo, estadoFisico = 'excelente', ubicacion = '') {
  this.ejemplares.push({
    codigo: codigo,
    estado_fisico: estadoFisico,
    ubicacion: ubicacion,
    disponible: true,
    fecha_adquisicion: new Date()
  });
  
  this.stock = this.ejemplares.length;
  return this.save();
};

// Marcar un ejemplar como no disponible
libroSchema.methods.marcarEjemplarNoDisponible = function(codigo) {
  const ejemplar = this.ejemplares.find(e => e.codigo === codigo);
  if (ejemplar) {
    ejemplar.disponible = false;
    this.markModified('ejemplares');
    return this.save();
  }
  return Promise.reject(new Error('Ejemplar no encontrado'));
};

// MÉTODOS ESTÁTICOS
// Buscar libros por criterios múltiples
libroSchema.statics.buscarPorCriterios = function(criterios) {
  const query = {};
  
  // Mapeo de criterios de búsqueda desde la UI a la estructura de MongoDB
  if (criterios.titulo) query.titulo = { $regex: criterios.titulo, $options: 'i' };
  if (criterios.autor) query.autor = { $regex: criterios.autor, $options: 'i' };
  if (criterios.genero) query.genero = criterios.genero;
  if (criterios.editorial) query.editorial = { $regex: criterios.editorial, $options: 'i' };
  if (criterios.ISBN) query.ISBN = criterios.ISBN;
  if (criterios.idioma) query.idioma = criterios.idioma;
  if (criterios.estado) query.estado = criterios.estado;
  
  // Rango de precios
  if (criterios.precio_min || criterios.precio_max) {
    query.precio = {};
    if (criterios.precio_min) query.precio.$gte = criterios.precio_min;
    if (criterios.precio_max) query.precio.$lte = criterios.precio_max;
  }
  
  // Rango de fechas
  if (criterios.anio_min || criterios.anio_max) {
    query.anio_publicacion = {};
    if (criterios.anio_min) query.anio_publicacion.$gte = criterios.anio_min;
    if (criterios.anio_max) query.anio_publicacion.$lte = criterios.anio_max;
  }
  
  if (criterios.solo_disponibles) {
    query.stock = { $gt: 0 };
  }
  
  if (criterios.incluir_inactivos !== true) {
    query.activo = true;
  }
  
  return this.find(query);
};

libroSchema.statics.marcarComoHistoricoAgotado = function(idLibro) {
  return this.findByIdAndUpdate(
    idLibro, 
    { 
      categoria_historico: true,
      activo: false
    },
    { new: true }
  );
};

libroSchema.statics.obtenerLibrosMasVendidos = function(limite = 10, diasAtras = 30) {

  return this.find({ activo: true, stock: { $gt: 0 } })
    .sort({ 'calificaciones.promedio': -1 })
    .limit(limite);
};

const Libro = mongoose.model('Libro', libroSchema);

module.exports = Libro;