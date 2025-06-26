const { spawn } = require('child_process');
const path = require('path');

console.log('Starting FleetChat application...');

// Start the backend server
const server = spawn('tsx', ['server/index.ts'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Keep the process running
process.on('SIGINT', () => {
  console.log('Shutting down FleetChat...');
  server.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down FleetChat...');
  server.kill();
  process.exit(0);
});