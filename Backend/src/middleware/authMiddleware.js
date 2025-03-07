// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const { ApiError } = require('./errorMiddleware');

// Middleware para proteger rutas (requiere autenticación)
exports.protect = async (req, res, next) => {
  try {
    // 1) Verificar si el token existe
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new ApiError('No estás autenticado. Por favor inicia sesión para acceder', 401)
      );
    }

    // 2) Verificar token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Verificar si el usuario todavía existe
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new ApiError('El usuario con este token ya no existe', 401)
      );
    }

    // 4) Verificar si el usuario cambió su contraseña después de emitir el token
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new ApiError('Usuario cambió recientemente su contraseña. Por favor inicie sesión nuevamente', 401)
      );
    }

    // ACCESO CONCEDIDO: Almacenar el usuario en req
    req.user = currentUser;
    next();
  } catch (error) {
    next(new ApiError('Error de autenticación', 401));
  }
};

// Middleware para restringir acceso a ciertos roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'staff']
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError('No tienes permiso para realizar esta acción', 403)
      );
    }
    next();
  };
};