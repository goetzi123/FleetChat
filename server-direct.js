// Direct server runner for FleetChat preview
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic dashboard stats endpoint
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    totalTransports: 3,
    activeTransports: 2,
    completedTransports: 1,
    totalDrivers: 3,
    totalDispatchers: 2,
    pendingDocuments: 1,
    transportsByStatus: {
      pending: 1,
      enRoute: 1,
      delivered: 1,
      completed: 1
    }
  });
});

// Basic transports endpoint
app.get('/api/transports', (req, res) => {
  res.json([
    {
      id: 'transport_1',
      status: 'EN_ROUTE',
      workflowType: 'FTL',
      pickupLocation: 'Hamburg',
      deliveryLocation: 'Munich',
      driverId: 'driver_abc123',
      dispatcherId: 'dispatcher_1',
      isActive: true,
      createdAt: new Date('2025-06-27T00:00:00Z'),
      updatedAt: new Date('2025-06-27T01:00:00Z')
    },
    {
      id: 'transport_2', 
      status: 'DELIVERED',
      workflowType: 'LTL',
      pickupLocation: 'Berlin',
      deliveryLocation: 'Cologne',
      driverId: 'driver_def456',
      dispatcherId: 'dispatcher_2',
      isActive: true,
      createdAt: new Date('2025-06-26T12:00:00Z'),
      updatedAt: new Date('2025-06-27T00:30:00Z')
    }
  ]);
});

// Demo endpoints for WhatsApp integration
app.get('/api/demo/whatsapp-messages', (req, res) => {
  res.json([
    {
      id: 'msg_1',
      transportId: 'transport_1',
      type: 'template',
      content: 'Hi! You have a new transport assignment: Hamburg → Munich. Please confirm when you start your journey.',
      buttons: ['✅ Started', '📍 Share Location', '❌ Issue'],
      timestamp: new Date('2025-06-27T08:00:00Z')
    }
  ]);
});

// Serve static files
app.use(express.static(path.join(__dirname, 'client/dist')));

// Fallback for SPA routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`FleetChat demo server running on port ${port}`);
});