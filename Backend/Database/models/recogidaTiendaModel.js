const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const recogidaTiendaSchema = new Schema({
  // Identificador único
  id_recogida: {
    type: String,
    default: function() {
      return new mongoose.Types.ObjectId().toString();
    },
    unique: true,
    index: true
  },
  
  // Transacción asociada
  id_transaccion: {
    type: Schema.Types.ObjectId,
    ref: 'Transaccion',
    required: true,
    index: true,
    unique: true
  },
  
  // Tienda seleccionada para recogid
  id_tienda: {
    type: Schema.Types.ObjectId,
    ref: 'Tienda_Fisica',
    required: true,
    index: true
  },
  
  // Estado de la recogida
  estado: {
    type: String,
    enum: [
      'VERIFICANDO_DISPONIBILIDAD',  // Estado inicial
      'PENDIENTE_TRANSFERENCIA',     // Requiere transferir de otra tienda
      'EN_TRANSFERENCIA',            // Transferencia en proceso
      'LISTO_PARA_RECOGER',          // Disponible para recoger
      'RECOGIDO'                     // Cliente ya recogió
    ],
    default: 'VERIFICANDO_DISPONIBILIDAD',
    index: true
  },
  
  // Libros incluidos con información de disponibilidad
  libros: [{
    id_libro: {
      type: Schema.Types.ObjectId,
      ref: 'Libro',
      required: true
    },
    titulo: String,
    cantidad: Number,
    disponible_en_tienda: {
      type: Boolean,
      default: false
    },
    requiere_transferencia: {
      type: Boolean,
      default: false
    },
    tienda_origen: {
      type: Schema.Types.ObjectId,
      ref: 'Tienda_Fisica'
    }
  }],
  
  // Transferencias entre tiendas
  transferencias: [{
    id_libro: {
      type: Schema.Types.ObjectId,
      ref: 'Libro'
    },
    cantidad: Number,
    tienda_origen: {
      type: Schema.Types.ObjectId,
      ref: 'Tienda_Fisica'
    },
    tienda_destino: {
      type: Schema.Types.ObjectId,
      ref: 'Tienda_Fisica'
    },
    estado: {
      type: String,
      enum: ['solicitada', 'en_proceso', 'completada'],
      default: 'solicitada'
    },
    fecha_solicitud: {
      type: Date,
      default: Date.now
    },
    fecha_estimada_llegada: Date,
    fecha_llegada_real: Date,
    codigo_transferencia: String
  }],
  
  // Código único para recogida
  codigo_recogida: String,
  
  // Fechas importantes
  fechas: {
    creacion: {
      type: Date,
      default: Date.now
    },
    verificacion_completada: Date,
    disponible_desde: Date,
    fecha_recogida: Date
  },
  
  // Fecha estimada de disponibilidad
  fecha_disponibilidad_estimada: Date,
  
  // Si se ha notificado al cliente
  notificacion_enviada: {
    type: Boolean,
    default: false
  },
  
  // Historial de estados
  historial: [{
    estado_anterior: String,
    estado_nuevo: String,
    fecha: {
      type: Date,
      default: Date.now
    },
    descripcion: String,
    id_usuario_operacion: Schema.Types.ObjectId
  }]
});

// MÉTODOS DE INSTANCIA

// Verificar disponibilidad
recogidaTiendaSchema.methods.verificarDisponibilidad = async function(idAdministrador) {
  if (this.estado !== 'VERIFICANDO_DISPONIBILIDAD') {
    throw new Error('Solo se puede verificar disponibilidad en estado inicial');
  }
  
  const Inventario = mongoose.model('Inventario');
  const tiendaRecogida = this.id_tienda;
  let requiereTransferencia = false;
  let fechaDisponibilidadMasLejana = null;
  
  // Verificar cada libro
  for (let i = 0; i < this.libros.length; i++) {
    const libro = this.libros[i];
    
    // Verificar disponibilidad en la tienda seleccionada
    const inventarioTienda = await Inventario.findOne({
      id_libro: libro.id_libro,
      id_tienda: tiendaRecogida,
      stock_disponible: { $gte: libro.cantidad }
    });
    
    if (inventarioTienda) {
      // Libro disponible en la tienda seleccionada
      libro.disponible_en_tienda = true;
      libro.requiere_transferencia = false;
      libro.tienda_origen = tiendaRecogida;
    } else {
      // Buscar en otras tiendas
      const otraTienda = await Inventario.findOne({
        id_libro: libro.id_libro,
        id_tienda: { $ne: tiendaRecogida },
        stock_disponible: { $gte: libro.cantidad }
      }).populate('id_tienda');
      
      if (otraTienda) {
        // Libro disponible en otra tienda, requiere transferencia
        requiereTransferencia = true;
        libro.disponible_en_tienda = false;
        libro.requiere_transferencia = true;
        libro.tienda_origen = otraTienda.id_tienda;
        
        // Crear transferencia
        const fechaEstimada = new Date();
        fechaEstimada.setDate(fechaEstimada.getDate() + 2); // 2 días para transferencia
        
        this.transferencias.push({
          id_libro: libro.id_libro,
          cantidad: libro.cantidad,
          tienda_origen: otraTienda.id_tienda,
          tienda_destino: tiendaRecogida,
          fecha_estimada_llegada: fechaEstimada,
          codigo_transferencia: `TR-${Date.now().toString(36)}-${libro.id_libro.toString().substring(0, 5)}`
        });
        
        // Actualizar fecha de disponibilidad más lejana
        if (!fechaDisponibilidadMasLejana || fechaEstimada > fechaDisponibilidadMasLejana) {
          fechaDisponibilidadMasLejana = fechaEstimada;
        }
      } else {
        // Libro no disponible en ninguna tienda
        throw new Error(`El libro ${libro.titulo} no está disponible en ninguna tienda`);
      }
    }
    
    this.markModified(`libros.${i}`);
  }
  
  // Actualizar estado según resultado
  const estadoAnterior = this.estado;
  
  if (requiereTransferencia) {
    this.estado = 'PENDIENTE_TRANSFERENCIA';
    this.fecha_disponibilidad_estimada = fechaDisponibilidadMasLejana;
  } else {
    this.estado = 'LISTO_PARA_RECOGER';
    this.codigo_recogida = `REC-${Date.now().toString(36)}-${this.id_transaccion.toString().substring(0, 5)}`;
    this.fechas.disponible_desde = new Date();
  }
  
  this.fechas.verificacion_completada = new Date();
  
  // Registrar en historial
  this.historial.push({
    estado_anterior: estadoAnterior,
    estado_nuevo: this.estado,
    fecha: new Date(),
    descripcion: requiereTransferencia 
      ? 'Se requiere transferencia entre tiendas'
      : 'Todos los libros disponibles para recoger',
    id_usuario_operacion: idAdministrador
  });
  
  return this.save();
};

// Más métodos para manejar las transferencias, marcar como recogido, etc.
// (similar a los métodos que vimos anteriormente)

// MÉTODOS ESTÁTICOS

// Crear desde transacción
recogidaTiendaSchema.statics.crearDesdeTransaccion = async function(transaccion) {
  // Solo para recogida en tienda
  if (transaccion.envio.metodo !== 'recogida_tienda') {
    throw new Error('Este método solo aplica para transacciones con recogida en tienda');
  }
  
  // Verificar que no exista
  const recogidaExistente = await this.findOne({ id_transaccion: transaccion._id });
  if (recogidaExistente) {
    return recogidaExistente;
  }
  
  // Crear nueva recogida
  const nuevaRecogida = new this({
    id_transaccion: transaccion._id,
    id_tienda: transaccion.envio.id_tienda_recogida,
    libros: transaccion.items.map(item => ({
      id_libro: item.id_libro,
      titulo: item.titulo,
      cantidad: item.cantidad
    }))
  });
  
  // Registro inicial
  nuevaRecogida.historial.push({
    estado_nuevo: 'VERIFICANDO_DISPONIBILIDAD',
    fecha: new Date(),
    descripcion: 'Recogida en tienda creada'
  });
  
  return nuevaRecogida.save();
};

// Otros métodos estáticos para consultas comunes...

const RecogidaTienda = mongoose.model('RecogidaTienda', recogidaTiendaSchema);

module.exports = RecogidaTienda;