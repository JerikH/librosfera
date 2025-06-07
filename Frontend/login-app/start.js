const { spawn } = require('child_process');

const port = process.env.PORT || 3000;
const host = '0.0.0.0';

console.log(`Starting dev server on ${host}:${port}`);

const child = spawn('npx', ['react-scripts', 'start'], {
  env: {
    ...process.env,
    HOST: host,
    PORT: port,
    DANGEROUSLY_DISABLE_HOST_CHECK: 'true',
    BROWSER: 'none'
  },
  stdio: 'inherit'
});

child.on('close', (code) => {
  process.exit(code);
});