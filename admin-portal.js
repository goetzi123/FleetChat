const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'fleet-chat-admin-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Admin credentials
const ADMIN_EMAIL = 'admin@fleet.chat';
const ADMIN_PASSWORD_HASH = '$2b$10$Y0mUxAZGurbJYfhsSa6ZheEwllsvdEUZRlenO9hPKwwwYUQMqBTDq'; // FleetChat2025!

// Auth middleware
function requireAdminAuth(req, res, next) {
  if (!req.session.adminId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

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
        <div class="mt-4 text-center text-sm text-gray-500">
            <p>Test Credentials:</p>
            <p>Email: admin@fleet.chat</p>
            <p>Password: FleetChat2025!</p>
        </div>
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
                    <h1 class="text-xl font-semibold text-gray-900">Fleet.Chat Admin Dashboard</h1>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-500">Welcome, Admin</span>
                    <button onclick="logout()" class="text-indigo-600 hover:text-indigo-900">Logout</button>
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
                                    <span class="text-white text-sm font-medium">F</span>
                                </div>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">Fleet Operators</dt>
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

            <div class="bg-white shadow rounded-lg mb-8">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Fleet.Chat Pricing Tiers</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Name</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price per Driver</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Drivers</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Starter</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$15/month</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">50</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button class="text-indigo-600 hover:text-indigo-900">Edit</button>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Professional</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$25/month</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">200</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button class="text-indigo-600 hover:text-indigo-900">Edit</button>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Enterprise</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$35/month</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Unlimited</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button class="text-indigo-600 hover:text-indigo-900">Edit</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="bg-white shadow rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Fleet Operators</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drivers</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Bill</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Swift Transport</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">34</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Professional</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$850</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Metro Logistics</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">28</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Starter</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$420</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Global Freight</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">67</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Enterprise</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$2,345</td>
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

// Fleet.Chat website homepage
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fleet.Chat - Connect Your Fleet to WhatsApp</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white">
    <div class="relative bg-white overflow-hidden">
        <div class="max-w-7xl mx-auto">
            <div class="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
                <main class="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                    <div class="sm:text-center lg:text-left">
                        <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                            <span class="block xl:inline">Connect Your Fleet</span>
                            <span class="block text-indigo-600 xl:inline">to WhatsApp</span>
                        </h1>
                        <p class="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                            Fleet.Chat is the headless message broker that connects Samsara fleet management with WhatsApp Business API. 
                            Automate driver communication, document collection, and status updates through intelligent message routing.
                        </p>
                        <div class="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                            <div class="rounded-md shadow">
                                <a href="#pricing" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10">
                                    Get Started
                                </a>
                            </div>
                            <div class="mt-3 sm:mt-0 sm:ml-3">
                                <a href="/admin" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10">
                                    Admin Portal
                                </a>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    </div>

    <div class="py-12 bg-gray-50" id="pricing">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="lg:text-center">
                <h2 class="text-base text-indigo-600 font-semibold tracking-wide uppercase">Pricing</h2>
                <p class="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                    Simple per-driver pricing
                </p>
            </div>

            <div class="mt-10">
                <div class="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
                    <div class="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
                        <div class="p-6">
                            <h2 class="text-lg leading-6 font-medium text-gray-900">Starter</h2>
                            <p class="mt-4 text-sm text-gray-500">Perfect for small fleets getting started</p>
                            <p class="mt-8">
                                <span class="text-4xl font-extrabold text-gray-900">$15</span>
                                <span class="text-base font-medium text-gray-500">/driver/month</span>
                            </p>
                        </div>
                        <div class="pt-6 pb-8 px-6">
                            <h3 class="text-xs font-medium text-gray-900 tracking-wide uppercase">What's included</h3>
                            <ul class="mt-6 space-y-4">
                                <li class="flex space-x-3">
                                    <span class="text-sm text-gray-500">WhatsApp messaging</span>
                                </li>
                                <li class="flex space-x-3">
                                    <span class="text-sm text-gray-500">Basic document handling</span>
                                </li>
                                <li class="flex space-x-3">
                                    <span class="text-sm text-gray-500">Transport tracking</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div class="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
                        <div class="p-6">
                            <h2 class="text-lg leading-6 font-medium text-gray-900">Professional</h2>
                            <p class="mt-4 text-sm text-gray-500">Ideal for growing fleet operations</p>
                            <p class="mt-8">
                                <span class="text-4xl font-extrabold text-gray-900">$25</span>
                                <span class="text-base font-medium text-gray-500">/driver/month</span>
                            </p>
                        </div>
                        <div class="pt-6 pb-8 px-6">
                            <h3 class="text-xs font-medium text-gray-900 tracking-wide uppercase">What's included</h3>
                            <ul class="mt-6 space-y-4">
                                <li class="flex space-x-3">
                                    <span class="text-sm text-gray-500">All Starter features</span>
                                </li>
                                <li class="flex space-x-3">
                                    <span class="text-sm text-gray-500">Advanced analytics</span>
                                </li>
                                <li class="flex space-x-3">
                                    <span class="text-sm text-gray-500">Priority support</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div class="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
                        <div class="p-6">
                            <h2 class="text-lg leading-6 font-medium text-gray-900">Enterprise</h2>
                            <p class="mt-4 text-sm text-gray-500">Complete solution for large operations</p>
                            <p class="mt-8">
                                <span class="text-4xl font-extrabold text-gray-900">$35</span>
                                <span class="text-base font-medium text-gray-500">/driver/month</span>
                            </p>
                        </div>
                        <div class="pt-6 pb-8 px-6">
                            <h3 class="text-xs font-medium text-gray-900 tracking-wide uppercase">What's included</h3>
                            <ul class="mt-6 space-y-4">
                                <li class="flex space-x-3">
                                    <span class="text-sm text-gray-500">All Professional features</span>
                                </li>
                                <li class="flex space-x-3">
                                    <span class="text-sm text-gray-500">Dedicated account manager</span>
                                </li>
                                <li class="flex space-x-3">
                                    <span class="text-sm text-gray-500">Custom integrations</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fleet.Chat Admin Portal running on port ${PORT}`);
  console.log(`Admin Portal: http://localhost:${PORT}/admin`);
  console.log(`Credentials: admin@fleet.chat / FleetChat2025!`);
});