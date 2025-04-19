// src/routes/libroRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getLibros,
  getLibroPorId,
  crearLibro,
  actualizarLibro,
  eliminarLibro,
  eliminarLibroPermanente,
  buscarLibros,
  registrarInteraccion,
  getRecomendaciones,
  getLibrosConDescuento,
  getLibrosDestacados,
  calificarLibro,
  marcarComoHistorico,
  agregarEjemplar,
  actualizarEjemplar,
  eliminarEjemplar,
  agregarDescuento,
  desactivarDescuentos,
  subirImagenLibro,
  actualizarOrdenImagenes,
  eliminarImagenLibro,
  reservarStockLibro,
  liberarStockLibro,
  confirmarCompraLibro
} = require('../controllers/libroController');

const { protect, authorize } = require('../middleware/authMiddleware');
const { 
  uploadSingleImage, 
  handleMulterError, 
  checkUploadDirs 
} = require('../middleware/uploadMiddleware');

/**
 * @swagger
 * tags:
 *   name: Libros
 *   description: Gestión del catálogo de libros
 */

// Rutas públicas para búsqueda y listado
/**
 * @swagger
 * /api/v1/libros:
 *   get:
 *     summary: Obtener lista de libros con filtros y paginación
 *     tags: [Libros]
 *     parameters:
 *       - in: query
 *         name: titulo
 *         schema:
 *           type: string
 *         description: Título del libro (búsqueda parcial)
 *       - in: query
 *         name: autor
 *         schema:
 *           type: string
 *         description: Nombre del autor (búsqueda parcial)
 *       - in: query
 *         name: genero
 *         schema:
 *           type: string
 *         description: Género del libro
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de resultados por página
 *     responses:
 *       200:
 *         description: Lista de libros obtenida exitosamente
 */
router.get('/', getLibros);

/**
 * @swagger
 * /api/v1/libros/buscar:
 *   get:
 *     summary: Buscar libros por texto y registrar búsqueda
 *     tags: [Libros]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Texto a buscar (título, autor, descripción)
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 *       400:
 *         description: Se requiere un término de búsqueda
 */
router.get('/buscar', buscarLibros);

/**
 * @swagger
 * /api/v1/libros/buscar/{idBusqueda}/interaccion/{idLibro}:
 *   post:
 *     summary: Registrar interacción con un libro desde una búsqueda
 *     tags: [Libros]
 *     parameters:
 *       - in: path
 *         name: idBusqueda
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la búsqueda
 *       - in: path
 *         name: idLibro
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del libro
 *     responses:
 *       200:
 *         description: Interacción registrada correctamente
 */
router.post('/buscar/:idBusqueda/interaccion/:idLibro', registrarInteraccion);

/**
 * @swagger
 * /api/v1/libros/descuentos:
 *   get:
 *     summary: Obtener libros con descuentos activos
 *     tags: [Libros]
 *     responses:
 *       200:
 *         description: Lista de libros con descuento
 */
router.get('/descuentos', getLibrosConDescuento);

/**
 * @swagger
 * /api/v1/libros/destacados:
 *   get:
 *     summary: Obtener libros destacados (mejor calificados)
 *     tags: [Libros]
 *     responses:
 *       200:
 *         description: Lista de libros destacados
 */
router.get('/destacados', getLibrosDestacados);

/**
 * @swagger
 * /api/v1/libros/recomendaciones:
 *   get:
 *     summary: Obtener recomendaciones para el usuario
 *     tags: [Libros]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recomendaciones personalizadas
 *       401:
 *         description: Requiere autenticación
 */
router.get('/recomendaciones', protect, getRecomendaciones);

/**
 * @swagger
 * /api/v1/libros/{id}:
 *   get:
 *     summary: Obtener detalles de un libro específico
 *     tags: [Libros]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del libro
 *     responses:
 *       200:
 *         description: Detalles del libro
 *       404:
 *         description: Libro no encontrado
 */
router.get('/:id', getLibroPorId);

// Rutas protegidas para administración de libros

/**
 * @swagger
 * /api/v1/libros:
 *   post:
 *     summary: Crear un nuevo libro
 *     tags: [Libros]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - autor
 *               - editorial
 *               - genero
 *               - idioma
 *               - fecha_publicacion
 *               - numero_paginas
 *               - precio
 *               - estado
 *     responses:
 *       201:
 *         description: Libro creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para crear libros
 */
router.post('/', protect, authorize('administrador', 'root'), crearLibro);

/**
 * @swagger
 * /api/v1/libros/{id}:
 *   put:
 *     summary: Actualizar un libro existente
 *     tags: [Libros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Libro actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para actualizar libros
 */
router.put('/:id', protect, authorize('administrador', 'root'), actualizarLibro);

/**
 * @swagger
 * /api/v1/libros/{id}:
 *   delete:
 *     summary: Eliminar un libro (desactivación lógica)
 *     tags: [Libros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Libro desactivado correctamente
 *       403:
 *         description: No tiene permisos para eliminar libros
 */
router.delete('/:id', protect, authorize('administrador', 'root'), eliminarLibro);

/**
 * @swagger
 * /api/v1/libros/{id}/permanente:
 *   delete:
 *     summary: Eliminar un libro permanentemente
 *     tags: [Libros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Libro eliminado permanentemente
 *       403:
 *         description: No tiene permisos para eliminar libros permanentemente
 */
router.delete('/:id/permanente', protect, authorize('root'), eliminarLibroPermanente);

/**
 * @swagger
 * /api/v1/libros/{id}/historico:
 *   patch:
 *     summary: Marcar un libro como histórico agotado
 *     tags: [Libros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Libro marcado como histórico agotado
 *       403:
 *         description: No tiene permisos para esta acción
 */
router.patch('/:id/historico', protect, authorize('administrador', 'root'), marcarComoHistorico);

// Rutas para calificaciones
/**
 * @swagger
 * /api/v1/libros/{id}/calificacion:
 *   post:
 *     summary: Calificar un libro
 *     tags: [Libros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - calificacion
 *             properties:
 *               calificacion:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: Calificación registrada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Requiere autenticación
 */
router.post('/:id/calificacion', protect, calificarLibro);

// Rutas para gestión de ejemplares
/**
 * @swagger
 * /api/v1/libros/{id}/ejemplares:
 *   post:
 *     summary: Agregar un ejemplar a un libro
 *     tags: [Libros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo
 *     responses:
 *       201:
 *         description: Ejemplar agregado exitosamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para agregar ejemplares
 */
router.post('/:id/ejemplares', protect, authorize('administrador', 'root'), agregarEjemplar);

/**
 * @swagger
 * /api/v1/libros/{id}/ejemplares/{codigo}:
 *   put:
 *     summary: Actualizar un ejemplar específico
 *     tags: [Libros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ejemplar actualizado exitosamente
 *       403:
 *         description: No tiene permisos para actualizar ejemplares
 */
router.put('/:id/ejemplares/:codigo', protect, authorize('administrador', 'root'), actualizarEjemplar);

/**
 * @swagger
 * /api/v1/libros/{id}/ejemplares/{codigo}:
 *   delete:
 *     summary: Eliminar un ejemplar específico
 *     tags: [Libros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ejemplar eliminado exitosamente
 *       403:
 *         description: No tiene permisos para eliminar ejemplares
 */
router.delete('/:id/ejemplares/:codigo', protect, authorize('administrador', 'root'), eliminarEjemplar);

// Rutas para gestión de descuentos
/**
 * @swagger
 * /api/v1/libros/{id}/descuentos:
 *   post:
 *     summary: Agregar un descuento a un libro
 *     tags: [Libros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo
 *               - valor
 *     responses:
 *       201:
 *         description: Descuento agregado exitosamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para agregar descuentos
 */
router.post('/:id/descuentos', protect, authorize('administrador', 'root'), agregarDescuento);

/**
 * @swagger
 * /api/v1/libros/{id}/descuentos:
 *   delete:
 *     summary: Desactivar todos los descuentos de un libro
 *     tags: [Libros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Descuentos desactivados exitosamente
 *       403:
 *         description: No tiene permisos para desactivar descuentos
 */
router.delete('/:id/descuentos', protect, authorize('administrador', 'root'), desactivarDescuentos);

// Rutas para gestión de imágenes
/**
 * @swagger
 * /api/v1/libros/{id}/imagenes:
 *   post:
 *     summary: Subir una imagen para un libro
 *     tags: [Libros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - imagen
 *             properties:
 *               imagen:
 *                 type: string
 *                 format: binary
 *               tipo:
 *                 type: string
 *                 enum: [portada, contraportada, contenido, detalle]
 *               orden:
 *                 type: integer
 *               alt_text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Imagen subida exitosamente
 *       400:
 *         description: Error al subir imagen
 *       403:
 *         description: No tiene permisos para subir imágenes
 */
router.post(
  '/:id/imagenes', 
  protect, 
  authorize('administrador', 'root'), 
  checkUploadDirs,
  uploadSingleImage,
  handleMulterError,
  subirImagenLibro
);

/**
 * @swagger
 * /api/v1/libros/{id}/imagenes/orden:
 *   patch:
 *     summary: Actualizar orden de imágenes
 *     tags: [Libros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ordenesNuevos
 *             properties:
 *               ordenesNuevos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id_imagen
 *                     - orden_nuevo
 *     responses:
 *       200:
 *         description: Orden actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para ordenar imágenes
 */
router.patch('/:id/imagenes/orden', protect, authorize('administrador', 'root'), actualizarOrdenImagenes);

/**
 * @swagger
 * /api/v1/libros/{id}/imagenes/{idImagen}:
 *   delete:
 *     summary: Eliminar una imagen
 *     tags: [Libros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: idImagen
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Imagen eliminada correctamente
 *       400:
 *         description: Error al eliminar imagen
 *       403:
 *         description: No tiene permisos para eliminar imágenes
 */
router.delete('/:id/imagenes/:idImagen', protect, authorize('administrador', 'root'), eliminarImagenLibro);

// Rutas para gestión de stock
/**
 * @swagger
 * /api/v1/libros/{id}/reservar:
 *   post:
 *     summary: Reservar stock para compra
 *     tags: [Libros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cantidad
 *               - id_reserva
 *     responses:
 *       200:
 *         description: Stock reservado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Requiere autenticación
 *       409:
 *         description: Stock insuficiente
 */
router.post('/:id/reservar', protect, reservarStockLibro);

/**
 * @swagger
 * /api/v1/libros/{id}/liberar:
 *   post:
 *     summary: Liberar stock reservado
 *     tags: [Libros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cantidad
 *               - id_reserva
 *     responses:
 *       200:
 *         description: Stock liberado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Requiere autenticación
 */
router.post('/:id/liberar', protect, liberarStockLibro);

/**
 * @swagger
 * /api/v1/libros/{id}/comprar:
 *   post:
 *     summary: Confirmar compra de libro
 *     tags: [Libros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cantidad
 *               - id_transaccion
 *               - id_reserva
 *     responses:
 *       200:
 *         description: Compra confirmada correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Requiere autenticación
 */
router.post('/:id/comprar', protect, confirmarCompraLibro);

module.exports = router;