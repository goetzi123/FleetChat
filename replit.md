# ZeKju Platform - Replit Development Guide

## Overview

ZeKju is a GDPR-compliant transport communication platform that enables workflow automation through popular messenger apps (WhatsApp, Telegram, Viber) without requiring dedicated mobile applications. The platform serves the logistics industry by connecting truck drivers, dispatchers, yard operators, and shippers through automated chat-based workflows.

## System Architecture

### Frontend Architecture
- **Transport Center UI**: Web-based dashboard for dispatchers and operators
- **Messenger Integration**: Chat-based interfaces through WhatsApp, Telegram, and Viber APIs
- **QR Code System**: Digital check-in and onboarding via QR code generation
- **Document Management Interface**: Digital approval/rejection system for PODs and delivery documents

### Backend Architecture
- **Workflow Engine**: Automated status collection and document processing
- **Communication Service**: Unified messaging across messenger platforms
- **Geolocation Services**: GPS tracking with geofencing and ETA calculations
- **Integration Layer**: Native connectors for TMS platforms
- **Notification System**: SMS and messenger-based communication

### Communication Layer
- **Multi-messenger Support**: WhatsApp, Telegram, Viber integration
- **Chat-based Workflows**: Structured interaction flows for transport operations
- **Document Upload**: File handling through messenger attachments
- **Status Updates**: One-click status options for drivers

## Key Components

### 1. Driver Onboarding System
- SMS/QR code invitation system
- Privacy terms acceptance workflow
- Messenger platform selection
- 30-second onboarding process

### 2. Workflow Automation Engine
- **Transport Communication Workflows**:
  - Automated status prompts ("arrived," "loaded," "unloaded")
  - Document collection and validation
  - Geolocation tracking at critical points
- **Yard Communication Workflows**:
  - Gate registration via QR codes
  - ETA confirmation systems
  - Turn-by-turn navigation instructions
  - Digital check-out processes

### 3. Document Management System
- Digital POD (Proof of Delivery) handling
- Load slip processing
- Document tagging and approval workflows
- Digital storage and retrieval

### 4. Geolocation & Tracking
- One-off geo-pings at critical transport points
- Optional live GPS tracking via Tracking Companion
- Geofencing capabilities
- Movement alerts and ETA calculations
- Anonymous tracking validation

### 5. Communication Management
- Unified messaging across platforms
- Automated status notifications
- Context-aware transport terminology
- Message routing and delivery tracking

## Data Flow

1. **Driver Onboarding**: SMS/QR → Messenger Selection → Privacy Acceptance → Workflow Assignment
2. **Status Updates**: Automated Prompts → Driver Response → System Processing → Dispatcher Notification
3. **Document Flow**: Driver Upload → System Processing → Dispatcher Review → Approval/Rejection
4. **Location Data**: GPS Collection → Validation → Geofence Processing → ETA Calculation
5. **Communication**: Driver Message → System Processing → Dispatcher Interface → Response Routing → Driver

## External Dependencies

### Messenger Platform APIs
- WhatsApp Business API
- Telegram Bot API
- Viber Business API

### TMS Integration Partners
- **Samsara** (Primary Fleet Management Platform)
- Transporeon
- Agheera
- project44
- Wanko
- D-Soft (bluecargo)

### Core Services
- SMS Gateway for initial contact
- Messaging services for platform integration
- Geolocation services for tracking
- QR code generation libraries
- File storage for document management

### Compliance & Security
- GDPR compliance framework
- Data anonymization for tracking
- Secure chat infrastructure
- Privacy-first architecture

## Deployment Strategy

### Multi-tenant Architecture
- Support for multiple logistics companies
- Isolated data and workflows per tenant
- Shared infrastructure with tenant-specific configurations

### Scalability Considerations
- Messenger API rate limiting handling
- Document storage optimization
- Real-time messaging service scaling
- Geolocation data processing efficiency

### Integration Deployment
- API-first approach for TMS connectors
- Webhook-based real-time updates
- Batch processing for large data volumes
- Fallback mechanisms for service reliability

## Current Implementation Status

### Completed Features
- **Backend API**: Complete Express.js server with transport communication endpoints
- **Data Models**: Comprehensive schema for transports, users, documents, location tracking
- **Storage Layer**: In-memory storage implementation with full CRUD operations
- **Frontend Dashboard**: React-based UI with transport management, user management, document handling
- **GDPR Compliance**: Anonymous driver handling with pseudonymization
- **Geolocation Tracking**: GPS tracking with geofencing capabilities
- **TMS Integration**: Comprehensive Samsara fleet management integration with real-time event processing

### Key Components Built
1. **Transport Management**: Create, track, and manage FTL/LTL/Yard workflows
2. **User Management**: Driver anonymity protection, role-based access
3. **Document Management**: POD handling, digital signatures, approval workflows
4. **Real-time Tracking**: GPS location updates with ETA calculations
5. **Dashboard Analytics**: Transport statistics and workflow monitoring

### API Endpoints
- `/api/transports` - Transport CRUD operations
- `/api/users` - User management with GDPR compliance
- `/api/documents` - Document upload and approval
- `/api/location-tracking` - GPS tracking and geofencing
- `/api/yard-operations` - Yard workflow management
- `/api/dashboard/stats` - Analytics and reporting
- `/api/samsara/webhook` - Samsara event webhook processing
- `/api/samsara/routes` - Create and manage Samsara routes
- `/api/samsara/vehicles` - Fleet vehicle management
- `/api/samsara/drivers` - Driver status and management
- `/api/samsara/sync/:transportId` - Sync transport status with Samsara

## Samsara Integration Architecture

### Core Integration Components

#### 1. Samsara API Client (`server/integrations/samsara.ts`)
- **Fleet Management**: Vehicle and driver data synchronization
- **Route Management**: Create, update, and track transport routes
- **Event Processing**: Real-time webhook event handling
- **Document Integration**: POD and delivery document management

#### 2. Event Processing System
- **Webhook Handler**: `/api/samsara/webhook` endpoint for real-time events
- **Event Types Supported**:
  - Vehicle location updates
  - Trip start/completion events
  - Geofence entry/exit notifications
  - Driver duty status changes
  - Document upload notifications
  - Maintenance alerts and fault codes

#### 3. Bidirectional Data Flow
- **FleetChat → Samsara**: Transport creation triggers route creation in Samsara
- **Samsara → FleetChat**: Real-time events update transport status and location data
- **Periodic Sync**: Automated status synchronization every 5 minutes

#### 4. Fleet Management Features
- **Vehicle Tracking**: Real-time GPS location and status monitoring
- **Driver Management**: Duty status tracking and vehicle assignment
- **Route Optimization**: Integration with Samsara's routing capabilities
- **Compliance Monitoring**: ELD data and HOS compliance tracking

### Samsara Integration Service (`server/integrations/samsara-service.ts`)
- **Configuration Management**: Environment-based API credentials
- **Event Processing**: Automated event classification and processing
- **Sync Management**: Periodic transport status synchronization
- **Error Handling**: Comprehensive logging and error recovery

### Frontend Integration (`client/src/pages/SamsaraIntegration.tsx`)
- **Fleet Overview**: Vehicle and driver status dashboard
- **Integration Monitoring**: Event logging and status tracking
- **Route Management**: Create and manage Samsara routes from FleetChat
- **Real-time Status**: Connection status and sync monitoring

## Changelog
```
Changelog:
- June 26, 2025. Initial setup
- June 26, 2025. Complete FleetChat platform implementation with transport communication workflows, GDPR-compliant user management, document handling, and GPS tracking features
- June 26, 2025. Comprehensive Samsara integration architecture design with real-time event processing, fleet management, and bidirectional data synchronization
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```