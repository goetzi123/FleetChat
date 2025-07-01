const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.redirect('/demo');
});

app.get('/demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'working-demo.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fleet.Chat Working Demo Server running on port ${PORT}`);
});