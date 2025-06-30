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