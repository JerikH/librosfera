// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { Usuario } = require('../../../Database/models');

/**
 * Middleware para proteger rutas - verifica que el usuario esté autenticado
 */
const protect = async (req, res, next) => {
  let token;

  // Verificar si hay token en los headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Obtener token del header
      token = req.headers.authorization.split(' ')[1];

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Buscar usuario por ID y excluir la contraseña
      req.user = await Usuario.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Usuario no encontrado'
        });
      }
      
      // Actualizar último acceso
      await Usuario.findByIdAndUpdate(req.user._id, {
        ultimo_acceso: Date.now()
      });

      next();
    } catch (error) {
      console.error('Error en autenticación:', error);
      res.status(401).json({
        status: 'error',
        message: 'No autorizado, token inválido'
      });
    }
  } else {
    return res.status(401).json({
      status: 'error',
      message: 'No autorizado, no hay token'
    });
  }
};

/**
 * Middleware para verificar roles de usuario
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.tipo_usuario)) {
      return res.status(403).json({
        status: 'error',
        message: 'No tiene permiso para realizar esta acción'
      });
    }
    next();
  };
};

module.exports = { protect, authorize };