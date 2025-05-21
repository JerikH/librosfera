// Database/models/index.js
/**
 * Archivo índice para exportar todos los modelos
 * Permite importar múltiples modelos desde un solo archivo
 */

const userModels = require('./userModel');
const Libro = require('./libroModel');
const Inventario = require('./inventarioModel');
const TiendaFisica = require('./tiendaFisicaModel');
const Transaccion = require('./transaccionModel');
const Busqueda = require('./busquedaModel');
const Carrito = require('./carritoModel');
const CarritoItem = require('./carritoItemsModel');
const Devolucion = require('./devolucionModel');
const Recomendacion = require('./recomendacionModel');
const Ejemplar = require('./ejemplarModel');
const Reserva = require('./reservaModel');
const Envio = require('./envioModel');
const RecogidaTienda = require('./recogidaTiendaModel');
const Noticia = require('./noticiaModel');
const Mensaje= require('./mensajeModel');
module.exports = {
  // Exportar modelos de usuario
  Usuario: userModels.Usuario,
  Root: userModels.Root,
  Administrador: userModels.Administrador,
  Cliente: userModels.Cliente,
  
  // Exportar nuevos modelos
  Libro,
  Inventario,
  TiendaFisica,
  Transaccion,
  Busqueda,
  Carrito,
  CarritoItem,
  Devolucion,
  Recomendacion,
  Ejemplar,
  Reserva,
  Envio,
  RecogidaTienda, 
  Noticia, 
  Mensaje

};