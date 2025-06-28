const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  if (req.url === '/' || req.url === '/index.html') {
    try {
      const html = fs.readFileSync('./index.html', 'utf8');
      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Content-Length': Buffer.byteLength(html)
      });
      res.end(html);
      console.log('HTML served successfully');
    } catch (error) {
      console.error('Error:', error);
      res.writeHead(500);
      res.end('Error loading page');
    }
  } else if (req.url === '/health') {
    const response = JSON.stringify({ status: 'ok' });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(response);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Server running on port 3000');
});