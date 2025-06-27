const { spawn } = require('child_process');
const http = require('http');

// Start the demo server
const server = spawn('node', ['demo-server.js'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: false
});

server.stdout.on('data', (data) => {
  console.log(data.toString());
});

server.stderr.on('data', (data) => {
  console.error(data.toString());
});

// Keep the process alive
process.on('SIGINT', () => {
  server.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  server.kill();
  process.exit();
});

// Health check after startup
setTimeout(() => {
  const req = http.request('http://localhost:3000/health', (res) => {
    console.log('Server health check:', res.statusCode);
  });
  req.on('error', (err) => {
    console.log('Health check failed:', err.message);
  });
  req.end();
}, 2000);