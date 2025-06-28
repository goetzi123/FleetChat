const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  if (req.url === '/' || req.url === '/index.html') {
    try {
      const html = fs.readFileSync('index.html', 'utf8');
      res.writeHead(200, { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      });
      res.end(html);
      console.log('Served FleetChat demo');
    } catch (error) {
      console.error('Error:', error);
      res.writeHead(500);
      res.end('Server error');
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`FleetChat demo server running on port ${PORT}`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});