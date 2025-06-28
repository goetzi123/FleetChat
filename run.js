const http = require('http');
const fs = require('fs');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Set CORS headers for Replit preview access
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
        'Cache-Control': 'no-cache'
      });
      res.end(html);
    } catch (error) {
      res.writeHead(500);
      res.end('Error loading demo');
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`FleetChat Demo running on port ${PORT}`);
});