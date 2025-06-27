const http = require('http');
const fs = require('fs');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache'
  });
  
  try {
    const html = fs.readFileSync('index.html', 'utf8');
    res.end(html);
  } catch (error) {
    res.writeHead(500);
    res.end('Demo file not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`FleetChat Demo running on port ${PORT}`);
  console.log('Demo accessible at root URL');
});

process.on('SIGTERM', () => {
  console.log('Shutting down demo server');
  server.close();
});

module.exports = server;