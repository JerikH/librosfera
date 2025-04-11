// Database/services/index.js
/**
 * Archivo índice para exportar todos los servicios
 * Facilita la importación de múltiples servicios desde un solo archivo
 */

// Exportar servicios disponibles
module.exports = {
    userService: require('./userService'),
    libroService: require('./libroService'),

    
    // Aquí se pueden exportar otros servicios cuando se creen
    // productService: require('./productService'),
    // orderService: require('./orderService'),
  };