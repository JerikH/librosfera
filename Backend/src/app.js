// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Importar configuraciones
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const debugMiddleware = require('./middleware/debugMiddleware');
const activityLogger = require('./middleware/activityLogMiddleware');

// Importar rutas
// const productRoutes = require('./routes/productRoutes');
// const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes');
const authRoutes = require('./routes/authRoutes');
const libroRoutes = require('./routes/libroRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
// const orderRoutes = require('./routes/orderRoutes');
// const cartRoutes = require('./routes/cartRoutes');
// const reservationRoutes = require('./routes/reservationRoutes');
// const searchRoutes = require('./routes/searchRoutes');

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

// middleware de activity logger a nivel global
app.use(activityLogger);

// Añadir middleware de depuración en ambiente de desarrollo
if (process.env.NODE_ENV === 'development' && process.env.DEBUG === 'true') {
  app.use(debugMiddleware);
  console.log('Middleware de depuración activado');
}

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutos
//   max: 1000, // Límite de 100 peticiones por ventana
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use(limiter);

// Directorio estático para archivos subidos
const uploadsPath = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
console.log('Directorio de uploads configurado en:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Crear directorios necesarios si no existen
const fs = require('fs');
const librosPath = path.join(uploadsPath, 'libros');
const profilesPath = path.join(uploadsPath, 'profiles');
try {
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('Directorio de uploads creado:', uploadsPath);
  }
  if (!fs.existsSync(librosPath)) {
    fs.mkdirSync(librosPath, { recursive: true });
    console.log('Directorio de imágenes de libros creado:', librosPath);
  }
  if (!fs.existsSync(profilesPath)) {
    fs.mkdirSync(profilesPath, { recursive: true });
    console.log('Directorio de imágenes de perfiles creado:', profilesPath);
  }
} catch (error) {
  console.error('Error creando directorios:', error);
}

// Rutas de la API
// app.use('/api/v1/products', productRoutes);
// app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/users', passwordResetRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/libros', libroRoutes);
app.use('/api/v1/activities', activityLogRoutes);
// app.use('/api/v1/orders', orderRoutes);
// app.use('/api/v1/cart', cartRoutes);
// app.use('/api/v1/reservations', reservationRoutes);
// app.use('/api/v1/search', searchRoutes);

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