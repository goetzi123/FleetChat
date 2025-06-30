const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.redirect('/demo');
});

app.get('/demo', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fleet.Chat Demo</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen p-6">
    <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl font-bold text-center mb-8">Fleet.Chat Demo - Bidirectional Communication</h1>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Samsara Panel -->
            <div class="bg-white rounded-lg shadow-lg p-6">
                <h2 class="text-2xl font-semibold mb-4 text-blue-600">🚛 Samsara Fleet Events</h2>
                <p class="text-gray-600 mb-6">Click buttons to send events to drivers</p>
                
                <div class="space-y-4">
                    <button class="samsara-btn w-full text-left p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100" data-event="route">
                        <div class="flex items-center">
                            <div class="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3">🚚</div>
                            <div>
                                <h3 class="font-semibold">Route Assignment</h3>
                                <p class="text-sm text-gray-600">Assign new delivery route</p>
                            </div>
                        </div>
                    </button>
                    
                    <button class="samsara-btn w-full text-left p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100" data-event="location">
                        <div class="flex items-center">
                            <div class="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center mr-3">📍</div>
                            <div>
                                <h3 class="font-semibold">Location Update</h3>
                                <p class="text-sm text-gray-600">Request driver location</p>
                            </div>
                        </div>
                    </button>
                    
                    <button class="samsara-btn w-full text-left p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100" data-event="geofence">
                        <div class="flex items-center">
                            <div class="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center mr-3">🏁</div>
                            <div>
                                <h3 class="font-semibold">Geofence Entry</h3>
                                <p class="text-sm text-gray-600">Driver arrived at location</p>
                            </div>
                        </div>
                    </button>
                </div>
                
                <div id="samsara-feedback" class="mt-6"></div>
            </div>
            
            <!-- WhatsApp Panel -->
            <div class="bg-white rounded-lg shadow-lg p-6">
                <h2 class="text-2xl font-semibold mb-4 text-green-600">💬 WhatsApp Driver Messages</h2>
                <p class="text-gray-600 mb-6">Driver communication interface</p>
                
                <div id="whatsapp-chat" class="min-h-96 bg-gray-50 rounded-lg p-4">
                    <div class="text-center text-gray-500 py-8">
                        <p>No messages yet</p>
                        <p class="text-sm mt-2">Click a Samsara event to see driver messages</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const samsaraBtns = document.querySelectorAll('.samsara-btn');
            const whatsappChat = document.getElementById('whatsapp-chat');
            const samsaraFeedback = document.getElementById('samsara-feedback');
            
            const eventMessages = {
                route: {
                    text: '🚚 New Route Assignment\\n\\nRoute: Berlin → Hamburg Express\\nPickup: Berlin Distribution Center\\nDelivery: Hamburg Port Terminal\\n\\nPlease confirm receipt.',
                    buttons: [
                        { id: 'accept', text: '✅ Accept Route' },
                        { id: 'details', text: 'ℹ️ More Details' },
                        { id: 'issue', text: '⚠️ Report Issue' }
                    ]
                },
                location: {
                    text: '📍 Location Update Request\\n\\nCurrent position needed for route optimization.\\n\\nPlease share your location.',
                    buttons: [
                        { id: 'share', text: '📍 Share Location' },
                        { id: 'accurate', text: '✅ Location Accurate' },
                        { id: 'gps-issue', text: '⚠️ GPS Issue' }
                    ]
                },
                geofence: {
                    text: '🏁 Arrival at Hamburg Port Terminal\\n\\nArrival detected. Please confirm status.\\n\\nWhat is your current status?',
                    buttons: [
                        { id: 'loading', text: '📦 Start Loading' },
                        { id: 'arrived', text: '📍 Confirm Arrival' },
                        { id: 'help', text: '🆘 Need Help' }
                    ]
                }
            };
            
            const responses = {
                accept: '✅ Route accepted! ETA updated.',
                details: 'ℹ️ Route details sent to device.',
                issue: '⚠️ Issue reported to dispatch.',
                share: '📍 Location shared: Berlin, Germany',
                accurate: '✅ Location confirmed accurate.',
                'gps-issue': '⚠️ GPS issue reported.',
                loading: '📦 Loading started.',
                arrived: '📍 Arrival confirmed.',
                help: '🆘 Assistance requested.'
            };
            
            samsaraBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const eventType = this.getAttribute('data-event');
                    const message = eventMessages[eventType];
                    
                    showWhatsAppMessage(message);
                });
            });
            
            function showWhatsAppMessage(message) {
                let buttonsHtml = '';
                message.buttons.forEach(btn => {
                    buttonsHtml += '<button class="response-btn block w-full text-left px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm mb-2" data-response="' + btn.id + '">' + btn.text + '</button>';
                });
                
                const messageHtml = '<div class="message-bubble bg-green-100 p-4 rounded-lg mb-4">' +
                    '<p class="whitespace-pre-line text-gray-800">' + message.text + '</p>' +
                    '<div class="mt-3">' + buttonsHtml + '</div>' +
                    '<div class="text-xs text-gray-500 mt-2">' + new Date().toLocaleTimeString() + '</div>' +
                    '</div>';
                
                whatsappChat.innerHTML = messageHtml;
                
                // Add event listeners to response buttons
                const responseBtns = whatsappChat.querySelectorAll('.response-btn');
                responseBtns.forEach(btn => {
                    btn.addEventListener('click', function() {
                        const responseId = this.getAttribute('data-response');
                        handleDriverResponse(responseId);
                    });
                });
            }
            
            function handleDriverResponse(responseId) {
                const responseText = responses[responseId] || 'Response sent';
                
                // Add blue driver message
                const driverMessage = '<div class="message-bubble bg-blue-100 p-3 rounded-lg mb-4 ml-8">' +
                    '<p class="text-gray-800">' + responseText + '</p>' +
                    '<div class="text-xs text-gray-500 mt-1">' + new Date().toLocaleTimeString() + '</div>' +
                    '</div>';
                
                whatsappChat.innerHTML += driverMessage;
                whatsappChat.scrollTop = whatsappChat.scrollHeight;
                
                // Show green feedback in Samsara panel
                showSamsaraFeedback('Driver response received: ' + responseText);
            }
            
            function showSamsaraFeedback(message) {
                const feedbackHtml = '<div class="feedback-panel bg-green-50 border border-green-200 rounded-lg p-3">' +
                    '<div class="flex items-center">' +
                    '<div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">' +
                    '<span class="text-white text-xs">✓</span>' +
                    '</div>' +
                    '<p class="text-sm text-green-800">' + message + '</p>' +
                    '</div>' +
                    '</div>';
                
                samsaraFeedback.innerHTML = feedbackHtml;
                
                // Auto-remove after 2 seconds
                setTimeout(function() {
                    samsaraFeedback.innerHTML = '';
                }, 2000);
            }
        });
    </script>
</body>
</html>`);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Fleet.Chat Demo Server running on port ' + PORT);
});