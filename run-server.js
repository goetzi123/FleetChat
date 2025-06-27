const { spawn } = require('child_process');

console.log('Starting FleetChat server...');

// Kill any existing processes
const killExisting = spawn('pkill', ['-f', 'tsx server/index.ts'], { stdio: 'pipe' });
killExisting.on('exit', () => {
  // Start the server with proper environment
  const server = spawn('node', ['node_modules/.bin/tsx', 'server/index.ts'], {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'development' }
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
  });

  server.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
  });

  // Keep process alive
  process.on('SIGINT', () => {
    server.kill();
    process.exit(0);
  });
});