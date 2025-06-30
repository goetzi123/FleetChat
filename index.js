const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve the dynamic Fleet.Chat website with real-time pricing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'fleet-chat-dynamic.html'));
});

app.get('/public', (req, res) => {
  res.sendFile(path.join(__dirname, 'fleet-chat-dynamic.html'));
});

app.get('/fleet.chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'fleet-chat-dynamic.html'));
});

// Serve Privacy Policy page
app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy-policy.html'));
});

// Serve static version for comparison
app.get('/static', (req, res) => {
  res.sendFile(path.join(__dirname, 'fleet-chat-public.html'));
});

// Public pricing API endpoint - simple fallback for static deployment
app.get('/api/pricing', (req, res) => {
  res.json({
    success: true,
    pricing: [
      {
        name: "Starter",
        description: "Perfect for small fleets getting started",
        pricePerDriver: 15,
        minDrivers: 1,
        maxDrivers: 50,
        features: [
          "WhatsApp messaging",
          "Basic document handling", 
          "Transport tracking",
          "Standard support"
        ],
        isActive: true
      },
      {
        name: "Professional", 
        description: "Ideal for growing fleet operations",
        pricePerDriver: 25,
        minDrivers: 1,
        maxDrivers: 200,
        features: [
          "All Starter features",
          "Advanced analytics",
          "Custom workflows", 
          "Priority support",
          "24/7 support"
        ],
        isActive: true
      },
      {
        name: "Enterprise",
        description: "Complete solution for large operations", 
        pricePerDriver: 35,
        minDrivers: 1,
        maxDrivers: null,
        features: [
          "All Professional features",
          "Multi-fleet management",
          "Dedicated account manager",
          "Custom integrations",
          "SLA guarantees"
        ],
        isActive: true
      }
    ],
    lastUpdated: new Date().toISOString()
  });
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
  res.sendFile(path.join(__dirname, 'fleet-chat-dynamic.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fleet.Chat website live on port ${PORT}`);
});