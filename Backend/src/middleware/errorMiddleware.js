// src/middleware/errorMiddleware.js

// Middleware para rutas no encontradas
const notFound = (req, res, next) => {
    const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
    res.status(404);
    next(error);
  };
  
  // Middleware para manejo centralizado de errores
  const errorHandler = (err, req, res, next) => {
    // Si el error tiene código de status, usarlo, de lo contrario usar 500
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    // Preparar respuesta de error
    const errorResponse = {
      status: 'error',
      message: err.message,
    };
    
    // Agregar stack trace en desarrollo
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = err.stack;
    }
    
    // Enviar respuesta de error formateada
    res.status(statusCode).json(errorResponse);
  };
  
  // Clase de error personalizada para la API
  class ApiError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = true;
  
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  module.exports = {
    notFound,
    errorHandler,
    ApiError
  };