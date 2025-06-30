const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// Demo data
const events = {
  route_assignment: {
    eventType: 'route.assigned',
    data: {
      routeName: 'Hamburg Port → BMW Munich',
      pickupLocation: 'Hamburg Port Terminal',
      deliveryLocation: 'BMW Plant Munich',
      cargoType: 'Auto Parts'
    }
  },
  location_update: {
    eventType: 'vehicle.location',
    data: {
      address: 'A7 Autobahn, near Hamburg',
      speed: 85,
      status: 'en_route'
    }
  },
  geofence_entry: {
    eventType: 'geofence.entry',
    data: {
      geofenceName: 'Hamburg Port Terminal',
      status: 'On Time'
    }
  }
};

const templates = {
  route_assignment: (event) => ({
    type: 'interactive',
    text: `🚚 New Route Assignment\n\nRoute: ${event.data.routeName}\nPickup: ${event.data.pickupLocation}\nDelivery: ${event.data.deliveryLocation}\nCargo: ${event.data.cargoType}\n\nPlease confirm receipt of this assignment.`,
    buttons: [
      { id: 'accept_route', text: '✅ Accept Route' },
      { id: 'request_details', text: 'ℹ️ More Details' },
      { id: 'report_issue', text: '⚠️ Report Issue' }
    ]
  }),
  location_update: (event) => ({
    type: 'text',
    text: `📍 Location Update Request\n\nCurrent: ${event.data.address}\nSpeed: ${event.data.speed} km/h\nStatus: ${event.data.status}\n\nPlease share your current location for route optimization.`
  }),
  geofence_entry: (event) => ({
    type: 'interactive',
    text: `🏁 Arrived at ${event.data.geofenceName}\n\nStatus: ${event.data.status}\n\nWhat's your next action?`,
    buttons: [
      { id: 'start_loading', text: '📦 Start Loading' },
      { id: 'report_arrival', text: '📍 Confirm Arrival' },
      { id: 'need_assistance', text: '🆘 Need Help' }
    ]
  })
};

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Fleet.Chat Demo - Samsara → WhatsApp Integration</title>
    <script src="https://cdn.tailwindcss.com"></script>
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

                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h2 class="text-2xl font-semibold mb-4 text-green-600">💬 WhatsApp Driver Interface</h2>
                    <p class="text-gray-600 mb-6">Intelligent message translation for driver communication</p>
                    
                    <div class="h-96 bg-gray-50 rounded-lg p-4 overflow-y-auto border-2 border-gray-200" id="chatArea">
                        <div class="text-center text-gray-500 py-8">
                            <p>💬 WhatsApp messages will appear here</p>
                            <p class="text-sm mt-2">Send a Samsara event to see the translation</p>
                        </div>
                    </div>
                </div>
            </div>

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
            
            chatArea.innerHTML = '<div class="text-gray-500 text-center py-4">Fleet.Chat is processing event...</div>';
            
            try {
                const response = await fetch('/api/event', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ eventType })
                });
                
                const result = await response.json();
                lastEventEl.textContent = JSON.stringify(result.event, null, 2);
                
                setTimeout(() => {
                    showWhatsAppMessage(result.whatsappMessage);
                }, 1000);
                
            } catch (error) {
                console.error('Error:', error);
                chatArea.innerHTML = '<div class="text-center text-red-500 py-4">Error processing event</div>';
            }
        }
        
        function showWhatsAppMessage(message) {
            const chatArea = document.getElementById('chatArea');
            let messageHtml = '';
            
            if (message.type === 'interactive') {
                const buttonsHtml = message.buttons.map(btn => 
                    \`<button onclick="handleResponse('\${btn.id}')" 
                            class="block w-full text-left px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm mb-2">
                        \${btn.text}
                    </button>\`
                ).join('');
                
                messageHtml = \`
                    <div class="bg-green-100 p-4 rounded-lg mb-4 max-w-sm">
                        <p class="text-gray-800 whitespace-pre-line">\${message.text}</p>
                        <div class="mt-3">\${buttonsHtml}</div>
                    </div>
                \`;
            } else {
                messageHtml = \`
                    <div class="bg-green-100 p-4 rounded-lg mb-4 max-w-sm">
                        <p class="text-gray-800 whitespace-pre-line">\${message.text}</p>
                    </div>
                \`;
            }
            
            chatArea.innerHTML = messageHtml;
        }
        
        function handleResponse(buttonId) {
            const chatArea = document.getElementById('chatArea');
            const responses = {
                'accept_route': '✅ Route accepted! ETA updated.',
                'request_details': 'ℹ️ Route details sent to your device.',
                'report_issue': '⚠️ Issue reported to dispatch.',
                'start_loading': '📦 Loading started. Will update when complete.',
                'report_arrival': '📍 Arrival confirmed. Standing by.',
                'need_assistance': '🆘 Assistance request sent to operations.'
            };
            
            const responseText = responses[buttonId] || 'Response received';
            const driverMessage = \`
                <div class="bg-blue-100 p-3 rounded-lg mb-4 max-w-sm ml-auto">
                    <p class="text-gray-800">\${responseText}</p>
                </div>
            \`;
            
            chatArea.innerHTML += driverMessage;
        }
    </script>
</body>
</html>
  `);
});

app.post('/api/event', (req, res) => {
  const { eventType } = req.body;
  
  if (!events[eventType]) {
    return res.status(400).json({ error: 'Unknown event type' });
  }
  
  const event = events[eventType];
  const whatsappMessage = templates[eventType](event);
  
  console.log(`Processing ${eventType} event`);
  
  res.json({ event, whatsappMessage });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fleet.Chat Demo running on port ${PORT}`);
  console.log(`Open: http://localhost:${PORT}/`);
  console.log('Ready for demonstration!');
});