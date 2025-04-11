// src/app.js - Modificaciones necesarias para integrar las rutas de libros

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Importar configuraciones
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Importar rutas
// const productRoutes = require('./routes/productRoutes');
// const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes');
const authRoutes = require('./routes/authRoutes');
// const orderRoutes = require('./routes/orderRoutes');
// const cartRoutes = require('./routes/cartRoutes');
// const reservationRoutes = require('./routes/reservationRoutes');
// const searchRoutes = require('./routes/searchRoutes');
const libroRoutes = require('./routes/libroRoutes'); 

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
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
// app.use('/api/v1/products', productRoutes);
// app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/users', passwordResetRoutes);
app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/orders', orderRoutes);
// app.use('/api/v1/cart', cartRoutes);
// app.use('/api/v1/reservations', reservationRoutes);
// app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/libros', libroRoutes); // Registrar las rutas de libros

// Ruta de estado
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API funcionando correctamente' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }'
}));

// Middleware de manejo de errores
app.use(notFound);
app.use(errorHandler);

module.exports = app;