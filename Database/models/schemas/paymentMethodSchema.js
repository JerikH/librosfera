// Database/models/schemas/paymentMethodSchema.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Esquema para métodos de pago de usuarios
 * Diseñado para manejar diferentes tipos de instrumentos financieros
 * con medidas de seguridad apropiadas
 */
const paymentMethodSchema = new Schema({
  // Tipo de método de pago
  tipo: {
    type: String,
    enum: ['tarjeta_credito', 'tarjeta_debito', 'transferencia', 'monedero_electronico'],
    required: [true, 'El tipo de método de pago es obligatorio']
  },
  
  // Información para tarjetas
  detalles_tarjeta: {
    nombre_titular: {
      type: String,
      required: function() { return this.tipo.includes('tarjeta'); },
      trim: true,
      minlength: [3, 'El nombre del titular debe tener al menos 3 caracteres']
    },
    
    numero: {
      type: String,
      required: function() { return this.tipo.includes('tarjeta'); },
      validate: {
        validator: function(v) {
          // Algoritmo de Luhn para validar números de tarjeta
          if (!v) return true; // Skip if not provided (handled by required)
          v = v.replace(/\s+/g, '');
          if (!/^\d+$/.test(v)) return false;
          
          let sum = 0;
          let doubleUp = false;
          for (let i = v.length - 1; i >= 0; i--) {
            let digit = parseInt(v.charAt(i));
            if (doubleUp) {
              digit *= 2;
              if (digit > 9) digit -= 9;
            }
            sum += digit;
            doubleUp = !doubleUp;
          }
          return (sum % 10) === 0;
        },
        message: 'Número de tarjeta inválido'
      },
      // Almacenar solo los últimos 4 dígitos por seguridad
      set: function(num) {
        if (!num) return '';
        this._numero_completo = num.replace(/\s+/g, ''); // Almacenar temporalmente para validación
        return '************' + num.replace(/\s+/g, '').slice(-4);
      }
    },
    
    mes_expiracion: {
      type: Number,
      required: function() { return this.tipo.includes('tarjeta'); },
      min: [1, 'Mes inválido'],
      max: [12, 'Mes inválido']
    },
    
    anio_expiracion: {
      type: Number,
      required: function() { return this.tipo.includes('tarjeta'); },
      min: [new Date().getFullYear(), 'La tarjeta ha expirado'],
      validate: {
        validator: function(v) {
          const anioActual = new Date().getFullYear();
          const mesActual = new Date().getMonth() + 1;
          
          // Si es el año actual, el mes debe ser mayor o igual al mes actual
          if (v === anioActual && this.mes_expiracion < mesActual) {
            return false;
          }
          
          return true;
        },
        message: 'La fecha de expiración no es válida'
      }
    },
    
    tipo_tarjeta: {
      type: String,
      enum: ['visa', 'mastercard', 'american_express', 'dinners', 'discover', 'otro'],
      required: function() { return this.tipo.includes('tarjeta'); }
    },
    
    // No almacenamos el CVV/CVC por razones de seguridad
  },
  
  // Información para transferencia bancaria
  detalles_transferencia: {
    banco: {
      type: String,
      required: function() { return this.tipo === 'transferencia'; },
      trim: true
    },
    
    tipo_cuenta: {
      type: String,
      enum: ['ahorros', 'corriente'],
      required: function() { return this.tipo === 'transferencia'; }
    },
    
    numero_cuenta: {
      type: String,
      required: function() { return this.tipo === 'transferencia'; },
      trim: true
    }
  },
  
  // Información para monedero electrónico
  detalles_monedero: {
    proveedor: {
      type: String,
      enum: ['paypal', 'nequi', 'daviplata', 'otro'],
      required: function() { return this.tipo === 'monedero_electronico'; }
    },
    
    identificador: {
      type: String,
      required: function() { return this.tipo === 'monedero_electronico'; },
      trim: true
    }
  },
  
  // Información general para todos los métodos
  alias: {
    type: String,
    trim: true,
    default: function() {
      if (this.tipo.includes('tarjeta')) {
        return `${this.detalles_tarjeta.tipo_tarjeta.charAt(0).toUpperCase() + 
                this.detalles_tarjeta.tipo_tarjeta.slice(1)} terminada en ${
                this.detalles_tarjeta.numero.slice(-4)}`;
      } else if (this.tipo === 'transferencia') {
        return `Cuenta ${this.detalles_transferencia.tipo_cuenta} ${this.detalles_transferencia.banco}`;
      } else {
        return `${this.detalles_monedero.proveedor.charAt(0).toUpperCase() + 
                this.detalles_monedero.proveedor.slice(1)}`;
      }
    }
  },
  
  direccion_facturacion: {
    type: require('./addressSchema'),
    required: function() { return this.tipo.includes('tarjeta'); }
  },
  
  // Preferencias y estado
  predeterminado: {
    type: Boolean,
    default: false
  },
  
  activo: {
    type: Boolean,
    default: true
  },
  
  // Para verificación y seguridad
  verificado: {
    type: Boolean,
    default: false
  },
  
  fecha_verificacion: {
    type: Date
  },
  
  metodo_verificacion: {
    type: String,
    enum: ['cargo_minimo', 'codigo_sms', 'codigo_email', 'sistema'],
    default: 'sistema'
  },
  
  // Metadatos y auditoría
  fecha_adicion: {
    type: Date,
    default: Date.now
  },
  
  ultima_utilizacion: Date,
  
  historial_usos: [{
    id_transaccion: {
      type: Schema.Types.ObjectId,
      ref: 'Transaccion'
    },
    fecha: {
      type: Date,
      default: Date.now
    },
    monto: Number,
    exitoso: Boolean,
    codigo_resultado: String
  }]
}, { _id: true }); // Cada método de pago necesita su propio ID

// MÉTODOS

// Verificar si el método de pago está expirado
paymentMethodSchema.methods.estaExpirado = function() {
  if (!this.tipo.includes('tarjeta')) return false;
  
  const ahora = new Date();
  const anioActual = ahora.getFullYear();
  const mesActual = ahora.getMonth() + 1;
  
  if (this.detalles_tarjeta.anio_expiracion < anioActual) {
    return true;
  }
  
  if (this.detalles_tarjeta.anio_expiracion === anioActual && 
      this.detalles_tarjeta.mes_expiracion < mesActual) {
    return true;
  }
  
  return false;
};

// Registrar uso del método de pago
paymentMethodSchema.methods.registrarUso = function(transaccionId, monto, exitoso, codigoResultado) {
  this.ultima_utilizacion = new Date();
  
  this.historial_usos.push({
    id_transaccion: transaccionId,
    fecha: new Date(),
    monto: monto,
    exitoso: exitoso,
    codigo_resultado: codigoResultado
  });
  
  return this;
};

/// Pre-save hook para obtener automáticamente el tipo de tarjeta basado en BIN
paymentMethodSchema.pre('validate', function(next) {
  // Solo aplica durante la creación inicial
  if (this.isNew && this.tipo.includes('tarjeta') && this._numero_completo) {
    const primeros6 = this._numero_completo.substring(0, 6);
    // Algoritmo simplificado para detectar tipo de tarjeta
    if (/^4/.test(primeros6)) {
      this.detalles_tarjeta.tipo_tarjeta = 'visa';
    } else if (/^5[1-5]/.test(primeros6)) {
      this.detalles_tarjeta.tipo_tarjeta = 'mastercard';
    } else if (/^3[47]/.test(primeros6)) {
      this.detalles_tarjeta.tipo_tarjeta = 'american_express';
    } else if (/^36|^38|^30[0-5]/.test(primeros6)) {
      this.detalles_tarjeta.tipo_tarjeta = 'dinners';
    } else if (/^6(?:011|5)/.test(primeros6)) {
      this.detalles_tarjeta.tipo_tarjeta = 'discover';
    } else {
      this.detalles_tarjeta.tipo_tarjeta = 'otro';
    }
  }
  
  // Eliminar el número completo que se usó temporalmente
  delete this._numero_completo;
  
  next();
});

module.exports = paymentMethodSchema;