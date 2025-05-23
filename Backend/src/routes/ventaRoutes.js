// src/routes/ventaRoutes.js
const express = require('express');
const router = express.Router();

const {
  crearVenta,
  obtenerMisVentas,
  obtenerDetalleVenta,
  cancelarVentaCliente,
  crearDevolucion,
  obtenerVentas,
  actualizarEstadoEnvio,
  cancelarVentaAdmin,
  obtenerEstadisticas,
  agregarNotaInterna
} = require('../controllers/ventaController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(protect);

// RUTAS DE CLIENTE

// Crear nueva venta desde carrito
router.post('/', authorize('cliente'), crearVenta);

// Obtener mis ventas
router.get('/mis-ventas', authorize('cliente'), obtenerMisVentas);

// Cancelar mi venta (cliente)
router.patch('/:numeroVenta/cancelar', authorize('cliente'), cancelarVentaCliente);

// Crear solicitud de devolución
router.post('/:numeroVenta/devolucion', authorize('cliente'), crearDevolucion);

// RUTAS ADMINISTRATIVAS

// Obtener estadísticas de ventas
router.get('/estadisticas', authorize('administrador', 'root'), obtenerEstadisticas);

// Obtener todas las ventas (admin)
router.get('/admin/todas', authorize('administrador', 'root'), obtenerVentas);

// Actualizar estado de envío
router.patch('/:numeroVenta/envio', authorize('administrador', 'root'), actualizarEstadoEnvio);

// Cancelar venta (admin)
router.delete('/:numeroVenta', authorize('administrador', 'root'), cancelarVentaAdmin);

// Agregar nota interna
router.post('/:numeroVenta/notas', authorize('administrador', 'root'), agregarNotaInterna);

// RUTAS MIXTAS (Cliente para sus ventas, Admin para cualquiera)

// Obtener detalle de venta específica
router.get('/:numeroVenta', obtenerDetalleVenta);

module.exports = router;