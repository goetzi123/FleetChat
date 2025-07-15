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

// Default route serves Fleet.Chat website with integrated demo
app.get('/', (req, res) => {
  res.redirect('/fleet');
});

// Fleet.Chat website with integrated demo
app.get('/fleet', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, 'fleet.chat', 'index.html');
  res.sendFile(filePath);
});

// Serve static files from fleet.chat directory
app.use('/fleet.chat', express.static(path.join(__dirname, 'fleet.chat')));

// Demo route - WORKING VERSION
app.get('/demo', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
    <title>FleetChat Demo - Event Propagation Working</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .panels { display: flex; gap: 20px; }
        .panel { flex: 1; background: white; border-radius: 8px; padding: 20px; }
        .samsara { border-left: 4px solid #1e40af; }
        .whatsapp { border-left: 4px solid #059669; }
        .btn { width: 100%; padding: 15px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 6px; background: #f8f9fa; cursor: pointer; text-align: left; }
        .btn:hover { background: #e9ecef; }
        .chat { height: 300px; border: 1px solid #e5e7eb; padding: 15px; background: #f9fafb; overflow-y: auto; margin-bottom: 15px; border-radius: 6px; }
        .message { margin-bottom: 10px; }
        .fleet-message { text-align: right; }
        .driver-message { text-align: left; }
        .bubble { display: inline-block; max-width: 80%; padding: 10px; border-radius: 12px; }
        .fleet-bubble { background: #1e40af; color: white; }
        .driver-bubble { background: white; border: 1px solid #d1d5db; }
        .response-btn { width: 100%; padding: 8px; margin-bottom: 4px; background: #059669; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .response-btn:hover { background: #047857; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>FleetChat Demo - Event Propagation WORKING</h1>
            <p>Click any Samsara event to test comprehensive fleet communication workflows</p>
            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 10px; border-radius: 6px; margin-top: 10px;">
                <strong>✅ Comprehensive Samsara Use Cases Active</strong><br>
                <small>Now supporting 10 core transport workflows: Route Assignment, Pickup Coordination, Delivery Management, Safety Monitoring, Vehicle Inspection, Maintenance Alerts, Geofence Notifications, Hours of Service, Emergency Response, and Load Status Tracking</small>
            </div>
        </div>
        
        <div class="panels">
            <div class="panel samsara">
                <h2>🚛 Samsara Fleet Events</h2>
                <button class="btn" onclick="triggerEvent('route')">
                    <strong>🚚 Route Assignment</strong><br>
                    <small>New delivery route assigned</small>
                </button>
                <button class="btn" onclick="triggerEvent('pickup')">
                    <strong>📋 Pickup Reminder</strong><br>
                    <small>Pickup time approaching</small>
                </button>
                <button class="btn" onclick="triggerEvent('delivery')">
                    <strong>📦 Delivery Notification</strong><br>
                    <small>Arrived at delivery location</small>
                </button>
                <button class="btn" onclick="triggerEvent('safety')">
                    <strong>⚠️ Safety Event</strong><br>
                    <small>Harsh braking detected</small>
                </button>
                <button class="btn" onclick="triggerEvent('inspection')">
                    <strong>🔍 Vehicle Inspection</strong><br>
                    <small>Pre-trip inspection required</small>
                </button>
                <button class="btn" onclick="triggerEvent('maintenance')">
                    <strong>🔧 Maintenance Alert</strong><br>
                    <small>Vehicle needs service</small>
                </button>
                <button class="btn" onclick="triggerEvent('geofence')">
                    <strong>📍 Geofence Entry</strong><br>
                    <small>Entered customer location</small>
                </button>
                <button class="btn" onclick="triggerEvent('hos')">
                    <strong>⏰ Hours of Service</strong><br>
                    <small>Break time reminder</small>
                </button>
                <button class="btn" onclick="triggerEvent('emergency')">
                    <strong>🚨 Emergency Response</strong><br>
                    <small>Emergency situation detected</small>
                </button>
                <button class="btn" onclick="triggerEvent('load_status')">
                    <strong>📊 Load Status</strong><br>
                    <small>Load condition check</small>
                </button>
                <div id="status" style="margin-top: 15px; padding: 10px; background: #f0f0f0; border-radius: 4px;">
                    <strong>Status:</strong> <span id="status-text">Ready for events</span>
                </div>
            </div>
            
            <div class="panel whatsapp">
                <h2>💬 WhatsApp Driver Interface</h2>
                <div class="chat" id="chat">
                    <div style="text-align: center; color: #6b7280; padding: 60px 0;">
                        Click a Samsara event to see WhatsApp message
                    </div>
                </div>
                <div>
                    <strong>Driver Responses:</strong>
                    <div id="responses">
                        <div style="color: #6b7280;">Options will appear with messages</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        console.log('FleetChat Demo loaded - All functions working');
        
        function triggerEvent(eventType) {
            console.log('Event triggered:', eventType);
            document.getElementById('status-text').textContent = 'Processing ' + eventType + ' event...';
            
            var events = {
                route: {
                    message: "NEW ROUTE ASSIGNED: ACME Corp, 123 Industrial Blvd, Chicago IL. Please confirm receipt and estimated departure time.",
                    responses: ["✅ Confirm Route", "🗺️ Need Navigation", "⏰ Delay Expected"]
                },
                pickup: {
                    message: "PICKUP REMINDER: ACME Corp pickup in 30 minutes. Any navigation assistance needed?",
                    responses: ["🚚 On My Way", "📍 Send Location", "⏰ Running Late"]
                },
                delivery: {
                    message: "DELIVERY NOTIFICATION: Arrived at Global Industries, 456 Commerce Ave. Ready for unloading. Please confirm delivery status.",
                    responses: ["📦 Delivered Successfully", "📄 Need POD Signature", "⚠️ Delivery Issue"]
                },
                safety: {
                    message: "SAFETY ALERT: Harsh braking event detected at 2:45 PM on Highway 94. Are you okay? Please respond immediately.",
                    responses: ["✅ I'm Safe", "🚨 Need Assistance", "📝 Report Details"]
                },
                inspection: {
                    message: "VEHICLE INSPECTION: Pre-trip inspection required for Vehicle #123. Please complete inspection checklist before departure.",
                    responses: ["✅ Inspection Complete", "⚠️ Issues Found", "📷 Upload Photos"]
                },
                maintenance: {
                    message: "MAINTENANCE ALERT: Vehicle #123 is due for service. Oil change and tire rotation needed. Schedule appointment?",
                    responses: ["🔧 Schedule Service", "📅 Postpone", "✅ Already Scheduled"]
                },
                geofence: {
                    message: "GEOFENCE ENTRY: You've entered customer location - Metro Distribution Center. Please follow site safety protocols.",
                    responses: ["✅ Safety Protocols Followed", "📍 At Loading Dock", "⏰ Need More Time"]
                },
                hos: {
                    message: "HOURS OF SERVICE: You've been driving for 8 hours. Mandatory 30-minute break required. Find nearest rest area?",
                    responses: ["⏰ Taking Break Now", "🛣️ Find Rest Area", "📋 Log Break"]
                },
                emergency: {
                    message: "EMERGENCY RESPONSE: Severe weather alert in your area. Seek shelter immediately. Please confirm your safety status.",
                    responses: ["🏠 Found Shelter", "🚨 Need Emergency Help", "📍 Share Location"]
                },
                load_status: {
                    message: "LOAD STATUS CHECK: Temperature-sensitive cargo requires monitoring. Current temperature: 38°F. Please confirm load condition.",
                    responses: ["🌡️ Temperature OK", "❄️ Too Cold", "📊 Send Full Report"]
                }
            };
            
            var event = events[eventType];
            if (!event) {
                console.error('Unknown event:', eventType);
                return;
            }
            
            setTimeout(function() {
                showTyping();
            }, 500);
            
            setTimeout(function() {
                hideTyping();
                addMessage(event.message, 'fleet');
                showResponses(event.responses);
                document.getElementById('status-text').textContent = 'Message sent to driver. Awaiting response...';
            }, 2500);
        }
        
        function showTyping() {
            var chat = document.getElementById('chat');
            var typingDiv = document.createElement('div');
            typingDiv.id = 'typing';
            typingDiv.className = 'message driver-message';
            typingDiv.innerHTML = '<div class="bubble driver-bubble">FleetChat typing...</div>';
            chat.appendChild(typingDiv);
            chat.scrollTop = chat.scrollHeight;
        }
        
        function hideTyping() {
            var typing = document.getElementById('typing');
            if (typing) typing.remove();
        }
        
        function addMessage(text, sender) {
            var chat = document.getElementById('chat');
            if (chat.children.length === 1 && chat.children[0].style.textAlign === 'center') {
                chat.innerHTML = '';
            }
            
            var messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + (sender === 'fleet' ? 'fleet-message' : 'driver-message');
            
            var bubbleDiv = document.createElement('div');
            bubbleDiv.className = 'bubble ' + (sender === 'fleet' ? 'fleet-bubble' : 'driver-bubble');
            bubbleDiv.innerHTML = text + '<div style="font-size: 10px; margin-top: 5px; opacity: 0.7;">' + new Date().toLocaleTimeString() + '</div>';
            
            messageDiv.appendChild(bubbleDiv);
            chat.appendChild(messageDiv);
            chat.scrollTop = chat.scrollHeight;
        }
        
        function showResponses(options) {
            var responsesDiv = document.getElementById('responses');
            responsesDiv.innerHTML = '';
            
            for (var i = 0; i < options.length; i++) {
                var btn = document.createElement('button');
                btn.className = 'response-btn';
                btn.textContent = options[i];
                btn.onclick = (function(response) {
                    return function() { sendResponse(response); };
                })(options[i]);
                responsesDiv.appendChild(btn);
            }
        }
        
        function sendResponse(response) {
            console.log('Driver response:', response);
            
            addMessage(response, 'driver');
            document.getElementById('responses').innerHTML = '<div style="color: #059669; font-weight: bold;">✓ Response sent to Samsara</div>';
            
            setTimeout(function() {
                document.getElementById('status-text').textContent = 'Driver responded: "' + response + '"';
            }, 1000);
            
            setTimeout(function() {
                document.getElementById('status-text').textContent = 'Transport status updated in Samsara Fleet Management ✅';
            }, 2500);
        }
        
        console.log('All functions loaded. triggerEvent ready for testing.');
    </script>
</body>
</html>`);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'live',
    service: 'Fleet.Chat Website',
    timestamp: new Date().toISOString()
  });
});

// Handle remaining routes
app.use((req, res) => {
  if (req.path.startsWith('/admin') || req.path.startsWith('/api/admin') || req.path.startsWith('/demo') || req.path.startsWith('/api/demo')) {
    return res.status(404).send('Not Found');
  }
  res.sendFile(path.join(__dirname, 'fleet-chat-dynamic.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fleet.Chat demo server live on port ${PORT}`);
});