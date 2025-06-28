const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from current directory
app.use(express.static(__dirname));

// Main route - serve the demo
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'running',
    service: 'FleetChat Demo',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`FleetChat demo server running on port ${PORT}`);
});