const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Serve static files from demo directory
app.use('/demo', express.static(path.join(__dirname, 'demo')));

// Serve the main demo page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'demo', 'whatsapp-driver-interface.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Demo server running', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Demo server running on port ${PORT}`);
  console.log(`Access the demo at: http://localhost:${PORT}`);
});