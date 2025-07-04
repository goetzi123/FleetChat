const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

console.log('🚀 Starting Fleet.Chat deployment server...');

const server = http.createServer((req, res) => {
  console.log(`📡 Request: ${req.method} ${req.url}`);
  
  let filePath = path.join(__dirname, 'fleet.chat');
  
  // Route handling
  if (req.url === '/' || req.url === '') {
    filePath = path.join(filePath, 'index.html');
  } else if (req.url === '/privacy') {
    filePath = path.join(filePath, 'privacy.html');
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'live',
      service: 'Fleet.Chat Website',
      timestamp: new Date().toISOString(),
      logo: 'integrated-3rem-sizing',
      version: '2.0-with-logo'
    }));
    return;
  } else {
    // Serve static files (logo, etc.)
    filePath = path.join(filePath, req.url);
  }

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.log(`❌ File not found: ${filePath}`);
      // File doesn't exist, serve index.html
      filePath = path.join(__dirname, 'fleet.chat', 'index.html');
    }
    
    // Read and serve file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.log(`❌ Error reading file: ${err.message}`);
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
        return;
      }
      
      // Set content type
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
      
      console.log(`✅ Serving: ${path.basename(filePath)} (${contentType})`);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Fleet.Chat website live on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log(`🖼️ Logo: FleetChat professional logo (3rem sizing)`);
  console.log(`📏 Size: Matches "Get Started" button proportions`);
});

// Check logo file exists
const logoPath = path.join(__dirname, 'fleet.chat', 'fleetchat-logo.png');
fs.access(logoPath, fs.constants.F_OK, (err) => {
  if (err) {
    console.log('❌ Logo file missing');
  } else {
    console.log('✅ Logo file verified');
  }
});