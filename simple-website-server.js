const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, 'fleet.chat');
  
  // Handle root path
  if (req.url === '/' || req.url === '') {
    filePath = path.join(filePath, 'index.html');
  } else if (req.url === '/privacy') {
    filePath = path.join(filePath, 'privacy.html');
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'live',
      service: 'Fleet.Chat Website',
      timestamp: new Date().toISOString()
    }));
    return;
  } else {
    // For other files (like the logo), serve them from fleet.chat directory
    filePath = path.join(filePath, req.url);
  }

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File doesn't exist, serve index.html (SPA behavior)
      filePath = path.join(__dirname, 'fleet.chat', 'index.html');
    }
    
    // Read and serve the file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
        return;
      }
      
      // Set content type based on file extension
      const ext = path.extname(filePath).toLowerCase();
      const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
      }[ext] || 'text/plain';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Fleet.Chat website live on port ${PORT}`);
});