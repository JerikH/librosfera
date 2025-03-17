// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile, 
  deleteUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUserById
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/login', loginUser);

// Registro de usuarios (clientes sin autenticación, otros roles con autenticación)
router.post('/register', registerUser);

// Rutas protegidas para cualquier usuario autenticado
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.delete('/profile', protect, deleteUser);

// Rutas protegidas para administradores y root
router.get('/', protect, authorize('administrador', 'root'), getUsers);
router.get('/:id', protect, authorize('administrador', 'root'), getUserById);
router.put('/:id', protect, authorize('administrador', 'root'), updateUser);
router.delete('/:id', protect, authorize('administrador', 'root'), deleteUserById);

// Rutas específicas para administradores y root
router.post('/admin', protect, authorize('root'), registerUser); // Ruta específica para crear administradores

module.exports = router;