const { spawn } = require('child_process');

const reactPort = 3001;
const proxyPort = process.env.PORT || 3000;

console.log(`Starting React dev server on port ${reactPort}`);
console.log(`Starting proxy on 0.0.0.0:${proxyPort}`);

// Iniciar React en puerto 3001
const reactServer = spawn('npx', ['react-scripts', 'start'], {
  env: {
    ...process.env,
    HOST: '127.0.0.1',
    PORT: reactPort,
    BROWSER: 'none'
  },
  stdio: 'inherit'
});

// Esperar un poco y luego iniciar el proxy
setTimeout(() => {
  const proxyServer = spawn('node', ['server.js'], {
    env: {
      ...process.env,
      PORT: proxyPort
    },
    stdio: 'inherit'
  });
}, 5000);