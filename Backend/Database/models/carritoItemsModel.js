const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const carritoItemSchema = new Schema({
  // Identificador único del item
  id_item: {
    type: String,
    default: function() {
      return new mongoose.Types.ObjectId().toString();
    },
    unique: true,
    index: true
  },
  
  // Referencia al carrito al que pertenece este item
  id_carrito: {
    type: Schema.Types.ObjectId,
    ref: 'Carrito',
    required: true,
    index: true
  },
  
  // Referencia al libro que se está añadiendo
  id_libro: {
    type: Schema.Types.ObjectId,
    ref: 'Libro',
    required: true,
    index: true
  },
  
  // Cantidad de ejemplares de este libro
  cantidad: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
    validate: {
      validator: function(v) {
        // Validar que no se exceda el límite de ejemplares del mismo libro
        return v <= 3; // Según requisito: hasta 3 libros del mismo ejemplar
      },
      message: 'No se pueden agregar más de 3 ejemplares del mismo libro'
    }
  },
  
  // Precio unitario al momento de agregar al carrito
  precio_unitario: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Subtotal calculado (precio × cantidad)
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Fecha en que se agregó el item al carrito
  fecha_agregado: {
    type: Date,
    default: Date.now
  },
  
  // Metadatos adicionales que podrían ser útiles
  metadatos: {
    titulo_libro: String,
    autor_libro: String,
    imagen_portada: String
  }
});

// ÍNDICES
// Índice compuesto para buscar items de un libro en un carrito (debe ser único)
carritoItemSchema.index({ id_carrito: 1, id_libro: 1 }, { unique: true });

// PRE SAVE MIDDLEWARE
carritoItemSchema.pre('save', function(next) {
  // Actualizar el subtotal automáticamente
  this.subtotal = this.precio_unitario * this.cantidad;
  next();
});

// PRE VALIDATE MIDDLEWARE
carritoItemSchema.pre('validate', async function(next) {
  try {
    // Si es un documento nuevo o si se está actualizando la cantidad
    if (this.isNew || this.isModified('cantidad')) {
      // Verificar cuántos libros diferentes hay en el carrito
      if (this.isNew) {
        const Carrito = mongoose.model('Carrito_Items');
        const itemsCount = await Carrito.countDocuments({ id_carrito: this.id_carrito });
        
        // Validar que no se exceda el límite de libros diferentes
        if (itemsCount >= 5) { // Según requisito: hasta 5 libros diferentes
          throw new Error('No se pueden agregar más de 5 libros diferentes al carrito');
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// MÉTODOS DE INSTANCIA

// Actualizar cantidad
carritoItemSchema.methods.actualizarCantidad = async function(nuevaCantidad) {
  if (nuevaCantidad < 1) {
    throw new Error('La cantidad debe ser al menos 1');
  }
  
  if (nuevaCantidad > 3) {
    throw new Error('No se pueden agregar más de 3 ejemplares del mismo libro');
  }
  
  this.cantidad = nuevaCantidad;
  this.subtotal = this.precio_unitario * nuevaCantidad;
  return this.save();
};

// MÉTODOS ESTÁTICOS

// Obtener todos los items de un carrito
carritoItemSchema.statics.obtenerItemsCarrito = function(idCarrito) {
  return this.find({ id_carrito: idCarrito })
    .populate('id_libro', 'titulo autor ISBN imagenes.portada estado precio')
    .sort({ fecha_agregado: -1 });
};

// Verificar si un libro ya está en el carrito
carritoItemSchema.statics.libroEnCarrito = async function(idCarrito, idLibro) {
  const item = await this.findOne({ id_carrito: idCarrito, id_libro: idLibro });
  return !!item;
};

// Obtener el total de libros en un carrito
carritoItemSchema.statics.obtenerTotalItems = async function(idCarrito) {
  const result = await this.aggregate([
    { $match: { id_carrito: mongoose.Types.ObjectId(idCarrito) } },
    { $group: { _id: null, total: { $sum: '$cantidad' } } }
  ]);
  
  return result.length > 0 ? result[0].total : 0;
};

// Calcular el total del carrito (suma de subtotales)
carritoItemSchema.statics.calcularTotalCarrito = async function(idCarrito) {
  const result = await this.aggregate([
    { $match: { id_carrito: mongoose.Types.ObjectId(idCarrito) } },
    { $group: { _id: null, total: { $sum: '$subtotal' } } }
  ]);
  
  return result.length > 0 ? result[0].total : 0;
};

const CarritoItem = mongoose.model('Carrito_Items', carritoItemSchema);

module.exports = CarritoItem;