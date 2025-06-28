#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/' || req.url === '/index.html') {
    try {
      const demoPath = path.join(__dirname, 'demo.html');
      const html = fs.readFileSync(demoPath, 'utf8');
      res.writeHead(200, { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(html);
      console.log('✓ Served FleetChat demo successfully');
    } catch (error) {
      console.error('Error serving demo:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading FleetChat demo: ' + error.message);
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 FleetChat Samsara-WhatsApp Demo`);
  console.log(`📱 Server running on http://localhost:${PORT}`);
  console.log(`⏰ Started at ${new Date().toISOString()}`);
  console.log(`📋 Demo shows Samsara fleet events → WhatsApp messages`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

// Keep alive
setInterval(() => {
  console.log(`💓 FleetChat demo running - ${new Date().toLocaleTimeString()}`);
}, 30000);

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down FleetChat demo...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down FleetChat demo...');
  server.close(() => {
    process.exit(0);
  });
});