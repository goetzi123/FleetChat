const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Serve the demo
    if (req.url === '/' || req.url === '/index.html') {
        try {
            const html = fs.readFileSync('working-demo.html', 'utf8');
            res.writeHead(200, { 
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache'
            });
            res.end(html);
            console.log('✓ Served working-demo.html');
        } catch (error) {
            console.error('Error serving demo:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error: ' + error.message);
        }
    } else if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'live',
            service: 'FleetChat Demo (Testing)',
            timestamp: new Date().toISOString(),
            file: 'working-demo.html'
        }));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FleetChat Demo Test Server`);
    console.log(`📱 Running on port ${PORT}`);
    console.log(`📋 Serving: working-demo.html`);
    console.log(`🔗 Access: http://localhost:${PORT}`);
});

server.on('error', (error) => {
    console.error('Server error:', error);
});