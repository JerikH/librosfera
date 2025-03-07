// src/models/productModel.js
const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Un libro debe tener un título'],
      unique: true,
      trim: true,
      maxlength: [100, 'El título no puede exceder los 100 caracteres'],
    },
    slug: String,
    author: {
      type: String,
      required: [true, 'Un libro debe tener un autor'],
      trim: true,
    },
    isbn: {
      type: String,
      required: [true, 'Un libro debe tener un ISBN'],
      unique: true,
      trim: true,
    },
    publisher: {
      type: String,
      required: [true, 'Un libro debe tener una editorial'],
    },
    publicationDate: {
      type: Date,
      required: [true, 'Un libro debe tener una fecha de publicación'],
    },
    description: {
      type: String,
      required: [true, 'Un libro debe tener una descripción'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Un libro debe tener un precio'],
      min: [0, 'El precio debe ser mayor o igual a 0'],
    },
    discountPrice: {
      type: Number,
      validate: {
        validator: function (val) {
          // El precio con descuento debe ser menor que el precio regular
          return val < this.price;
        },
        message: 'El precio con descuento ({VALUE}) debe ser menor que el precio regular',
      },
    },
    categories: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Un libro debe pertenecer a al menos una categoría'],
    }],
    format: {
      type: String,
      required: [true, 'Un libro debe tener un formato'],
      enum: {
        values: ['Físico', 'Digital', 'Audiolibro'],
        message: 'El formato debe ser: Físico, Digital o Audiolibro',
      },
    },
    language: {
      type: String,
      required: [true, 'Un libro debe tener un idioma'],
    },
    pages: {
      type: Number,
      required: function() { return this.format === 'Físico' || this.format === 'Digital'; },
      min: [1, 'Un libro debe tener al menos 1 página'],
    },
    duration: {
      type: Number, // En minutos
      required: function() { return this.format === 'Audiolibro'; },
      min: [1, 'Un audiolibro debe tener al menos 1 minuto de duración'],
    },
    stock: {
      type: Number,
      required: function() { return this.format === 'Físico'; },
      min: [0, 'El stock no puede ser negativo'],
      default: 0,
    },
    images: [String],
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'La calificación debe ser al menos 1.0'],
      max: [5, 'La calificación no puede ser mayor a 5.0'],
      set: (val) => Math.round(val * 10) / 10, // Redondear a 1 decimal
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isBestseller: {
      type: Boolean,
      default: false,
    },
    isNewRelease: {
      type: Boolean,
      default: false,
    },
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

// Índices
productSchema.index({ price: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ title: 'text', author: 'text', description: 'text' });

// Middleware pre-save para crear slug
productSchema.pre('save', function (next) {
  this.slug = slugify(`${this.title}-${this.author}`, { lower: true });
  next();
});

// Virtual populate para reseñas
productSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id',
});

// Método estático para calcular estadísticas de calificaciones
productSchema.statics.calcAverageRatings = async function (productId) {
  const stats = await this.model('Review').aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: '$product',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await this.findByIdAndUpdate(productId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await this.findByIdAndUpdate(productId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;