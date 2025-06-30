const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

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
            <p class="mt-2 text-center text-sm text-gray-600">Management Dashboard</p>
        </div>
        <div class="bg-white p-8 rounded-lg shadow">
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="text-center p-4 bg-blue-50 rounded">
                    <div class="text-2xl font-bold text-blue-600">12</div>
                    <div class="text-sm text-gray-600">Fleet Operators</div>
                </div>
                <div class="text-center p-4 bg-green-50 rounded">
                    <div class="text-2xl font-bold text-green-600">142</div>
                    <div class="text-sm text-gray-600">Active Drivers</div>
                </div>
                <div class="text-center p-4 bg-yellow-50 rounded">
                    <div class="text-2xl font-bold text-yellow-600">89</div>
                    <div class="text-sm text-gray-600">Active Transports</div>
                </div>
                <div class="text-center p-4 bg-purple-50 rounded">
                    <div class="text-2xl font-bold text-purple-600">$4,250</div>
                    <div class="text-sm text-gray-600">Monthly Revenue</div>
                </div>
            </div>
            
            <h3 class="text-lg font-medium mb-4">Pricing Tiers</h3>
            <div class="space-y-2">
                <div class="flex justify-between p-3 bg-gray-50 rounded">
                    <span>Starter</span>
                    <span class="font-medium">$15/driver/month</span>
                </div>
                <div class="flex justify-between p-3 bg-gray-50 rounded">
                    <span>Professional</span>
                    <span class="font-medium">$25/driver/month</span>
                </div>
                <div class="flex justify-between p-3 bg-gray-50 rounded">
                    <span>Enterprise</span>
                    <span class="font-medium">$35/driver/month</span>
                </div>
            </div>
            
            <div class="mt-6">
                <a href="/" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                    View Public Website
                </a>
            </div>
        </div>
    </div>
</body>
</html>
  `);
});

// Fleet.Chat homepage
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
                <div class="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:max-w-4xl lg:mx-auto">
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
                                <li class="text-sm text-gray-500">WhatsApp messaging</li>
                                <li class="text-sm text-gray-500">Basic document handling</li>
                                <li class="text-sm text-gray-500">Transport tracking</li>
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
                                <li class="text-sm text-gray-500">All Starter features</li>
                                <li class="text-sm text-gray-500">Advanced analytics</li>
                                <li class="text-sm text-gray-500">Priority support</li>
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
                                <li class="text-sm text-gray-500">All Professional features</li>
                                <li class="text-sm text-gray-500">Dedicated account manager</li>
                                <li class="text-sm text-gray-500">Custom integrations</li>
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
  console.log(`Fleet.Chat running on port ${PORT}`);
  console.log(`Public Website: http://localhost:${PORT}/`);
  console.log(`Admin Portal: http://localhost:${PORT}/admin`);
});