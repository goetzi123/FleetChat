const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.redirect('/demo');
});

app.get('/demo', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
    <title>Fleet.Chat Demo - Working</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-8">
    <h1 class="text-3xl font-bold mb-8">Fleet.Chat Demo - Bidirectional Communication</h1>
    
    <div class="grid grid-cols-2 gap-8">
        <div class="bg-white p-6 rounded-lg">
            <h2 class="text-xl font-bold mb-4">Samsara Fleet Events</h2>
            <button id="routeBtn" class="block w-full p-3 mb-2 bg-blue-500 text-white rounded">Route Assignment</button>
            <button id="locationBtn" class="block w-full p-3 mb-2 bg-green-500 text-white rounded">Location Update</button>
            <button id="geofenceBtn" class="block w-full p-3 mb-2 bg-purple-500 text-white rounded">Geofence Entry</button>
            <div id="samsaraFeedback" class="mt-4"></div>
        </div>
        
        <div class="bg-white p-6 rounded-lg">
            <h2 class="text-xl font-bold mb-4">WhatsApp Driver Messages</h2>
            <div id="whatsappMessages" class="min-h-64 bg-gray-50 p-4 rounded">
                <p class="text-gray-500">Click a Samsara event to see messages</p>
            </div>
        </div>
    </div>

    <script>
        const routeBtn = document.getElementById('routeBtn');
        const locationBtn = document.getElementById('locationBtn');
        const geofenceBtn = document.getElementById('geofenceBtn');
        const whatsappMessages = document.getElementById('whatsappMessages');
        const samsaraFeedback = document.getElementById('samsaraFeedback');
        
        let currentEvent = '';

        routeBtn.addEventListener('click', function() {
            currentEvent = 'route_assignment';
            const message = 'Route Assignment: Berlin → Hamburg Express. Pickup: Berlin Distribution Center. Please confirm: <button onclick="driverResponse(\\'accept\\')">Accept</button> <button onclick="driverResponse(\\'details\\')">Details</button>';
            whatsappMessages.innerHTML = '<div class="bg-green-100 p-3 rounded mb-2">' + message + '</div>';
        });

        locationBtn.addEventListener('click', function() {
            currentEvent = 'location_update';
            const message = 'Location Update Request: Current position needed for route optimization. <button onclick="driverResponse(\\'share\\')">Share Location</button> <button onclick="driverResponse(\\'accurate\\')">Location Accurate</button>';
            whatsappMessages.innerHTML = '<div class="bg-green-100 p-3 rounded mb-2">' + message + '</div>';
        });

        geofenceBtn.addEventListener('click', function() {
            currentEvent = 'geofence_entry';
            const message = 'Arrival at Hamburg Port Terminal. Please confirm: <button onclick="driverResponse(\\'loading\\')">Start Loading</button> <button onclick="driverResponse(\\'arrived\\')">Confirm Arrival</button>';
            whatsappMessages.innerHTML = '<div class="bg-green-100 p-3 rounded mb-2">' + message + '</div>';
        });

        function driverResponse(responseType) {
            // Add blue driver message
            const driverMsg = '<div class="bg-blue-100 p-3 rounded mb-2 ml-8">Driver: ' + responseType + ' response sent</div>';
            whatsappMessages.innerHTML += driverMsg;
            
            // Add green feedback to Samsara panel
            const feedback = '<div class="bg-green-100 p-2 rounded mt-2">Driver response received: ' + responseType + '</div>';
            samsaraFeedback.innerHTML = feedback;
            
            // Auto-remove after 2 seconds
            setTimeout(function() {
                samsaraFeedback.innerHTML = '';
            }, 2000);
        }
    </script>
</body>
</html>`);
});

app.post('/api/demo/event', (req, res) => {
  res.json({ success: true, message: 'Event processed' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Fleet.Chat Demo Server running on port ' + PORT);
});