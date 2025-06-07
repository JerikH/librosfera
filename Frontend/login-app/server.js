const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

console.log(`Starting production server on port ${PORT}`);

// Servir archivos estáticos desde build
app.use(express.static(path.join(__dirname, 'build')));

// ESTO ES CLAVE: Servir index.html para TODAS las rutas que no sean archivos estáticos
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Production server running on 0.0.0.0:${PORT}`);
});