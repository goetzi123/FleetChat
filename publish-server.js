const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('.'));

// Serve the public Fleet.Chat website at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'fleet-chat-public.html'));
});

// Alternative routes for the public site
app.get('/fleet.chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'fleet-chat-public.html'));
});

app.get('/public', (req, res) => {
  res.sendFile(path.join(__dirname, 'fleet-chat-public.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'operational',
    service: 'Fleet.Chat Public Website',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fleet.Chat public website server running on port ${PORT}`);
  console.log(`Website accessible at: http://localhost:${PORT}`);
});