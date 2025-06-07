const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

console.log(`Starting NO-BUILD server on port ${PORT}`);

// Servir archivos estáticos desde public
app.use(express.static(path.join(__dirname, 'public')));

// Servir archivos JS compilados en tiempo real
app.get('/static/js/:file', (req, res) => {
  const filename = req.params.file;
  const srcPath = path.join(__dirname, 'src', filename.replace('.js', '.jsx') || filename.replace('.js', '.js'));
  
  if (fs.existsSync(srcPath)) {
    const code = fs.readFileSync(srcPath, 'utf8');
    res.set('Content-Type', 'text/javascript');
    res.send(code);
  } else {
    res.status(404).send('File not found');
  }
});

// Ruta principal que sirve index.html modificado
app.get('*', (req, res) => {
  const publicIndex = path.join(__dirname, 'public', 'index.html');
  
  if (fs.existsSync(publicIndex)) {
    let html = fs.readFileSync(publicIndex, 'utf8');
    
    // Inyectar Babel para compilar JSX en el navegador
    html = html.replace(
      '</head>',
      `
      <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
      <script>
        // Configurar Babel
        Babel.registerPreset('react', {
          presets: [
            [Babel.availablePresets['react']],
            [Babel.availablePresets['env']]
          ]
        });
      </script>
      </head>`
    );
    
    // Cargar el archivo principal de React
    html = html.replace(
      '<div id="root"></div>',
      `
      <div id="root"></div>
      <script type="text/babel" data-presets="react,env">
        ${fs.readFileSync(path.join(__dirname, 'src', 'index.js'), 'utf8')}
      </script>
      `
    );
    
    res.send(html);
  } else {
    res.send('<h1>App funcionando en Render</h1><p>Sin build, directo desde src/</p>');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`NO-BUILD server running on 0.0.0.0:${PORT}`);
  console.log('Serving React files directly from src/ folder');
});