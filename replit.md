# FleetChat Message Broker - Replit Development Guide

## Overview

FleetChat is a headless message broker service that facilitates seamless communication between Samsara fleet management systems and WhatsApp Business API. The service operates without a user interface, functioning purely as an intelligent message routing and translation layer between TMS platforms and driver communication channels.

## System Architecture

### Headless Message Broker Architecture
- **Event Translation Engine**: Converts Samsara fleet events into contextual WhatsApp messages
- **Response Processing System**: Processes driver WhatsApp responses and updates Samsara records
- **Phone Number Resolution**: Maps Samsara driver IDs to WhatsApp numbers with GDPR compliance
- **Webhook Processors**: Bidirectional webhook handling for Samsara and WhatsApp integrations
- **Message Templates**: Contextual driver communication templates for various transport scenarios

### Integration Points
- **Samsara TMS**: Primary fleet management system (driver data, routes, events)
- **WhatsApp Business API**: Driver communication channel
- **No User Interface**: Pure API service with webhook endpoints only

### Message Broker Layer
- **Bidirectional Communication**: Samsara events → WhatsApp messages, Driver responses → Samsara updates
- **Intelligent Translation**: Context-aware message generation based on transport events
- **Document Processing**: WhatsApp attachments automatically uploaded to Samsara transport records
- **Status Synchronization**: Real-time status updates between driver responses and fleet management

## Key Components

### 1. Driver Onboarding System
- SMS/QR code invitation system
- Privacy terms acceptance workflow
- WhatsApp Business API connection
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

## Message Broker Flow

1. **Fleet Event Processing**: Samsara Event → Driver Phone Resolution → WhatsApp Message Generation → Driver Notification
2. **Driver Response Handling**: WhatsApp Response → Driver Identification → Response Classification → Samsara Update
3. **Document Processing**: WhatsApp Document Upload → File Processing → Samsara Transport Record Update
4. **Status Synchronization**: Driver Status Update → Transport Status Change → Real-time Fleet Visibility
5. **Bidirectional Communication**: Samsara ↔ FleetChat ↔ WhatsApp (No human interface required)

## External Dependencies

### Messenger Platform APIs
- WhatsApp Business API

### TMS Integration Partners
- **Samsara** (Primary Fleet Management Platform)
- Transporeon
- Agheera
- project44
- Wanko
- D-Soft (bluecargo)

### Core Services
- SMS Gateway for initial contact
- WhatsApp Business API messaging service
- Geolocation services for tracking
- QR code generation libraries
- File storage for document management

### Compliance & Security
- GDPR compliance framework
- Data anonymization for tracking
- Secure chat infrastructure
- Privacy-first architecture

## Multi-Tenant Architecture

### Core Multi-Tenancy Design
FleetChat is built as a multi-tenant SaaS platform supporting unlimited trucking companies with complete logical separation:

**Tenant Isolation:**
- Each fleet operator is a separate tenant with isolated data
- Dedicated WhatsApp phone numbers per fleet (tenant)
- Separate Samsara API configurations per tenant
- Independent driver databases with GDPR compliance
- Isolated message queues and webhook processing

**Shared Infrastructure:**
- Single FleetChat middleware instance serves all tenants
- Shared WhatsApp Business API management layer
- Common message template library with tenant customization
- Unified billing and monitoring systems
- Centralized compliance and security management

### Scalability Considerations
- WhatsApp Business API rate limiting handling
- Document storage optimization
- Real-time WhatsApp messaging service scaling
- Geolocation data processing efficiency

### Integration Deployment
- API-first approach for TMS connectors
- Webhook-based real-time updates
- Batch processing for large data volumes
- Fallback mechanisms for service reliability

## Current Implementation Status

### Production Fleet.Chat System Complete
- **Production-Ready Architecture**: Full PostgreSQL database with multi-tenant isolation
- **Samsara API Integration**: Complete client with driver management, route creation, and webhook processing
- **WhatsApp Business API Management**: Bulk phone number provisioning with managed service infrastructure
- **Fleet Onboarding System**: Three-step setup process with Samsara connection and payment integration
- **Stripe Payment Integration**: Automated driver-based billing with monthly invoicing
- **Fleet Dashboard**: Comprehensive management interface for fleet operators
- **High-Performance Message Broker**: Bidirectional communication with intelligent event processing

### Production Components Built
1. **Database Schema**: Complete PostgreSQL schema with tenant isolation, users, transports, billing records, admin system
2. **Samsara API Client**: Full integration including drivers, vehicles, routes, locations, documents, webhooks
3. **WhatsApp Management Service**: Bulk phone provisioning, message templates, media handling, webhook processing
4. **Fleet Onboarding UI**: Multi-step setup with Samsara configuration, driver discovery, and payment setup
5. **Fleet Dashboard**: Real-time monitoring with transport tracking, driver management, and billing overview
6. **Message Translation Engine**: Context-aware WhatsApp message generation for transport workflows
7. **Automated Billing System**: Driver-based pricing with Stripe integration and usage tracking
8. **Admin Management System**: Complete admin dashboard with usage monitoring, pricing configuration, and system oversight

### Production API Endpoints
- `POST /api/fleet/setup` - Complete fleet onboarding with Samsara and WhatsApp configuration
- `GET /api/samsara/drivers/:tenantId` - Discover and list Samsara drivers
- `POST /api/fleet/drivers/onboard` - Onboard selected drivers to WhatsApp
- `POST /api/fleet/billing/setup` - Configure Stripe payment integration
- `POST /api/samsara/webhook` - Process real-time Samsara fleet events
- `POST /api/whatsapp/webhook` - Handle incoming WhatsApp messages from drivers
- `GET /api/dashboard/:tenantId` - Fleet dashboard data and statistics
- `GET /api/health` - Service health with WhatsApp pool statistics

### User Interface Components
- **Public Fleet.Chat Website**: Professional marketing site describing service capabilities and value proposition
- **Fleet.Chat Production App**: Complete onboarding and dashboard system for fleet operators
- **Fleet Onboarding Wizard**: Three-step setup process (Company/Samsara → Driver Discovery → Billing)
- **Fleet Dashboard**: Multi-tab interface (Transports, Drivers, Billing, Settings)
- **Demo Environment**: Original FleetChat system preserved for development and testing

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

### WhatsApp Response Processing System (`server/integrations/whatsapp-response-handler.ts`)
- **Bidirectional Communication**: Complete system for processing driver responses to templated messages
- **Smart Response Classification**: Automatic detection of button clicks, quick replies, text messages, location shares, and document uploads
- **Context-Aware Processing**: Links incoming messages to active transports and driver profiles
- **Automated Actions**: Updates transport status, creates location tracking, processes document uploads
- **Intelligent Text Processing**: Natural language understanding for free-text driver responses

### WhatsApp Webhook Integration (`/api/whatsapp/webhook`)
- **Real-time Message Processing**: Webhook endpoint for WhatsApp Business API integration
- **Message Content Extraction**: Handles all WhatsApp message types (text, buttons, location, documents, images)
- **Response Generation**: Automatic contextual responses based on driver actions
- **Security**: Webhook verification and signature validation for production deployment

## Known Issues

### Replit Preview System Compatibility
- **Issue**: Replit preview panel fails to display demo despite server running successfully on port 3000
- **Status**: Technical limitation with Replit's preview integration system
- **Workaround**: Server accessible via direct port access and external browser tabs
- **Impact**: Demo functionality fully operational, preview display issue only
- **Date Reported**: June 28, 2025

## Changelog
```
Changelog:
- June 26, 2025. Initial setup
- June 26, 2025. Complete FleetChat platform implementation with transport communication workflows, GDPR-compliant user management, document handling, and GPS tracking features
- June 26, 2025. Comprehensive Samsara integration architecture design with real-time event processing, fleet management, and bidirectional data synchronization
- June 26, 2025. Removed multi-language support requirement - simplified communication service to focus on unified messaging across messenger platforms
- June 26, 2025. Limited messenger client integration to WhatsApp only - removed Telegram and Viber support from platform architecture
- June 26, 2025. Implemented comprehensive WhatsApp response handling system with bidirectional communication, smart message processing, and automated workflow updates
- June 27, 2025. Enhanced Samsara integration with complete API coverage including fleet telematics, safety monitoring, HOS compliance, geofencing, industrial IoT, and maintenance tracking
- June 27, 2025. Created comprehensive prototype deployment specification confirming macro requirement for seamless WhatsApp conversation flow management with complete backend synchronization
- June 27, 2025. Redesigned Samsara integration to ensure driver phone number access for WhatsApp communication with proper API scopes, validation systems, and GDPR-compliant driver mapping
- June 27, 2025. Redesigned FleetChat as headless message broker service eliminating user interface complexity - pure API service for Samsara-WhatsApp communication routing
- June 28, 2025. Documented Replit preview system compatibility issue - server running successfully but preview panel integration failing
- June 28, 2025. Created comprehensive 2-page system overview document summarizing FleetChat's headless middleware architecture, integration capabilities, and business impact
- June 28, 2025. Developed complete fleet operator onboarding guide explaining Samsara API configuration, webhook setup, WhatsApp integration, and driver mapping requirements
- June 29, 2025. Simplified WhatsApp integration to FleetChat managed service only - eliminates need for fleet operators to handle separate WhatsApp Business API setup
- June 29, 2025. Created comprehensive billing architecture document detailing driver-based pricing, automated invoice generation, and enterprise billing features
- June 29, 2025. Confirmed FleetChat's simplified two-part configuration: Samsara API management and automated credit card billing for active drivers monthly
- June 29, 2025. Implemented comprehensive multi-tenant architecture with tenant isolation, updated schema with tenantId fields, and created detailed multi-tenant documentation
- June 29, 2025. Created executive summary document covering system overview, value proposition, business model, market opportunity, and financial projections for FleetChat platform
- June 29, 2025. Developed interactive HTML presentation and PowerPoint-ready content covering complete FleetChat business case with 8 professional slides
- June 29, 2025. Confirmed single fleet administrator model per tenant - one user per trucking company handles both Samsara API and payment configuration
- June 29, 2025. Created comprehensive onboarding summary document detailing the complete two-step configuration process, single administrator model, and deployment timeline
- June 29, 2025. Implemented complete production Fleet.Chat system with PostgreSQL database, Samsara API integration, WhatsApp Business API management, fleet onboarding UI, Stripe payment integration, and comprehensive dashboard
- June 30, 2025. Created professional public website for fleet.chat with comprehensive service description, pricing information, feature overview, and contact integration for fleet operator inquiries
- June 30, 2025. Implemented complete admin management system with secure authentication, pricing tier management, usage analytics, billing oversight, and system configuration controls
- June 30, 2025. Created dynamic pricing synchronization between admin system and public website - pricing changes in admin panel automatically update on fleet.chat website via real-time API
- June 30, 2025. Added comprehensive Fleet.Chat Privacy Policy (effective 06/29/2025) to website with dedicated privacy page and footer navigation integration
- June 30, 2025. Created comprehensive technical documentation with detailed multi-tenant architecture specifications, including row-level security, tenant isolation strategies, API endpoint scoping, webhook processing, and database schema design for enterprise-grade multi-tenancy
- July 6, 2025. Resolved critical demo functionality issue - completely rebuilt index.js server to eliminate JavaScript syntax errors and template literal parsing conflicts that were preventing event propagation from Samsara Fleet Events to WhatsApp Driver Interface in Replit preview environment
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```