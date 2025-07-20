# FleetChat Samsara Integration Overview
*Brief Technical Summary - July 19, 2025*

## Core Integration Purpose
FleetChat integrates with Samsara as a **read-only communication middleware** that translates fleet events into WhatsApp messages and processes driver responses back to the TMS.

## Samsara APIs Used

### Driver Management
- `GET /fleet/drivers` - Retrieve driver list and basic information
- `GET /fleet/drivers/{driverId}` - Get individual driver details
- `PATCH /fleet/drivers/{driverId}` - Update driver phone number mapping (write-back only)

### Vehicle & Route Data (Read-Only)
- `GET /fleet/vehicles` - Vehicle inventory and status
- `GET /fleet/routes` - Active route assignments
- `GET /fleet/routes/{routeId}` - Specific route details and waypoints

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
FleetChat maintains strict boundaries as communication middleware:
- **No route creation or modification** in Samsara
- **No fleet management functionality** replication
- **Read-only access** to operational data for context
- **Write-back limited** to driver responses and status updates only

## Authentication & Security
- **OAuth 2.0** tokens for API access per customer
- **Webhook signature verification** using customer-specific secrets
- **Rate limiting** compliance with Samsara API quotas
- **Data isolation** through tenant-specific API configurations

---
*This integration enables pure communication protocol services between Samsara fleet management and WhatsApp messaging without duplicating any TMS functionality.*