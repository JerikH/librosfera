// src/models/cartModel.js
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: [true, 'El ítem del carrito debe tener un producto'],
  },
  quantity: {
    type: Number,
    required: [true, 'El ítem del carrito debe tener una cantidad'],
    min: [1, 'La cantidad debe ser al menos 1'],
  },
  format: {
    type: String,
    required: [true, 'El ítem del carrito debe especificar el formato del producto'],
    enum: ['Físico', 'Digital', 'Audiolibro'],
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'El carrito debe pertenecer a un usuario'],
    },
    items: [cartItemSchema],
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índice para asegurar que cada usuario tenga un carrito activo
cartSchema.index({ user: 1, active: 1 }, { unique: true });

// Middleware pre-find para popular los productos
cartSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'items.product',
    select: 'title author price discountPrice stock images format',
  });
  next();
});

// Virtual para calcular total del carrito
cartSchema.virtual('total').get(function () {
  return this.items.reduce((acc, item) => {
    const product = item.product;
    const price = product.discountPrice || product.price;
    return acc + price * item.quantity;
  }, 0);
});

// Método para validar stock disponible
cartSchema.methods.validateStock = async function() {
  const stockErrors = [];
  
  // Verificar cada ítem físico
  for (const item of this.items) {
    if (item.format === 'Físico') {
      const product = await mongoose.model('Product').findById(item.product._id);
      if (!product) {
        stockErrors.push(`Producto no encontrado: ${item.product._id}`);
        continue;
      }
      
      if (product.stock < item.quantity) {
        stockErrors.push(`Stock insuficiente para "${product.title}". Disponible: ${product.stock}, Solicitado: ${item.quantity}`);
      }
    }
  }
  
  return stockErrors;
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;