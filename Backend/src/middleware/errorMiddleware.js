// src/middleware/errorMiddleware.js

/**
 * Middleware para manejar rutas no encontradas
 */
const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Middleware para manejar errores
 */
const errorHandler = (err, req, res, next) => {
  // Si el status code sigue siendo 200, cambiarlo a 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    status: 'error',
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };