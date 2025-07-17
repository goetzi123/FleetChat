# FleetChat Customer Portal Specification

## Overview

The FleetChat Customer Portal is a streamlined interface designed for fleet operators to configure, monitor, and manage their FleetChat integration. This portal provides a single fleet administrator per company with comprehensive control over their Samsara-to-WhatsApp communication system, from initial setup through ongoing operations.

## System Architecture

### Single Administrator Model
- **One Admin Per Fleet**: Each trucking company designates one fleet administrator
- **Role Definition**: Typically fleet manager, IT administrator, or operations manager
- **No Driver Access**: Drivers interact exclusively through WhatsApp with no portal access
- **Simplified Management**: Eliminates user management complexity

### Authentication & Security
- **Email-Based Authentication**: Simple login with email and password
- **Session Management**: Secure session handling with automatic timeout
- **Tenant Isolation**: Complete data separation between different fleet operators
- **Role-Based Access**: Admin has full access to their tenant's configuration

## Core Functionality

### 1. Fleet Onboarding Wizard
**Three-Step Setup Process** - Complete system configuration in 2-3 days

#### Step 1: Company & Samsara Integration
**Company Information**
- Company name and contact details
- Fleet administrator email and phone
- Trucking company size and operation type
- Service tier selection (Starter, Professional, Enterprise)

**Samsara API Configuration**
- Samsara API token input with validation
- Samsara group ID specification
- Automatic per-customer webhook creation with signature verification
- API connection testing and verification

**Driver Discovery**
- Automatic driver list retrieval from Samsara
- Driver profile review and validation
- Phone number verification and formatting
- Driver communication preferences

#### Step 2: WhatsApp Business Setup
**Phone Number Assignment**
- Automatic WhatsApp Business phone number assignment
- Phone number verification and testing
- Message template configuration
- Driver invitation system setup

**Communication Preferences**
- Message frequency settings
- Notification preferences
- Language and localization options
- Driver opt-in/opt-out management

#### Step 3: Billing & Payment Configuration
**Subscription Setup**
- Service tier confirmation
- Driver count verification
- Monthly billing amount calculation
- Payment method configuration (Stripe)

**Payment Processing**
- Credit card information collection
- Automatic billing setup
- Invoice delivery preferences
- Payment failure handling

### 2. Fleet Dashboard
**Primary Management Interface** - Real-time fleet communication overview

#### Transport Management
**Active Transports**
- Current active transport list with status
- Driver assignments and vehicle information
- Route progress and estimated completion times
- Communication status and last message timestamps

**Transport Details**
- Complete transport workflow history
- Driver communication log
- Document collection status
- Status update timeline

#### Driver Management
**Driver Overview**
- Complete driver list with communication status
- WhatsApp connection status
- Recent message activity
- Driver preferences and settings

**Driver Communication**
- Manual message sending capability
- Driver response history
- Communication analytics per driver
- Opt-out management

#### Real-Time Monitoring
**Communication Flow**
- Live message feed showing Samsara events and WhatsApp responses
- Driver response times and engagement metrics
- Communication success/failure rates
- System health indicators

**Fleet Metrics**
- Daily/weekly message volume
- Driver response rates
- Transport completion metrics
- Communication efficiency indicators

### 3. Configuration Management
**System Settings** - Comprehensive configuration control

#### Samsara Integration Settings
**API Configuration**
- Samsara API token management
- Webhook endpoint configuration
- Event type preferences
- Data synchronization settings

**Fleet Data Management**
- Driver list synchronization
- Vehicle information updates
- Route management preferences
- Document handling settings

#### WhatsApp Business Configuration
**Message Templates**
- Custom message template creation
- Template approval status
- Message customization options
- Multi-language support

**Communication Rules**
- Message frequency limits
- Quiet hours configuration
- Emergency communication protocols
- Escalation procedures

#### System Preferences
**Notification Settings**
- Email notification preferences
- Dashboard alert configuration
- System maintenance notifications
- Billing and payment alerts

**User Interface**
- Dashboard layout preferences
- Data display options
- Time zone configuration
- Language and localization

### 4. Analytics & Reporting
**Data-Driven Insights** - Comprehensive fleet communication analytics

#### Communication Analytics
**Message Volume**
- Daily, weekly, monthly message statistics
- Message type breakdown (route assignments, status updates, documents)
- Peak usage times and patterns
- Driver engagement metrics

**Response Analytics**
- Driver response rates by message type
- Response time analysis
- Communication effectiveness metrics
- Driver satisfaction indicators

#### Operational Metrics
**Fleet Performance**
- Transport completion rates
- On-time delivery performance
- Driver productivity metrics
- Communication-driven efficiency gains

**Cost Analysis**
- Monthly communication costs
- Cost per driver analysis
- ROI calculation and tracking
- Billing trend analysis

#### Custom Reporting
**Report Builder**
- Custom report creation with drag-and-drop interface
- Scheduled report generation
- Export options (PDF, Excel, CSV)
- Report sharing and distribution

**Data Export**
- Raw data export capabilities
- API access for third-party integrations
- Data retention and archiving
- Compliance reporting

### 5. Billing & Account Management
**Financial Operations** - Transparent billing and account control

#### Billing Overview
**Current Billing**
- Current month charges and usage
- Active driver count and billing rate
- Service tier and features included
- Next billing date and amount

**Billing History**
- Complete invoice history
- Payment method and transaction details
- Billing adjustments and credits
- Tax information and compliance

#### Payment Management
**Payment Methods**
- Credit card management
- Payment method updates
- Auto-pay configuration
- Payment failure handling

**Billing Preferences**
- Invoice delivery preferences
- Billing contact information
- Payment notifications
- Billing cycle preferences

#### Service Management
**Subscription Control**
- Service tier changes
- Feature upgrades/downgrades
- Temporary service suspension
- Account cancellation

**Usage Monitoring**
- Real-time usage tracking
- Usage alerts and notifications
- Billing projections
- Cost optimization recommendations

### 6. Support & Documentation
**Customer Success** - Comprehensive support resources

#### Help Center
**Documentation**
- Getting started guide
- Feature documentation
- Best practices and recommendations
- Troubleshooting guides

**Video Tutorials**
- Setup walkthrough videos
- Feature demonstration videos
- Common task tutorials
- Advanced configuration guides

#### Support Channels
**Ticket System**
- Support ticket creation
- Ticket status tracking
- Response time indicators
- Priority level management

**Live Chat**
- Real-time support chat
- Screen sharing capabilities
- Escalation to technical support
- Multi-language support

#### System Status
**Health Monitoring**
- Real-time system status
- Scheduled maintenance notifications
- Service disruption alerts
- Performance metrics

**Integration Status**
- Samsara API connection health
- WhatsApp Business API status
- Webhook processing status
- Data synchronization health

## Technical Implementation

### Backend Architecture
```typescript
// Customer Portal Routes Structure
/api/customer/
├── auth/                 # Authentication endpoints
├── onboarding/          # Fleet setup wizard
├── dashboard/           # Dashboard data and metrics
├── config/              # Configuration management
├── analytics/           # Analytics and reporting
├── billing/             # Billing and payment operations
├── support/             # Support and help desk
└── integrations/        # Samsara and WhatsApp management
```

### Database Schema
```sql
-- Customer-specific tables
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    admin_email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    samsara_api_token VARCHAR(255),
    samsara_group_id VARCHAR(255),
    whatsapp_phone_number VARCHAR(20),
    service_tier VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE fleet_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    setting_key VARCHAR(255) NOT NULL,
    setting_value JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE communication_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    date DATE NOT NULL,
    messages_sent INTEGER NOT NULL,
    messages_received INTEGER NOT NULL,
    response_rate DECIMAL(5,2),
    avg_response_time INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Authentication Flow
1. **Fleet Admin Login**: Email/password authentication
2. **Session Management**: Secure session with tenant ID binding
3. **Tenant Isolation**: All operations scoped to authenticated tenant
4. **Password Reset**: Email-based password recovery system

### API Integration Points
- **Samsara API**: Real-time fleet data and webhook management
- **WhatsApp Business API**: Message sending and template management
- **Stripe API**: Payment processing and subscription management
- **Internal Analytics**: Usage tracking and business metrics

## User Interface Design

### Dashboard Layout
- **Header**: Company branding, navigation, admin profile, notifications
- **Sidebar**: Primary navigation with onboarding progress indicator
- **Main Content**: Dynamic content area with responsive design
- **Footer**: Support links, system status, documentation

### Key UI Components
- **Setup Wizard**: Step-by-step onboarding with progress tracking
- **Metrics Dashboard**: Real-time KPIs with interactive charts
- **Data Tables**: Driver lists, transport logs, billing history
- **Configuration Forms**: Settings management with validation
- **Real-Time Updates**: Live feed of communication activity

### Responsive Design
- **Desktop**: Full-featured interface optimized for fleet management
- **Tablet**: Touch-friendly controls for mobile fleet managers
- **Mobile**: Essential monitoring and emergency communication

## Security & Compliance

### Data Protection
- **Tenant Isolation**: Complete data separation between fleet operators
- **Encryption**: All data encrypted at rest and in transit
- **Access Control**: Role-based access with session management
- **Audit Logging**: Complete activity tracking for compliance

### GDPR Compliance
- **Driver Consent**: Explicit consent for WhatsApp communication
- **Data Retention**: Configurable retention policies
- **Right to Erasure**: Driver data deletion capabilities
- **Data Portability**: Export capabilities for driver data

### Security Measures
- **Input Validation**: Strict validation for all user inputs
- **SQL Injection Prevention**: Parameterized queries and ORM protection
- **XSS Protection**: Content Security Policy implementation
- **HTTPS Only**: All traffic encrypted with TLS 1.3

## Performance & Scalability

### Performance Optimization
- **Database Indexing**: Optimized queries for tenant-specific data
- **Caching Strategy**: Redis caching for frequently accessed data
- **Lazy Loading**: Progressive data loading for large datasets
- **Background Processing**: Async operations for heavy tasks

### Scalability Considerations
- **Multi-Tenant Architecture**: Efficient resource sharing across tenants
- **Database Sharding**: Horizontal scaling capabilities
- **CDN Integration**: Fast content delivery worldwide
- **Auto-Scaling**: Dynamic resource allocation based on usage

## Integration Specifications

### Samsara Integration
**API Endpoints**
- Driver management and synchronization
- Vehicle tracking and status updates
- Route creation and management
- Webhook configuration and processing

**Data Synchronization**
- Real-time driver status updates
- Vehicle location and movement data
- Transport status and completion tracking
- Document collection and management

### WhatsApp Business API Integration
**Message Management**
- Template message creation and approval
- Bulk message sending capabilities
- Message delivery status tracking
- Response handling and classification

**Phone Number Management**
- Automatic phone number assignment
- Number verification and testing
- Multi-number support for large fleets
- Number portability and migration

### Stripe Integration
**Payment Processing**
- Subscription management and billing
- Payment method handling
- Invoice generation and delivery
- Payment failure handling and retry

**Usage-Based Billing**
- Real-time usage tracking
- Dynamic pricing calculations
- Prorated billing for mid-cycle changes
- Usage alerts and notifications

## Deployment & Maintenance

### Deployment Architecture
- **Multi-Tenant SaaS**: Single deployment serving all fleet operators
- **Environment Management**: Staging and production environments
- **Feature Flags**: Gradual rollout of new features
- **Zero-Downtime Deployment**: Blue-green deployment strategy

### Monitoring & Alerting
- **Real-Time Monitoring**: System health and performance metrics
- **Business Metrics**: Usage patterns and customer satisfaction
- **Alert Management**: Automated alerting for critical issues
- **Customer Notifications**: Proactive communication about issues

### Maintenance Procedures
- **Regular Updates**: Monthly feature releases and security patches
- **Database Maintenance**: Performance optimization and data archiving
- **Security Updates**: Continuous security monitoring and updates
- **Backup Management**: Automated backups with disaster recovery testing

This customer portal specification provides fleet operators with comprehensive control over their FleetChat integration while maintaining simplicity and ease of use. The single administrator model eliminates user management complexity while providing all necessary tools for successful fleet communication automation.