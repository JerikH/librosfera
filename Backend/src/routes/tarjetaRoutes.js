// src/routes/tarjetaRoutes.js
const express = require('express');
const router = express.Router();
const { 
  registrarTarjeta, 
  obtenerTarjetas, 
  obtenerTarjeta, 
  actualizarTarjeta, 
  eliminarTarjeta,
  establecerPredeterminada,
  verificarTarjeta,
  verificarSaldo,
  modificarSaldo,
  obtenerTarjetaPredeterminada,
  obtenerEstadisticasTarjetas,
  obtenerEstadisticasTarjetasUsuario
} = require('../controllers/tarjetaController');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Tarjetas
 *   description: Gestión de tarjetas de crédito y débito
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Tarjeta:
 *       type: object
 *       properties:
 *         id_tarjeta:
 *           type: string
 *           description: Identificador único de la tarjeta
 *         id_usuario:
 *           type: string
 *           description: ID del usuario propietario de la tarjeta
 *         tipo:
 *           type: string
 *           enum: [credito, debito]
 *           description: Tipo de tarjeta
 *         nombre_titular:
 *           type: string
 *           description: Nombre del titular como aparece en la tarjeta
 *         ultimos_digitos:
 *           type: string
 *           description: Últimos 4 dígitos de la tarjeta
 *         marca:
 *           type: string
 *           enum: [visa, mastercard, american_express, diners, otra]
 *           description: Marca de la tarjeta
 *         fecha_expiracion:
 *           type: object
 *           properties:
 *             mes:
 *               type: integer
 *               description: Mes de expiración
 *             anio:
 *               type: integer
 *               description: Año de expiración
 *         predeterminada:
 *           type: boolean
 *           description: Indica si es la tarjeta predeterminada del usuario
 *         saldo:
 *           type: number
 *           description: Saldo disponible (solo para tarjetas de débito)
 *         activa:
 *           type: boolean
 *           description: Estado de la tarjeta
 *         fecha_registro:
 *           type: string
 *           format: date-time
 *           description: Fecha de registro de la tarjeta
 *         ultima_actualizacion:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *
 *     TarjetaInput:
 *       type: object
 *       required:
 *         - numero_tarjeta
 *         - nombre_titular
 *         - mes_expiracion
 *         - anio_expiracion
 *         - cvv
 *         - tipo
 *       properties:
 *         numero_tarjeta:
 *           type: string
 *           description: Número completo de la tarjeta (solo se almacenan los últimos 4 dígitos)
 *         nombre_titular:
 *           type: string
 *           description: Nombre del titular como aparece en la tarjeta
 *         mes_expiracion:
 *           type: integer
 *           description: Mes de expiración (1-12)
 *         anio_expiracion:
 *           type: integer
 *           description: Año de expiración (4 dígitos)
 *         cvv:
 *           type: string
 *           description: Código de seguridad (no se almacena)
 *         tipo:
 *           type: string
 *           enum: [credito, debito]
 *           description: Tipo de tarjeta
 *         marca:
 *           type: string
 *           enum: [visa, mastercard, american_express, diners, otra]
 *           description: Marca de la tarjeta (opcional, se detecta automáticamente)
 *
 *     TarjetaUpdate:
 *       type: object
 *       properties:
 *         nombre_titular:
 *           type: string
 *           description: Nombre del titular como aparece en la tarjeta
 *         numero_tarjeta:
 *           type: string
 *           description: Número completo de la tarjeta (solo para actualización)
 *         mes_expiracion:
 *           type: integer
 *           description: Mes de expiración (1-12)
 *         anio_expiracion:
 *           type: integer
 *           description: Año de expiración (4 dígitos)
 *         tipo:
 *           type: string
 *           enum: [credito, debito]
 *           description: Tipo de tarjeta
 *         marca:
 *           type: string
 *           enum: [visa, mastercard, american_express, diners, otra]
 *           description: Marca de la tarjeta
 *         predeterminada:
 *           type: boolean
 *           description: Indica si la tarjeta debe ser predeterminada
 *
 *     SaldoModificacion:
 *       type: object
 *       required:
 *         - monto
 *       properties:
 *         monto:
 *           type: number
 *           description: Monto a modificar (positivo para incremento, negativo para decremento)
 *         descripcion:
 *           type: string
 *           description: Descripción de la modificación de saldo
 *
 *     TarjetaEstadisticas:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total de tarjetas
 *         activas:
 *           type: integer
 *           description: Cantidad de tarjetas activas
 *         inactivas:
 *           type: integer
 *           description: Cantidad de tarjetas inactivas
 *         credito:
 *           type: integer
 *           description: Cantidad de tarjetas de crédito
 *         debito:
 *           type: integer
 *           description: Cantidad de tarjetas de débito
 *         saldoTotal:
 *           type: number
 *           description: Suma de saldos de todas las tarjetas de débito
 *
 *     ApiResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [success, fail]
 *           description: Estado de la respuesta
 *         message:
 *           type: string
 *           description: Mensaje descriptivo
 *         data:
 *           type: object
 *           description: Datos de la respuesta
 */

/**
 * @swagger
 * /api/v1/tarjetas:
 *   post:
 *     summary: Registrar una nueva tarjeta
 *     description: Registra una nueva tarjeta de crédito o débito para el usuario autenticado
 *     tags: [Tarjetas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TarjetaInput'
 *     responses:
 *       201:
 *         description: Tarjeta registrada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Tarjeta'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *
 *   get:
 *     summary: Obtener todas las tarjetas del usuario
 *     description: Obtiene la lista de todas las tarjetas activas del usuario autenticado
 *     tags: [Tarjetas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tarjetas del usuario
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     resultados:
 *                       type: integer
 *                       description: Cantidad de tarjetas obtenidas
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Tarjeta'
 *       401:
 *         description: No autenticado
 *
 * /api/v1/tarjetas/predeterminada:
 *   get:
 *     summary: Obtener la tarjeta predeterminada del usuario
 *     description: Obtiene la tarjeta marcada como predeterminada del usuario autenticado
 *     tags: [Tarjetas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tarjeta predeterminada del usuario
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       oneOf:
 *                         - $ref: '#/components/schemas/Tarjeta'
 *                         - type: null
 *       401:
 *         description: No autenticado
 *
 * /api/v1/tarjetas/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: ID de la tarjeta
 *       schema:
 *         type: string
 *
 *   get:
 *     summary: Obtener una tarjeta específica
 *     description: Obtiene la información detallada de una tarjeta específica del usuario
 *     tags: [Tarjetas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información de la tarjeta
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Tarjeta'
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Tarjeta no encontrada
 *
 *   put:
 *     summary: Actualizar una tarjeta
 *     description: Actualiza la información de una tarjeta específica del usuario
 *     tags: [Tarjetas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TarjetaUpdate'
 *     responses:
 *       200:
 *         description: Tarjeta actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Tarjeta'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Tarjeta no encontrada
 *
 *   delete:
 *     summary: Eliminar una tarjeta
 *     description: Desactiva (eliminación lógica) una tarjeta específica del usuario
 *     tags: [Tarjetas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tarjeta eliminada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Tarjeta no encontrada
 *
 * /api/v1/tarjetas/{id}/predeterminada:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: ID de la tarjeta
 *       schema:
 *         type: string
 *   patch:
 *     summary: Establecer tarjeta predeterminada
 *     description: Establece una tarjeta específica como predeterminada para el usuario
 *     tags: [Tarjetas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tarjeta establecida como predeterminada
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Tarjeta'
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Tarjeta no encontrada
 *
 * /api/v1/tarjetas/{id}/verificar:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: ID de la tarjeta
 *       schema:
 *         type: string
 *   get:
 *     summary: Verificar validez de tarjeta
 *     description: Verifica si una tarjeta es válida (no expirada) y está activa
 *     tags: [Tarjetas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resultado de la verificación
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         valida:
 *                           type: boolean
 *                           description: Indica si la tarjeta es válida
 *                         activa:
 *                           type: boolean
 *                           description: Indica si la tarjeta está activa
 *                         mensaje:
 *                           type: string
 *                           description: Mensaje descriptivo
 *                         datos:
 *                           type: object
 *                           properties:
 *                             tipo:
 *                               type: string
 *                               description: Tipo de tarjeta
 *                             marca:
 *                               type: string
 *                               description: Marca de la tarjeta
 *                             ultimos_digitos:
 *                               type: string
 *                               description: Últimos 4 dígitos
 *                             fecha_expiracion:
 *                               type: object
 *                               properties:
 *                                 mes:
 *                                   type: integer
 *                                 anio:
 *                                   type: integer
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Tarjeta no encontrada
 *
 * /api/v1/tarjetas/{id}/saldo:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: ID de la tarjeta
 *       schema:
 *         type: string
 *   get:
 *     summary: Verificar saldo de tarjeta
 *     description: Obtiene el saldo disponible de una tarjeta de débito
 *     tags: [Tarjetas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del saldo
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         tipo:
 *                           type: string
 *                           enum: [debito, credito]
 *                         saldo:
 *                           type: number
 *                           description: Saldo disponible (solo para débito)
 *                         moneda:
 *                           type: string
 *                           description: Moneda del saldo
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Tarjeta no encontrada
 *
 *   patch:
 *     summary: Modificar saldo de tarjeta
 *     description: Incrementa o disminuye el saldo de una tarjeta de débito
 *     tags: [Tarjetas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SaldoModificacion'
 *     responses:
 *       200:
 *         description: Saldo modificado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id_tarjeta:
 *                           type: string
 *                         saldo_anterior:
 *                           type: number
 *                         saldo_actual:
 *                           type: number
 *                         monto_modificado:
 *                           type: number
 *                         fecha_operacion:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Datos inválidos o saldo insuficiente
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Tarjeta no encontrada
 *
 * /api/v1/tarjetas/stats:
 *   get:
 *     summary: Obtener estadísticas de tarjetas
 *     description: Obtiene estadísticas globales de tarjetas (solo para administradores)
 *     tags: [Tarjetas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de tarjetas
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/TarjetaEstadisticas'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *
 * /api/v1/tarjetas/stats/{userId}:
 *   parameters:
 *     - in: path
 *       name: userId
 *       required: true
 *       description: ID del usuario
 *       schema:
 *         type: string
 *   get:
 *     summary: Obtener estadísticas de tarjetas de un usuario
 *     description: Obtiene estadísticas de tarjetas para un usuario específico (solo para administradores)
 *     tags: [Tarjetas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de tarjetas del usuario
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/TarjetaEstadisticas'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */

// Todas las rutas requieren autenticación
router.use(protect);

// 1. Rutas POST y GET generales
router.post('/', registrarTarjeta);
router.get('/', obtenerTarjetas);

// 2. Rutas específicas (SIN parámetros dinámicos)
router.get('/predeterminada', obtenerTarjetaPredeterminada);
router.get('/stats', authorize('administrador', 'root'), obtenerEstadisticasTarjetas);
router.get('/stats/:userId', authorize('administrador', 'root'), obtenerEstadisticasTarjetasUsuario);

// 3. Rutas con parámetros específicos (operaciones sobre una tarjeta)
router.get('/:id/verificar', verificarTarjeta);
router.get('/:id/saldo', verificarSaldo);
router.patch('/:id/saldo', modificarSaldo);
router.patch('/:id/predeterminada', establecerPredeterminada);

// 4. Rutas CRUD básicas (ESTAS VAN AL FINAL)
router.get('/:id', obtenerTarjeta);
router.put('/:id', actualizarTarjeta);
router.delete('/:id', eliminarTarjeta);

module.exports = router;