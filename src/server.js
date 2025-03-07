// src/server.js
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Cargar variables de entorno
dotenv.config();

// Importar aplicación Express
const app = require('./app');

// Configurar manejo de excepciones no capturadas
process.on('uncaughtException', (err) => {
  console.error('ERROR NO CAPTURADO! 💥 Cerrando aplicación...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Conectar a MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Conexión a MongoDB establecida'))
  .catch((err) => console.error('Error al conectar a MongoDB:', err));

// Iniciar servidor
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`Servidor ejecutándose en modo ${process.env.NODE_ENV} en puerto ${PORT}`)
);

// Manejar rechazos de promesas no capturados
process.on('unhandledRejection', (err) => {
  console.error('ERROR DE PROMESA NO MANEJADA! 💥 Cerrando aplicación...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});