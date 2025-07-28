# FleetChat Production Deployment Checklist
*Date: July 25, 2025*
*Complete Customer-Facing Deployment Requirements*

## Overview

This document outlines the complete requirements for deploying FleetChat as a customer-facing production service with full integration to Samsara, Stripe, and WhatsApp Business API. The deployment must support multi-tenant architecture with enterprise-grade security and reliability.

## 1. Infrastructure & Hosting Requirements

### Production Hosting Platform
- **Recommended:** AWS, Google Cloud, or Azure (not Replit for production)
- **Requirements:**
  - Auto-scaling capability for message traffic
  - Load balancing for high availability
  - SSL/TLS certificates for HTTPS
  - CDN for global performance
  - Database clustering/failover capability

### Domain & DNS
- **Custom Domain:** fleet.chat (already owned)
- **SSL Certificate:** Wildcard certificate for subdomains
- **DNS Configuration:**
  - Main website: fleet.chat
  - API endpoints: api.fleet.chat
  - Admin portal: admin.fleet.chat
  - Status page: status.fleet.chat

### Database Requirements
- **PostgreSQL 16+** with multi-tenant row-level security
- **Minimum Specs:** 4 vCPU, 16GB RAM, 1TB SSD
- **Backup Strategy:** Daily automated backups with 30-day retention
- **Replication:** Master-slave setup for failover
- **Connection Pooling:** PgBouncer or similar

## 2. API Credentials & Service Accounts

### Samsara Integration
**Required Credentials:**
- **Samsara Partner Application:** Register as Samsara marketplace partner
- **OAuth2 Configuration:** For customer Samsara account connections
- **Webhook Management:** Per-customer webhook creation capability
- **API Scopes Needed:**
  ```
  fleet:drivers:read
  fleet:drivers:appSettings:read
  fleet:vehicles:read
  fleet:routes:read
  fleet:routes:write
  fleet:webhooks:write
  fleet:documents:read
  fleet:documents:write
  fleet:locations:read
  ```

**Implementation Steps:**
1. Register FleetChat as Samsara Partner Application
2. Implement OAuth2 flow for customer authorization
3. Create webhook management system for per-customer endpoints
4. Implement webhook signature verification
5. Add rate limiting and error handling

### WhatsApp Business API
**Business Account Requirements:**
- **Meta Business Account:** Verified business account
- **WhatsApp Business Platform Access:** Application approval
- **Phone Number Pool:** 50-100 WhatsApp Business phone numbers
- **Message Templates:** Pre-approved templates for fleet communication

**Required Credentials:**
- **Access Token:** Long-lived access token for WhatsApp Business API
- **App ID:** WhatsApp Business application ID
- **App Secret:** For webhook verification
- **Business Account ID:** Meta Business Account identifier
- **Phone Number IDs:** Individual phone number identifiers

**Implementation Steps:**
1. Apply for WhatsApp Business Platform access
2. Create message template library and get approval
3. Implement phone number provisioning system
4. Set up webhook endpoints for incoming messages
5. Implement message queuing for high volume

### Stripe Payment Processing
**Account Requirements:**
- **Stripe Business Account:** Verified business account
- **Marketplace Configuration:** For multi-tenant billing
- **Webhook Endpoints:** For payment event processing

**Required Credentials:**
- **Publishable Key:** For frontend payment forms
- **Secret Key:** For backend payment processing
- **Webhook Secret:** For webhook signature verification
- **Connect Account:** For marketplace functionality (if needed)

**Implementation Steps:**
1. Set up Stripe business account with tax information
2. Configure automated subscription billing
3. Implement customer portal for billing management
4. Set up usage-based billing for per-driver charges
5. Add tax calculation and compliance

## 3. Environment Configuration

### Production Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/fleetchat_prod
PGDATABASE=fleetchat_prod
PGHOST=prod-db.fleet.chat
PGPORT=5432
PGUSER=fleetchat_prod
PGPASSWORD=<secure_password>

# Redis (for session storage and caching)
REDIS_URL=redis://prod-redis.fleet.chat:6379

# Application
NODE_ENV=production
PORT=443
BASE_URL=https://api.fleet.chat
FRONTEND_URL=https://fleet.chat
ADMIN_URL=https://admin.fleet.chat

# Authentication
SESSION_SECRET=<256-bit-secret>
JWT_SECRET=<256-bit-secret>
ADMIN_JWT_SECRET=<256-bit-secret>

# Samsara Integration
SAMSARA_CLIENT_ID=<samsara_oauth_client_id>
SAMSARA_CLIENT_SECRET=<samsara_oauth_secret>
SAMSARA_REDIRECT_URI=https://api.fleet.chat/auth/samsara/callback
SAMSARA_WEBHOOK_SECRET=<webhook_verification_secret>

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=<long_lived_access_token>
WHATSAPP_APP_ID=<whatsapp_app_id>
WHATSAPP_APP_SECRET=<whatsapp_app_secret>
WHATSAPP_VERIFY_TOKEN=<webhook_verify_token>
WHATSAPP_BUSINESS_ACCOUNT_ID=<business_account_id>

# Stripe
STRIPE_SECRET_KEY=sk_live_<live_secret_key>
STRIPE_PUBLISHABLE_KEY=pk_live_<live_publishable_key>
STRIPE_WEBHOOK_SECRET=whsec_<webhook_secret>

# Email Service (for notifications)
SENDGRID_API_KEY=SG.<sendgrid_api_key>
SUPPORT_EMAIL=support@fleet.chat
BILLING_EMAIL=billing@fleet.chat

# Monitoring & Logging
SENTRY_DSN=<sentry_error_tracking_url>
LOG_LEVEL=info
METRICS_ENDPOINT=<monitoring_service_url>

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=1000
```

## 4. Security Requirements

### Authentication & Authorization
- **Admin Authentication:** Multi-factor authentication for admin access
- **Customer Authentication:** OAuth2 with Samsara/fleet system integration
- **API Security:** JWT tokens with short expiration times
- **Session Management:** Redis-based session storage with encryption

### Data Encryption
- **At Rest:** Database encryption for sensitive fields (API tokens, phone numbers)
- **In Transit:** TLS 1.3 for all communications
- **API Tokens:** Encrypted storage with separate encryption keys
- **PII Data:** GDPR-compliant encryption for driver phone numbers

### Network Security
- **Firewall:** Restrict database access to application servers only
- **VPC:** Private network for all production services
- **API Rate Limiting:** Protection against DDoS and abuse
- **Webhook Validation:** Signature verification for all incoming webhooks

## 5. Database Schema Deployment

### Migration System
```sql
-- Create production database with multi-tenant row-level security
CREATE DATABASE fleetchat_prod;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tables with proper indexes and constraints
-- (Use existing schema.ts as reference)

-- Set up row-level security for multi-tenancy
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transports ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant isolation
CREATE POLICY tenant_isolation ON tenants FOR ALL USING (id = current_setting('app.current_tenant')::uuid);
CREATE POLICY user_tenant_isolation ON users FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);
-- (Continue for all tenant-scoped tables)
```

### Required Database Indexes
```sql
-- Performance indexes for high-traffic queries
CREATE INDEX CONCURRENTLY idx_users_tenant_role ON users(tenant_id, role);
CREATE INDEX CONCURRENTLY idx_transports_tenant_status ON transports(tenant_id, status);
CREATE INDEX CONCURRENTLY idx_messages_tenant_created ON messages(tenant_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_webhooks_tenant_processed ON webhook_events(tenant_id, processed_at);

-- Unique constraints for data integrity
ALTER TABLE tenants ADD CONSTRAINT unique_company_name UNIQUE (company_name);
ALTER TABLE users ADD CONSTRAINT unique_tenant_phone UNIQUE (tenant_id, whatsapp_number);
```

## 6. API Endpoints Implementation

### Customer Onboarding API
```typescript
// Complete implementation needed:
POST /api/auth/samsara/connect     - OAuth2 Samsara connection
GET /api/samsara/drivers/:tenantId - Discover drivers from Samsara
POST /api/tenant/setup             - Complete tenant configuration
POST /api/billing/setup            - Stripe customer creation
POST /api/drivers/onboard          - Driver WhatsApp activation
```

### Production Webhook Endpoints
```typescript
// Webhook handlers for real-time integration:
POST /api/webhooks/samsara/:tenantId    - Samsara event processing
POST /api/webhooks/whatsapp             - WhatsApp message handling
POST /api/webhooks/stripe               - Payment event processing
```

### Monitoring & Analytics
```typescript
// Customer dashboard and analytics:
GET /api/dashboard/:tenantId            - Tenant dashboard data
GET /api/analytics/messages/:tenantId   - Message statistics
GET /api/analytics/billing/:tenantId    - Usage and billing data
GET /api/health                         - System health check
```

## 7. Frontend Applications

### Customer Portal (React/Next.js)
**Features Required:**
- Samsara OAuth2 connection flow
- Driver discovery and selection interface
- WhatsApp activation management
- Real-time message monitoring dashboard
- Billing and usage analytics
- Support ticket system

**Deployment:**
- Host on Vercel/Netlify with CDN
- Environment-specific builds (staging/production)
- Error tracking with Sentry
- Analytics with Google Analytics/Mixpanel

### Admin Portal
**Features Required:**
- Tenant management and monitoring
- Pricing tier configuration
- System health monitoring
- Customer support tools
- Billing oversight and reconciliation
- WhatsApp phone number pool management

## 8. Message Template System

### WhatsApp Template Approval
**Required Templates:**
```json
{
  "route_assignment": {
    "name": "route_assignment_v1",
    "status": "approved",
    "components": [
      {
        "type": "body",
        "text": "New route assigned: {{pickup_location}} to {{delivery_location}}. ETA: {{pickup_eta}}. Contact dispatcher: {{dispatcher_phone}}"
      },
      {
        "type": "buttons",
        "buttons": [
          {"type": "reply", "title": "✅ Accepted"},
          {"type": "reply", "title": "❌ Cannot Accept"},
          {"type": "reply", "title": "📞 Call Dispatcher"}
        ]
      }
    ]
  }
}
```

### Template Management System
- Dynamic template variable substitution
- Multi-language template support
- Template performance analytics
- A/B testing for message effectiveness

## 9. Monitoring & Observability

### Application Monitoring
- **Error Tracking:** Sentry for error monitoring and alerting
- **Performance Monitoring:** New Relic or DataDog for APM
- **Uptime Monitoring:** Pingdom or UptimeRobot for service availability
- **Log Management:** ELK stack or Splunk for centralized logging

### Business Metrics
- **Message Volume:** Daily/monthly message statistics per tenant
- **Delivery Rates:** WhatsApp message delivery success rates
- **Response Times:** API response time monitoring
- **Customer Usage:** Driver activation and engagement metrics

### Alerting System
```yaml
# Critical alerts configuration
alerts:
  - name: "Database Connection Failure"
    severity: "critical"
    condition: "database_connections < 1"
    notification: "slack, email, sms"
  
  - name: "WhatsApp API Rate Limit"
    severity: "warning" 
    condition: "whatsapp_rate_limit > 80%"
    notification: "slack, email"
    
  - name: "High Error Rate"
    severity: "warning"
    condition: "error_rate > 5%"
    notification: "slack"
```

## 10. Compliance & Legal

### GDPR Compliance
- **Data Processing Agreement:** Legal framework for customer data
- **Privacy Policy:** Updated for production service
- **Cookie Consent:** Website cookie compliance
- **Data Retention:** Automated data cleanup after retention period
- **Right to Deletion:** Customer data deletion upon request

### Business Compliance
- **Terms of Service:** Production service terms
- **SLA Agreement:** Service level agreements for uptime/performance
- **Business License:** Required business registrations
- **Insurance:** Cyber liability and business insurance
- **Tax Compliance:** Sales tax registration where required

## 11. Testing Strategy

### Pre-Production Testing
- **Load Testing:** Simulate high message volume (10,000+ messages/hour)
- **Integration Testing:** End-to-end Samsara → FleetChat → WhatsApp flow
- **Security Testing:** Penetration testing and vulnerability assessment
- **Compliance Testing:** GDPR and data protection compliance validation

### Staging Environment
- **Staging Infrastructure:** Production-like environment for testing
- **Test Data:** Anonymized customer data for realistic testing
- **Samsara Sandbox:** Test Samsara integration with sandbox API
- **WhatsApp Test Numbers:** Test WhatsApp integration with test phone numbers

## 12. Launch Preparation

### Operational Readiness
- **Customer Support:** 24/7 support team and documentation
- **Runbooks:** Operations procedures for common issues
- **Incident Response:** Escalation procedures for critical issues
- **Backup Procedures:** Data backup and recovery testing

### Business Readiness
- **Pricing Finalization:** Production pricing tiers and billing
- **Marketing Materials:** Updated website and sales collateral  
- **Sales Process:** Customer onboarding and contract procedures
- **Partnership Agreements:** Samsara partner agreement execution

## 13. Go-Live Checklist

### Final Deployment Steps
- [ ] Production infrastructure provisioned and configured
- [ ] All environment variables set and validated
- [ ] Database migrated with proper security policies
- [ ] SSL certificates installed and configured
- [ ] DNS records updated to point to production
- [ ] Monitoring and alerting systems active
- [ ] Backup systems tested and verified
- [ ] Load balancer and auto-scaling configured
- [ ] All API integrations tested in production
- [ ] Customer support systems ready
- [ ] Incident response team briefed
- [ ] Launch announcement prepared

### Post-Launch Monitoring (First 48 Hours)
- [ ] Monitor error rates and response times
- [ ] Verify all webhook endpoints receiving data
- [ ] Check message delivery success rates  
- [ ] Monitor database performance and connections
- [ ] Validate billing system calculations
- [ ] Review customer onboarding flow
- [ ] Assess customer support ticket volume
- [ ] Monitor security logs for anomalies

## 14. Estimated Timeline & Resources

### Development Timeline (12-16 weeks)
- **Weeks 1-2:** Infrastructure setup and environment configuration
- **Weeks 3-4:** Samsara OAuth2 and webhook implementation
- **Weeks 5-6:** WhatsApp Business API integration and phone number management
- **Weeks 7-8:** Stripe billing system and customer portal
- **Weeks 9-10:** Admin portal and monitoring systems
- **Weeks 11-12:** Security hardening and compliance implementation
- **Weeks 13-14:** Load testing and performance optimization
- **Weeks 15-16:** Final testing, documentation, and launch preparation

### Resource Requirements
- **Backend Developer:** 2 full-time (Node.js/TypeScript expertise)
- **Frontend Developer:** 1 full-time (React/Next.js expertise)
- **DevOps Engineer:** 1 full-time (AWS/infrastructure expertise)
- **QA Engineer:** 1 part-time (testing and compliance)
- **Product Manager:** 1 part-time (coordination and requirements)

### Estimated Costs (First Year)
- **Infrastructure:** $2,000-5,000/month (AWS/GCP hosting)
- **WhatsApp Business API:** $0.012-0.028 per message (variable)
- **Third-party Services:** $500-1,000/month (monitoring, security, etc.)
- **Development Team:** $50,000-100,000 (contract/full-time)
- **Business Insurance/Legal:** $5,000-10,000/year

## Conclusion

FleetChat production deployment requires comprehensive integration across multiple enterprise platforms with strict security, compliance, and reliability requirements. The system must handle multi-tenant architecture while maintaining data isolation and providing real-time communication capabilities.

**Critical Success Factors:**
1. **Partnership Approvals:** Samsara and WhatsApp Business API partner status
2. **Security Implementation:** Enterprise-grade security and compliance
3. **Scalable Architecture:** Auto-scaling infrastructure for message volume
4. **Customer Experience:** Seamless onboarding and reliable service
5. **Business Operations:** 24/7 support and incident response capability

With proper execution of this deployment plan, FleetChat will be positioned to serve enterprise fleet operators with a production-ready communication platform that meets all technical, security, and business requirements.