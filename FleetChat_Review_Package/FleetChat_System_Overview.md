# FleetChat: Headless Message Broker System

## Executive Summary

FleetChat is a middleware service that bridges fleet management systems (Samsara and Geotab) with driver communication platforms. Operating as a headless message broker with dual-platform support, it translates fleet events into contextual WhatsApp messages for drivers and processes driver responses back into fleet management updates, regardless of the underlying fleet platform. The system requires no user interface, functioning purely as an intelligent routing and translation layer. **Current Status**: Production-ready with verified event propagation system (July 2025).

## System Architecture

### Core Purpose
FleetChat eliminates communication gaps between fleet dispatchers and drivers by automatically converting technical fleet management events into clear, actionable WhatsApp messages. Drivers receive contextual notifications about route assignments, pickup reminders, compliance warnings, and delivery instructions without requiring specialized fleet management apps.

### Middleware Design
The system operates as pure middleware between two primary endpoints:

**Input**: Fleet platform events (Samsara webhooks or Geotab data feeds) containing route assignments, location updates, compliance alerts  
**Processing**: Platform-agnostic event classification, driver identification, unified message template generation  
**Output**: WhatsApp Business API messages with interactive quick replies and response handling

**Return Path**: WhatsApp driver responses are processed and translated back into fleet platform data updates (Samsara or Geotab), maintaining bidirectional synchronization between fleet management and driver communications.

### Technical Stack
- **Backend**: Express.js server with TypeScript
- **Integration**: Samsara/Geotab Fleet Management APIs and WhatsApp Business API
- **Storage**: In-memory data structures for session management
- **Deployment**: Containerized Node.js application with webhook endpoints

## Key Features

### Event Translation Engine
Converts fleet platform events (Samsara/Geotab) into driver-friendly WhatsApp messages:
- Route assignments become location-specific pickup instructions
- Geofence events trigger arrival confirmations and next-step guidance
- HOS compliance alerts provide clear action items for drivers
- Document requests generate photo upload prompts with templates

### Response Processing System
Handles all WhatsApp message types from drivers:
- Quick reply buttons for status updates ("Arrived", "Loaded", "Delivered")
- Location sharing for real-time GPS tracking
- Photo uploads for proof of delivery and load documentation
- Free-text responses with natural language processing for status classification

### Driver Privacy Protection
Implements GDPR-compliant driver identification:
- Maps fleet platform driver IDs to WhatsApp phone numbers without exposing personal data
- Uses anonymized pseudo-IDs for internal tracking
- Maintains separate driver consent records for communication preferences
- Provides opt-out mechanisms for all automated messaging

## Integration Architecture

### Samsara Fleet Management Integration
**Webhook Processing**: Real-time event handling for:
- Vehicle location updates and geofence entry/exit notifications
- Trip start/completion events with automatic driver assignments
- Maintenance alerts and fault code notifications
- Hours of Service (HOS) compliance warnings and duty status changes
- Document upload confirmations and approval status updates

**API Operations**: Bidirectional data synchronization including:
- Route creation and modification based on transport assignments
- Status updates from driver responses to transport records
- Location tracking integration with fleet visibility systems
- Document management for POD and compliance documentation

### WhatsApp Business API Integration
**Message Delivery**: Contextual driver communications featuring:
- Template-based messages with transport-specific details
- Interactive buttons for common driver responses
- Location request prompts for critical transport milestones
- Document collection workflows with approval processes

**Response Handling**: Comprehensive message processing covering:
- Button interactions for status updates and confirmations
- Location sharing validation and transport record updates
- Media uploads with automatic transport association
- Text message classification for status and issue reporting

## Deployment Model

### Headless Service Architecture
FleetChat operates without user interfaces, providing only API endpoints:
- `POST /api/samsara/webhook/{tenantId}` - Per-customer fleet event processing
- `POST /api/whatsapp/webhook` - Processes driver message responses
- `GET /api/health` - Service monitoring and configuration validation
- `GET /api/samsara/webhooks/{tenantId}` - List customer webhooks
- `PATCH/DELETE /api/samsara/webhooks/{tenantId}/{webhookId}` - Webhook management

### Multi-Tenant Support
The system supports multiple logistics companies with isolated data:
- Tenant-specific Samsara API configurations
- Separate WhatsApp Business accounts per customer
- Isolated driver phone number mappings and consent records
- Custom message templates and workflow configurations

### Scalability Considerations
- Stateless design enables horizontal scaling across multiple instances
- Event queue processing for high-volume fleet operations
- Rate limiting compliance with WhatsApp Business API restrictions
- Efficient database queries for real-time driver identification

## Message Flow Examples

### Route Assignment Workflow
1. **Samsara Event**: New route assigned to driver ID 12345
2. **FleetChat Processing**: Maps driver ID to WhatsApp number, generates pickup message
3. **WhatsApp Delivery**: "New pickup at ABC Warehouse, 123 Main St. ETA 2:30 PM. Confirm arrival?"
4. **Driver Response**: Taps "Arrived" button or shares location
5. **Samsara Update**: Transport status updated to "At Pickup Location"

### Document Collection Workflow
1. **Samsara Trigger**: Transport status changes to "Delivered"
2. **FleetChat Message**: "Upload proof of delivery photo. Include customer signature."
3. **Driver Action**: Takes photo and sends via WhatsApp
4. **FleetChat Processing**: Validates image, uploads to Samsara transport record
5. **Confirmation**: "POD received and approved. Transport completed."

## Security and Data Protection

### Data Protection
- Secure driver phone number handling with appropriate safeguards
- Encrypted communication channels for all API integrations
- Audit logging for all message routing and data processing activities
- Secure webhook validation to prevent unauthorized access

### Fleet Management Compliance
- HOS regulation compliance monitoring with automated driver alerts
- DOT inspection document management through WhatsApp workflows
- Vehicle maintenance notification routing to appropriate drivers
- Load documentation requirements with template-guided collection

## Business Impact

FleetChat eliminates the need for drivers to learn specialized fleet management software while providing dispatchers with real-time visibility into transport operations. The system reduces communication delays, improves compliance monitoring, and enhances operational efficiency through automated workflow management. By leveraging WhatsApp's familiar interface, FleetChat achieves high driver adoption rates without additional training requirements.

The middleware approach ensures seamless integration with existing fleet management workflows while extending communication capabilities to any mobile-enabled driver workforce. This creates a scalable solution for logistics companies seeking to modernize driver communication without replacing established TMS platforms.