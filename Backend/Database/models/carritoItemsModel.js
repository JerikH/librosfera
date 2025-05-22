// Database/models/carritoItemsModel.js
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
        return v <= 3; // Máximo 3 ejemplares del mismo libro
      },
      message: 'No se pueden agregar más de 3 ejemplares del mismo libro'
    }
  },
  
  // Estructura de precios detallada
  precios: {
    // Precio base del libro (sin descuentos ni impuestos)
    precio_base: {
      type: Number,
      required: true,
      min: 0
    },
    
    // Precio con descuentos aplicados (sin impuestos)
    precio_con_descuentos: {
      type: Number,
      required: true,
      min: 0
    },
    
    // Precio final con impuestos
    precio_con_impuestos: {
      type: Number,
      required: true,
      min: 0
    },
    
    // Información de impuesto aplicado
    impuesto: {
      tipo: String,
      porcentaje: Number,
      valor_impuesto: Number // Valor monetario del impuesto
    },
    
    // Total de descuentos aplicados
    total_descuentos: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Códigos de descuento aplicados manualmente por el cliente
  codigos_aplicados: [{
    codigo: String,
    descuento_aplicado: Number,
    tipo_descuento: String
  }],
  
  // Subtotal calculado (precio_con_impuestos × cantidad)
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Indicar si el precio ha cambiado desde que se agregó
  precio_cambiado: {
    type: Boolean,
    default: false
  },
  
  // Mensaje sobre cambio de precio
  mensaje_precio: {
    type: String,
    default: ''
  },
  
  // Estado del item
  estado: {
    type: String,
    enum: ['activo', 'precio_cambiado', 'sin_stock', 'removido'],
    default: 'activo'
  },
  
  // Fecha en que se agregó el item al carrito
  fecha_agregado: {
    type: Date,
    default: Date.now
  },
  
  // Fecha de última actualización
  fecha_actualizado: {
    type: Date,
    default: Date.now
  },
  
  // Metadatos adicionales
  metadatos: {
    titulo_libro: String,
    autor_libro: String,
    imagen_portada: String,
    isbn: String,
    disponible: {
      type: Boolean,
      default: true
    }
  }
});

// ÍNDICES
carritoItemSchema.index({ id_carrito: 1, id_libro: 1 }, { unique: true });
carritoItemSchema.index({ estado: 1 });
carritoItemSchema.index({ fecha_agregado: -1 });

// PRE SAVE MIDDLEWARE
carritoItemSchema.pre('save', function(next) {
  // Actualizar el subtotal automáticamente (con impuestos incluidos)
  this.subtotal = this.precios.precio_con_impuestos * this.cantidad;
  this.fecha_actualizado = new Date();
  next();
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
  this.subtotal = this.precios.precio_con_impuestos * nuevaCantidad;
  return this.save();
};

// Calcular precios con descuentos e impuestos
carritoItemSchema.methods.calcularPrecios = async function(codigosDescuento = []) {
  try {
    const Libro = mongoose.model('Libro');
    const libro = await Libro.findById(this.id_libro);
    
    if (!libro) {
      throw new Error('Libro no encontrado');
    }
    
    // 1. Precio base
    this.precios.precio_base = libro.precio_info?.precio_base || libro.precio;
    
    // 2. Calcular precio con descuentos (automáticos + códigos)
    let precioConDescuentos;
    if (libro.precio_info && libro.precio_info.calcularPrecioConDescuentos) {
      precioConDescuentos = libro.precio_info.calcularPrecioConDescuentos(codigosDescuento);
    } else {
      // Fallback si no tiene precio_info
      precioConDescuentos = this.precios.precio_base;
    }
    
    this.precios.precio_con_descuentos = precioConDescuentos;
    this.precios.total_descuentos = this.precios.precio_base - precioConDescuentos;
    
    // 3. Calcular precio con impuestos
    let precioConImpuestos = precioConDescuentos;
    let valorImpuesto = 0;
    
    if (libro.precio_info && libro.precio_info.impuesto) {
      const impuesto = libro.precio_info.impuesto;
      const porcentajeImpuesto = impuesto.porcentaje || 0;
      
      valorImpuesto = (precioConDescuentos * porcentajeImpuesto) / 100;
      precioConImpuestos = precioConDescuentos + valorImpuesto;
      
      // Guardar información del impuesto
      this.precios.impuesto = {
        tipo: impuesto.tipo || 'IVA',
        porcentaje: porcentajeImpuesto,
        valor_impuesto: Math.round(valorImpuesto * 100) / 100
      };
    } else {
      // Sin impuestos
      this.precios.impuesto = {
        tipo: 'ninguno',
        porcentaje: 0,
        valor_impuesto: 0
      };
    }
    
    this.precios.precio_con_impuestos = Math.round(precioConImpuestos * 100) / 100;
    
    // 4. Registrar códigos aplicados
    this.codigos_aplicados = [];
    if (libro.precio_info && libro.precio_info.descuentos) {
      const descuentosActivos = libro.precio_info.obtenerDescuentosActivos();
      
      for (const descuento of descuentosActivos) {
        if (descuento.codigo_promocion && codigosDescuento.includes(descuento.codigo_promocion)) {
          let valorDescuento = 0;
          
          if (descuento.tipo === 'porcentaje') {
            valorDescuento = (this.precios.precio_base * descuento.valor) / 100;
          } else if (descuento.tipo === 'valor_fijo') {
            valorDescuento = Math.min(descuento.valor, this.precios.precio_base);
          }
          
          this.codigos_aplicados.push({
            codigo: descuento.codigo_promocion,
            descuento_aplicado: Math.round(valorDescuento * 100) / 100,
            tipo_descuento: descuento.tipo
          });
        }
      }
    }
    
    // 5. Actualizar subtotal
    this.subtotal = this.precios.precio_con_impuestos * this.cantidad;
    
    return this.save();
  } catch (error) {
    throw new Error(`Error calculando precios: ${error.message}`);
  }
};

// Verificar y actualizar precio
carritoItemSchema.methods.verificarPrecio = async function() {
  try {
    const Libro = mongoose.model('Libro');
    const libro = await Libro.findById(this.id_libro);
    
    if (!libro) {
      this.estado = 'removido';
      this.mensaje_precio = 'El libro ya no está disponible';
      return this.save();
    }
    
    // Actualizar metadatos
    this.metadatos.titulo_libro = libro.titulo;
    this.metadatos.autor_libro = libro.autor_nombre_completo;
    this.metadatos.disponible = libro.stock > 0;
    
    const precioBaseActual = libro.precio_info?.precio_base || libro.precio;
    
    // Verificar si el precio base cambió
    if (precioBaseActual !== this.precios.precio_base) {
      this.precio_cambiado = true;
      this.estado = 'precio_cambiado';
      
      if (precioBaseActual > this.precios.precio_base) {
        this.mensaje_precio = `El precio subió de $${this.precios.precio_base.toLocaleString()} a $${precioBaseActual.toLocaleString()}`;
      } else {
        this.mensaje_precio = `El precio bajó de $${this.precios.precio_base.toLocaleString()} a $${precioBaseActual.toLocaleString()}`;
      }
    }
    
    // Verificar stock
    if (libro.stock < this.cantidad) {
      this.estado = 'sin_stock';
      this.mensaje_precio = `Stock insuficiente. Disponible: ${libro.stock}`;
    }
    
    return this.save();
  } catch (error) {
    throw new Error(`Error verificando precio: ${error.message}`);
  }
};

// Confirmar cambio de precio
carritoItemSchema.methods.confirmarCambioPrecio = async function() {
  // Recalcular con el nuevo precio
  const codigosActuales = this.codigos_aplicados.map(c => c.codigo);
  await this.calcularPrecios(codigosActuales);
  
  this.precio_cambiado = false;
  this.estado = 'activo';
  this.mensaje_precio = '';
  
  return this.save();
};

// MÉTODOS ESTÁTICOS

// Obtener todos los items de un carrito
carritoItemSchema.statics.obtenerItemsCarrito = function(idCarrito) {
  return this.find({ id_carrito: idCarrito })
    .populate('id_libro', 'titulo autor_nombre_completo ISBN precio stock imagenes estado precio_info')
    .sort({ fecha_agregado: -1 });
};

// Verificar si un libro ya está en el carrito
carritoItemSchema.statics.libroEnCarrito = async function(idCarrito, idLibro) {
  const item = await this.findOne({ id_carrito: idCarrito, id_libro: idLibro });
  return item;
};

// Obtener estadísticas de items con estructura de precios detallada
carritoItemSchema.statics.obtenerEstadisticasItems = async function(idCarrito) {
  const stats = await this.aggregate([
    { $match: { id_carrito: mongoose.Types.ObjectId(idCarrito) } },
    {
      $group: {
        _id: null,
        total_items: { $sum: '$cantidad' },
        subtotal_sin_descuentos: { $sum: { $multiply: ['$precios.precio_base', '$cantidad'] } },
        total_descuentos: { $sum: { $multiply: ['$precios.total_descuentos', '$cantidad'] } },
        subtotal_sin_impuestos: { $sum: { $multiply: ['$precios.precio_con_descuentos', '$cantidad'] } },
        total_impuestos: { $sum: { $multiply: ['$precios.impuesto.valor_impuesto', '$cantidad'] } },
        total_final: { $sum: '$subtotal' },
        items_con_precio_cambiado: {
          $sum: { $cond: ['$precio_cambiado', 1, 0] }
        },
        items_sin_stock: {
          $sum: { $cond: [{ $eq: ['$estado', 'sin_stock'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats.length > 0 ? stats[0] : {
    total_items: 0,
    subtotal_sin_descuentos: 0,
    total_descuentos: 0,
    subtotal_sin_impuestos: 0,
    total_impuestos: 0,
    total_final: 0,
    items_con_precio_cambiado: 0,
    items_sin_stock: 0
  };
};

const CarritoItem = mongoose.model('Carrito_Items', carritoItemSchema);

module.exports = CarritoItem;