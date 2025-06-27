const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Sample data for demo
const transports = [
  {
    id: 'T001',
    driverId: 'D001',
    status: 'EN_ROUTE',
    workflowType: 'FTL',
    pickupLocation: 'Hamburg Port',
    deliveryLocation: 'Munich Warehouse',
    loadReference: 'HAM-MUN-001',
    samsaraVehicleId: 'VEH_001',
    createdAt: new Date('2025-06-26T08:00:00Z'),
    updatedAt: new Date('2025-06-27T01:30:00Z')
  },
  {
    id: 'T002',
    driverId: 'D002',
    status: 'DELIVERED',
    workflowType: 'LTL',
    pickupLocation: 'Berlin Distribution',
    deliveryLocation: 'Cologne Terminal',
    loadReference: 'BER-COL-002',
    samsaraVehicleId: 'VEH_002',
    createdAt: new Date('2025-06-25T14:00:00Z'),
    updatedAt: new Date('2025-06-26T18:45:00Z')
  },
  {
    id: 'T003',
    driverId: 'D003',
    status: 'PENDING',
    workflowType: 'YARD',
    pickupLocation: 'Frankfurt Hub',
    deliveryLocation: 'Stuttgart Plant',
    loadReference: 'FRA-STU-003',
    samsaraVehicleId: 'VEH_003',
    createdAt: new Date('2025-06-27T02:00:00Z'),
    updatedAt: new Date('2025-06-27T02:00:00Z')
  }
];

const whatsappMessages = [
  {
    id: 'MSG001',
    transportId: 'T001',
    driverId: 'D001',
    message: 'Hello! You have a new transport from Hamburg Port to Munich Warehouse. Load reference: HAM-MUN-001. Please confirm when you start driving.',
    buttons: ['✅ Started Driving', '📍 Share Location', '❓ Need Help'],
    timestamp: new Date('2025-06-26T08:05:00Z'),
    status: 'delivered'
  },
  {
    id: 'MSG002',
    transportId: 'T002',
    driverId: 'D002',
    message: 'Transport BER-COL-002 completed successfully! Please upload your delivery documents.',
    buttons: ['📄 Upload POD', '✅ All Documents Sent', '📞 Call Dispatcher'],
    timestamp: new Date('2025-06-26T18:30:00Z'),
    status: 'delivered'
  }
];

const samsaraEvents = [
  {
    id: 'EVT001',
    vehicleId: 'VEH_001',
    eventType: 'location_update',
    data: { lat: 53.5511, lng: 9.9937, speed: 85, heading: 180 },
    timestamp: new Date('2025-06-27T01:45:00Z'),
    description: 'Vehicle location update - Hamburg to Munich route'
  },
  {
    id: 'EVT002',
    vehicleId: 'VEH_002',
    eventType: 'geofence_exit',
    data: { geofence: 'Cologne Terminal', lat: 50.9375, lng: 6.9603 },
    timestamp: new Date('2025-06-26T18:45:00Z'),
    description: 'Vehicle exited delivery geofence'
  },
  {
    id: 'EVT003',
    vehicleId: 'VEH_001',
    eventType: 'trip_started',
    data: { route: 'Hamburg-Munich', driver: 'Hans Mueller' },
    timestamp: new Date('2025-06-26T08:15:00Z'),
    description: 'Trip started from Hamburg Port'
  }
];

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FleetChat Demo - Transport Communication Platform</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 10px; margin-bottom: 2rem; }
            .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
            .header p { font-size: 1.2rem; opacity: 0.9; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
            .card { background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 1.5rem; border-left: 4px solid #667eea; }
            .card h3 { color: #667eea; margin-bottom: 1rem; }
            .api-list { background: #f8f9fa; padding: 1rem; border-radius: 5px; margin-top: 1rem; }
            .api-list h4 { margin-bottom: 0.5rem; }
            .api-list a { display: block; color: #667eea; text-decoration: none; padding: 0.25rem 0; }
            .api-list a:hover { text-decoration: underline; }
            .status { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 15px; font-size: 0.8rem; font-weight: bold; }
            .status.active { background: #e3f2fd; color: #1976d2; }
            .status.completed { background: #e8f5e8; color: #2e7d32; }
            .status.pending { background: #fff3e0; color: #f57c00; }
            .demo-data { background: #f5f5f5; padding: 1rem; border-radius: 5px; margin-top: 1rem; }
            .demo-data pre { font-size: 0.9rem; overflow-x: auto; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚛 FleetChat Demo</h1>
                <p>Transport Communication Platform - WhatsApp Integration & Samsara Fleet Management</p>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h3>📊 Dashboard Statistics</h3>
                    <p>Real-time transport and fleet metrics</p>
                    <div class="api-list">
                        <h4>Available Endpoints:</h4>
                        <a href="/api/dashboard/stats" target="_blank">GET /api/dashboard/stats</a>
                        <a href="/health" target="_blank">GET /health</a>
                    </div>
                </div>
                
                <div class="card">
                    <h3>🚚 Transport Management</h3>
                    <p>Active transport tracking and workflow management</p>
                    <div class="api-list">
                        <h4>Available Endpoints:</h4>
                        <a href="/api/transports" target="_blank">GET /api/transports</a>
                        <a href="/api/demo/overview" target="_blank">GET /api/demo/overview</a>
                    </div>
                </div>
                
                <div class="card">
                    <h3>💬 WhatsApp Integration</h3>
                    <p>Driver communication and workflow automation</p>
                    <div class="api-list">
                        <h4>Available Endpoints:</h4>
                        <a href="/api/demo/whatsapp-messages" target="_blank">GET /api/demo/whatsapp-messages</a>
                    </div>
                </div>
                
                <div class="card">
                    <h3>🛰️ Samsara Fleet Management</h3>
                    <p>Real-time vehicle tracking and fleet events</p>
                    <div class="api-list">
                        <h4>Available Endpoints:</h4>
                        <a href="/api/demo/samsara-events" target="_blank">GET /api/demo/samsara-events</a>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3>🎯 Demo Features</h3>
                <ul style="margin-left: 1.5rem;">
                    <li><strong>Transport Workflows:</strong> Hamburg-Munich, Berlin-Cologne, Frankfurt-Stuttgart routes</li>
                    <li><strong>WhatsApp Simulation:</strong> Driver response buttons and message templates</li>
                    <li><strong>Samsara Integration:</strong> Vehicle tracking, geofencing, and trip events</li>
                    <li><strong>Real-time Updates:</strong> Live transport status and location tracking</li>
                    <li><strong>Document Management:</strong> POD handling and digital signatures</li>
                </ul>
            </div>
        </div>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'FleetChat Demo Server'
  });
});

app.get('/api/dashboard/stats', (req, res) => {
  const stats = {
    totalTransports: transports.length,
    activeTransports: transports.filter(t => ['EN_ROUTE', 'PENDING'].includes(t.status)).length,
    completedTransports: transports.filter(t => t.status === 'DELIVERED').length,
    totalDrivers: 3,
    totalDispatchers: 2,
    pendingDocuments: 1,
    transportsByStatus: {
      pending: transports.filter(t => t.status === 'PENDING').length,
      enRoute: transports.filter(t => t.status === 'EN_ROUTE').length,
      delivered: transports.filter(t => t.status === 'DELIVERED').length,
      completed: 0
    },
    lastUpdated: new Date().toISOString()
  };
  res.json(stats);
});

app.get('/api/transports', (req, res) => {
  res.json(transports);
});

app.get('/api/demo/whatsapp-messages', (req, res) => {
  res.json(whatsappMessages);
});

app.get('/api/demo/samsara-events', (req, res) => {
  res.json(samsaraEvents);
});

app.get('/api/demo/overview', (req, res) => {
  res.json({
    transports,
    whatsappMessages,
    samsaraEvents,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FleetChat Demo Server running on port ${PORT}`);
  console.log(`Access the demo at: http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET /health');
  console.log('- GET /api/dashboard/stats');
  console.log('- GET /api/transports');
  console.log('- GET /api/demo/whatsapp-messages');
  console.log('- GET /api/demo/samsara-events');
  console.log('- GET /api/demo/overview');
});