const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Demo data for FleetChat platform
const demoData = {
  transports: [
    {
      id: 'transport_1',
      status: 'EN_ROUTE',
      workflowType: 'FTL',
      pickupLocation: 'Hamburg',
      deliveryLocation: 'Munich',
      driverId: 'driver_abc123',
      dispatcherId: 'dispatcher_1',
      pickupEta: '2025-06-27T08:00:00Z',
      deliveryEta: '2025-06-27T14:00:00Z',
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
      pickupEta: '2025-06-26T10:00:00Z',
      deliveryEta: '2025-06-26T16:00:00Z',
      isActive: false,
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
      pickupEta: '2025-06-27T12:00:00Z',
      deliveryEta: '2025-06-27T18:00:00Z',
      isActive: true,
      createdAt: '2025-06-27T02:00:00Z',
      updatedAt: '2025-06-27T02:00:00Z'
    }
  ],
  whatsappMessages: [
    {
      id: 'msg_1',
      transportId: 'transport_1',
      type: 'template',
      content: 'Hi! You have a new transport assignment: Hamburg → Munich. Please confirm when you start your journey.',
      buttons: ['✅ Started', '📍 Share Location', '❌ Issue'],
      timestamp: '2025-06-27T08:00:00Z',
      status: 'sent'
    },
    {
      id: 'msg_2',
      transportId: 'transport_2',
      type: 'status_update',
      content: 'Great! Your delivery to Cologne has been confirmed. Please upload the delivery receipt.',
      buttons: ['📄 Upload POD', '✅ Complete', '❓ Help'],
      timestamp: '2025-06-26T16:30:00Z',
      status: 'delivered'
    }
  ],
  samsaraEvents: [
    {
      id: 'event_1',
      type: 'vehicle_location',
      vehicleId: 'veh_123',
      transportId: 'transport_1',
      timestamp: '2025-06-27T09:15:00Z',
      data: {
        lat: 53.5511,
        lng: 9.9937,
        speed: 65,
        location: 'A7 Highway near Hamburg',
        heading: 180
      }
    },
    {
      id: 'event_2',
      type: 'geofence_enter',
      vehicleId: 'veh_456',
      transportId: 'transport_2',
      timestamp: '2025-06-27T10:30:00Z',
      data: {
        geofence: 'Munich Delivery Zone',
        lat: 48.1351,
        lng: 11.5820,
        geofenceType: 'delivery'
      }
    },
    {
      id: 'event_3',
      type: 'document_uploaded',
      vehicleId: 'veh_456',
      transportId: 'transport_2',
      timestamp: '2025-06-27T11:00:00Z',
      data: {
        documentType: 'POD',
        filename: 'delivery_receipt_cologne.pdf',
        uploadedBy: 'driver_def456'
      }
    }
  ]
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  res.setHeader('Content-Type', 'application/json');

  // API Routes
  if (pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'FleetChat Demo Server'
    }));
  } 
  else if (pathname === '/api/dashboard/stats') {
    const stats = {
      totalTransports: demoData.transports.length,
      activeTransports: demoData.transports.filter(t => t.isActive).length,
      completedTransports: demoData.transports.filter(t => t.status === 'DELIVERED').length,
      totalDrivers: 3,
      totalDispatchers: 2,
      pendingDocuments: 1,
      transportsByStatus: {
        pending: demoData.transports.filter(t => t.status === 'PENDING').length,
        enRoute: demoData.transports.filter(t => t.status === 'EN_ROUTE').length,
        delivered: demoData.transports.filter(t => t.status === 'DELIVERED').length,
        completed: demoData.transports.filter(t => t.status === 'COMPLETED').length
      },
      lastUpdated: new Date().toISOString()
    };
    res.writeHead(200);
    res.end(JSON.stringify(stats));
  }
  else if (pathname === '/api/transports') {
    res.writeHead(200);
    res.end(JSON.stringify(demoData.transports));
  }
  else if (pathname === '/api/demo/whatsapp-messages') {
    res.writeHead(200);
    res.end(JSON.stringify(demoData.whatsappMessages));
  }
  else if (pathname === '/api/demo/samsara-events') {
    res.writeHead(200);
    res.end(JSON.stringify(demoData.samsaraEvents));
  }
  else if (pathname === '/api/demo/overview') {
    const overview = {
      platform: 'FleetChat - Transport Communication Platform',
      features: [
        'WhatsApp Business API Integration',
        'Samsara Fleet Management Integration', 
        'GDPR-Compliant Driver Anonymization',
        'Real-time Transport Tracking',
        'Document Management with Digital Signatures',
        'Geofencing and ETA Calculations'
      ],
      currentDemo: {
        activeTransports: demoData.transports.filter(t => t.isActive).length,
        whatsappMessages: demoData.whatsappMessages.length,
        samsaraEvents: demoData.samsaraEvents.length,
        status: 'Running in demo mode'
      },
      timestamp: new Date().toISOString()
    };
    res.writeHead(200);
    res.end(JSON.stringify(overview));
  }
  else if (pathname.startsWith('/api/demo/whatsapp/response')) {
    // Simulate WhatsApp response handling
    const response = {
      success: true,
      message: 'WhatsApp response processed successfully',
      updatedTransport: demoData.transports[0],
      timestamp: new Date().toISOString()
    };
    res.writeHead(200);
    res.end(JSON.stringify(response));
  }
  else if (pathname === '/') {
    // Serve demo interface
    const demoHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FleetChat Demo - Transport Communication Platform</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .demo-section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-en-route { background: #dbeafe; color: #1e40af; }
        .status-delivered { background: #d1fae5; color: #065f46; }
        .whatsapp-message { background: #e7f5e7; padding: 15px; border-radius: 15px; margin: 10px 0; border-left: 4px solid #25d366; }
        .samsara-event { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #0ea5e9; }
        .demo-button { background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
        .demo-button:hover { background: #1d4ed8; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .api-endpoint { background: #f8fafc; padding: 10px; border-radius: 4px; font-family: monospace; margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>FleetChat Demo Platform</h1>
            <p>Comprehensive Transport Communication System with WhatsApp & Samsara Integration</p>
        </div>
        
        <div class="grid">
            <div class="demo-section">
                <h2>🚛 Active Transports</h2>
                <div id="transports-list">Loading...</div>
            </div>
            
            <div class="demo-section">
                <h2>💬 WhatsApp Workflow</h2>
                <div id="whatsapp-messages">Loading...</div>
                <button class="demo-button" onclick="simulateWhatsAppResponse()">Simulate Driver Response</button>
            </div>
            
            <div class="demo-section">
                <h2>🔗 Samsara Events</h2>
                <div id="samsara-events">Loading...</div>
            </div>
        </div>
        
        <div class="demo-section">
            <h2>📊 Dashboard Statistics</h2>
            <div id="dashboard-stats">Loading...</div>
        </div>
        
        <div class="demo-section">
            <h2>🔌 API Endpoints</h2>
            <div class="api-endpoint">GET /api/dashboard/stats</div>
            <div class="api-endpoint">GET /api/transports</div>
            <div class="api-endpoint">GET /api/demo/whatsapp-messages</div>
            <div class="api-endpoint">GET /api/demo/samsara-events</div>
            <div class="api-endpoint">GET /api/demo/overview</div>
        </div>
    </div>
    
    <script>
        async function loadDemoData() {
            try {
                // Load transports
                const transports = await fetch('/api/transports').then(r => r.json());
                document.getElementById('transports-list').innerHTML = transports.map(t => 
                    \`<div style="margin: 10px 0; padding: 10px; border: 1px solid #e5e7eb; border-radius: 5px;">
                        <strong>\${t.pickupLocation} → \${t.deliveryLocation}</strong>
                        <span class="status-badge status-\${t.status.toLowerCase().replace('_', '-')}">\${t.status}</span>
                        <br><small>Driver: \${t.driverId} | Type: \${t.workflowType}</small>
                    </div>\`
                ).join('');
                
                // Load WhatsApp messages
                const messages = await fetch('/api/demo/whatsapp-messages').then(r => r.json());
                document.getElementById('whatsapp-messages').innerHTML = messages.map(m =>
                    \`<div class="whatsapp-message">
                        <div>\${m.content}</div>
                        <div style="margin-top: 10px;">
                            \${m.buttons.map(b => \`<button class="demo-button" style="font-size: 12px; padding: 5px 10px;">\${b}</button>\`).join('')}
                        </div>
                    </div>\`
                ).join('');
                
                // Load Samsara events
                const events = await fetch('/api/demo/samsara-events').then(r => r.json());
                document.getElementById('samsara-events').innerHTML = events.map(e =>
                    \`<div class="samsara-event">
                        <strong>\${e.type.replace('_', ' ').toUpperCase()}</strong><br>
                        <small>\${e.timestamp}</small><br>
                        \${Object.entries(e.data).map(([k,v]) => \`\${k}: \${v}\`).join(' | ')}
                    </div>\`
                ).join('');
                
                // Load dashboard stats
                const stats = await fetch('/api/dashboard/stats').then(r => r.json());
                document.getElementById('dashboard-stats').innerHTML = \`
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                        <div style="text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
                            <div style="font-size: 24px; font-weight: bold; color: #2563eb;">\${stats.totalTransports}</div>
                            <div>Total Transports</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
                            <div style="font-size: 24px; font-weight: bold; color: #059669;">\${stats.activeTransports}</div>
                            <div>Active Transports</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
                            <div style="font-size: 24px; font-weight: bold; color: #dc2626;">\${stats.totalDrivers}</div>
                            <div>Total Drivers</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
                            <div style="font-size: 24px; font-weight: bold; color: #7c3aed;">\${stats.pendingDocuments}</div>
                            <div>Pending Documents</div>
                        </div>
                    </div>
                \`;
                
            } catch (error) {
                console.error('Error loading demo data:', error);
            }
        }
        
        async function simulateWhatsAppResponse() {
            try {
                const response = await fetch('/api/demo/whatsapp/response', { method: 'POST' });
                const result = await response.json();
                alert('WhatsApp response simulated successfully! Transport status updated.');
                loadDemoData(); // Refresh data
            } catch (error) {
                console.error('Error simulating WhatsApp response:', error);
            }
        }
        
        // Load demo data on page load
        loadDemoData();
        
        // Refresh data every 30 seconds
        setInterval(loadDemoData, 30000);
    </script>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(demoHtml);
  }
  else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  }
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`FleetChat demo server running on port ${PORT}`);
  console.log(`Access the demo at: http://localhost:${PORT}`);
  console.log('API endpoints available:');
  console.log('- GET /health');
  console.log('- GET /api/dashboard/stats');
  console.log('- GET /api/transports');
  console.log('- GET /api/demo/whatsapp-messages');
  console.log('- GET /api/demo/samsara-events');
  console.log('- GET /api/demo/overview');
});