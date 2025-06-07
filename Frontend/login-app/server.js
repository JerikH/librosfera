const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

console.log(`Starting React server on port ${PORT}`);

// Servir archivos estáticos desde public
app.use(express.static(path.join(__dirname, 'public')));

// IMPORTANTE: Todas las rutas deben servir index.html para que React Router funcione
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');
    
    // Reemplazar las variables de CRA
    html = html.replace(/%PUBLIC_URL%/g, '');
    
    // Inyectar React, ReactDOM y tu código
    html = html.replace(
      '</body>',
      `
      <!-- React y ReactDOM desde CDN -->
      <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
      <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
      <script crossorigin src="https://unpkg.com/react-router-dom@6/dist/umd/react-router-dom.production.min.js"></script>
      
      <!-- Babel para compilar JSX -->
      <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
      
      <!-- Tu aplicación -->
      <script type="text/babel">
        const { BrowserRouter: Router, Route, Routes, Navigate } = ReactRouterDOM;
        
        // Componente temporal para probar
        const LoginPage = () => React.createElement('div', null, 'Login Page - Funciona!');
        const HomePage = () => React.createElement('div', null, 'Home Page - Funciona!');
        
        const App = () => {
          return React.createElement(Router, null,
            React.createElement(Routes, null,
              React.createElement(Route, { path: "/", element: React.createElement(Navigate, { to: "/Login", replace: true }) }),
              React.createElement(Route, { path: "/Login", element: React.createElement(LoginPage) }),
              React.createElement(Route, { path: "/Home", element: React.createElement(HomePage) })
            )
          );
        };
        
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(React.StrictMode, null, React.createElement(App)));
      </script>
      </body>`
    );
    
    res.send(html);
  } else {
    res.status(404).send('index.html not found');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ React Router server running on 0.0.0.0:${PORT}`);
});