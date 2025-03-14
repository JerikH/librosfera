// test-native-driver.js
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

async function testNativeDriver() {
  const client = new MongoClient(process.env.MONGO_URI, {
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000
  });

  try {
    // Conectar directamente sin Mongoose
    await client.connect();
    console.log('Conexión directa a MongoDB establecida');
    
    // Obtener base de datos y colección
    const db = client.db(); // Usa la base de datos de la URI
    console.log('Usando base de datos:', db.databaseName);
    
    // Listar colecciones
    const collections = await db.listCollections().toArray();
    console.log('Colecciones existentes:', collections.map(c => c.name).join(', '));
    
    // Intentar insertar directamente en la colección 'users'
    console.log('Intentando insertar documento directamente...');
    const result = await db.collection('users').insertOne({
      usuario: 'test_direct_' + Date.now(),
      email: `direct${Date.now()}@example.com`,
      password: 'test12345',
      fecha_registro: new Date(),
      activo: true,
      tipo_usuario: 'cliente'
    });
    
    console.log('Documento insertado directamente:', result.insertedId);
    
    // Limpiar
    await db.collection('users').deleteOne({ _id: result.insertedId });
    console.log('Documento eliminado correctamente');
    
  } catch (error) {
    console.error('Error con el driver nativo:', error);
  } finally {
    await client.close();
    console.log('Conexión cerrada');
  }
}

testNativeDriver();