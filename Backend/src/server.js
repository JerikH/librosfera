// src/server.js
const dotenv = require('dotenv');
const { connectDB } = require('../Database/config/dbConfig');
const initRootUser = require('../Database/scripts/initRootUser');

// Cargar variables de entorno antes de importar otros módulos
dotenv.config();

// Importar aplicación Express
const app = require('./app');

// Configurar manejo de excepciones no capturadas
process.on('uncaughtException', (err) => {
  console.error('ERROR NO CAPTURADO! 💥 Cerrando aplicación...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// Función principal para iniciar el servidor
async function iniciarServidor() {
  try {
    // Conectar a MongoDB
    await connectDB();
    
    // Definir puerto
    const PORT = process.env.PORT || 5000;
    await initRootUser();
    // Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      console.log(`
🚀 Servidor iniciado:
- Modo: ${process.env.NODE_ENV}
- Puerto: ${PORT}
- Tiempo: ${new Date().toISOString()}
      `);
    });
    
    // Manejar rechazos de promesas no capturados
    process.on('unhandledRejection', (err) => {
      console.error('ERROR DE PROMESA NO MANEJADA! 💥');
      console.error(err.name, err.message);
      console.error(err.stack);
      
      // Cerrar servidor y salir
      server.close(() => {
        console.log('Servidor cerrado debido a un error no manejado.');
        process.exit(1);
      });
    });
    
    // Manejar señales de terminación
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM recibido. Cerrando servidor graciosamente...');
      server.close(() => {
        console.log('Proceso terminado.');
      });
    });
    
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor
iniciarServidor();