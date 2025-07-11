# FleetChat Customer Portal Specification - Dual Platform Support

## Overview

The FleetChat Customer Portal provides fleet operators with a comprehensive interface to configure, monitor, and manage their fleet communication system. With the addition of dual platform support, the portal now accommodates both Samsara and Geotab integrations while maintaining simplicity and ease of use.

## Portal Architecture

### Authentication & Access
- **Single Sign-On**: Unified login for all fleet operators
- **Role-Based Access**: Fleet admin, operator, and viewer roles
- **Multi-Factor Authentication**: Optional 2FA for enhanced security
- **Session Management**: Secure session handling with automatic timeout

### Navigation Structure
```
Dashboard
├── Overview (Home)
├── Fleet Integration
│   ├── Platform Selection
│   ├── Samsara Configuration
│   ├── Geotab Configuration
│   └── Connection Testing
├── Drivers
│   ├── Driver Discovery
│   ├── WhatsApp Onboarding
│   ├── Communication Status
│   └── Driver Management
├── Vehicles
│   ├── Vehicle List
│   ├── Location Tracking
│   └── Diagnostic Status
├── Messages
│   ├── Message History
│   ├── Template Management
│   └── Response Analytics
├── Analytics
│   ├── Communication Metrics
│   ├── Driver Engagement
│   └── System Performance
├── Billing
│   ├── Usage Overview
│   ├── Invoice History
│   └── Payment Methods
└── Settings
    ├── Account Settings
    ├── Notification Preferences
    └── API Access
```

## Fleet Integration Management

### Platform Selection Interface

**Initial Setup Flow:**
1. **Platform Selection**: Choose between Samsara or Geotab
2. **Credential Configuration**: Platform-specific setup forms
3. **Connection Testing**: Automated validation
4. **Driver Discovery**: Automatic import from fleet platform
5. **WhatsApp Setup**: Phone number verification and onboarding

### Samsara Integration Panel

**Configuration Form:**
```
┌─── Samsara Integration ──────────────────────────┐
│                                                  │
│ Platform: [Samsara] ✓                           │
│                                                  │
│ API Token: [●●●●●●●●●●●●●●●●] [Test Connection]  │
│                                                  │
│ Group ID (Optional): [________________]          │
│                                                  │
│ Webhook Status: ✅ Active                       │
│ Last Event: 2 minutes ago                       │
│                                                  │
│ [Save Configuration] [Advanced Settings]        │
└──────────────────────────────────────────────────┘
```

**Advanced Samsara Settings:**
- Webhook endpoint configuration
- Event type selection
- Rate limiting preferences
- Custom API endpoints
- Debug logging level

### Geotab Integration Panel

**Configuration Form:**
```
┌─── Geotab Integration ───────────────────────────┐
│                                                  │
│ Platform: [Geotab] ✓                            │
│                                                  │
│ Username: [fleet_admin]                          │
│ Password: [●●●●●●●●●●] [Test Connection]         │
│ Database: [CompanyFleet]                         │
│ Server: [my.geotab.com]                          │
│                                                  │
│ Session Status: ✅ Active                       │
│ Last Sync: 30 seconds ago                       │
│                                                  │
│ [Save Configuration] [Advanced Settings]        │
└──────────────────────────────────────────────────┘
```

**Advanced Geotab Settings:**
- Polling interval configuration
- Data feed preferences
- Server selection
- Session timeout settings
- Custom diagnostic filters

## Driver Management Interface

### Driver Discovery Dashboard

**Unified Driver List:**
```
┌─── Discovered Drivers ───────────────────────────────────────┐
│ 📋 Total: 45 drivers | ✅ Active: 42 | 📱 WhatsApp: 38     │
│                                                              │
│ Search: [________________] Filter: [All▼] [Samsara/Geotab▼] │
│                                                              │
│ Name              Phone         Platform  WhatsApp  Action   │
│ ──────────────────────────────────────────────────────────── │
│ John Smith        +1234567890   Samsara   ✅       [Manage] │
│ Jane Doe          +1987654321   Samsara   ⏳       [Enroll] │
│ Mike Johnson      +1122334455   Samsara   ❌       [Retry]  │
│ Sarah Wilson      +1555666777   Samsara   ✅       [Manage] │
│                                                              │
│ [Select All] [Bulk Enroll] [Export List]                   │
└──────────────────────────────────────────────────────────────┘
```

### Driver Onboarding Workflow

**Step-by-Step Process:**
1. **Discovery**: Automatic import from fleet platform
2. **Phone Verification**: Validate phone numbers
3. **SMS Invitation**: Send WhatsApp enrollment link
4. **Confirmation**: Monitor enrollment status
5. **Testing**: Send test message
6. **Activation**: Enable for fleet communication

**Onboarding Status Indicators:**
- 🔍 **Discovered**: Imported from fleet platform
- 📞 **Phone Verified**: Valid phone number confirmed
- 📨 **Invited**: SMS invitation sent
- ⏳ **Pending**: Waiting for WhatsApp enrollment
- ✅ **Active**: Enrolled and ready for communication
- ❌ **Failed**: Requires manual intervention

## Vehicle Management Interface

### Vehicle Dashboard

**Platform-Unified Vehicle List:**
```
┌─── Fleet Vehicles ───────────────────────────────────────────┐
│ 🚛 Total: 25 vehicles | 🟢 Active: 23 | 📍 Tracked: 25     │
│                                                              │
│ Vehicle           Driver        Platform  Status   Location  │
│ ──────────────────────────────────────────────────────────── │
│ Truck-001         John Smith    Samsara   Moving   Oakland   │
│ Truck-002         Jane Doe      Samsara   Idle     San Jose  │
│ Van-003          Mike Johnson   Samsara   Moving   Fremont   │
│ Truck-004         Sarah Wilson  Samsara   Stopped  Berkeley  │
│                                                              │
│ [Real-time Map] [Export Data] [Vehicle Details]            │
└──────────────────────────────────────────────────────────────┘
```

### Real-Time Tracking Map

**Interactive Map Features:**
- Live vehicle positions
- Driver status indicators
- Route visualization
- Geofence boundaries
- Event markers
- Historical trails

## Message Management System

### Communication History

**Message Thread View:**
```
┌─── Communication History ────────────────────────────────────┐
│ Driver: John Smith | Vehicle: Truck-001 | Today             │
│                                                              │
│ 10:30 AM [System] Route assigned: Oakland to San Jose       │
│          [Confirm when ready to start]                      │
│          [Start Route] [Delay]                               │
│                                                              │
│ 10:32 AM [John] ✅ Start Route                              │
│                                                              │
│ 10:35 AM [System] 📍 Next stop: 123 Main St, San Jose     │
│          [Arrived] [Issue] [Need Help]                      │
│                                                              │
│ 11:45 AM [John] ✅ Arrived                                 │
│                                                              │
│ [Load More] [Export Chat] [Driver Profile]                 │
└──────────────────────────────────────────────────────────────┘
```

### Message Template Management

**Template Editor:**
```
┌─── Message Templates ────────────────────────────────────────┐
│ Category: [Route Management▼] Language: [English▼]          │
│                                                              │
│ Template: Route Assignment                                   │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 🚛 Route assigned: {{route.name}}                     │  │
│ │ 📍 First stop: {{stop.address}}                       │  │
│ │ ⏰ ETA: {{stop.eta}}                                   │  │
│ │                                                        │  │
│ │ Confirm when ready to start                            │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ Buttons: [Start Route] [Delay] [+ Add Button]               │
│                                                              │
│ Variables Available:                                         │
│ • {{driver.name}} • {{vehicle.name}} • {{route.name}}      │
│ • {{stop.address}} • {{stop.eta}} • {{company.name}}       │
│                                                              │
│ [Save Template] [Preview] [Test Send]                       │
└──────────────────────────────────────────────────────────────┘
```

## Analytics & Reporting

### Communication Metrics Dashboard

**Key Performance Indicators:**
```
┌─── Communication Analytics ──────────────────────────────────┐
│ Today | This Week | This Month | Custom Range              │
│                                                              │
│ 📊 Messages Sent: 1,247     📱 Response Rate: 94%          │
│ ⏱️ Avg Response Time: 3.2 min  ✅ Delivery Rate: 99.8%    │
│                                                              │
│ 📈 Trends:                   🎯 Top Events:                 │
│ ├─ Messages: ↗️ +12%         ├─ Route Assignments: 67%      │
│ ├─ Responses: ↗️ +8%         ├─ Arrival Confirmations: 23%  │
│ └─ Engagement: ↗️ +5%        └─ Issue Reports: 10%          │
│                                                              │
│ [Detailed Report] [Export Data] [Schedule Report]           │
└──────────────────────────────────────────────────────────────┘
```

### Driver Engagement Analysis

**Individual Driver Metrics:**
- Response time patterns
- Message engagement rates
- Communication preferences
- Performance trends
- Issue resolution efficiency

### Platform Performance Comparison

**Cross-Platform Analytics:**
```
Platform Performance Comparison

Samsara Integration:
├─ API Response Time: 245ms avg
├─ Event Processing: Real-time
├─ Data Accuracy: 99.9%
└─ Uptime: 99.95%

Geotab Integration:
├─ API Response Time: 380ms avg  
├─ Event Processing: 60s polling
├─ Data Accuracy: 99.8%
└─ Uptime: 99.92%
```

## Billing & Usage Management

### Usage Dashboard

**Current Billing Period:**
```
┌─── Billing Overview ─────────────────────────────────────────┐
│ Current Plan: Professional | Billing Period: March 1-31     │
│                                                              │
│ 👥 Active Drivers: 42/50    💰 Current Charges: $420.00    │
│ 📱 Messages Sent: 12,470    📊 Usage: 84% of allowance     │
│                                                              │
│ Platform Breakdown:                                          │
│ ├─ Samsara Drivers: 42      Cost: $420.00                  │
│ ├─ Geotab Drivers: 0        Cost: $0.00                    │
│ └─ Total: 42 drivers        Monthly: $420.00               │
│                                                              │
│ Next Invoice: April 1, 2025                                 │
│ [View Detailed Usage] [Payment Methods] [Upgrade Plan]      │
└──────────────────────────────────────────────────────────────┘
```

### Invoice History

**Billing Records:**
```
Invoice History

March 2025    $420.00    Paid    [Download PDF]
February 2025 $380.00    Paid    [Download PDF]  
January 2025  $360.00    Paid    [Download PDF]
```

## System Health & Monitoring

### Platform Status Dashboard

**Real-Time System Health:**
```
┌─── System Status ────────────────────────────────────────────┐
│ Overall Status: ✅ All Systems Operational                  │
│                                                              │
│ Fleet Platform:                                              │
│ ├─ Samsara API: ✅ Connected (245ms)                       │
│ ├─ Webhook Status: ✅ Receiving events                     │
│ └─ Last Event: 2 minutes ago                                │
│                                                              │
│ WhatsApp Service:                                            │
│ ├─ Message Delivery: ✅ 99.8% success rate                 │
│ ├─ Response Processing: ✅ Active                           │
│ └─ Queue Status: ✅ Empty                                   │
│                                                              │
│ [Detailed Logs] [Performance Metrics] [Support]             │
└──────────────────────────────────────────────────────────────┘
```

### Alert Management

**Notification Center:**
```
Recent Alerts

🟡 Warning: High message volume detected (2 hours ago)
   Action: Rate limiting automatically applied

✅ Resolved: Samsara API timeout (4 hours ago)  
   Duration: 3 minutes | Impact: Minimal

ℹ️ Info: New driver enrolled: Mike Johnson (6 hours ago)
   Status: WhatsApp confirmed
```

## Settings & Configuration

### Account Settings

**Organization Profile:**
- Company information
- Primary contact details
- Fleet characteristics
- Industry classification
- Time zone settings

### Notification Preferences

**Alert Configuration:**
```
Email Notifications:
☑️ System alerts and outages
☑️ Billing and payment reminders  
☑️ Weekly usage reports
☐ Daily activity summaries

SMS Notifications:
☑️ Critical system issues only
☐ All system alerts
☐ Billing notifications

In-App Notifications:
☑️ New driver enrollments
☑️ Failed message delivery
☑️ Platform connection issues
```

### API Access Management

**Developer Tools:**
- API key generation
- Webhook testing tools
- Integration documentation
- Rate limit monitoring
- Usage analytics

## Mobile Responsiveness

The Customer Portal is fully responsive and optimized for:
- **Desktop**: Full-featured interface with advanced analytics
- **Tablet**: Streamlined interface with essential functions
- **Mobile**: Quick access to critical operations and alerts

## Security Features

### Data Protection
- **Encryption**: All data encrypted in transit and at rest
- **Access Control**: Role-based permissions and audit logging
- **Compliance**: GDPR, CCPA, and industry standards
- **Backup**: Automated daily backups with point-in-time recovery

### Platform Security
- **API Security**: Token rotation and rate limiting
- **Session Management**: Secure authentication with timeout
- **Audit Trail**: Complete activity logging
- **Vulnerability Management**: Regular security assessments

This updated Customer Portal specification provides fleet operators with comprehensive tools to manage their dual-platform fleet communication system while maintaining simplicity and ease of use.