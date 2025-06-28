const http = require('http');
const fs = require('fs');

const PORT = process.env.PORT || 3000;

console.log('Starting FleetChat Demo Server...');

// Verify demo file exists
if (!fs.existsSync('index.html')) {
  console.error('Error: index.html not found');
  process.exit(1);
}

console.log('Demo file verified');

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Set CORS headers for Replit preview
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve demo at root
  if (req.url === '/' || req.url === '/index.html') {
    try {
      const html = fs.readFileSync('index.html', 'utf8');
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(html);
      console.log('Demo served successfully');
    } catch (error) {
      console.error('Error serving demo:', error.message);
      res.writeHead(500);
      res.end('Error loading demo: ' + error.message);
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.on('error', (error) => {
  console.error('Server error:', error.message);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ FleetChat Demo Server running on port ${PORT}`);
  console.log(`✓ Server bound to 0.0.0.0:${PORT}`);
  console.log(`✓ Ready for Replit preview access`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});