#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');

console.log('FleetChat Demo: Samsara Events → WhatsApp Messages');
console.log('=================================================\n');

// Start message broker
console.log('Starting message broker service...');
const broker = spawn('npx', ['tsx', 'server/message-broker.ts'], {
  stdio: ['ignore', 'pipe', 'pipe']
});

broker.stdout.on('data', (data) => {
  console.log(`[Broker] ${data.toString().trim()}`);
});

broker.stderr.on('data', (data) => {
  console.error(`[Error] ${data.toString().trim()}`);
});

// Wait for broker to start, then demonstrate event processing
setTimeout(() => {
  console.log('\nTesting Samsara event translation...\n');
  
  // Simulate route assignment event
  const routeEvent = {
    eventType: 'route.assigned',
    timestamp: new Date().toISOString(),
    data: {
      routeId: 'route_abc123',
      driverId: 'driver_67890',
      vehicleId: 'vehicle_002',
      route: {
        name: 'Hamburg Port Terminal → BMW Plant Munich',
        stops: [
          {
            type: 'pickup',
            location: 'Hamburg Port Terminal',
            address: 'Waltershof, 20457 Hamburg',
            scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
          },
          {
            type: 'delivery',
            location: 'BMW Plant Munich',
            address: 'Petuelring 130, 80809 München',
            scheduledTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
          }
        ]
      }
    }
  };

  // Send to broker
  const postData = JSON.stringify(routeEvent);
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/webhook/samsara',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('✓ Route assignment event processed');
      console.log('Response:', data);
      
      setTimeout(() => {
        console.log('\nDemo Instructions:');
        console.log('1. Open demo/whatsapp-driver-interface.html in your browser');
        console.log('2. Click "Route Assignment" button to see the translated message');
        console.log('3. Try other event types to see different message formats');
        console.log('4. Click message buttons to simulate driver responses');
        console.log('\nPress Ctrl+C to stop the demo');
      }, 1000);
    });
  });

  req.on('error', (err) => {
    console.error('Failed to send event:', err.message);
  });

  req.write(postData);
  req.end();

}, 3000);

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\nStopping demo...');
  broker.kill();
  process.exit(0);
});