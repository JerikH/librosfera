const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Proxy hacia el servidor de desarrollo de React
const proxy = createProxyMiddleware({
  target: 'http://localhost:3001', // React correrá en 3001
  changeOrigin: true,
  ws: true, // Para websockets (hot reload)
});

app.use('/', proxy);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server running on 0.0.0.0:${PORT}`);
});