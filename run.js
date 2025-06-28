const http = require('http');
const fs = require('fs');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Set CORS headers for Replit preview
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/' || req.url === '/index.html') {
    try {
      const html = fs.readFileSync('index.html', 'utf8');
      res.writeHead(200, { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(html);
      console.log('Served FleetChat demo successfully');
    } catch (error) {
      console.error('Error reading index.html:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error: Could not load demo');
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Page not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 FleetChat Demo Server Started Successfully`);
  console.log(`📱 Server running at: http://localhost:${PORT}`);
  console.log(`🌐 Preview should be available in Replit's preview panel`);
  console.log(`⚡ Ready to demonstrate Samsara-WhatsApp integration\n`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is busy, trying another port...`);
    setTimeout(() => {
      server.listen(PORT + 1, '0.0.0.0');
    }, 1000);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down FleetChat demo server...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});