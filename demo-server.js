const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Set CORS headers for demo
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let filePath = '';
  
  if (req.url === '/' || req.url === '/demo') {
    filePath = path.join(__dirname, 'demo', 'whatsapp-driver-interface.html');
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'running', 
      demo: 'FleetChat WhatsApp Interface Demo',
      timestamp: new Date().toISOString() 
    }));
    return;
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Demo not found. Access the demo at the root URL /');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading demo file');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`FleetChat Demo running on port ${PORT}`);
  console.log(`Access demo at: http://localhost:${PORT}`);
});

module.exports = server;