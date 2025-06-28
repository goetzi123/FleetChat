const http = require('http');
const fs = require('fs');

const PORT = 3000;

const server = http.createServer((req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url;
  
  if (url === '/index.html') {
    const html = fs.readFileSync('demo.html', 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`FleetChat demo server running on port ${PORT}`);
});