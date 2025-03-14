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
router.post('/register', registerUser);
router.post('/login', loginUser);

// Rutas protegidas para cualquier usuario autenticado
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.delete('/profile', protect, deleteUser);

// Rutas protegidas para administradores y root
router.get('/', protect, authorize('administrador', 'root'), getUsers);
router.get('/:id', protect, authorize('administrador', 'root'), getUserById);
router.put('/:id', protect, authorize('administrador', 'root'), updateUser);
router.delete('/:id', protect, authorize('administrador', 'root'), deleteUserById);

// Ruta para crear usuarios administradores (solo accesible por root)
router.post('/admin', protect, authorize('root'), registerUser);

module.exports = router;