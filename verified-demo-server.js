const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

console.log('Starting FleetChat Demo Server...');

const server = http.createServer((req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.url}`);
    
    // Set proper headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.url === '/' || req.url === '/index.html') {
        try {
            const demoFile = path.join(__dirname, 'final-working-demo.html');
            const html = fs.readFileSync(demoFile, 'utf8');
            
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
            console.log(`✓ Served final-working-demo.html successfully`);
            
        } catch (error) {
            console.error(`✗ Error serving demo:`, error.message);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Server Error: ' + error.message);
        }
    } 
    else if (req.url === '/health') {
        const healthData = {
            status: 'operational',
            service: 'FleetChat Demo - Verified Working',
            timestamp: new Date().toISOString(),
            file: 'final-working-demo.html',
            events: ['route', 'pickup', 'arrival', 'document', 'hos', 'geofence'],
            port: PORT
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(healthData, null, 2));
        console.log('✓ Health check requested');
    }
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        console.log(`✗ 404 - ${req.url}`);
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('🚀 FleetChat Demo Server RUNNING');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📋 File: final-working-demo.html`);
    console.log(`⚡ Status: Ready for testing`);
    console.log('');
    console.log('Events available:');
    console.log('  • Route Assignment');
    console.log('  • Pickup Reminder');
    console.log('  • Arrival Notification');
    console.log('  • Document Request');
    console.log('  • HOS Warning');
    console.log('  • Geofence Entry');
    console.log('');
});

server.on('error', (error) => {
    console.error('Server Error:', error);
});

process.on('SIGINT', () => {
    console.log('\nShutting down FleetChat Demo Server...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});