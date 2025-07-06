const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    console.log(new Date().toISOString(), req.method, req.url);
    
    res.setHeader('Cache-Control', 'no-cache');
    
    if (req.url === '/' || req.url === '/index.html') {
        const html = fs.readFileSync('clean-demo.html', 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
        console.log('✓ Served clean-demo.html');
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(3000, '0.0.0.0', () => {
    console.log('FleetChat Clean Demo running on port 3000');
});