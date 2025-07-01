const express = require('express');
const path = require('path');
const app = express();

// Serve static files
app.use(express.static(__dirname));

// Redirect root to demo
app.get('/', (req, res) => {
  res.redirect('/demo');
});

// Serve the demo HTML file
app.get('/demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'demo.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fleet.Chat Demo Server running on port ${PORT}`);
});