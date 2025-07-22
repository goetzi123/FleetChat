# FleetChat Samsara Integration Overview
*Brief Technical Summary - July 19, 2025*

## Core Integration Purpose
FleetChat integrates with Samsara as a **bidirectional communication protocol service** that translates fleet events into WhatsApp messages and processes driver responses back to the TMS. FleetChat operates as pure communication middleware without replicating any fleet management functionality.

## Samsara APIs Used

### Driver Management
- `GET /fleet/drivers` - Retrieve driver list and basic information
- `GET /fleet/drivers/{driverId}` - Get individual driver details
- `PATCH /fleet/drivers/{driverId}` - Update driver phone number mapping (write-back only)

### Fleet Context Data (Read-Only for Message Context)
- `GET /fleet/vehicles` - Vehicle identification for message context only
- `GET /fleet/routes` - Route information for message templates only
- `GET /fleet/routes/{routeId}` - Route context for communication purposes only

### Real-Time Events (Webhook Sources)
- `GET /fleet/hos/logs` - Hours of Service status changes
- `GET /safety/events` - Safety incidents and alerts
- `GET /industrial/data` - Vehicle diagnostics and maintenance alerts

### Document Handling
- `POST /fleet/documents` - Upload driver-submitted documents from WhatsApp
- `GET /fleet/documents/{documentId}` - Retrieve document metadata

## Samsara Webhooks Consumed

### Primary Event Types
- **Vehicle Location Updates** - GPS position changes for geofence notifications
- **Route Status Changes** - Trip start/completion, waypoint arrivals
- **HOS Events** - Duty status transitions, violations, break reminders  
- **Safety Alerts** - Hard braking, speeding, collision detection
- **Maintenance Events** - Fault codes, inspection due dates, service alerts
- **Geofence Events** - Entry/exit notifications for pickup/delivery locations

### Webhook Configuration
- **Endpoint**: `POST /api/samsara/webhook` (FleetChat receiver)
- **Authentication**: HMAC signature verification with customer API tokens
- **Event Filtering**: Configurable per-customer event subscriptions
- **Retry Logic**: Automatic retry with exponential backoff

## Data Flow Summary

### Inbound (Samsara → FleetChat → WhatsApp)
1. **Event Reception**: Samsara webhook → FleetChat event processor
2. **Driver Lookup**: Map Samsara driver ID → WhatsApp phone number
3. **Message Translation**: Convert fleet event → contextual WhatsApp message
4. **Delivery**: Send templated message via WhatsApp Business API

### Outbound (WhatsApp → FleetChat → Samsara)
1. **Response Processing**: WhatsApp webhook → FleetChat response handler
2. **Status Translation**: Parse driver response → structured status update
3. **TMS Write-back**: Update route status, location, or documents in Samsara
4. **Confirmation**: Send acknowledgment message to driver

## Integration Boundaries
FleetChat maintains strict boundaries as pure communication protocol service:
- **No route creation or modification** in Samsara (absolute prohibition)
- **No fleet management functionality** replication (universal restriction)
- **No vehicle tracking or monitoring** capabilities (system boundary)
- **Read-only access** to data for message context only
- **Write-back limited** to driver communication responses only
- **Communication middleware** function exclusively

## Authentication & Security
- **OAuth 2.0** tokens for API access per customer
- **Webhook signature verification** using customer-specific secrets
- **Rate limiting** compliance with Samsara API quotas
- **Data isolation** through tenant-specific API configurations

---
*This integration enables pure communication protocol services between Samsara fleet management and WhatsApp messaging without duplicating any TMS functionality.*