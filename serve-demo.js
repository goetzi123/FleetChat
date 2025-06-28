#!/usr/bin/env node

const http = require('http');
const fs = require('fs');

const PORT = process.env.PORT || 3000;

console.log('Starting FleetChat Demo Server...');

// Verify demo file exists
if (!fs.existsSync('index.html')) {
  console.error('Error: index.html not found');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  // CORS headers for Replit preview
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`Request: ${req.method} ${req.url}`);

  // Serve demo file
  if (req.url === '/' || req.url === '/index.html') {
    try {
      const html = fs.readFileSync('index.html', 'utf8');
      res.writeHead(200, { 
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      });
      res.end(html);
      console.log('Served demo successfully');
    } catch (error) {
      console.error('Error serving demo:', error.message);
      res.writeHead(500);
      res.end('Internal server error');
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ FleetChat Demo running on port ${PORT}`);
  console.log(`✓ Accessible via Replit preview`);
  console.log(`✓ Demo ready at root URL`);
});

server.on('error', (error) => {
  console.error('Server error:', error.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());