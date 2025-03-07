// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Importar configuraciones
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Importar rutas
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const searchRoutes = require('./routes/searchRoutes');

// Inicializar app
const app = express();

// Middlewares de seguridad y utilidad
app.use(helmet()); // Seguridad con headers HTTP
app.use(cors()); // Habilitar CORS
app.use(express.json()); // Parsear JSON
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev')); // Logging

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 peticiones por ventana
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Rutas de la API
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/search', searchRoutes);

// Ruta de estado
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API funcionando correctamente' });
});

// Middleware de manejo de errores
app.use(notFound);
app.use(errorHandler);

module.exports = app;