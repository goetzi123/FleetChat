const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Demo events data
const samsaraEvents = {
  route_assignment: {
    eventType: 'route_assignment',
    timestamp: new Date().toISOString(),
    driverId: 'driver_001',
    vehicleId: 'vehicle_123',
    data: {
      routeName: 'Berlin → Hamburg Express',
      pickupLocation: 'Berlin Distribution Center',
      deliveryLocation: 'Hamburg Port Terminal',
      pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      cargoType: 'Electronics & Components'
    }
  },
  location_update: {
    eventType: 'location_update',
    timestamp: new Date().toISOString(),
    driverId: 'driver_001',
    vehicleId: 'vehicle_123',
    data: {
      lat: 52.5200,
      lng: 13.4050,
      address: 'Brandenburg Gate, Berlin, Germany',
      speed: 45,
      status: 'en_route'
    }
  },
  geofence_entry: {
    eventType: 'geofence_entry',
    timestamp: new Date().toISOString(),
    driverId: 'driver_001',
    vehicleId: 'vehicle_123',
    data: {
      geofenceName: 'Hamburg Port Terminal',
      lat: 53.5394,
      lng: 9.9069,
      arrivalTime: new Date().toISOString()
    }
  }
};

function createMessage(eventType, event) {
  if (eventType === 'route_assignment') {
    return {
      type: 'interactive',
      text: '🚚 New Route Assignment\\n\\nRoute: ' + event.data.routeName + '\\nPickup: ' + event.data.pickupLocation + '\\nDelivery: ' + event.data.deliveryLocation + '\\nCargo: ' + event.data.cargoType + '\\n\\nPlease confirm receipt of this assignment.',
      buttons: [
        { id: 'accept_route', text: '✅ Accept Route' },
        { id: 'request_details', text: 'ℹ️ More Details' },
        { id: 'report_issue', text: '⚠️ Report Issue' }
      ],
      timestamp: new Date().toISOString()
    };
  } else if (eventType === 'location_update') {
    return {
      type: 'interactive',
      text: '📍 Location Update Request\\n\\nCurrent: ' + event.data.address + '\\nSpeed: ' + event.data.speed + ' km/h\\nStatus: ' + event.data.status + '\\n\\nPlease share your current location for route optimization.',
      buttons: [
        { id: 'share_location', text: '📍 Share Current Location' },
        { id: 'location_accurate', text: '✅ Current Location Accurate' },
        { id: 'location_issue', text: '⚠️ GPS Issue - Need Help' }
      ],
      timestamp: new Date().toISOString()
    };
  } else if (eventType === 'geofence_entry') {
    return {
      type: 'interactive',
      text: '🏁 Arrived at ' + event.data.geofenceName + '\\n\\nArrival: ' + new Date(event.data.arrivalTime).toLocaleString() + '\\nStatus: On Time\\n\\nWhat is your next action?',
      buttons: [
        { id: 'start_loading', text: '📦 Start Loading' },
        { id: 'report_arrival', text: '📍 Confirm Arrival' },
        { id: 'need_assistance', text: '🆘 Need Help' }
      ],
      timestamp: new Date().toISOString()
    };
  }
  return null;
}

app.get('/', (req, res) => {
  res.redirect('/demo');
});

app.get('/demo', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fleet.Chat Demo - Samsara to WhatsApp Integration</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .message-bubble { animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .response-panel { animation: slideInLeft 0.3s ease-out; }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .response-panel.removing { animation: slideOutLeft 0.3s ease-in; }
        @keyframes slideOutLeft { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-20px); } }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">Fleet.Chat Demo</h1>
            <p class="text-xl text-gray-600">Samsara Fleet Events → WhatsApp Driver Messages</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div id="samsaraPanel" class="bg-white rounded-lg shadow-lg p-6">
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

                <div class="mt-4 p-3 bg-green-50 rounded-lg">
                    <p class="text-sm text-green-700">
                        <strong>Demo Features:</strong> Interactive buttons, location sharing, document requests, status updates
                    </p>
                </div>
            </div>
        </div>
    </div>

    <script>
        let lastEventType = null;

        function sendEvent(eventType) {
            console.log('Sending event:', eventType);
            lastEventType = eventType;
            
            var chatArea = document.getElementById('chatArea');
            var lastEventEl = document.getElementById('lastEvent');
            
            showTypingIndicator();
            
            fetch('/api/demo/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventType: eventType })
            })
            .then(function(response) {
                return response.json();
            })
            .then(function(result) {
                console.log('Event result:', result);
                
                lastEventEl.textContent = JSON.stringify(result.event, null, 2);
                
                setTimeout(function() {
                    hideTypingIndicator();
                    showWhatsAppMessage(result.whatsappMessage);
                }, 1500);
            })
            .catch(function(error) {
                console.error('Error sending event:', error);
                hideTypingIndicator();
                showErrorMessage();
            });
        }
        
        function showTypingIndicator() {
            var chatArea = document.getElementById('chatArea');
            chatArea.innerHTML = '<div class="typing-indicator text-gray-500 text-center py-4">Fleet.Chat is processing event...</div>';
        }
        
        function hideTypingIndicator() {
            var typingEl = document.querySelector('.typing-indicator');
            if (typingEl) typingEl.remove();
        }
        
        function showWhatsAppMessage(message) {
            console.log('Showing WhatsApp message:', message);
            var chatArea = document.getElementById('chatArea');
            var messageHtml = '';
            
            if (message.type === 'interactive') {
                var buttonsHtml = '';
                for (var i = 0; i < message.buttons.length; i++) {
                    var btn = message.buttons[i];
                    buttonsHtml += '<button onclick="handleDriverResponse(\'' + btn.id + '\')" ' +
                                  'class="block w-full text-left px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm mb-2">' +
                                  btn.text + '</button>';
                }
                
                messageHtml = '<div class="message-bubble bg-green-100 p-4 rounded-lg mb-4 max-w-sm">' +
                    '<p class="text-gray-800 whitespace-pre-line">' + message.text + '</p>' +
                    '<div class="mt-3">' + buttonsHtml + '</div>' +
                    '<div class="text-xs text-gray-500 mt-2">' + new Date(message.timestamp).toLocaleTimeString() + '</div>' +
                    '</div>';
            } else {
                messageHtml = '<div class="message-bubble bg-green-100 p-4 rounded-lg mb-4 max-w-sm">' +
                    '<p class="text-gray-800 whitespace-pre-line">' + message.text + '</p>' +
                    '<div class="text-xs text-gray-500 mt-2">' + new Date(message.timestamp).toLocaleTimeString() + '</div>' +
                    '</div>';
            }
            
            chatArea.innerHTML = messageHtml;
        }
        
        function handleDriverResponse(buttonId) {
            console.log('Driver response:', buttonId);
            var chatArea = document.getElementById('chatArea');
            
            var responses = {
                'accept_route': '✅ Route accepted! ETA updated.',
                'request_details': 'ℹ️ Route details sent to your device.',
                'report_issue': '⚠️ Issue reported to dispatch.',
                'share_location': '📍 Location shared: 52.5200° N, 13.4050° E (Berlin, Germany)',
                'location_accurate': '✅ Current location confirmed as accurate.',
                'location_issue': '⚠️ GPS issue reported. Technical support notified.',
                'start_loading': '📦 Loading started. Will update when complete.',
                'report_arrival': '📍 Arrival confirmed. Standing by for instructions.',
                'need_assistance': '🆘 Assistance request sent to operations.'
            };
            
            var samsaraFeedback = {
                'accept_route': '✅ Driver accepted route assignment - Route status updated in Samsara',
                'request_details': 'ℹ️ Driver requested route details - Additional info sent via Samsara',
                'report_issue': '⚠️ Driver reported issue - Alert created in Samsara dispatch system',
                'share_location': '📍 Driver shared location - GPS coordinates updated in Samsara tracking',
                'location_accurate': '✅ Driver confirmed location accuracy - Samsara positioning verified',
                'location_issue': '⚠️ Driver reported GPS issue - Samsara technical support notified',
                'start_loading': '📦 Driver started loading - Transport status updated to "Loading"',
                'report_arrival': '📍 Driver confirmed arrival - Geofence status updated in Samsara',
                'need_assistance': '🆘 Driver needs assistance - Emergency alert sent to Samsara operations'
            };
            
            var responseText = responses[buttonId] || 'Response received';
            var driverMessage = '<div class="message-bubble bg-blue-100 p-3 rounded-lg mb-4 max-w-sm ml-auto">' +
                '<p class="text-gray-800">' + responseText + '</p>' +
                '<div class="text-xs text-gray-500 mt-1">' + new Date().toLocaleTimeString() + '</div>' +
                '</div>';
            
            chatArea.innerHTML += driverMessage;
            chatArea.scrollTop = chatArea.scrollHeight;
            
            showSamsaraFeedback(samsaraFeedback[buttonId] || 'Driver response received', buttonId);
        }

        function showSamsaraFeedback(message, responseType) {
            console.log('Showing Samsara feedback:', message, responseType);
            
            var buttonMapping = {
                'accept_route': 'route_assignment',
                'request_details': 'route_assignment', 
                'report_issue': 'route_assignment',
                'share_location': 'location_update',
                'location_accurate': 'location_update',
                'location_issue': 'location_update',
                'start_loading': 'geofence_entry',
                'report_arrival': 'geofence_entry',
                'need_assistance': 'geofence_entry'
            };
            
            var eventType = buttonMapping[responseType] || lastEventType || 'route_assignment';
            
            var responsePanel = document.createElement('div');
            responsePanel.className = 'response-panel mt-2 p-3 bg-green-50 border border-green-200 rounded-lg';
            responsePanel.innerHTML = '<div class="flex items-center">' +
                '<div class="flex-shrink-0">' +
                '<div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">' +
                '<span class="text-white text-xs">✓</span>' +
                '</div>' +
                '</div>' +
                '<div class="ml-3">' +
                '<p class="text-sm font-medium text-green-800">Driver Response Received</p>' +
                '<p class="text-xs text-green-600">' + message + '</p>' +
                '</div>' +
                '</div>';
            
            var samsaraPanel = document.getElementById('samsaraPanel');
            var buttonContainer = samsaraPanel.querySelector('.space-y-4');
            
            var targetButton = null;
            var buttons = buttonContainer.querySelectorAll('button[onclick]');
            
            for (var i = 0; i < buttons.length; i++) {
                var button = buttons[i];
                var onclickAttr = button.getAttribute('onclick');
                if (onclickAttr && onclickAttr.indexOf(eventType) !== -1) {
                    targetButton = button;
                    break;
                }
            }
            
            if (targetButton) {
                targetButton.insertAdjacentElement('afterend', responsePanel);
            } else {
                buttonContainer.appendChild(responsePanel);
            }
            
            setTimeout(function() {
                responsePanel.classList.add('removing');
                setTimeout(function() {
                    if (responsePanel.parentNode) {
                        responsePanel.parentNode.removeChild(responsePanel);
                    }
                }, 300);
            }, 2000);
        }
        
        function showErrorMessage() {
            var chatArea = document.getElementById('chatArea');
            chatArea.innerHTML = '<div class="text-center text-red-500 py-8"><p>⚠️ Error processing event</p><p class="text-sm mt-2">Please try again</p></div>';
        }
    </script>
</body>
</html>`);
});

app.post('/api/demo/event', (req, res) => {
  const { eventType } = req.body;
  
  console.log('[Demo] Processing ' + eventType + ' event');
  
  const event = samsaraEvents[eventType];
  if (!event) {
    return res.status(400).json({ error: 'Invalid event type' });
  }
  
  const whatsappMessage = createMessage(eventType, event);
  
  res.json({
    success: true,
    event: event,
    whatsappMessage: whatsappMessage
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Fleet.Chat website live on port ' + PORT);
});