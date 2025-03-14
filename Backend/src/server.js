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

const uri = process.env.MONGO_URI;
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function conectarMongoDB() {
  try {
    console.log("Intentando conectar a MongoDB...");
    await mongoose.connect(uri, clientOptions);
    console.log("Estado de conexión:", mongoose.connection.readyState);

    // Intentar un ping para asegurarse
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("MongoDB está respondiendo correctamente.");

    // Crear una nueva base de datos y colección
    const db = mongoose.connection.db;
    const collection = db.collection("prueba");
    
    // Insertar datos de prueba
    await collection.insertOne({ mensaje: "Datos de prueba" });
    console.log("Datos insertados en la base de datos de prueba.");

    // Esperar 30 segundos antes de borrar los datos
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Borrar los datos y la colección
    await collection.deleteMany({});
    await db.dropCollection("prueba");
    console.log("Datos y base de datos eliminados.");

    // Iniciar servidor después de la limpieza de datos
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

  } catch (err) {
    console.error("Error al conectar a MongoDB:", err);
    process.exit(1);
  }
}

conectarMongoDB();