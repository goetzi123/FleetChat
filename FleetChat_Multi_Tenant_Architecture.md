# FleetChat Multi-Tenant Architecture

## Overview
FleetChat operates as a Software-as-a-Service (SaaS) platform designed to serve multiple trucking companies simultaneously while maintaining complete data isolation and security between tenants. **Architecture Status**: Production-grade multi-tenant system fully implemented with PostgreSQL backend (July 2025).

## Tenant Architecture

### Tenant Definition
Each trucking company using FleetChat is a separate **tenant** with:
- Unique tenant identifier (e.g., `tenant_abc_trucking_001`)
- Dedicated WhatsApp Business phone number
- Isolated Samsara API configuration
- Separate driver database and communication logs
- Independent billing and usage tracking

### Data Isolation Model

#### Database-Level Separation
```sql
-- All tables include tenant_id for strict isolation
transports {
  id: varchar
  tenant_id: varchar  -- Foreign key to tenants table
  samsara_driver_id: varchar
  status: varchar
  -- Additional transport fields
}

drivers {
  id: varchar
  tenant_id: varchar  -- Ensures driver data isolation
  samsara_driver_id: varchar
  whatsapp_number: varchar (encrypted)
  consent_status: varchar
  -- Additional driver fields
}

message_logs {
  id: varchar
  tenant_id: varchar  -- Message isolation per tenant
  driver_id: varchar
  direction: enum(inbound, outbound)
  content: text (encrypted)
  timestamp: datetime
}
```

#### API-Level Tenant Isolation
```javascript
// All FleetChat operations include tenant context
class FleetChatService {
  async processWebhook(tenantId, samsaraEvent) {
    // Validate tenant ownership of Samsara event
    // Process only within tenant boundary
  }
  
  async sendWhatsAppMessage(tenantId, driverId, message) {
    // Use tenant-specific WhatsApp credentials
    // Access only tenant's driver database
  }
}
```

### Tenant Configuration Management

#### Per-Tenant Settings
```javascript
// Tenant configuration schema
{
  tenant_id: "abc_trucking_001",
  company_name: "ABC Trucking Company",
  
  // Samsara Integration
  samsara_config: {
    api_token: "encrypted_token",
    group_id: "samsara_group_123",
    webhook_secret: "encrypted_secret",
    webhook_url: "https://fleet-chat.replit.app/api/samsara/webhook/abc_trucking_001"
  },
  
  // WhatsApp Business Configuration
  whatsapp_config: {
    phone_number: "+1-555-ABC-FLEET",
    phone_number_id: "whatsapp_id_123",
    business_account_id: "managed_by_fleetchat"
  },
  
  // Service Configuration
  service_tier: "professional",
  message_templates: "transport_standard_v2",
  compliance_settings: {
    gdpr_enabled: true,
    data_retention_days: 365,
    driver_consent_required: true
  }
}
```

### Multi-Tenant Message Processing

#### Webhook Routing
```javascript
// Tenant-aware webhook processing with signature verification
app.post('/api/samsara/webhook/:tenantId', async (req, res) => {
  const tenantId = req.params.tenantId;
  const samsaraEvent = req.body;
  
  // Validate tenant authentication
  const tenant = await getTenantConfig(tenantId);
  if (!validateWebhookSignature(tenant.samsara_config.webhook_secret, req)) {
    return res.status(401).send('Unauthorized');
  }
  
  // Process event within tenant context
  await processSamsaraEvent(tenantId, samsaraEvent);
  res.status(200).send('OK');
});

app.post('/api/whatsapp/webhook', async (req, res) => {
  const whatsappMessage = req.body;
  
  // Identify tenant from WhatsApp phone number
  const tenantId = await identifyTenantByWhatsAppNumber(
    whatsappMessage.metadata.phone_number_id
  );
  
  // Process message within tenant context
  await processWhatsAppMessage(tenantId, whatsappMessage);
  res.status(200).send('OK');
});
```

#### Driver Identity Resolution
```javascript
// Tenant-scoped driver lookup
async function identifyDriverByPhone(tenantId, phoneNumber) {
  // Only search within tenant's driver database
  return await storage.getDriverByPhoneAndTenant(tenantId, phoneNumber);
}

async function updateTransportStatus(tenantId, transportId, status) {
  // Validate transport belongs to tenant
  const transport = await storage.getTransportById(transportId);
  if (transport.tenant_id !== tenantId) {
    throw new Error('Cross-tenant access denied');
  }
  
  // Proceed with update
  return await storage.updateTransport(transportId, { status });
}
```

## Tenant Onboarding Process

### New Tenant Setup
1. **Tenant Registration**
   ```javascript
   {
     company_name: "New Trucking Company",
     primary_contact: "fleet@newtrucking.com",
     estimated_driver_count: 25,
     service_tier: "professional"
   }
   ```

2. **WhatsApp Phone Number Assignment**
   - FleetChat assigns dedicated business number from pool
   - Number format: `+1-555-[COMPANY-CODE]`
   - Automatic WhatsApp Business API configuration

3. **Samsara Integration Setup**
   - Tenant provides Samsara API credentials
   - FleetChat configures tenant-specific webhook endpoint
   - Webhook URL: `https://fleetchat.com/webhook/samsara/{tenant_id}`

4. **Driver Data Import**
   - Secure upload of driver phone number mappings
   - GDPR consent validation
   - Tenant-specific driver database creation

### Tenant Scaling

#### Horizontal Scaling
- Each tenant operates independently
- No cross-tenant performance impact
- Individual tenant resource allocation
- Isolated monitoring and alerting

#### Resource Management
```javascript
// Per-tenant resource tracking
{
  tenant_id: "abc_trucking_001",
  current_metrics: {
    active_drivers: 47,
    monthly_messages: 1247,
    webhook_requests: 892,
    storage_usage_mb: 156
  },
  resource_limits: {
    max_drivers: 100,
    max_monthly_messages: 5000,
    storage_limit_mb: 500
  }
}
```

## Security and Compliance

### Tenant Data Protection
- **Encryption**: All tenant data encrypted at rest and in transit
- **Access Control**: Role-based access with tenant boundaries
- **Audit Logging**: Complete audit trail per tenant
- **Data Residency**: Configurable data location per tenant requirements

### Cross-Tenant Security
```javascript
// Middleware enforces tenant isolation
function tenantIsolationMiddleware(req, res, next) {
  const tenantId = extractTenantFromRequest(req);
  
  // Attach tenant context to request
  req.tenant = { id: tenantId };
  
  // Validate user access to tenant
  if (!userHasAccessToTenant(req.user, tenantId)) {
    return res.status(403).send('Access denied');
  }
  
  next();
}
```

### Privacy & Security Per Tenant
- Individual data processing agreements
- Tenant-specific data retention policies
- Per-tenant data export capabilities
- Isolated data deletion upon tenant termination

## Multi-Tenant Billing

### Isolated Usage Tracking
```javascript
// Tenant-specific billing calculation
async function calculateMonthlyBilling(tenantId, billingPeriod) {
  const usage = await getUsageMetrics(tenantId, billingPeriod);
  
  return {
    tenant_id: tenantId,
    billing_period: billingPeriod,
    active_drivers: usage.activeDrivers,
    message_volume: usage.totalMessages,
    base_cost: usage.activeDrivers * tenant.service_tier.price,
    volume_discount: calculateVolumeDiscount(usage.activeDrivers),
    total_amount: calculateFinalAmount(usage)
  };
}
```

### Consolidated Management
- Individual tenant billing and invoicing
- Centralized payment processing
- Per-tenant usage analytics
- Multi-tenant fleet management for enterprise clients

## Operational Management

### Tenant Monitoring
```javascript
// Real-time tenant health monitoring
{
  tenant_id: "abc_trucking_001",
  status: "healthy",
  metrics: {
    webhook_success_rate: 99.2,
    message_delivery_rate: 98.7,
    average_response_time: 150,
    last_activity: "2025-06-29T14:30:00Z"
  },
  alerts: []
}
```

### Multi-Tenant Support
- Tenant-specific support tickets
- Per-tenant configuration management
- Isolated troubleshooting and debugging
- Tenant-aware system maintenance

## Enterprise Multi-Tenant Features

### Corporate Account Management
- Parent-child tenant relationships
- Consolidated billing across subsidiary fleets
- Centralized compliance reporting
- Cross-tenant analytics for corporate oversight

### White-Label Options
```javascript
// Tenant branding configuration
{
  tenant_id: "enterprise_fleet_001",
  branding: {
    company_logo_url: "https://tenant.com/logo.png",
    color_scheme: "#0066cc",
    custom_domain: "fleet.enterprisecompany.com",
    message_footer: "Powered by Enterprise Fleet Solutions"
  }
}
```

This multi-tenant architecture ensures FleetChat can scale to serve hundreds of trucking companies simultaneously while maintaining complete data isolation, security, and customization capabilities for each tenant.