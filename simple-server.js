const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('.'));
app.use(express.json());

// Main route
app.get('/', (req, res) => {
  try {
    const htmlContent = fs.readFileSync('index.html', 'utf8');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).send('Server Error');
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FleetChat demo running on port ${PORT}`);
  console.log(`Access at: http://localhost:${PORT}`);
});