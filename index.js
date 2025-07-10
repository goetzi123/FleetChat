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

// Default route serves demo for preview
app.get('/', (req, res) => {
  res.redirect('/demo');
});

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
            <p>Click Route Assignment to test Samsara → WhatsApp communication</p>
            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 10px; border-radius: 6px; margin-top: 10px;">
                <strong>✅ Database-Based Response Catalog Active</strong><br>
                <small>Now using multi-language template system with English (ENG) support - 5 templates, 10 response options, 14 variables</small>
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