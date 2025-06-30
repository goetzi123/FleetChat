const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'fleet-chat-admin-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Test admin credentials
const ADMIN_EMAIL = 'admin@fleet.chat';
const ADMIN_PASSWORD_HASH = '$2b$10$Y0mUxAZGurbJYfhsSa6ZheEwllsvdEUZRlenO9hPKwwwYUQMqBTDq'; // FleetChat2025!

// Admin middleware
function requireAdminAuth(req, res, next) {
  if (!req.session.adminId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Admin Portal Routes

// Admin login page
app.get('/admin', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fleet.Chat Admin Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center">
    <div class="max-w-md w-full space-y-8">
        <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Fleet.Chat Admin Portal</h2>
            <p class="mt-2 text-center text-sm text-gray-600">Sign in to your admin account</p>
        </div>
        <form class="mt-8 space-y-6" onsubmit="handleLogin(event)">
            <div class="rounded-md shadow-sm -space-y-px">
                <div>
                    <input id="email" name="email" type="email" required 
                           class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" 
                           placeholder="Email address" value="admin@fleet.chat">
                </div>
                <div>
                    <input id="password" name="password" type="password" required 
                           class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" 
                           placeholder="Password" value="FleetChat2025!">
                </div>
            </div>
            <div>
                <button type="submit" 
                        class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Sign in
                </button>
            </div>
        </form>
        <div id="error-message" class="hidden text-red-600 text-center"></div>
    </div>

    <script>
        async function handleLogin(event) {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                if (response.ok) {
                    window.location.href = '/admin/dashboard';
                } else {
                    const error = await response.json();
                    document.getElementById('error-message').textContent = error.error;
                    document.getElementById('error-message').classList.remove('hidden');
                }
            } catch (error) {
                document.getElementById('error-message').textContent = 'Login failed';
                document.getElementById('error-message').classList.remove('hidden');
            }
        }
    </script>
</body>
</html>
  `);
});

// Admin dashboard
app.get('/admin/dashboard', requireAdminAuth, (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fleet.Chat Admin Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen">
    <nav class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <h1 class="text-xl font-semibold text-gray-900">Fleet.Chat Admin</h1>
                </div>
                <div class="flex items-center">
                    <button onclick="logout()" class="text-gray-500 hover:text-gray-700">Logout</button>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                                    <span class="text-white text-sm font-medium">T</span>
                                </div>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">Total Fleet Operators</dt>
                                    <dd class="text-lg font-medium text-gray-900">12</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                    <span class="text-white text-sm font-medium">D</span>
                                </div>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">Active Drivers</dt>
                                    <dd class="text-lg font-medium text-gray-900">142</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                                    <span class="text-white text-sm font-medium">T</span>
                                </div>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">Active Transports</dt>
                                    <dd class="text-lg font-medium text-gray-900">89</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                    <span class="text-white text-sm font-medium">$</span>
                                </div>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">Monthly Revenue</dt>
                                    <dd class="text-lg font-medium text-gray-900">$4,250</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white shadow rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Pricing Tiers</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/Driver</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Drivers</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Starter</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$15</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">50</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Professional</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$25</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">200</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Enterprise</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$35</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Unlimited</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        async function logout() {
            await fetch('/api/admin/logout', { method: 'POST' });
            window.location.href = '/admin';
        }
    </script>
</body>
</html>
  `);
});

// Admin API endpoints
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (email !== ADMIN_EMAIL) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    req.session.adminId = email;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Serve the dynamic Fleet.Chat website with real-time pricing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'fleet-chat-dynamic.html'));
});

app.get('/public', (req, res) => {
  res.sendFile(path.join(__dirname, 'fleet-chat-dynamic.html'));
});

app.get('/fleet.chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'fleet-chat-dynamic.html'));
});

// Serve Privacy Policy page
app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy-policy.html'));
});

// Serve static version for comparison
app.get('/static', (req, res) => {
  res.sendFile(path.join(__dirname, 'fleet-chat-public.html'));
});

// Public pricing API endpoint - simple fallback for static deployment
app.get('/api/pricing', (req, res) => {
  res.json({
    success: true,
    pricing: [
      {
        name: "Starter",
        description: "Perfect for small fleets getting started",
        pricePerDriver: 15,
        minDrivers: 1,
        maxDrivers: 50,
        features: [
          "WhatsApp messaging",
          "Basic document handling", 
          "Transport tracking",
          "Standard support"
        ],
        isActive: true
      },
      {
        name: "Professional", 
        description: "Ideal for growing fleet operations",
        pricePerDriver: 25,
        minDrivers: 1,
        maxDrivers: 200,
        features: [
          "All Starter features",
          "Advanced analytics",
          "Custom workflows", 
          "Priority support",
          "24/7 support"
        ],
        isActive: true
      },
      {
        name: "Enterprise",
        description: "Complete solution for large operations", 
        pricePerDriver: 35,
        minDrivers: 1,
        maxDrivers: null,
        features: [
          "All Professional features",
          "Multi-fleet management",
          "Dedicated account manager",
          "Custom integrations",
          "SLA guarantees"
        ],
        isActive: true
      }
    ],
    lastUpdated: new Date().toISOString()
  });
});

// Demo functionality - Samsara to WhatsApp integration demo
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

// Demo route
app.get('/demo', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fleet.Chat Demo - Samsara → WhatsApp Integration</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .message-bubble { animation: slideIn 0.3s ease-out; }
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .typing-indicator { animation: pulse 1.5s infinite; }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <div class="max-w-6xl mx-auto">
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-gray-900 mb-2">Fleet.Chat Demo</h1>
                <p class="text-xl text-gray-600">Samsara Fleet Events → WhatsApp Driver Messages</p>
                <p class="text-sm text-gray-500 mt-2">Real-time demonstration of intelligent message translation</p>
                <div class="mt-4">
                    <a href="/" class="text-blue-600 hover:underline mr-4">← Back to Fleet.Chat</a>
                    <a href="/admin" class="text-blue-600 hover:underline">Admin Portal →</a>
                </div>
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

                    <div class="mt-4 p-3 bg-green-50 rounded-lg">
                        <p class="text-sm text-green-700">
                            <strong>Demo Features:</strong> Interactive buttons, location sharing, document requests, status updates
                        </p>
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
            
            showTypingIndicator();
            
            try {
                const response = await fetch('/api/demo/event', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ eventType })
                });
                
                const result = await response.json();
                lastEventEl.textContent = JSON.stringify(result.event, null, 2);
                
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

// Demo API endpoint
app.post('/api/demo/event', (req, res) => {
  const { eventType } = req.body;
  
  if (!sampleEvents[eventType]) {
    return res.status(400).json({ error: 'Unknown event type' });
  }
  
  const event = sampleEvents[eventType];
  const whatsappMessage = messageTemplates[eventType](event);
  
  console.log(`[Demo] Processing ${eventType} event`);
  
  res.json({
    event,
    whatsappMessage,
    timestamp: new Date().toISOString()
  });
});

// Health check for deployment
app.get('/health', (req, res) => {
  res.json({ 
    status: 'live',
    service: 'Fleet.Chat Website',
    timestamp: new Date().toISOString()
  });
});

// Catch all other routes and redirect to homepage
app.get('*', (req, res) => {
  // Don't interfere with admin routes
  if (req.path.startsWith('/admin') || req.path.startsWith('/api/admin')) {
    return res.status(404).send('Not Found');
  }
  res.sendFile(path.join(__dirname, 'fleet-chat-dynamic.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fleet.Chat website live on port ${PORT}`);
});