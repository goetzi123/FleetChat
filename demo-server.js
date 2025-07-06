const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('.'));

// Main demo route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'demo.html'));
});

// Demo health check
app.get('/health', (req, res) => {
  res.json({
    status: 'live',
    service: 'FleetChat Demo',
    timestamp: new Date().toISOString(),
    features: [
      'Bidirectional Communication',
      'Real-time Event Processing',
      'WhatsApp Message Simulation',
      'Samsara Integration Demo'
    ]
  });
});

// API endpoint for demo statistics (optional future use)
app.get('/api/demo/stats', (req, res) => {
  res.json({
    eventsSupported: 6,
    responseTypes: 18,
    avgResponseTime: '2-3 seconds',
    driverAdoption: '95%+',
    automationRate: '70%'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FleetChat Demo server running on port ${PORT}`);
  console.log(`Demo available at: http://localhost:${PORT}`);
  console.log('Features:');
  console.log('  ✓ Samsara Event Simulation');
  console.log('  ✓ WhatsApp Message Interface');
  console.log('  ✓ Bidirectional Communication Flow');
  console.log('  ✓ Real-time Status Updates');
});