# FleetChat Onboarding Guide for Fleet Operators

## Overview
This guide explains how a trucking company using Samsara can onboard onto FleetChat middleware to enable automated driver communication via WhatsApp.

## Prerequisites
- Active Samsara fleet management account
- WhatsApp Business API account (or FleetChat can assist with setup)
- Administrative access to Samsara webhooks configuration
- Driver phone number data in Samsara system

## Step 1: Samsara API Configuration

### Required Samsara API Credentials
Fleet operators need to provide the following to FleetChat:

```
SAMSARA_API_TOKEN=<your_samsara_api_token>
SAMSARA_GROUP_ID=<your_fleet_group_id>
SAMSARA_WEBHOOK_SECRET=<webhook_verification_secret>
```

### API Token Permissions Required
The Samsara API token must have these scopes enabled:
- **Fleet Management**: Read vehicle and driver data
- **Routes**: Create and manage transport routes
- **Webhooks**: Receive real-time fleet events
- **Documents**: Upload and manage delivery documentation
- **Location**: Access vehicle GPS and geofencing data

### Obtaining API Credentials
1. Log into Samsara dashboard as administrator
2. Navigate to Settings → API Tokens
3. Create new token with "FleetChat Integration" label
4. Enable required permissions listed above
5. Copy the generated API token securely

## Step 2: Webhook Configuration in Samsara

### FleetChat Webhook URL
Configure Samsara to send events to FleetChat:
```
Webhook URL: https://your-fleetchat-domain.com/webhook/samsara
```

### Required Event Types
Enable these Samsara webhook events for FleetChat processing:

**Vehicle Events:**
- `vehicle.location` - Real-time GPS updates
- `vehicle.geofence.enter` - Pickup/delivery area arrivals
- `vehicle.geofence.exit` - Location departures

**Trip Events:**
- `trip.started` - Route commencement notifications
- `trip.completed` - Delivery completion confirmations

**Driver Events:**
- `driver.duty.on` - Driver shift start
- `driver.duty.off` - Driver shift end
- `driver.hos.warning` - Hours of service compliance alerts

**Document Events:**
- `document.uploaded` - Proof of delivery submissions
- `document.approved` - Document validation confirmations

### Webhook Security
- Use provided webhook secret for event verification
- Configure HTTPS endpoints only for secure communication
- Set appropriate timeout values (30 seconds recommended)

## Step 3: WhatsApp Business API Setup

### Option A: FleetChat Managed WhatsApp (Recommended)
**Turnkey Solution - No WhatsApp Setup Required**

FleetChat provides complete WhatsApp Business API management:
- **Dedicated Phone Numbers**: Bulk-purchased business numbers assigned per fleet
- **Pre-Approved Templates**: Transport-specific message templates already approved by WhatsApp
- **Instant Activation**: Ready-to-use within 24 hours of onboarding
- **Compliance Management**: FleetChat handles all WhatsApp Business policy requirements
- **Rate Limiting**: Automated message throttling to prevent API violations

**Fleet Operator Requirements**: None - FleetChat handles everything

**Configuration**:
```
# Provided by FleetChat automatically
WHATSAPP_PHONE_NUMBER: +1-555-FLEET-01 (example)
SERVICE_LEVEL: "managed"
MESSAGE_TEMPLATES: "transport-standard-v2"
```

### Option B: Fleet Operator Owned WhatsApp Business
**For Large Enterprises with Existing WhatsApp Infrastructure**

If fleet operator already has WhatsApp Business API:
```
WHATSAPP_ACCESS_TOKEN=<your_whatsapp_token>
WHATSAPP_PHONE_NUMBER_ID=<your_business_phone_id>
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<webhook_verification_token>
SERVICE_LEVEL: "self-managed"
```

**Requirements**:
- Existing Meta Business account with WhatsApp API access
- Approved business verification status
- Transport industry message templates (FleetChat can assist)
- Technical team for webhook configuration

### Option C: Hybrid Model
**FleetChat Provisions, Fleet Operator Owns**

FleetChat facilitates WhatsApp Business API setup under fleet operator's Meta Business account:
- FleetChat guides through Meta Business verification process
- Fleet operator owns the WhatsApp Business account
- FleetChat configures all technical integrations
- Fleet operator maintains control over phone number and billing

## Step 4: Driver Phone Number Mapping

### Data Requirements
Fleet operators must provide driver phone number mapping:

**Format Required:**
```json
{
  "samsara_driver_id": "12345",
  "whatsapp_number": "+1234567890",
  "driver_name": "John Smith",
  "consent_status": "approved",
  "preferred_language": "en"
}
```

### Privacy Compliance
- Driver consent required for WhatsApp communications
- GDPR-compliant data handling with opt-out mechanisms
- Anonymous pseudo-IDs used internally for tracking

### Bulk Import Process
1. Export driver data from Samsara (ID, name, phone)
2. Verify driver WhatsApp consent status
3. Upload mapping file to FleetChat configuration
4. Test communication with sample driver group

## Step 5: Message Template Configuration

### Standard Fleet Templates
FleetChat provides pre-built templates for:

**Route Management:**
- New pickup assignments with location details
- ETA confirmations and delivery instructions
- Route modification notifications

**Status Updates:**
- Arrival confirmations at pickup/delivery locations
- Loading and unloading status requests
- Proof of delivery collection prompts

**Compliance Alerts:**
- Hours of service warnings with action steps
- Vehicle inspection reminders
- Document submission requirements

### Custom Template Options
Fleet operators can customize:
- Company branding in message headers
- Specific terminology for loads/shipments
- Regional compliance requirements
- Preferred response options and quick replies

## Step 6: Testing and Validation

### Configuration Testing
FleetChat provides testing tools to verify:
- Samsara webhook connectivity and event processing
- WhatsApp message delivery to test driver numbers
- Driver response handling and Samsara updates
- Document upload workflows and approval processes

### Pilot Program
Recommended pilot approach:
1. Select 5-10 test drivers for initial deployment
2. Configure limited event types (pickup assignments only)
3. Monitor message delivery and response rates
4. Gather driver feedback on message clarity and timing
5. Gradually expand to full fleet after validation

## Step 7: Go-Live Checklist

### Pre-Deployment Verification
- [ ] Samsara API connectivity confirmed
- [ ] WhatsApp Business API operational
- [ ] Driver phone number mappings validated
- [ ] Message templates approved by fleet management
- [ ] Webhook endpoints responding correctly
- [ ] Driver consent documentation complete

### Monitoring Setup
FleetChat provides real-time monitoring for:
- Message delivery success rates
- Driver response times and engagement
- Samsara data synchronization status
- System uptime and performance metrics

## Ongoing Management

### Fleet Operator Responsibilities
- Maintain accurate driver phone numbers in Samsara
- Update driver consent status as needed
- Monitor driver engagement and feedback
- Coordinate with FleetChat for template modifications

### FleetChat Support
- 24/7 system monitoring and maintenance
- Regular updates for Samsara API changes
- WhatsApp Business API compliance management
- Driver communication analytics and reporting

## Cost Structure

### WhatsApp Business API Pricing Models

#### Option A: FleetChat Managed (Recommended for Most Fleets)
**Includes Everything - No Separate WhatsApp Costs**
- **Basic**: $15/driver/month - Standard templates, basic reporting, managed WhatsApp
- **Professional**: $25/driver/month - Custom templates, advanced analytics, priority support
- **Enterprise**: $35/driver/month - Multi-fleet support, dedicated account management, custom integrations

**What's Included in Managed Service:**
- Dedicated WhatsApp Business phone number
- Pre-approved transport message templates
- WhatsApp Business API access and compliance
- Message delivery infrastructure
- 24/7 technical support

#### Option B: Fleet Operator Owned WhatsApp
**Lower FleetChat Fees + Separate WhatsApp Costs**
- **FleetChat Integration**: $8/driver/month - Pure middleware service
- **WhatsApp Business API**: $0.005-0.025 per message (paid directly to Meta)
- **WhatsApp Phone Number**: $15-50/month per business number (varies by region)

#### Option C: Hybrid Model
**FleetChat Setup + Fleet Operator Billing**
- **One-time Setup**: $2,500 - WhatsApp Business API provisioning and configuration
- **Monthly Integration**: $10/driver/month - Ongoing middleware service
- **WhatsApp Costs**: Billed directly by Meta to fleet operator

### Volume Discounts
- **50+ drivers**: 15% discount on all tiers
- **200+ drivers**: 25% discount on all tiers  
- **500+ drivers**: 35% discount + custom enterprise features

### Additional Services
- **Custom Message Templates**: $500 per template set
- **Advanced Analytics Dashboard**: $200/month per fleet
- **Multi-language Support**: $150/driver/month for non-English communications
- **Priority Technical Support**: $1,000/month per fleet

This onboarding process typically takes 2-3 weeks from initial configuration to full deployment, with most complexity handled by FleetChat's integration team to minimize fleet operator technical requirements.