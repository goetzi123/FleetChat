const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.static('.'));

// Test admin user
const testAdmin = {
  id: 'admin-1',
  email: 'admin@fleet.chat',
  name: 'Fleet.Chat Admin',
  passwordHash: '$2b$10$rOvRw2HxWGzF8EO4WM5QJ.K5mGfTdDWxn7A8vHNzQXLSq2w8zP6K6', // FleetChat2025!
  permissions: ['all']
};

// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (email === testAdmin.email) {
    const isValid = await bcrypt.compare(password, testAdmin.passwordHash);
    if (isValid) {
      res.json({
        success: true,
        admin: {
          id: testAdmin.id,
          email: testAdmin.email,
          name: testAdmin.name,
          permissions: testAdmin.permissions
        }
      });
      return;
    }
  }
  
  res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// Dashboard data
app.get('/api/admin/dashboard/overview', (req, res) => {
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

app.get('/api/admin/pricing/tiers', (req, res) => {
  res.json([
    {
      id: 'tier-1',
      name: 'Starter',
      description: 'Perfect for small fleets getting started',
      pricePerDriver: 15,
      minDrivers: 1,
      maxDrivers: 50,
      features: ['WhatsApp messaging', 'Basic document handling', 'Transport tracking', 'Standard support'],
      isActive: true
    },
    {
      id: 'tier-2', 
      name: 'Professional',
      description: 'Ideal for growing fleet operations',
      pricePerDriver: 25,
      minDrivers: 1,
      maxDrivers: 200,
      features: ['All Starter features', 'Advanced analytics', 'Custom workflows', 'Priority support'],
      isActive: true
    }
  ]);
});

// Admin login page
app.get('/admin', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Fleet.Chat Admin Login</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 0; background: #f5f5f5; }
        .container { max-width: 400px; margin: 100px auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .logo { text-align: center; margin-bottom: 30px; color: #059669; font-size: 1.5rem; font-weight: bold; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: 500; }
        input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box; }
        button { width: 100%; background: #059669; color: white; padding: 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background: #047857; }
        .error { color: #dc2626; margin-top: 10px; font-size: 14px; }
        .test-info { background: #f0f9ff; border: 1px solid #0ea5e9; padding: 15px; border-radius: 4px; margin-bottom: 20px; font-size: 14px; }
        .result { margin-top: 20px; padding: 15px; border-radius: 4px; }
        .success { background: #dcfce7; border: 1px solid #16a34a; color: #15803d; }
        .dashboard-link { display: block; text-align: center; margin-top: 15px; color: #059669; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">Fleet.Chat Admin Portal</div>
        
        <div class="test-info">
            <strong>Test Credentials:</strong><br>
            Email: admin@fleet.chat<br>
            Password: FleetChat2025!
        </div>

        <form id="loginForm">
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" id="email" value="admin@fleet.chat" required>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" id="password" required>
            </div>
            <button type="submit">Login to Admin Portal</button>
            <div id="error" class="error" style="display: none;"></div>
            <div id="result" style="display: none;"></div>
        </form>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('error');
            const resultDiv = document.getElementById('result');
            
            errorDiv.style.display = 'none';
            resultDiv.style.display = 'none';
            
            try {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    resultDiv.className = 'result success';
                    resultDiv.innerHTML = \`
                        <strong>Login Successful!</strong><br>
                        Welcome, \${data.admin.name}<br>
                        Admin ID: \${data.admin.id}<br>
                        Permissions: \${data.admin.permissions.join(', ')}
                        <a href="/admin/dashboard" class="dashboard-link">→ Go to Dashboard</a>
                    \`;
                    resultDiv.style.display = 'block';
                } else {
                    errorDiv.textContent = data.message || 'Login failed';
                    errorDiv.style.display = 'block';
                }
            } catch (error) {
                errorDiv.textContent = 'Network error: ' + error.message;
                errorDiv.style.display = 'block';
            }
        });
    </script>
</body>
</html>
  `);
});

// Simple dashboard
app.get('/admin/dashboard', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Fleet.Chat Admin Dashboard</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 0; background: #f5f5f5; }
        .header { background: white; padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
        .logo { color: #059669; font-size: 1.25rem; font-weight: bold; }
        .main { max-width: 1200px; margin: 20px auto; padding: 0 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-value { font-size: 2rem; font-weight: bold; color: #059669; }
        .stat-label { color: #6b7280; margin-top: 5px; }
        .section { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .loading { text-align: center; padding: 20px; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">Fleet.Chat Admin Dashboard</div>
        <div>System Management Portal</div>
    </div>

    <div class="main">
        <h1>System Overview</h1>
        
        <div class="grid" id="statsGrid">
            <div class="loading">Loading statistics...</div>
        </div>

        <div class="section">
            <h2>Pricing Tiers</h2>
            <div id="pricingTable" class="loading">Loading pricing data...</div>
        </div>
    </div>

    <script>
        async function loadDashboard() {
            try {
                // Load overview stats
                const overviewResponse = await fetch('/api/admin/dashboard/overview');
                const stats = await overviewResponse.json();
                
                document.getElementById('statsGrid').innerHTML = \`
                    <div class="card">
                        <div class="stat-value">\${stats.totalTenants}</div>
                        <div class="stat-label">Total Fleet Operators</div>
                    </div>
                    <div class="card">
                        <div class="stat-value">\${stats.activeDrivers}</div>
                        <div class="stat-label">Active Drivers</div>
                    </div>
                    <div class="card">
                        <div class="stat-value">\${stats.totalTransports.toLocaleString()}</div>
                        <div class="stat-label">Total Transports</div>
                    </div>
                    <div class="card">
                        <div class="stat-value">$\${stats.monthlyRevenue.toLocaleString()}</div>
                        <div class="stat-label">Monthly Revenue</div>
                    </div>
                \`;

                // Load pricing tiers
                const pricingResponse = await fetch('/api/admin/pricing/tiers');
                const tiers = await pricingResponse.json();
                
                document.getElementById('pricingTable').innerHTML = \`
                    <table>
                        <thead>
                            <tr>
                                <th>Tier Name</th>
                                <th>Description</th>
                                <th>Price per Driver</th>
                                <th>Driver Range</th>
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
                                    <td>\${tier.isActive ? 'Active' : 'Inactive'}</td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                \`;
            } catch (error) {
                console.error('Failed to load dashboard:', error);
            }
        }

        loadDashboard();
    </script>
</body>
</html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Admin Portal Test Server running on port ${PORT}`);
  console.log(`Login: http://localhost:${PORT}/admin`);
  console.log(`Credentials: admin@fleet.chat / FleetChat2025!`);
});