const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Origin': '*'
  });
  res.end('FleetChat Demo Test - Server Running on Port 3000');
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Test server running on port 3000');
});

// Test connectivity
setTimeout(() => {
  const testReq = http.get('http://localhost:3000', (res) => {
    console.log('Local connectivity test: SUCCESS');
    console.log('Status:', res.statusCode);
  });
  
  testReq.on('error', (err) => {
    console.log('Local connectivity test: FAILED');
    console.log('Error:', err.message);
  });
}, 1000);