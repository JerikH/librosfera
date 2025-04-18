const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Esquema para gestionar los precios y descuentos de los libros
const bookPriceSchema = new Schema({
  // Precio base del libro
  precio_base: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Moneda (por defecto en pesos colombianos, según la ubicación de la librería)
  moneda: {
    type: String,
    default: 'COP',
    enum: ['COP', 'USD', 'EUR']
  },
  
  // Impuestos aplicables
  impuesto: {
    tipo: {
      type: String,
      default: 'IVA',
      enum: ['IVA', 'ninguno', 'otro']
    },
    porcentaje: {
      type: Number,
      default: 19, // IVA Colombia
      min: 0,
      max: 100
    }
  },
  
  // Descuentos activos
  descuentos: [{
    tipo: {
      type: String,
      enum: ['porcentaje', 'valor_fijo', 'promocion_2x1', 'bundle'],
      required: true
    },
    valor: {
      type: Number,
      required: true,
      min: 0
    },
    fecha_inicio: {
      type: Date,
      default: Date.now
    },
    fecha_fin: Date,
    codigo_promocion: String,
    descripcion: String,
    activo: {
      type: Boolean,
      default: true
    }
  }],
  
  // Si el precio incluye envío gratuito
  envio_gratis: {
    type: Boolean,
    default: false
  }
});

// Método para calcular precio con impuestos
bookPriceSchema.methods.calcularPrecioConImpuestos = function() {
  const precioBase = this.precio_base;
  const impuestoDecimal = this.impuesto.porcentaje / 100;
  
  return precioBase * (1 + impuestoDecimal);
};

// Método para obtener descuentos activos actualmente
bookPriceSchema.methods.obtenerDescuentosActivos = function() {
  const hoy = new Date();
  
  return this.descuentos.filter(descuento => {
    return descuento.activo && 
           (!descuento.fecha_fin || descuento.fecha_fin >= hoy) &&
           descuento.fecha_inicio <= hoy;
  });
};

// Método para calcular precio final con descuentos aplicados
bookPriceSchema.methods.calcularPrecioFinal = function() {
  let precioFinal = this.calcularPrecioConImpuestos();
  const descuentosActivos = this.obtenerDescuentosActivos();
  
  // Aplicar descuentos
  descuentosActivos.forEach(descuento => {
    if (descuento.tipo === 'porcentaje') {
      // Descuento porcentual
      const descuentoDecimal = descuento.valor / 100;
      precioFinal = precioFinal * (1 - descuentoDecimal);
    } else if (descuento.tipo === 'valor_fijo') {
      // Descuento de valor fijo
      precioFinal = Math.max(0, precioFinal - descuento.valor);
    }
    // Otros tipos de descuento (2x1, bundle) requieren lógica adicional
    // en el contexto del carrito, no del precio individual
  });
  
  // Redondear a 2 decimales
  return Math.round(precioFinal * 100) / 100;
};

// Método para agregar un nuevo descuento
bookPriceSchema.methods.agregarDescuento = function(tipo, valor, fechaInicio, fechaFin, codigoPromocion = '', descripcion = '') {
  this.descuentos.push({
    tipo: tipo,
    valor: valor,
    fecha_inicio: fechaInicio || new Date(),
    fecha_fin: fechaFin,
    codigo_promocion: codigoPromocion,
    descripcion: descripcion,
    activo: true
  });
};

// Método para desactivar todos los descuentos
bookPriceSchema.methods.desactivarDescuentos = function() {
  this.descuentos.forEach(descuento => {
    descuento.activo = false;
  });
};

module.exports = bookPriceSchema;