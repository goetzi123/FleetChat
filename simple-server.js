const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (path === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString() 
    }));
  } else if (path === '/api/dashboard/stats') {
    res.writeHead(200);
    res.end(JSON.stringify({
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
    }));
  } else if (path === '/api/transports') {
    res.writeHead(200);
    res.end(JSON.stringify([
      {
        id: 'transport_1',
        status: 'EN_ROUTE',
        workflowType: 'FTL',
        pickupLocation: 'Hamburg',
        deliveryLocation: 'Munich',
        driverId: 'driver_abc123',
        dispatcherId: 'dispatcher_1',
        isActive: true,
        createdAt: '2025-06-27T00:00:00Z',
        updatedAt: '2025-06-27T01:00:00Z'
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
        createdAt: '2025-06-26T12:00:00Z',
        updatedAt: '2025-06-27T00:30:00Z'
      },
      {
        id: 'transport_3',
        status: 'PENDING',
        workflowType: 'FTL',
        pickupLocation: 'Frankfurt',
        deliveryLocation: 'Stuttgart',
        driverId: 'driver_ghi789',
        dispatcherId: 'dispatcher_1',
        isActive: true,
        createdAt: '2025-06-27T02:00:00Z',
        updatedAt: '2025-06-27T02:00:00Z'
      }
    ]));
  } else if (path === '/api/demo/whatsapp-messages') {
    res.writeHead(200);
    res.end(JSON.stringify([
      {
        id: 'msg_1',
        transportId: 'transport_1',
        type: 'template',
        content: 'Hi! You have a new transport assignment: Hamburg → Munich. Please confirm when you start your journey.',
        buttons: ['✅ Started', '📍 Share Location', '❌ Issue'],
        timestamp: '2025-06-27T08:00:00Z'
      }
    ]));
  } else if (path === '/api/demo/samsara-events') {
    res.writeHead(200);
    res.end(JSON.stringify([
      {
        id: 'event_1',
        type: 'vehicle_location',
        vehicleId: 'veh_123',
        timestamp: '2025-06-27T09:15:00Z',
        data: {
          lat: 53.5511,
          lng: 9.9937,
          speed: 65,
          location: 'A7 near Hamburg'
        }
      },
      {
        id: 'event_2',
        type: 'geofence_enter',
        vehicleId: 'veh_456',
        timestamp: '2025-06-27T10:30:00Z',
        data: {
          geofence: 'Munich Delivery Zone',
          lat: 48.1351,
          lng: 11.5820
        }
      }
    ]));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`FleetChat demo server running on port ${PORT}`);
});