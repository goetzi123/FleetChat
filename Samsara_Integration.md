# Samsara Integration

## Overview

FleetChat's Samsara integration provides comprehensive bidirectional communication between Samsara fleet management systems and WhatsApp Business API. This integration enables real-time event processing, driver communication workflows, and seamless data synchronization between fleet operations and driver mobile communications.

## Driver Phone Number Mapping to WhatsApp Business

### Phone Number Discovery Process

**1. Samsara API Driver Data Extraction**
- FleetChat accesses driver records through Samsara's `/fleet/drivers` API endpoint
- Retrieves driver profiles including phone numbers from driver contact information
- Uses proper API scopes: `drivers:read` and `drivers:write` for full access

**2. Phone Number Validation & Formatting**
- Validates phone numbers against international formats (E.164)
- Standardizes formatting for WhatsApp Business API compatibility
- Handles various input formats (US domestic, international, etc.)

**3. WhatsApp Business Account Mapping**

**Direct WhatsApp Integration:**
```
Driver Phone → WhatsApp Business API → FleetChat Managed Number Pool
```

**Key Mapping Components:**
- **Driver ID**: Samsara's unique driver identifier
- **Phone Number**: Driver's mobile number from Samsara profile
- **WhatsApp Status**: Verified/unverified WhatsApp account status
- **Tenant Association**: Links to specific fleet operator

### Privacy & Compliance Framework

**GDPR-Compliant Process:**
1. **Consent Collection**: Drivers must explicitly consent to WhatsApp communication
2. **Data Minimization**: Only essential contact data is stored
3. **Secure Storage**: Phone numbers encrypted in FleetChat database
4. **Right to Withdraw**: Drivers can opt-out anytime

**Onboarding Flow:**
1. Fleet operator configures Samsara API connection
2. FleetChat discovers available drivers and phone numbers
3. SMS/QR code invitations sent to driver phones
4. Driver accepts WhatsApp Business connection
5. Phone number verified and mapped to transport communications

**Technical Implementation:**
- Database stores: `samsara_driver_id` ↔ `phone_number` ↔ `whatsapp_verified`
- Real-time sync maintains driver status between Samsara and WhatsApp
- Failed message delivery triggers re-verification process

## Samsara APIs for Event Extraction

### Primary Samsara APIs for Event Extraction

**1. Webhooks API (Real-time Events)**
- **Endpoint**: `POST /fleet/hos-logs/webhook` and `POST /fleet/drivers/webhook`
- **Purpose**: Real-time event notifications from Samsara to FleetChat
- **Events Captured**:
  - Driver duty status changes (on-duty, driving, off-duty)
  - Vehicle location updates and GPS tracking
  - Route start/completion events
  - Geofence entry/exit notifications
  - Vehicle fault codes and maintenance alerts
  - Document upload notifications (PODs, inspections)

**2. Fleet Management APIs**
- **Drivers API**: `/fleet/drivers` - Driver profile and status data
- **Vehicles API**: `/fleet/vehicles` - Vehicle information and assignments
- **Routes API**: `/fleet/routes` - Route creation and management
- **Locations API**: `/fleet/locations` - Real-time GPS positioning

**3. Safety & Compliance APIs**
- **HOS Logs API**: `/fleet/hos-logs` - Hours of Service compliance data
- **DVIR API**: `/fleet/maintenance/dvirs` - Vehicle inspection reports
- **Safety Events API**: `/safety/events` - Harsh driving, speeding alerts

### Event Processing Flow

**Samsara → FleetChat → WhatsApp:**
```
1. Samsara Event Triggered → Webhook to FleetChat
2. FleetChat processes event → Generates contextual WhatsApp message
3. Message sent to driver's WhatsApp → Driver receives notification
4. Driver responds via WhatsApp → FleetChat processes response
5. Response updates sent back to Samsara → Status synchronized
```

### Key Implementation Details

**Webhook Configuration:**
- FleetChat registers webhook URLs with Samsara: `/api/samsara/webhook`
- Events filtered by type: location, route, safety, maintenance, compliance
- Payload includes: driver_id, vehicle_id, event_type, timestamp, location_data

**Event Translation Engine:**
- Route assignment → "New route assigned to [destination]"
- Location update → "Please confirm your current status"
- Geofence entry → "You've arrived at [location]. Ready to proceed?"
- Maintenance alert → "Vehicle inspection required before departure"

**Response Processing:**
- WhatsApp responses parsed and classified
- Driver status updates sent back to Samsara via `/fleet/drivers/{id}/status`
- Document uploads from WhatsApp attached to Samsara transport records

## Bidirectional Communication Architecture

### FleetChat Message Broker Flow

1. **Fleet Event Processing**: Samsara Event → Driver Phone Resolution → WhatsApp Message Generation → Driver Notification
2. **Driver Response Handling**: WhatsApp Response → Driver Identification → Response Classification → Samsara Update
3. **Document Processing**: WhatsApp Document Upload → File Processing → Samsara Transport Record Update
4. **Status Synchronization**: Driver Status Update → Transport Status Change → Real-time Fleet Visibility
5. **Bidirectional Communication**: Samsara ↔ FleetChat ↔ WhatsApp (No human interface required)

### Technical Integration Components

**Webhook Handlers:**
- **Incoming Samsara Events**: `/api/samsara/webhook`
- **Incoming WhatsApp Messages**: `/api/whatsapp/webhook`

**Event Processing:**
- Real-time event classification and routing
- Context-aware message generation
- Multi-tenant event isolation
- Comprehensive error handling and retry logic

**Data Synchronization:**
- Periodic status sync every 5 minutes
- Real-time updates for critical events
- Automatic conflict resolution
- Data consistency validation

## Security and Compliance

### Data Protection
- All sensitive data encrypted in transit and at rest
- Phone numbers stored with AES-256 encryption
- API credentials managed through secure environment variables
- Regular security audits and compliance validation

### API Security
- OAuth 2.0 authentication with Samsara
- Webhook signature verification
- Rate limiting and request throttling
- Comprehensive audit logging

### GDPR Compliance
- Driver consent management
- Right to data portability
- Right to be forgotten implementation
- Data minimization principles
- Privacy-by-design architecture

## Integration Benefits

### For Fleet Operators
- Real-time driver communication without manual intervention
- Automated status updates and compliance monitoring
- Reduced operational overhead
- Enhanced visibility into fleet operations

### For Drivers
- Simple WhatsApp-based communication
- No additional apps or training required
- Privacy-respecting data handling
- Instant notifications and updates

### For the System
- Seamless data flow between platforms
- Reduced manual data entry errors
- Scalable multi-tenant architecture
- Comprehensive audit trails and reporting

This integration creates a seamless communication bridge where Samsara fleet events automatically trigger appropriate WhatsApp messages to drivers, and driver responses update Samsara records in real-time, maintaining complete operational visibility and workflow automation.