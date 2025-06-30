const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('client/dist'));

// Session configuration
app.use(session({
  name: 'fleet-admin-session',
  secret: 'fleet-admin-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // Set to false for testing
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// In-memory admin storage for testing
const adminUsers = [
  {
    id: 'admin-1',
    email: 'admin@fleet.chat',
    name: 'Fleet.Chat Admin',
    passwordHash: '$2b$10$rOvRw2HxWGzF8EO4WM5QJ.K5mGfTdDWxn7A8vHNzQXLSq2w8zP6K6', // FleetChat2025!
    permissions: ['all'],
    createdAt: new Date(),
    lastLoginAt: null
  }
];

// Helper function to validate password
async function validatePassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    return false;
  }
}

// Admin authentication middleware
function requireAdminAuth(req, res, next) {
  if (!req.session?.adminId) {
    return res.status(401).json({ message: "Admin authentication required" });
  }
  next();
}

// Admin routes
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const admin = adminUsers.find(u => u.email === email);
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await validatePassword(password, admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    req.session.adminId = admin.id;
    req.session.adminEmail = admin.email;
    
    // Update last login
    admin.lastLoginAt = new Date();

    res.json({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      permissions: admin.permissions,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

app.get('/api/admin/me', requireAdminAuth, async (req, res) => {
  try {
    const admin = adminUsers.find(u => u.id === req.session.adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      permissions: admin.permissions,
      lastLoginAt: admin.lastLoginAt,
    });
  } catch (error) {
    console.error("Admin profile error:", error);
    res.status(500).json({ message: "Failed to get admin profile" });
  }
});

// Dashboard data endpoints
app.get('/api/admin/dashboard/overview', requireAdminAuth, (req, res) => {
  res.json({
    totalTenants: 12,
    activeTenants: 8,
    totalDrivers: 156,
    activeDrivers: 142,
    totalTransports: 1247,
    totalMessages: 8936,
    monthlyRevenue: 4250
  });
});

app.get('/api/admin/dashboard/tenants', requireAdminAuth, (req, res) => {
  res.json([
    {
      tenantId: 'tenant-1',
      companyName: 'ABC Logistics',
      activeDrivers: 25,
      totalTransports: 342,
      totalMessages: 1826,
      monthlyBilling: 625,
      serviceTier: 'Professional'
    },
    {
      tenantId: 'tenant-2', 
      companyName: 'Fast Transport Co',
      activeDrivers: 18,
      totalTransports: 298,
      totalMessages: 1453,
      monthlyBilling: 450,
      serviceTier: 'Starter'
    }
  ]);
});

// Pricing management endpoints
app.get('/api/admin/pricing/tiers', requireAdminAuth, (req, res) => {
  res.json([
    {
      id: 'tier-1',
      name: 'Starter',
      description: 'Perfect for small fleets getting started',
      pricePerDriver: 15,
      minDrivers: 1,
      maxDrivers: 50,
      features: ['WhatsApp messaging', 'Basic document handling', 'Transport tracking', 'Standard support'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'tier-2',
      name: 'Professional',
      description: 'Ideal for growing fleet operations',
      pricePerDriver: 25,
      minDrivers: 1,
      maxDrivers: 200,
      features: ['All Starter features', 'Advanced analytics', 'Custom workflows', 'Priority support', '24/7 support'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'tier-3',
      name: 'Enterprise',
      description: 'Complete solution for large operations',
      pricePerDriver: 35,
      minDrivers: 1,
      maxDrivers: null,
      features: ['All Professional features', 'Multi-fleet management', 'Dedicated account manager', 'Custom integrations', 'SLA guarantees'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
});

// Health check
app.get('/api/admin/health', (req, res) => {
  res.json({
    status: "healthy",
    service: "Fleet.Chat Admin API",
    timestamp: new Date().toISOString(),
  });
});

// Serve admin login page
app.get('/admin/login', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fleet.Chat Admin Login</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
        }
        .logo {
            text-align: center;
            margin-bottom: 2rem;
        }
        .logo h1 {
            color: #059669;
            margin: 0;
            font-size: 1.5rem;
        }
        .form-group {
            margin-bottom: 1rem;
        }
        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #374151;
        }
        input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            font-size: 1rem;
            box-sizing: border-box;
        }
        input:focus {
            outline: none;
            border-color: #059669;
            box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
        }
        .btn {
            width: 100%;
            background-color: #059669;
            color: white;
            padding: 0.75rem;
            border: none;
            border-radius: 4px;
            font-size: 1rem;
            cursor: pointer;
            margin-top: 1rem;
        }
        .btn:hover {
            background-color: #047857;
        }
        .btn:disabled {
            background-color: #9ca3af;
            cursor: not-allowed;
        }
        .error {
            color: #dc2626;
            margin-top: 0.5rem;
            font-size: 0.875rem;
        }
        .test-credentials {
            background-color: #f3f4f6;
            padding: 1rem;
            border-radius: 4px;
            margin-bottom: 1rem;
            font-size: 0.875rem;
        }
        .test-credentials strong {
            color: #374151;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <h1>Fleet.Chat Admin</h1>
            <p>System Administration Portal</p>
        </div>
        
        <div class="test-credentials">
            <strong>Test Credentials:</strong><br>
            Email: admin@fleet.chat<br>
            Password: FleetChat2025!
        </div>

        <form id="loginForm">
            <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" value="admin@fleet.chat" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <button type="submit" class="btn" id="loginBtn">Sign In</button>
            
            <div id="error" class="error" style="display: none;"></div>
        </form>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const loginBtn = document.getElementById('loginBtn');
            const errorDiv = document.getElementById('error');
            
            loginBtn.disabled = true;
            loginBtn.textContent = 'Signing in...';
            errorDiv.style.display = 'none';
            
            try {
                const formData = new FormData(e.target);
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: formData.get('email'),
                        password: formData.get('password')
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    window.location.href = '/admin/dashboard';
                } else {
                    errorDiv.textContent = data.message || 'Login failed';
                    errorDiv.style.display = 'block';
                }
            } catch (error) {
                errorDiv.textContent = 'Network error. Please try again.';
                errorDiv.style.display = 'block';
            }
            
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        });
    </script>
</body>
</html>
  `);
});

// Serve admin dashboard page
app.get('/admin/dashboard', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fleet.Chat Admin Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background-color: #f9fafb;
            line-height: 1.6;
        }
        .header {
            background: white;
            border-bottom: 1px solid #e5e7eb;
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo {
            font-size: 1.25rem;
            font-weight: bold;
            color: #059669;
        }
        .user-menu {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        .btn-logout {
            background: #dc2626;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
        }
        .btn-logout:hover {
            background: #b91c1c;
        }
        .main-content {
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        .dashboard-header {
            margin-bottom: 2rem;
        }
        .dashboard-header h1 {
            color: #111827;
            margin-bottom: 0.5rem;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #059669;
            margin-bottom: 0.5rem;
        }
        .stat-label {
            color: #6b7280;
            font-size: 0.875rem;
        }
        .tabs {
            display: flex;
            background: white;
            border-radius: 8px 8px 0 0;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 0;
        }
        .tab {
            padding: 1rem 1.5rem;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }
        .tab.active {
            border-bottom-color: #059669;
            color: #059669;
        }
        .tab:hover {
            background: #f9fafb;
        }
        .tab-content {
            background: white;
            padding: 2rem;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .tab-panel {
            display: none;
        }
        .tab-panel.active {
            display: block;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
        }
        .table th,
        .table td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        .table th {
            background: #f9fafb;
            font-weight: 600;
            color: #374151;
        }
        .loading {
            text-align: center;
            padding: 2rem;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">Fleet.Chat Admin</div>
        <div class="user-menu">
            <span id="adminName">Loading...</span>
            <button class="btn-logout" onclick="logout()">Logout</button>
        </div>
    </div>

    <div class="main-content">
        <div class="dashboard-header">
            <h1>System Dashboard</h1>
            <p>Monitor and manage your Fleet.Chat system</p>
        </div>

        <div class="stats-grid" id="statsGrid">
            <div class="loading">Loading statistics...</div>
        </div>

        <div class="tabs">
            <div class="tab active" onclick="switchTab('overview')">Overview</div>
            <div class="tab" onclick="switchTab('tenants')">Fleet Operators</div>
            <div class="tab" onclick="switchTab('pricing')">Pricing</div>
        </div>

        <div class="tab-content">
            <div id="overview" class="tab-panel active">
                <h3>System Overview</h3>
                <div id="overviewContent" class="loading">Loading overview data...</div>
            </div>

            <div id="tenants" class="tab-panel">
                <h3>Fleet Operators</h3>
                <div id="tenantsContent" class="loading">Loading tenant data...</div>
            </div>

            <div id="pricing" class="tab-panel">
                <h3>Pricing Management</h3>
                <div id="pricingContent" class="loading">Loading pricing data...</div>
            </div>
        </div>
    </div>

    <script>
        let currentUser = null;

        // Check authentication and load user data
        async function checkAuth() {
            try {
                const response = await fetch('/api/admin/me');
                if (response.ok) {
                    currentUser = await response.json();
                    document.getElementById('adminName').textContent = currentUser.name;
                    loadDashboardData();
                } else {
                    window.location.href = '/admin/login';
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                window.location.href = '/admin/login';
            }
        }

        // Load dashboard data
        async function loadDashboardData() {
            await Promise.all([
                loadOverview(),
                loadTenants(),
                loadPricing()
            ]);
        }

        // Load overview statistics
        async function loadOverview() {
            try {
                const response = await fetch('/api/admin/dashboard/overview');
                const data = await response.json();
                
                // Update stats grid
                const statsGrid = document.getElementById('statsGrid');
                statsGrid.innerHTML = \`
                    <div class="stat-card">
                        <div class="stat-value">\${data.totalTenants}</div>
                        <div class="stat-label">Total Fleet Operators</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">\${data.activeDrivers}</div>
                        <div class="stat-label">Active Drivers</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">\${data.totalTransports}</div>
                        <div class="stat-label">Total Transports</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">$\${data.monthlyRevenue.toLocaleString()}</div>
                        <div class="stat-label">Monthly Revenue</div>
                    </div>
                \`;

                document.getElementById('overviewContent').innerHTML = \`
                    <p>System running normally with \${data.activeTenants} active fleet operators out of \${data.totalTenants} total.</p>
                    <p>Processing \${data.totalMessages.toLocaleString()} messages across \${data.totalTransports.toLocaleString()} transports.</p>
                \`;
            } catch (error) {
                console.error('Failed to load overview:', error);
            }
        }

        // Load tenant data
        async function loadTenants() {
            try {
                const response = await fetch('/api/admin/dashboard/tenants');
                const tenants = await response.json();
                
                const html = \`
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Company Name</th>
                                <th>Active Drivers</th>
                                <th>Transports</th>
                                <th>Messages</th>
                                <th>Monthly Billing</th>
                                <th>Service Tier</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${tenants.map(tenant => \`
                                <tr>
                                    <td>\${tenant.companyName}</td>
                                    <td>\${tenant.activeDrivers}</td>
                                    <td>\${tenant.totalTransports}</td>
                                    <td>\${tenant.totalMessages.toLocaleString()}</td>
                                    <td>$\${tenant.monthlyBilling}</td>
                                    <td>\${tenant.serviceTier}</td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                \`;
                
                document.getElementById('tenantsContent').innerHTML = html;
            } catch (error) {
                console.error('Failed to load tenants:', error);
            }
        }

        // Load pricing data
        async function loadPricing() {
            try {
                const response = await fetch('/api/admin/pricing/tiers');
                const tiers = await response.json();
                
                const html = \`
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Tier Name</th>
                                <th>Description</th>
                                <th>Price per Driver</th>
                                <th>Driver Range</th>
                                <th>Features</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${tiers.map(tier => \`
                                <tr>
                                    <td><strong>\${tier.name}</strong></td>
                                    <td>\${tier.description}</td>
                                    <td>$\${tier.pricePerDriver}/month</td>
                                    <td>\${tier.minDrivers} - \${tier.maxDrivers || '∞'}</td>
                                    <td>\${tier.features.slice(0, 2).join(', ')}...</td>
                                    <td>\${tier.isActive ? 'Active' : 'Inactive'}</td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                \`;
                
                document.getElementById('pricingContent').innerHTML = html;
            } catch (error) {
                console.error('Failed to load pricing:', error);
            }
        }

        // Switch tabs
        function switchTab(tabName) {
            // Update tab buttons
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            event.target.classList.add('active');
            
            // Update tab panels
            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');
        }

        // Logout function
        async function logout() {
            try {
                await fetch('/api/admin/logout', { method: 'POST' });
                window.location.href = '/admin/login';
            } catch (error) {
                console.error('Logout failed:', error);
                window.location.href = '/admin/login';
            }
        }

        // Initialize dashboard
        checkAuth();
    </script>
</body>
</html>
  `);
});

// Redirect admin root to login
app.get('/admin', (req, res) => {
  res.redirect('/admin/login');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fleet.Chat Admin Test Server running on port ${PORT}`);
  console.log(`Admin login: http://localhost:${PORT}/admin/login`);
  console.log(`Test credentials: admin@fleet.chat / FleetChat2025!`);
});