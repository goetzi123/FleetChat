# Fleet Operator Onboarding Guide - Dual Platform Support

## Overview

FleetChat now supports both **Samsara** and **Geotab** fleet management platforms. This guide walks you through the complete onboarding process for either platform, enabling seamless WhatsApp communication with your drivers.

## Platform Selection

**Choose Your Fleet Management Platform:**
- **Samsara**: Modern cloud-native platform with real-time webhook events
- **Geotab**: Comprehensive telematics platform with advanced diagnostics

*Note: Each FleetChat account connects to ONE platform. You cannot use both simultaneously.*

---

## Samsara Integration Setup

### Prerequisites
- Active Samsara account with API access
- Admin privileges in your Samsara organization
- Driver phone numbers configured in Samsara

### Step 1: Generate Samsara API Token
1. Log into your Samsara dashboard
2. Navigate to **Settings** → **API Tokens**
3. Click **Generate New Token**
4. Select scopes:
   - `drivers:read` (required)
   - `drivers:write` (optional, for status updates)
   - `vehicles:read` (required)
   - `routes:read` (required)
   - `routes:write` (required for route creation)
   - `locations:read` (required)
5. Copy the generated token (starts with `samsara_api_`)

### Step 2: Configure Fleet.Chat Integration
1. Access your Fleet.Chat dashboard
2. Go to **Settings** → **Fleet Integration**
3. Select **Samsara** as your platform
4. Enter your API configuration:
   ```
   Platform: Samsara
   API Token: [Your Samsara API Token]
   Group ID: [Optional - specific group to monitor]
   ```
5. Click **Test Connection** to verify
6. Save configuration

### Step 3: Setup Webhook Endpoints
Fleet.Chat automatically configures webhooks for real-time events:
- **Webhook URL**: `https://[your-domain].fleet.chat/api/webhooks/samsara`
- **Event Types**: 
  - Driver vehicle assignments
  - Vehicle engine events
  - Route assignments
  - Geofence entries/exits
  - Safety events

### Step 4: Driver Discovery & Onboarding
1. Fleet.Chat will automatically discover drivers from Samsara
2. Review the **Drivers** tab in your dashboard
3. Select drivers to enable for WhatsApp communication
4. Drivers will receive SMS invitations to join WhatsApp
5. Monitor onboarding progress in the dashboard

---

## Geotab Integration Setup

### Prerequisites
- Active Geotab account with API access
- MyGeotab credentials
- Driver phone numbers configured in Geotab

### Step 1: Gather Geotab Credentials
You'll need the following information:
- **Username**: Your MyGeotab username
- **Password**: Your MyGeotab password
- **Database**: Your Geotab database name (e.g., "CompanyName")
- **Server** (optional): Specific Geotab server (defaults to my.geotab.com)

### Step 2: Configure Fleet.Chat Integration
1. Access your Fleet.Chat dashboard
2. Go to **Settings** → **Fleet Integration**
3. Select **Geotab** as your platform
4. Enter your authentication details:
   ```
   Platform: Geotab
   Username: [Your MyGeotab username]
   Password: [Your MyGeotab password]
   Database: [Your Geotab database name]
   Server: [Optional - your.server.geotab.com]
   ```
5. Click **Test Connection** to verify
6. Save configuration

### Step 3: Event Monitoring Setup
Geotab uses polling for event updates:
- **Poll Interval**: 60 seconds for event updates
- **Location Updates**: 30 seconds for real-time tracking
- **Data Feeds**: Automatic versioned data synchronization

### Step 4: Driver Discovery & Onboarding
1. Fleet.Chat will discover drivers from Geotab users marked as drivers
2. Review discovered drivers in the **Drivers** tab
3. Verify phone numbers are correctly imported
4. Select drivers for WhatsApp enrollment
5. Monitor onboarding status and success rates

---

## Universal Setup Steps (Both Platforms)

### Payment Configuration
1. Navigate to **Billing** → **Payment Setup**
2. Enter credit card information
3. Billing is per active driver per month
4. Review pricing tier based on driver count

### Message Template Configuration
1. Access **Settings** → **Message Templates**
2. Review default English templates
3. Customize messages for your fleet operations
4. Test message generation with sample events

### WhatsApp Business Integration
Fleet.Chat provides managed WhatsApp Business service:
- **Phone Numbers**: Automatically provisioned per fleet
- **Message Templates**: Pre-approved for transport communication
- **Compliance**: GDPR-compliant data handling
- **Delivery**: 99.9% message delivery rate

---

## Platform-Specific Features

### Samsara Advantages
- **Real-time Events**: Instant webhook notifications
- **Modern API**: RESTful design with comprehensive documentation
- **Route Management**: Direct integration with Samsara routes
- **Easy Setup**: Token-based authentication

### Geotab Advantages
- **Comprehensive Diagnostics**: Detailed vehicle health data
- **Enterprise Features**: Advanced reporting and analytics
- **Mature Platform**: Extensive customization options
- **Rich Data Model**: Detailed fleet information

---

## Verification & Testing

### Connection Testing
1. **Samsara**: Test API connection with driver list retrieval
2. **Geotab**: Test session authentication and device listing
3. **WhatsApp**: Send test message to admin phone number
4. **Events**: Trigger test events to verify message generation

### Driver Onboarding Verification
1. Check driver phone number accuracy
2. Verify SMS invitation delivery
3. Confirm WhatsApp enrollment completion
4. Test bidirectional communication

### Event Flow Testing
1. Create test vehicle movement
2. Verify event detection in Fleet.Chat
3. Check WhatsApp message generation
4. Test driver response processing

---

## Monitoring & Maintenance

### Dashboard Monitoring
- **Connection Status**: Real-time platform health
- **Message Statistics**: Delivery rates and response times
- **Driver Status**: Active drivers and enrollment status
- **Event Processing**: Event volume and processing times

### Health Checks
- **Samsara**: API token validity and rate limits
- **Geotab**: Session status and data feed versions
- **WhatsApp**: Message queue status and delivery rates

### Troubleshooting
- **API Errors**: Check credentials and permissions
- **Missing Events**: Verify webhook/polling configuration
- **Message Failures**: Check driver phone numbers and WhatsApp status
- **Performance Issues**: Monitor rate limits and API quotas

---

## Migration Between Platforms

### Switching Platforms
If you need to switch from Samsara to Geotab (or vice versa):

1. **Export Data**: Download driver and vehicle information
2. **New Configuration**: Set up new platform credentials
3. **Re-onboard Drivers**: Drivers will need to re-confirm WhatsApp
4. **Update Settings**: Adjust message templates if needed
5. **Test Thoroughly**: Verify all communication flows

### Data Considerations
- Driver WhatsApp connections are preserved
- Message history remains available
- Vehicle mappings may need adjustment
- Custom templates transfer automatically

---

## Support & Resources

### Technical Support
- **Platform Issues**: Contact your fleet management provider
- **Fleet.Chat Issues**: support@fleet.chat
- **Integration Help**: integration@fleet.chat

### Documentation
- **API References**: Platform-specific documentation
- **Message Templates**: Template customization guide
- **Best Practices**: Fleet communication optimization

### Training Resources
- **Onboarding Videos**: Platform-specific setup guides
- **Webinars**: Monthly fleet communication best practices
- **Community**: Fleet operator discussion forum

---

## Compliance & Security

### Data Protection
- **GDPR Compliance**: Full driver data protection
- **Phone Number Security**: Encrypted storage and transmission
- **Message Privacy**: End-to-end encryption with WhatsApp
- **Access Controls**: Role-based dashboard access

### Platform Security
- **API Security**: Token-based authentication with rotation
- **Webhook Security**: Signature verification for all events
- **Data Isolation**: Complete tenant separation
- **Audit Logging**: Full activity tracking and monitoring

---

This updated onboarding guide provides comprehensive instructions for both Samsara and Geotab integrations while maintaining the simplicity and effectiveness of the original Fleet.Chat onboarding process.