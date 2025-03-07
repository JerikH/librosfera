// src/models/orderModel.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: [true, 'El ítem de orden debe tener un producto'],
  },
  quantity: {
    type: Number,
    required: [true, 'El ítem de orden debe tener una cantidad'],
    min: [1, 'La cantidad debe ser al menos 1'],
  },
  price: {
    type: Number,
    required: [true, 'El ítem de orden debe tener un precio'],
  },
  format: {
    type: String,
    required: [true, 'El ítem de orden debe especificar el formato del producto'],
    enum: ['Físico', 'Digital', 'Audiolibro'],
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'La orden debe pertenecer a un usuario'],
    },
    items: [orderItemSchema],
    shippingAddress: {
      street: {
        type: String,
        required: function() {
          return this.items.some(item => item.format === 'Físico');
        },
      },
      city: {
        type: String,
        required: function() {
          return this.items.some(item => item.format === 'Físico');
        },
      },
      state: {
        type: String,
        required: function() {
          return this.items.some(item => item.format === 'Físico');
        },
      },
      zipCode: {
        type: String,
        required: function() {
          return this.items.some(item => item.format === 'Físico');
        },
      },
      country: {
        type: String,
        required: function() {
          return this.items.some(item => item.format === 'Físico');
        },
      },
    },
    paymentMethod: {
      type: String,
      required: [true, 'La orden debe tener un método de pago'],
      enum: ['tarjeta', 'paypal', 'efectivo'],
    },
    paymentResult: {
      id: String,
      status: String,
      updateTime: String,
      emailAddress: String,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: Date,
    status: {
      type: String,
      required: true,
      enum: ['Pendiente', 'Procesando', 'Enviado', 'Entregado', 'Cancelado'],
      default: 'Pendiente',
    },
    deliveredAt: Date,
    trackingNumber: String,
    notes: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Middleware pre-find para popular campos
orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name email',
  }).populate({
    path: 'items.product',
    select: 'title author images',
  });
  next();
});

// Método para calcular totales de la orden
orderSchema.methods.calculateTotals = function() {
  // Calcular subtotal
  const subtotal = this.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  
  // Calcular impuestos (ejemplo: 16% IVA)
  this.taxPrice = parseFloat((subtotal * 0.16).toFixed(2));
  
  // Calcular costo de envío (basado en productos físicos)
  const hasPhysicalItems = this.items.some(item => item.format === 'Físico');
  this.shippingPrice = hasPhysicalItems ? 50 : 0; // Ejemplo: $50 para envíos físicos
  
  // Calcular total
  this.totalPrice = parseFloat(
    (subtotal + this.taxPrice + this.shippingPrice).toFixed(2)
  );
  
  return this;
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;