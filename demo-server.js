const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('.'));

// Demo data for Samsara events
const sampleEvents = {
  route_assignment: {
    eventType: 'route.assigned',
    timestamp: new Date().toISOString(),
    driverId: 'driver_001',
    vehicleId: 'vehicle_123',
    data: {
      routeId: 'route_abc123',
      routeName: 'Hamburg Port → BMW Munich',
      pickupLocation: 'Hamburg Port Terminal, Waltershof',
      deliveryLocation: 'BMW Plant Munich, Petuelring 130',
      pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      deliveryTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      cargoType: 'Auto Parts',
      priority: 'high'
    }
  },
  location_update: {
    eventType: 'vehicle.location',
    timestamp: new Date().toISOString(),
    driverId: 'driver_001',
    vehicleId: 'vehicle_123',
    data: {
      lat: 53.5511,
      lng: 9.9937,
      address: 'A7 Autobahn, near Hamburg',
      speed: 85,
      heading: 180,
      status: 'en_route'
    }
  },
  geofence_entry: {
    eventType: 'geofence.entry',
    timestamp: new Date().toISOString(),
    driverId: 'driver_001',
    vehicleId: 'vehicle_123',
    data: {
      geofenceName: 'Hamburg Port Terminal',
      lat: 53.5394,
      lng: 9.9069,
      arrivalTime: new Date().toISOString(),
      expectedArrival: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    }
  }
};

// WhatsApp message templates
const messageTemplates = {
  route_assignment: (event) => ({
    type: 'interactive',
    text: `🚚 New Route Assignment\n\n` +
          `Route: ${event.data.routeName}\n` +
          `Pickup: ${event.data.pickupLocation}\n` +
          `Delivery: ${event.data.deliveryLocation}\n` +
          `Pickup Time: ${new Date(event.data.pickupTime).toLocaleString()}\n` +
          `Cargo: ${event.data.cargoType}\n\n` +
          `Please confirm receipt of this assignment.`,
    buttons: [
      { id: 'accept_route', text: '✅ Accept Route' },
      { id: 'request_details', text: 'ℹ️ More Details' },
      { id: 'report_issue', text: '⚠️ Report Issue' }
    ],
    timestamp: new Date().toISOString()
  }),
  
  location_update: (event) => ({
    type: 'text',
    text: `📍 Location Update Request\n\n` +
          `Current: ${event.data.address}\n` +
          `Speed: ${event.data.speed} km/h\n` +
          `Status: ${event.data.status}\n\n` +
          `Please share your current location for route optimization.`,
    timestamp: new Date().toISOString()
  }),
  
  geofence_entry: (event) => ({
    type: 'interactive',
    text: `🏁 Arrived at ${event.data.geofenceName}\n\n` +
          `Arrival: ${new Date(event.data.arrivalTime).toLocaleString()}\n` +
          `Status: On Time\n\n` +
          `What's your next action?`,
    buttons: [
      { id: 'start_loading', text: '📦 Start Loading' },
      { id: 'report_arrival', text: '📍 Confirm Arrival' },
      { id: 'need_assistance', text: '🆘 Need Help' }
    ],
    timestamp: new Date().toISOString()
  })
};

// Demo homepage
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fleet.Chat Demo - Samsara → WhatsApp Integration</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .message-bubble {
            animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .typing-indicator {
            animation: pulse 1.5s infinite;
        }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <div class="max-w-6xl mx-auto">
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-gray-900 mb-2">Fleet.Chat Demo</h1>
                <p class="text-xl text-gray-600">Samsara Fleet Events → WhatsApp Driver Messages</p>
                <p class="text-sm text-gray-500 mt-2">Real-time demonstration of intelligent message translation</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Samsara Events Panel -->
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h2 class="text-2xl font-semibold mb-4 text-blue-600">🚛 Samsara Fleet Events</h2>
                    <p class="text-gray-600 mb-6">Simulate fleet management events from Samsara TMS</p>
                    
                    <div class="space-y-4">
                        <button onclick="sendEvent('route_assignment')" 
                                class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition">
                            📋 Route Assignment
                        </button>
                        <button onclick="sendEvent('location_update')" 
                                class="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition">
                            📍 Location Update Request
                        </button>
                        <button onclick="sendEvent('geofence_entry')" 
                                class="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg transition">
                            🏁 Geofence Entry Alert
                        </button>
                    </div>

                    <div class="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h3 class="font-semibold text-gray-700 mb-2">Last Event Sent:</h3>
                        <pre id="lastEvent" class="text-sm text-gray-600 overflow-x-auto">Click a button to send an event</pre>
                    </div>
                </div>

                <!-- WhatsApp Messages Panel -->
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h2 class="text-2xl font-semibold mb-4 text-green-600">💬 WhatsApp Driver Interface</h2>
                    <p class="text-gray-600 mb-6">Intelligent message translation for driver communication</p>
                    
                    <div class="h-96 bg-gray-50 rounded-lg p-4 overflow-y-auto border-2 border-gray-200" id="chatArea">
                        <div class="text-center text-gray-500 py-8">
                            <p>💬 WhatsApp messages will appear here</p>
                            <p class="text-sm mt-2">Send a Samsara event to see the translation</p>
                        </div>
                    </div>

                    <div class="mt-4 p-3 bg-green-50 rounded-lg">
                        <p class="text-sm text-green-700">
                            <strong>Demo Features:</strong> Interactive buttons, location sharing, document requests, status updates
                        </p>
                    </div>
                </div>
            </div>

            <!-- System Status -->
            <div class="mt-8 bg-white rounded-lg shadow-lg p-6">
                <h2 class="text-xl font-semibold mb-4">🔧 System Status</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="text-center p-4 bg-green-50 rounded-lg">
                        <div class="text-2xl font-bold text-green-600">✅ Online</div>
                        <div class="text-sm text-gray-600">Message Broker</div>
                    </div>
                    <div class="text-center p-4 bg-blue-50 rounded-lg">
                        <div class="text-2xl font-bold text-blue-600">🔄 Active</div>
                        <div class="text-sm text-gray-600">Event Processing</div>
                    </div>
                    <div class="text-center p-4 bg-purple-50 rounded-lg">
                        <div class="text-2xl font-bold text-purple-600">📱 Ready</div>
                        <div class="text-sm text-gray-600">WhatsApp Integration</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        async function sendEvent(eventType) {
            const chatArea = document.getElementById('chatArea');
            const lastEventEl = document.getElementById('lastEvent');
            
            // Show typing indicator
            showTypingIndicator();
            
            try {
                const response = await fetch('/api/demo/event', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ eventType })
                });
                
                const result = await response.json();
                
                // Update last event display
                lastEventEl.textContent = JSON.stringify(result.event, null, 2);
                
                // Clear typing indicator and show message
                setTimeout(() => {
                    hideTypingIndicator();
                    showWhatsAppMessage(result.whatsappMessage);
                }, 1500);
                
            } catch (error) {
                console.error('Error:', error);
                hideTypingIndicator();
                showErrorMessage();
            }
        }
        
        function showTypingIndicator() {
            const chatArea = document.getElementById('chatArea');
            chatArea.innerHTML = '<div class="typing-indicator text-gray-500 text-center py-4">Fleet.Chat is processing event...</div>';
        }
        
        function hideTypingIndicator() {
            const typingEl = document.querySelector('.typing-indicator');
            if (typingEl) typingEl.remove();
        }
        
        function showWhatsAppMessage(message) {
            const chatArea = document.getElementById('chatArea');
            
            let messageHtml = '';
            
            if (message.type === 'interactive') {
                messageHtml = \`
                    <div class="message-bubble bg-green-100 p-4 rounded-lg mb-4 max-w-sm">
                        <p class="text-gray-800 whitespace-pre-line">\${message.text}</p>
                        <div class="mt-3 space-y-2">
                            \${message.buttons.map(btn => \`
                                <button onclick="handleDriverResponse('\${btn.id}')" 
                                        class="block w-full text-left px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm">
                                    \${btn.text}
                                </button>
                            \`).join('')}
                        </div>
                        <div class="text-xs text-gray-500 mt-2">\${new Date(message.timestamp).toLocaleTimeString()}</div>
                    </div>
                \`;
            } else {
                messageHtml = \`
                    <div class="message-bubble bg-green-100 p-4 rounded-lg mb-4 max-w-sm">
                        <p class="text-gray-800 whitespace-pre-line">\${message.text}</p>
                        <div class="text-xs text-gray-500 mt-2">\${new Date(message.timestamp).toLocaleTimeString()}</div>
                    </div>
                \`;
            }
            
            chatArea.innerHTML = messageHtml;
        }
        
        function handleDriverResponse(buttonId) {
            const chatArea = document.getElementById('chatArea');
            
            const responses = {
                'accept_route': '✅ Route accepted! ETA updated.',
                'request_details': 'ℹ️ Route details sent to your device.',
                'report_issue': '⚠️ Issue reported to dispatch.',
                'start_loading': '📦 Loading started. Will update when complete.',
                'report_arrival': '📍 Arrival confirmed. Standing by for instructions.',
                'need_assistance': '🆘 Assistance request sent to operations.'
            };
            
            const responseText = responses[buttonId] || 'Response received';
            
            // Add driver response bubble
            const driverMessage = \`
                <div class="message-bubble bg-blue-100 p-3 rounded-lg mb-4 max-w-sm ml-auto">
                    <p class="text-gray-800">\${responseText}</p>
                    <div class="text-xs text-gray-500 mt-1">\${new Date().toLocaleTimeString()}</div>
                </div>
            \`;
            
            chatArea.innerHTML += driverMessage;
            chatArea.scrollTop = chatArea.scrollHeight;
        }
        
        function showErrorMessage() {
            const chatArea = document.getElementById('chatArea');
            chatArea.innerHTML = '<div class="text-center text-red-500 py-4">Error processing event. Please try again.</div>';
        }
    </script>
</body>
</html>
  `);
});

// API endpoint to simulate event processing
app.post('/api/demo/event', (req, res) => {
  const { eventType } = req.body;
  
  if (!sampleEvents[eventType]) {
    return res.status(400).json({ error: 'Unknown event type' });
  }
  
  const event = sampleEvents[eventType];
  const whatsappMessage = messageTemplates[eventType](event);
  
  console.log(`[Demo] Processing ${eventType} event`);
  console.log(`[Demo] Generated WhatsApp message:`, whatsappMessage);
  
  res.json({
    event,
    whatsappMessage,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Fleet.Chat Demo',
    timestamp: new Date().toISOString(),
    features: {
      samsara_integration: 'active',
      whatsapp_translation: 'active',
      message_broker: 'online'
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Fleet.Chat Demo Server Running');
  console.log(`📱 Demo Interface: http://localhost:${PORT}/`);
  console.log(`🔧 Health Check: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('Demo Features:');
  console.log('✅ Samsara Event Simulation');
  console.log('✅ WhatsApp Message Translation');
  console.log('✅ Interactive Driver Responses');
  console.log('✅ Real-time Event Processing');
  console.log('');
  console.log('Ready for demonstration!');
});