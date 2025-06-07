const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

console.log(`Proxy attempting to start on 0.0.0.0:${PORT}`);

// Proxy hacia el servidor de desarrollo de React
const proxy = createProxyMiddleware({
  target: 'http://127.0.0.1:3001',
  changeOrigin: true,
  ws: true,
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(500).send('Proxy error: ' + err.message);
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxying request to:', proxyReq.path);
  }
});

app.use('/', proxy);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server running on 0.0.0.0:${PORT}`);
  console.log(`Proxying to React dev server at http://127.0.0.1:3001`);
});