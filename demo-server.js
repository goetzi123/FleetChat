const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('.'));

// Serve the onboarding demo
app.get('/onboarding', (req, res) => {
    res.sendFile(path.join(__dirname, 'client-onboarding-demo.html'));
});

// Default route
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>FleetChat Demo System</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
                    .demo-link { display: block; padding: 15px; margin: 10px 0; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; text-align: center; }
                    .demo-link:hover { background: #1d4ed8; }
                </style>
            </head>
            <body>
                <h1>FleetChat Demo System</h1>
                <p>Comprehensive demonstration system for FleetChat communication protocol service.</p>
                
                <h2>Available Demonstrations:</h2>
                <a href="/onboarding" class="demo-link">Client Onboarding Process Demo</a>
                
                <h3>Demo Features:</h3>
                <ul>
                    <li>Interactive Samsara credential registration</li>
                    <li>Driver discovery and phone number mapping</li>
                    <li>Payment setup and billing configuration</li>
                    <li>Complete onboarding workflow demonstration</li>
                </ul>
                
                <p><strong>System Boundaries:</strong> All demos maintain FleetChat's strict boundaries as a pure bidirectional communication protocol service without fleet management functionality duplication.</p>
            </body>
        </html>
    `);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`FleetChat Demo Server running on port ${PORT}`);
    console.log(`Access onboarding demo at: http://localhost:${PORT}/onboarding`);
});