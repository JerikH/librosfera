const { spawn } = require('child_process');

const reactPort = 3001;
const proxyPort = process.env.PORT || 3000;

console.log(`Starting React dev server on port ${reactPort}`);

// Iniciar React en puerto 3001
const reactServer = spawn('npx', ['react-scripts', 'start'], {
  env: {
    ...process.env,
    HOST: '127.0.0.1',
    PORT: reactPort,
    BROWSER: 'none',
    DANGEROUSLY_DISABLE_HOST_CHECK: 'true'
  },
  stdio: 'pipe'
});

// Escuchar cuando React esté listo
let reactReady = false;

reactServer.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('React:', output);
  
  // Cuando React dice que está listo, iniciar el proxy
  if (output.includes('webpack compiled') || output.includes('Compiled successfully')) {
    if (!reactReady) {
      reactReady = true;
      console.log('React is ready! Starting proxy...');
      startProxy();
    }
  }
});

reactServer.stderr.on('data', (data) => {
  console.error('React Error:', data.toString());
});

function startProxy() {
  console.log(`Starting proxy on 0.0.0.0:${proxyPort}`);
  
  const proxyServer = spawn('node', ['server.js'], {
    env: {
      ...process.env,
      PORT: proxyPort
    },
    stdio: 'inherit'
  });
  
  proxyServer.on('error', (err) => {
    console.error('Proxy error:', err);
  });
}

// Fallback: si no detecta que React está listo en 60 segundos, iniciar proxy anyway
setTimeout(() => {
  if (!reactReady) {
    console.log('Timeout reached, starting proxy anyway...');
    startProxy();
  }
}, 60000);