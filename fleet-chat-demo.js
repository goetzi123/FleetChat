const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('.'));

app.get('/', (req, res) => {
  res.redirect('/demo');
});

app.get('/demo', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Fleet.Chat Demo</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .fade-out {
            opacity: 0;
            transition: opacity 0.5s ease-out;
        }
    </style>
</head>
<body class="bg-gray-100 p-6">
    <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl font-bold text-center mb-8">Fleet.Chat Demo</h1>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Samsara Panel -->
            <div class="bg-white rounded-lg shadow-lg p-6">
                <h2 class="text-2xl font-bold mb-6 text-blue-600">Samsara Fleet Events</h2>
                
                <div class="space-y-4">
                    <div>
                        <button id="route-btn" class="w-full text-left p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                            <div class="flex items-center">
                                <div class="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3">🚚</div>
                                <div>
                                    <h3 class="font-semibold">Route Assignment</h3>
                                    <p class="text-sm text-gray-600">Assign new delivery route</p>
                                </div>
                            </div>
                        </button>
                        <div id="route-feedback" class="mt-2"></div>
                    </div>
                    
                    <div>
                        <button id="location-btn" class="w-full text-left p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100">
                            <div class="flex items-center">
                                <div class="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center mr-3">📍</div>
                                <div>
                                    <h3 class="font-semibold">Location Update</h3>
                                    <p class="text-sm text-gray-600">Request driver location</p>
                                </div>
                            </div>
                        </button>
                        <div id="location-feedback" class="mt-2"></div>
                    </div>
                    
                    <div>
                        <button id="geofence-btn" class="w-full text-left p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100">
                            <div class="flex items-center">
                                <div class="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center mr-3">🏁</div>
                                <div>
                                    <h3 class="font-semibold">Geofence Entry</h3>
                                    <p class="text-sm text-gray-600">Driver arrived at location</p>
                                </div>
                            </div>
                        </button>
                        <div id="geofence-feedback" class="mt-2"></div>
                    </div>
                </div>
            </div>
            
            <!-- WhatsApp Panel -->
            <div class="bg-white rounded-lg shadow-lg p-6">
                <h2 class="text-2xl font-bold mb-6 text-green-600">WhatsApp Driver Messages</h2>
                
                <div id="chat-area" class="min-h-96 bg-gray-50 rounded-lg p-4">
                    <div class="text-center text-gray-500 py-8">
                        <p>No messages yet</p>
                        <p class="text-sm mt-2">Click a Samsara event to start</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Event messages configuration
        const messages = {
            route: {
                text: 'New Route Assignment\\n\\nRoute: Berlin to Hamburg Express\\nPickup: Berlin Distribution Center\\nDelivery: Hamburg Port Terminal\\n\\nPlease confirm receipt.',
                buttons: [
                    {id: 'accept', text: 'Accept Route'},
                    {id: 'details', text: 'More Details'},
                    {id: 'issue', text: 'Report Issue'}
                ]
            },
            location: {
                text: 'Location Update Request\\n\\nCurrent position needed for route optimization.\\n\\nPlease share your location.',
                buttons: [
                    {id: 'share', text: 'Share Location'},
                    {id: 'accurate', text: 'Location Accurate'},
                    {id: 'gps', text: 'GPS Issue'}
                ]
            },
            geofence: {
                text: 'Arrival at Hamburg Port Terminal\\n\\nArrival detected. Please confirm status.\\n\\nWhat is your current status?',
                buttons: [
                    {id: 'loading', text: 'Start Loading'},
                    {id: 'arrived', text: 'Confirm Arrival'},
                    {id: 'help', text: 'Need Help'}
                ]
            }
        };

        // Response messages
        const responses = {
            accept: 'Route accepted! ETA updated.',
            details: 'Route details sent to device.',
            issue: 'Issue reported to dispatch.',
            share: 'Location shared: Berlin, Germany',
            accurate: 'Location confirmed accurate.',
            gps: 'GPS issue reported.',
            loading: 'Loading started.',
            arrived: 'Arrival confirmed.',
            help: 'Assistance requested.'
        };

        // Get DOM elements
        const routeBtn = document.getElementById('route-btn');
        const locationBtn = document.getElementById('location-btn');
        const geofenceBtn = document.getElementById('geofence-btn');
        const chatArea = document.getElementById('chat-area');

        // Event handlers
        routeBtn.onclick = function() { showMessage('route'); };
        locationBtn.onclick = function() { showMessage('location'); };
        geofenceBtn.onclick = function() { showMessage('geofence'); };

        function showMessage(type) {
            const msg = messages[type];
            let buttonsHtml = '';
            
            for (let i = 0; i < msg.buttons.length; i++) {
                const btn = msg.buttons[i];
                buttonsHtml += '<button onclick="handleResponse(\\''+btn.id+'\\', \\''+type+'\\')" class="block w-full text-left px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm mb-2">'+btn.text+'</button>';
            }

            const messageHtml = '<div class="bg-green-100 p-4 rounded-lg mb-4">'+
                '<p class="whitespace-pre-line text-gray-800">'+msg.text+'</p>'+
                '<div class="mt-3">'+buttonsHtml+'</div>'+
                '<div class="text-xs text-gray-500 mt-2">'+new Date().toLocaleTimeString()+'</div>'+
                '</div>';

            chatArea.innerHTML = messageHtml;
        }

        function handleResponse(responseId, eventType) {
            const responseText = responses[responseId];
            
            // Add driver response message
            const driverMsg = '<div class="bg-blue-100 p-3 rounded-lg mb-4 ml-8">'+
                '<p class="text-gray-800">'+responseText+'</p>'+
                '<div class="text-xs text-gray-500 mt-1">'+new Date().toLocaleTimeString()+'</div>'+
                '</div>';
            
            chatArea.innerHTML += driverMsg;
            chatArea.scrollTop = chatArea.scrollHeight;
            
            // Show feedback in Samsara panel
            showFeedback(eventType, responseText);
        }

        function showFeedback(eventType, message) {
            const feedbackId = eventType + '-feedback';
            const feedbackDiv = document.getElementById(feedbackId);
            
            const feedbackHtml = '<div class="bg-green-50 border border-green-200 rounded-lg p-3">'+
                '<div class="flex items-center">'+
                '<div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">'+
                '<span class="text-white text-xs">✓</span>'+
                '</div>'+
                '<p class="text-sm text-green-800">Driver response: '+message+'</p>'+
                '</div>'+
                '</div>';
            
            feedbackDiv.innerHTML = feedbackHtml;
            
            // Auto-remove with fade animation
            setTimeout(function() {
                feedbackDiv.firstElementChild.classList.add('fade-out');
                setTimeout(function() {
                    feedbackDiv.innerHTML = '';
                }, 500);
            }, 2000);
        }
    </script>
</body>
</html>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Fleet.Chat Demo Server running on port ' + PORT);
});