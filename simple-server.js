const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Access-Control-Allow-Origin': '*'
  });
  
  if (req.url === '/') {
    const html = fs.readFileSync('index.html', 'utf8');
    res.end(html);
  } else {
    res.end('FleetChat Demo Server Running');
  }
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Demo accessible on port 3000');
});