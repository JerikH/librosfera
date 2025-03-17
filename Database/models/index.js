// Database/models/index.js
/**
 * Archivo índice para exportar todos los modelos
 * Permite importar múltiples modelos desde un solo archivo
 */

const userModels = require('./userModel');

module.exports = {
  // Exportar modelos de usuario
  Usuario: userModels.Usuario,
  Root: userModels.Root,
  Administrador: userModels.Administrador,
  Cliente: userModels.Cliente,
  
  // Aquí se pueden exportar otros modelos cuando se creen
  // Producto: require('./productModel'),
  // Pedido: require('./orderModel'),
};