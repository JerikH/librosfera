// // src/db.js - Archivo de inicialización de DB mejorado
// const mongoose = require('mongoose');

// // Configuraciones globales de Mongoose
// mongoose.set('bufferTimeoutMS', 60000); // Aumentar timeout a 60 segundos
// mongoose.set('strictQuery', false);     // Más permisivo con las consultas

// /**
//  * Inicializa la conexión a MongoDB con opciones optimizadas
//  */
// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGO_URI, {
//       // Desactivar la creación automática de índices
//       autoIndex: false,
//       autoCreate: false
//     });
    
//     console.log(`Conexión a MongoDB establecida: ${conn.connection.host}`);
//     console.log(`Base de datos: ${conn.connection.db.databaseName}`);
    
//     // Precargar modelos pero no esperar a que se creen índices
//     try {
//       require('../../Database/usuarioTipos');
//       console.log('Modelos cargados correctamente');
//     } catch (modelError) {
//       console.warn('Advertencia al cargar modelos:', modelError.message);
//     }
    
//     return conn;
//   } catch (error) {
//     console.error('Error al conectar a MongoDB:', error);
//     process.exit(1);
//   }
// };

// /**
//  * Función para crear índices manualmente después de iniciar
//  * Se puede llamar en un momento posterior cuando sea necesario
//  */
// const createIndexes = async () => {
//   try {
//     const { Usuario } = require('../../Database/usuarioTipos');
//     console.log('Creando índices...');
    
//     // Crear índices fundamentales de forma controlada
//     await Usuario.collection.createIndex(
//       { usuario: 1 }, 
//       { unique: true, background: true, sparse: true }
//     );
    
//     await Usuario.collection.createIndex(
//       { email: 1 }, 
//       { unique: true, background: true, sparse: true }
//     );
    
//     console.log('Índices creados correctamente');
//   } catch (error) {
//     console.warn('Advertencia al crear índices:', error.message);
//   }
// };

// /**
//  * Maneja la reconexión a MongoDB
//  */
// mongoose.connection.on('disconnected', () => {
//   console.log('MongoDB desconectado. Intentando reconectar...');
// });

// mongoose.connection.on('error', (err) => {
//   console.error('Error en la conexión MongoDB:', err);
// });

// /**
//  * Cierra la conexión a MongoDB correctamente
//  */
// const closeDB = async () => {
//   try {
//     await mongoose.connection.close();
//     console.log('Conexión a MongoDB cerrada correctamente');
//   } catch (error) {
//     console.error('Error al cerrar la conexión a MongoDB:', error);
//     process.exit(1);
//   }
// };

// module.exports = { connectDB, closeDB, createIndexes };