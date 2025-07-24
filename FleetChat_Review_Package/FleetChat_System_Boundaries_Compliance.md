# FleetChat System Boundaries & Compliance Specification
*Date: July 18, 2025*
*Status: Mandatory Compliance Document*

## Executive Summary

FleetChat is strictly limited to operating as a **communication protocol service only**. This document establishes mandatory boundaries to prevent any duplication or replication of ANY fleet management system functionality (Samsara, Geotab, or others), ensuring FleetChat operates exclusively as a message relay system.

## Strict System Boundaries

### 1. Communication Protocol Limitation

**PERMITTED FUNCTION:**
- FleetChat serves **exclusively** as a message relay between ANY fleet management system (Samsara, Geotab, etc.) and drivers via WhatsApp

**ABSOLUTE RESTRICTIONS:**
- ❌ No fleet management capabilities
- ❌ No vehicle tracking or monitoring
- ❌ No route optimization or planning
- ❌ No compliance monitoring
- ❌ No analytics or business intelligence
- ❌ No telematics data collection or processing

### 2. No Feature Duplication Policy

FleetChat **SHALL NOT** replicate, clone, or provide alternatives to ANY fleet management system functionality including:

#### Prohibited Fleet Management Features:
- ❌ **Vehicle Tracking**: No GPS monitoring, location history, or movement analytics
- ❌ **Telematics Processing**: No collection of engine data, fuel consumption, or vehicle diagnostics
- ❌ **Route Management**: No route creation, optimization, or modification capabilities
- ❌ **Fleet Operations**: No vehicle assignment, scheduling, or fleet coordination
- ❌ **Compliance Monitoring**: No HOS tracking, safety monitoring, or regulatory compliance
- ❌ **Business Analytics**: No dashboards, reports, or analytics that duplicate fleet system insights
- ❌ **Driver Management**: No driver profiles, performance tracking, or behavior analysis
- ❌ **Document Management**: No document storage, organization, or management systems

#### Permitted Communication Operations:
- ✅ **Driver Response Processing**: Parse and relay driver responses to fleet systems
- ✅ **Status Updates**: Write driver status updates back to fleet system APIs
- ✅ **Document Relay**: Forward WhatsApp documents to fleet system document endpoints
- ✅ **Location Sharing**: Submit driver location updates to fleet system APIs
- ✅ **Communication Logging**: Track message delivery and response confirmation

#### Prohibited Data Processing:
- ❌ **Fleet Data Storage**: No storage of vehicle, route, or operational data from Samsara
- ❌ **Analytics Processing**: No analysis, aggregation, or interpretation of fleet data
- ❌ **Business Logic**: No implementation of fleet management rules or decision-making
- ❌ **Workflow Management**: No automation of fleet operations beyond message relay

### 3. Permitted Data Handling (Minimal)

FleetChat is **ONLY** permitted to handle the following data, and **ONLY** if not available from Samsara:

#### 3.1 Driver Phone Numbers
- **Purpose**: Map fleet system driver IDs to WhatsApp phone numbers for message routing
- **Scope**: Phone number mapping table only (no driver profiles or personal data)
- **Limitation**: If fleet system provides phone numbers via API, FleetChat must use those instead

#### 3.2 Authorization Tokens
- **Purpose**: Store fleet system API tokens and WhatsApp credentials for message relay
- **Scope**: Authentication credentials only for message delivery service
- **Limitation**: Tokens used exclusively for message routing, not data access

#### 3.3 Payment Details (Conditional)
- **Purpose**: Process payments for message delivery service only
- **Scope**: Billing for communication service usage only
- **Limitation**: Only if payment processing is not part of Samsara subscription

### 4. Message Flow Restrictions

#### 4.1 Fleet-System-to-Driver Messages
```
PERMITTED FLOW:
Fleet System Event → FleetChat Template Application → WhatsApp Message → Driver

RESTRICTIONS:
- FleetChat applies predefined templates only
- No modification or interpretation of fleet system data
- No storage of message content beyond delivery confirmation
```

#### 4.2 Driver-to-Fleet-System Messages
```
PERMITTED FLOW:
Driver WhatsApp Response → FleetChat Processing → Fleet System API Update

PERMITTED OPERATIONS:
- Process driver responses (status updates, location sharing, document uploads)
- Parse structured responses (button clicks, quick replies, text messages)
- Write driver responses back to fleet system via API
- Update transport/route status based on driver input
- Forward documents from WhatsApp to fleet system
- Log communication for delivery confirmation

RESTRICTIONS:
- No creation of new routes or fleet management workflows
- No modification of fleet system business logic
- No analytics or reporting beyond communication logs
- No driver management beyond communication preferences
```

### 5. API and Interface Restrictions

#### 5.1 Fleet System API Usage
- **Read Access**: FleetChat reads event data for message relay to drivers
- **Write Access**: FleetChat writes driver responses back to fleet system (status updates, documents, location)
- **Limited Write Operations**: Only driver communication responses, no fleet management operations
- **No API Cloning**: Cannot replicate or mirror fleet system management functionality

#### 5.2 User Interface Prohibition
- **No Fleet Management UI**: Cannot provide interfaces that duplicate ANY fleet system functionality
- **No Dashboards**: Cannot display fleet metrics, analytics, or operational data
- **Setup Interface Only**: Limited to communication service configuration only

### 6. Technology Stack Limitations

#### 6.1 Database Restrictions
```sql
-- PERMITTED TABLES ONLY:
driver_mapping {
  fleet_system_driver_id → whatsapp_number mapping only
}

tenants {
  fleet_system_api_tokens, whatsapp_credentials, billing_info only
}

message_delivery_log {
  delivery_status tracking only (not content storage)
}

-- PROHIBITED TABLES:
❌ vehicles, routes, trips, locations, documents
❌ fleet_analytics, performance_metrics, compliance_data
❌ driver_profiles, behavior_data, telematics
```

#### 6.2 Service Architecture
- **Message Relay Only**: Webhook endpoints for message routing exclusively
- **No Business Logic**: No fleet operations, decision-making, or management processes
- **Template Engine**: Predefined message templates only (no dynamic content generation)

### 7. Compliance Monitoring

#### 7.1 Boundary Validation
Regular audits to ensure:
- No feature overlap with Samsara functionality
- No unauthorized data storage or processing
- Strict adherence to message relay limitations

#### 7.2 Legal Compliance
- **Non-Competition**: FleetChat cannot compete with or undermine ANY fleet management services
- **Data Minimization**: Only store data absolutely necessary for message relay
- **Service Boundaries**: Clear separation between communication and fleet management

### 8. Implementation Guidelines

#### 8.1 Development Constraints
```typescript
// PERMITTED: Message relay functions only
class MessageRelayService {
  relayEventToWhatsApp(samsaraEvent, driverId) {
    // Apply template and send message only
  }
  
  relayResponseToSamsara(whatsappMessage, driverId) {
    // Forward response without processing
  }
}

// PROHIBITED: Any fleet management functionality
❌ class FleetManagementService
❌ class VehicleTrackingService  
❌ class RouteOptimizationService
❌ class ComplianceMonitoringService
```

#### 8.2 API Endpoint Restrictions
```
PERMITTED ENDPOINTS:
✅ POST /webhook/{fleet-system}/{tenantId} - Receive events for relay
✅ POST /webhook/whatsapp/{tenantId} - Receive responses for relay
✅ POST /setup/tenant - Configure communication service

PROHIBITED ENDPOINTS:
❌ /api/fleet/* - No fleet management APIs
❌ /api/vehicles/* - No vehicle data APIs
❌ /api/routes/* - No route management APIs
❌ /api/analytics/* - No analytics or reporting APIs
```

### 9. Service Definition

#### 9.1 FleetChat Service Scope
**FleetChat IS:**
- A communication protocol for fleet-system-to-driver messaging
- A WhatsApp message relay service
- A template application system for standardized messaging
- A driver phone number mapping service

**FleetChat IS NOT:**
- A fleet management system
- A vehicle tracking platform
- A route optimization service
- A telematics data processor
- A compliance monitoring system
- A business analytics platform

#### 9.2 Value Proposition Boundaries
**PERMITTED VALUE CLAIMS:**
- "Improve driver communication through WhatsApp"
- "Streamline fleet system event notifications to drivers"
- "Reduce phone calls through automated messaging"

**PROHIBITED VALUE CLAIMS:**
- ❌ "Fleet management capabilities"
- ❌ "Vehicle tracking and monitoring"
- ❌ "Route optimization and planning"
- ❌ "Alternative to ANY fleet system features"

### 10. System Architecture Diagram

```
STRICT BOUNDARY ENFORCEMENT:

┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│FLEET SYSTEM │───▶│  FLEETCHAT   │───▶│  WHATSAPP   │
│ (Samsara,   │    │ (Message     │    │ (Driver     │
│  Geotab,    │    │  Relay       │    │  Interface) │
│  etc.)      │    │  Only)       │    │             │
└─────────────┘    └──────────────┘    └─────────────┘
                           │
                           ▼
                   ┌──────────────┐
                   │   BILLING    │
                   │ (Message     │
                   │  Service     │
                   │  Only)       │
                   └──────────────┘

PROHIBITED CONNECTIONS:
❌ FleetChat ↔ Vehicle Systems
❌ FleetChat ↔ Route Management  
❌ FleetChat ↔ Compliance Systems
❌ FleetChat ↔ Analytics Platforms
```

### 11. Enforcement and Penalties

#### 11.1 Compliance Violations
Any implementation of prohibited functionality constitutes a boundary violation requiring immediate remediation.

#### 11.2 Remediation Requirements
- Immediate removal of any prohibited features
- Data deletion for unauthorized storage
- Service limitation to communication relay only

## Conclusion

FleetChat operates under strict limitations as a **communication protocol service only**. These boundaries ensure:

1. **No Competition** with ANY fleet management system capabilities
2. **No Duplication** of existing fleet system functionality  
3. **Clear Value Distinction** between communication and fleet management
4. **Legal Compliance** with service boundary agreements
5. **Technical Clarity** for development and operational teams

This document serves as the definitive compliance specification for all FleetChat development, deployment, and operational activities.