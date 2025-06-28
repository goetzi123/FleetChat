const http = require('http');
const fs = require('fs');

console.log('Starting FleetChat demo server...');

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  if (req.url === '/' || req.url === '/index.html') {
    try {
      const html = fs.readFileSync('./demo.html', 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      console.log('Served demo.html successfully');
    } catch (error) {
      console.error('Error reading demo.html:', error);
      res.writeHead(500);
      res.end('Error loading demo');
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`FleetChat demo running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});