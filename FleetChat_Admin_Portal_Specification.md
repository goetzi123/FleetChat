# FleetChat Admin Portal Specification

## Overview

The FleetChat Admin Portal is a comprehensive management interface for system administrators to oversee the entire FleetChat platform. This portal provides centralized control over pricing, tenant management, system configuration, usage analytics, and billing operations across all fleet operators using the service.

## System Architecture

### Authentication & Security
- **Multi-factor Authentication**: Admin login with email/password and optional 2FA
- **Role-Based Access Control**: Super Admin, Operations Admin, Billing Admin, Support Admin
- **Session Management**: Secure session handling with PostgreSQL session store
- **Audit Logging**: Complete activity tracking for all admin actions

### Database Schema
The admin portal operates on dedicated admin tables:
- `admins` - Admin user accounts with role assignments
- `admin_sessions` - Secure session management
- `pricing_tiers` - Service pricing configuration 
- `system_config` - Global system configuration values
- `usage_analytics` - Platform usage metrics and reporting
- `billing_records` - Cross-tenant billing and revenue tracking

## Core Functionality

### 1. Admin Dashboard
**Primary Landing Page** - System overview with key metrics

#### System Health Status
- **Service Status**: Real-time monitoring of all FleetChat services
- **WhatsApp Pool Health**: Available phone numbers and connection status
- **Samsara API Status**: Integration health across all tenants
- **Database Performance**: Query performance and connection pool status
- **Error Rates**: System-wide error tracking and alerting

#### Key Performance Indicators
- **Total Tenants**: Active fleet operators using FleetChat
- **Active Drivers**: Monthly active drivers across all tenants
- **Message Volume**: Daily/monthly message processing statistics
- **Revenue Metrics**: Monthly recurring revenue and growth trends
- **System Uptime**: Service availability and reliability metrics

### 2. Tenant Management
**Multi-Tenant Oversight** - Comprehensive tenant administration

#### Tenant Directory
- **Tenant List**: All fleet operators with status, creation date, and activity
- **Tenant Details**: Deep dive into individual tenant configurations
- **Contact Information**: Fleet administrator contact details and preferences
- **Service Tier**: Current pricing plan and feature access levels
- **Integration Status**: Samsara API health and WhatsApp phone number assignments

#### Tenant Operations
- **Tenant Creation**: Onboard new fleet operators with guided setup and automatic webhook creation
- **Configuration Management**: Edit tenant settings and integration parameters
- **Webhook Management**: Monitor per-customer webhook health and configuration
- **Service Suspension**: Temporarily disable tenants with automatic webhook cleanup
- **Data Export**: Extract tenant data for analysis or migration
- **Support Tickets**: Track and manage tenant support requests

### 3. Pricing Management
**Dynamic Pricing Control** - Real-time pricing tier configuration

#### Pricing Tiers Administration
- **Tier Creation**: Define new pricing plans with feature sets
- **Price Adjustments**: Update per-driver pricing across all tiers
- **Feature Toggles**: Enable/disable features for different pricing levels
- **Grandfathering**: Manage existing customers during pricing changes
- **Promotional Pricing**: Create temporary discounts and special offers

#### Revenue Optimization
- **Pricing Analytics**: Track pricing effectiveness and customer response
- **Tier Migration**: Move customers between pricing tiers
- **Usage-Based Pricing**: Configure dynamic pricing based on message volume
- **Enterprise Pricing**: Custom pricing for large fleet operators
- **Billing Cycle Management**: Monthly/annual billing configuration

### 4. Usage Analytics & Reporting
**Data-Driven Insights** - Comprehensive platform analytics

#### Platform Usage Metrics
- **Message Volume**: Daily/weekly/monthly message processing statistics
- **Driver Activity**: Active driver counts and engagement rates
- **Feature Utilization**: Usage patterns across FleetChat features
- **Geographic Distribution**: Tenant and driver distribution by region
- **Peak Usage Analysis**: Traffic patterns and capacity planning

#### Business Intelligence
- **Revenue Reporting**: Detailed financial performance across all tenants
- **Customer Retention**: Churn analysis and retention metrics
- **Growth Metrics**: New tenant acquisition and expansion rates
- **Operational Efficiency**: System performance and cost optimization
- **Competitive Analysis**: Market position and feature adoption

### 5. System Configuration
**Global Platform Settings** - System-wide configuration management

#### WhatsApp Business API Management
- **Phone Number Pool**: Manage available WhatsApp Business phone numbers
- **API Key Management**: Secure storage and rotation of WhatsApp API credentials
- **Rate Limiting**: Configure message sending limits and throttling
- **Template Management**: System-wide message templates and customization
- **Webhook Configuration**: WhatsApp webhook endpoint management

#### Samsara Integration Settings
- **API Version Management**: Maintain compatibility across Samsara API versions
- **Feature Flags**: Enable/disable Samsara features for different tenants
- **Webhook Security**: Manage webhook verification and security tokens
- **Rate Limiting**: Configure API request limits and retry policies
- **Data Retention**: Configure how long Samsara data is cached

### 6. Billing & Revenue Management
**Financial Operations** - Comprehensive billing administration

#### Billing Operations
- **Invoice Generation**: Automated monthly billing across all tenants
- **Payment Processing**: Stripe integration for payment collection
- **Billing Disputes**: Handle payment issues and billing inquiries
- **Revenue Recognition**: Track and report revenue according to accounting standards
- **Tax Management**: Handle tax calculations and compliance

#### Financial Reporting
- **Revenue Dashboard**: Real-time revenue tracking and projections
- **Tenant Billing History**: Complete billing history for each fleet operator
- **Payment Analytics**: Payment success rates and failure analysis
- **Accounts Receivable**: Outstanding payments and collection management
- **Financial Forecasting**: Predict revenue growth and system capacity needs

### 7. Support & Operations
**Customer Success** - Comprehensive support management

#### Support Ticket Management
- **Ticket Queue**: Centralized support request management
- **Priority Levels**: Urgent, high, normal, low priority classification
- **SLA Tracking**: Response time monitoring and escalation procedures
- **Knowledge Base**: Internal documentation and troubleshooting guides
- **Customer Communication**: Email templates and response management

#### System Maintenance
- **Scheduled Maintenance**: Plan and communicate system maintenance windows
- **Feature Rollouts**: Gradual feature deployment and rollback capabilities
- **Database Maintenance**: Performance optimization and data archiving
- **Security Updates**: System security patches and vulnerability management
- **Backup Management**: Data backup verification and disaster recovery

## Technical Implementation

### Backend Architecture
```typescript
// Admin Routes Structure
/api/admin/
├── auth/                 # Authentication endpoints
├── dashboard/            # Dashboard metrics and KPIs
├── tenants/             # Tenant management operations
├── pricing/             # Pricing tier management
├── analytics/           # Usage and business analytics
├── config/              # System configuration
├── billing/             # Billing and revenue operations
├── support/             # Support and ticketing
└── maintenance/         # System maintenance operations
```

### Database Schema Extensions
```sql
-- Admin-specific tables
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

CREATE TABLE admin_sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE TABLE pricing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    price_per_driver DECIMAL(10,2) NOT NULL,
    features JSON NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE system_config (
    key VARCHAR(255) PRIMARY KEY,
    value JSON NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE usage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    date DATE NOT NULL,
    active_drivers INTEGER NOT NULL,
    messages_sent INTEGER NOT NULL,
    messages_received INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Authentication Flow
1. **Admin Login**: Email/password authentication with bcrypt hashing
2. **Session Management**: PostgreSQL session store with 24-hour expiration
3. **Role Validation**: Middleware to check admin permissions for each endpoint
4. **Activity Logging**: Track all admin actions for audit purposes

### API Integration Points
- **Stripe API**: Payment processing and subscription management
- **WhatsApp Business API**: Phone number management and message templates
- **Samsara API**: Integration monitoring and health checks
- **Internal Analytics**: Usage tracking and business metrics

## User Interface Design

### Dashboard Layout
- **Header**: Navigation, admin profile, notifications, logout
- **Sidebar**: Primary navigation with role-based menu items
- **Main Content**: Dynamic content area with responsive design
- **Footer**: System status, documentation links, support contact

### Key UI Components
- **Metrics Cards**: KPI displays with trend indicators
- **Data Tables**: Sortable, searchable tables for tenant and billing data
- **Charts & Graphs**: Revenue trends, usage patterns, system health
- **Form Management**: Configuration forms with validation
- **Modal Dialogs**: Confirmation dialogs and detailed views

### Responsive Design
- **Desktop**: Full-featured interface with multi-column layouts
- **Tablet**: Simplified navigation with touch-friendly controls
- **Mobile**: Essential functions only with swipe navigation

## Security & Compliance

### Access Control
- **Role-Based Permissions**: Granular access control for different admin functions
- **IP Whitelisting**: Restrict admin access to specific IP addresses
- **Two-Factor Authentication**: Optional 2FA for enhanced security
- **Session Timeout**: Automatic logout after inactivity

### Data Protection
- **Encryption**: All sensitive data encrypted at rest and in transit
- **Audit Logging**: Complete activity tracking for compliance
- **Data Retention**: Configurable retention policies for different data types
- **GDPR Compliance**: Data protection and privacy controls

### System Security
- **Input Validation**: Strict validation for all admin inputs
- **SQL Injection Prevention**: Parameterized queries and ORM protection
- **XSS Protection**: Content Security Policy and input sanitization
- **HTTPS Only**: All admin traffic encrypted with TLS 1.3

## Performance & Scalability

### Performance Optimization
- **Database Indexing**: Optimized queries for large datasets
- **Caching Strategy**: Redis caching for frequently accessed data
- **Lazy Loading**: Progressive data loading for large tables
- **Background Processing**: Async operations for heavy tasks

### Scalability Considerations
- **Horizontal Scaling**: Load balancer support for multiple admin instances
- **Database Sharding**: Partition large datasets across multiple databases
- **CDN Integration**: Static asset delivery optimization
- **API Rate Limiting**: Prevent abuse and ensure fair usage

## Monitoring & Alerting

### System Monitoring
- **Health Checks**: Automated monitoring of all system components
- **Performance Metrics**: Response time, throughput, error rates
- **Resource Usage**: CPU, memory, disk, network utilization
- **Business Metrics**: Revenue, customer satisfaction, usage trends

### Alert Management
- **Email Notifications**: Critical system alerts sent to admin team
- **Slack Integration**: Real-time notifications for urgent issues
- **Escalation Procedures**: Automated escalation for unresolved issues
- **On-Call Rotation**: 24/7 support coverage for critical systems

## Deployment & Maintenance

### Deployment Process
- **Blue-Green Deployment**: Zero-downtime deployments
- **Feature Flags**: Gradual rollout of new features
- **Rollback Procedures**: Quick rollback for problematic deployments
- **Environment Management**: Staging and production environment parity

### Maintenance Procedures
- **Regular Updates**: Monthly security patches and feature updates
- **Database Maintenance**: Index optimization and performance tuning
- **Backup Verification**: Regular backup testing and restoration procedures
- **Disaster Recovery**: Comprehensive DR plans and testing

This admin portal specification provides the foundation for comprehensive FleetChat platform management, enabling administrators to effectively oversee operations, optimize performance, and ensure customer success across all fleet operators using the service.