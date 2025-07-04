const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from fleet.chat directory
app.use(express.static(path.join(__dirname, 'fleet.chat')));

// Serve the Fleet.Chat website
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'fleet.chat', 'index.html'));
});

// Serve privacy policy
app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'fleet.chat', 'privacy.html'));
});

// Health check for deployment
app.get('/health', (req, res) => {
  res.json({ 
    status: 'live',
    service: 'Fleet.Chat Website',
    timestamp: new Date().toISOString()
  });
});

// Catch all other routes and redirect to homepage
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'fleet.chat', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fleet.Chat website live on port ${PORT}`);
});