# ZeKju Platform - Replit Development Guide

## Overview

ZeKju is a GDPR-compliant transport communication platform that enables workflow automation through popular messenger apps (WhatsApp, Telegram, Viber) without requiring dedicated mobile applications. The platform serves the logistics industry by connecting truck drivers, dispatchers, yard operators, and shippers through automated chat-based workflows with real-time translation capabilities across 24 European languages.

## System Architecture

### Frontend Architecture
- **Transport Center UI**: Web-based dashboard for dispatchers and operators
- **Messenger Integration**: Chat-based interfaces through WhatsApp, Telegram, and Viber APIs
- **QR Code System**: Digital check-in and onboarding via QR code generation
- **Document Management Interface**: Digital approval/rejection system for PODs and delivery documents

### Backend Architecture
- **Workflow Engine**: Automated status collection and document processing
- **Translation Service**: Real-time translation across 24 European languages
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
- Language preference configuration
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

### 5. Translation Service
- Real-time chat translation
- Support for 24 European languages
- Automated language detection
- Context-aware transport terminology

## Data Flow

1. **Driver Onboarding**: SMS/QR → Messenger Selection → Privacy Acceptance → Workflow Assignment
2. **Status Updates**: Automated Prompts → Driver Response → System Processing → Dispatcher Notification
3. **Document Flow**: Driver Upload → System Processing → Dispatcher Review → Approval/Rejection
4. **Location Data**: GPS Collection → Validation → Geofence Processing → ETA Calculation
5. **Communication**: Driver Message → Translation → Dispatcher Interface → Response Translation → Driver

## External Dependencies

### Messenger Platform APIs
- WhatsApp Business API
- Telegram Bot API
- Viber Business API

### TMS Integration Partners
- Transporeon
- Agheera
- project44
- Wanko
- D-Soft (bluecargo)

### Core Services
- SMS Gateway for initial contact
- Translation services for multi-language support
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
- Real-time translation service scaling
- Geolocation data processing efficiency

### Integration Deployment
- API-first approach for TMS connectors
- Webhook-based real-time updates
- Batch processing for large data volumes
- Fallback mechanisms for service reliability

## Changelog
```
Changelog:
- June 26, 2025. Initial setup
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```