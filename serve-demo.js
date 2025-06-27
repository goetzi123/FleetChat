const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

// Serve static files from demo directory
app.use('/demo', express.static(path.join(__dirname, 'demo')));

// Serve the main demo page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'demo', 'whatsapp-driver-interface.html'));
});

app.listen(PORT, () => {
  console.log(`Demo server running at http://localhost:${PORT}`);
  console.log('Access the WhatsApp demo interface at: http://localhost:8080');
});