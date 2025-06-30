const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Only serve the public Fleet.Chat website
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'fleet-chat-public.html'));
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
  res.sendFile(path.join(__dirname, 'fleet-chat-public.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fleet.Chat website live on port ${PORT}`);
});