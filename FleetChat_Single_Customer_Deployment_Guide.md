# FleetChat Single Customer Operational Deployment Guide
*Date: July 30, 2025*
*Customer Type: Samsara Fleet Management User*

## Overview

This guide outlines the complete operational deployment requirements to onboard **one customer** using Samsara onto the FleetChat communication middleware platform. The deployment focuses on production-ready infrastructure that can handle real fleet operations while maintaining system boundaries as pure communication protocol service.

## Pre-Deployment Infrastructure Requirements

### **1. Production Hosting Platform**

**Cloud Infrastructure Setup:**
```bash
# Recommended: DigitalOcean App Platform or AWS ECS
- Auto-scaling web service (1-3 instances)
- PostgreSQL managed database (4GB RAM minimum)
- Redis cache for session storage
- SSL certificates for custom domain
- CDN for static assets
```

**Domain Configuration:**
- Primary domain: `app.fleet.chat` (customer portal)
- API endpoints: `api.fleet.chat`
- Webhook endpoints: `webhooks.fleet.chat`
- Admin access: `admin.fleet.chat`

**Minimum Server Specifications:**
- **Web Server**: 2 vCPU, 4GB RAM, auto-scaling enabled
- **Database**: PostgreSQL 16, 4GB RAM, 100GB SSD storage
- **Redis**: 1GB RAM for session/cache storage
- **Bandwidth**: 1TB monthly transfer allowance

### **2. Database Production Setup**

**Multi-Tenant PostgreSQL Schema:**
```sql
-- Tenant isolation with encrypted credentials
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  service_tier VARCHAR(50) DEFAULT 'professional',
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Encrypted Samsara Configuration
  samsara_api_token JSONB, -- AES-256-GCM encrypted
  samsara_org_id VARCHAR(255),
  samsara_webhook_id VARCHAR(255),
  samsara_webhook_secret JSONB, -- encrypted
  samsara_scopes JSONB DEFAULT '[]',
  samsara_validated BOOLEAN DEFAULT FALSE,
  
  -- WhatsApp Configuration (FleetChat managed)
  whatsapp_phone_number VARCHAR(20),
  whatsapp_phone_number_id VARCHAR(255),
  whatsapp_business_account_id VARCHAR(255),
  
  -- Billing Integration
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  billing_email VARCHAR(255),
  auto_payment BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Driver phone number mapping
CREATE TABLE driver_phone_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  samsara_driver_id VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, samsara_driver_id),
  UNIQUE(tenant_id, phone_number)
);

-- Communication logs for audit trail
CREATE TABLE communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  driver_id VARCHAR(255),
  message_type VARCHAR(50),
  direction VARCHAR(20), -- 'outbound' or 'inbound'
  content_preview TEXT,
  delivery_status VARCHAR(50),
  samsara_event_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable row-level security for multi-tenancy
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_phone_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
```

## API Integration Setup

### **1. Samsara API Integration (Customer-Provided Credentials)**

**Required Samsara API Scopes:**
```typescript
const REQUIRED_SAMSARA_SCOPES = [
  'fleet:drivers:read',           // Driver data access
  'fleet:drivers:appSettings:read', // Phone number access
  'fleet:vehicles:read',          // Vehicle information
  'fleet:routes:read',            // Route information
  'fleet:routes:write',           // Route status updates
  'fleet:webhooks:write',         // Webhook management
  'fleet:documents:read',         // Document access
  'fleet:documents:write',        // Document uploads
  'fleet:locations:read'          // Location data
];
```

**Customer Prerequisites:**
- Active Samsara subscription with API access enabled
- Administrator-level account with API token generation permissions
- Fleet with active drivers and vehicles in Samsara system
- Permission to create webhook endpoints for real-time events

**Samsara Token Validation Process:**
```typescript
async function validateCustomerSamsaraToken(apiToken: string): Promise<ValidationResult> {
  try {
    // Test basic connectivity
    const response = await axios.get('https://api.samsara.com/fleet/drivers', {
      headers: { 'Authorization': `Bearer ${apiToken}` }
    });
    
    // Verify required scopes
    const tokenInfo = await axios.get('https://api.samsara.com/token/info', {
      headers: { 'Authorization': `Bearer ${apiToken}` }
    });
    
    const hasRequiredScopes = REQUIRED_SAMSARA_SCOPES.every(
      scope => tokenInfo.data.scopes.includes(scope)
    );
    
    return {
      valid: true,
      scopes: tokenInfo.data.scopes,
      hasRequiredScopes,
      driverCount: response.data.data.length,
      organization: tokenInfo.data.organization
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}
```

### **2. WhatsApp Business API Setup**

**Meta Business Account Requirements:**
- Verified Meta Business Account
- WhatsApp Business Platform application approval
- Dedicated phone number pool (minimum 5-10 numbers for single customer)
- Business verification documents submitted to Meta

**Message Template Approval (Critical Path):**
```typescript
const PRODUCTION_MESSAGE_TEMPLATES = [
  {
    name: "route_assignment_notification",
    category: "UTILITY",
    language: "en_US",
    status: "PENDING_APPROVAL", // 2-4 weeks approval time
    body: "📋 New Route Assignment\n\nFrom: {{1}}\nTo: {{2}}\nPickup: {{3}}\nLoad: {{4}}\n\nPlease confirm:",
    buttons: ["Accept", "Need Details", "Cannot Accept"]
  },
  {
    name: "location_status_update",
    category: "UTILITY", 
    language: "en_US",
    status: "PENDING_APPROVAL",
    body: "📍 Location Update\n\nYou're at {{1}}\nTime: {{2}}\n\nPlease update status:",
    buttons: ["Arrived", "Loading", "Loaded", "Issue"]
  },
  {
    name: "emergency_alert",
    category: "ALERT_UPDATE",
    language: "en_US", 
    status: "PENDING_APPROVAL",
    body: "🚨 EMERGENCY ALERT\n\n{{1}}\nVehicle: {{2}}\nTime: {{3}}\n\nRespond immediately:",
    buttons: ["I'm Safe", "Need Help", "Emergency"]
  }
];
```

**WhatsApp Business API Configuration:**
```typescript
const whatsappConfig = {
  baseUrl: "https://graph.facebook.com/v18.0",
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
  webhookUrl: `https://webhooks.fleet.chat/whatsapp/${tenantId}`
};
```

### **3. Stripe Payment Processing**

**Billing Configuration:**
```typescript
const stripeBillingConfig = {
  priceId: "price_per_active_driver_monthly", // $8/month per driver
  products: [
    {
      name: "FleetChat Communication Service",
      description: "Per-driver monthly communication service",
      unitAmount: 800, // $8.00 in cents
      currency: "usd",
      recurring: { interval: "month" }
    }
  ],
  usageBasedBilling: true,
  meteringEvent: "active_driver_monthly_usage"
};
```

## Customer Onboarding Process

### **Phase 1: Customer Registration & Samsara Setup (Day 1)**

**Step 1: Company Information Collection**
```typescript
interface CustomerOnboarding {
  // Company Details
  companyName: string;           // "ABC Trucking Company"
  contactEmail: string;          // "admin@abctrucking.com"
  contactPhone: string;          // "+1-555-123-4567"
  billingEmail: string;          // Same or different for billing
  
  // Fleet Information
  fleetSize: number;             // Number of active drivers
  operationType: 'local' | 'regional' | 'otr' | 'specialized';
  primaryRoutes: string[];       // Major operating regions
  
  // Technical Contact
  adminName: string;             // Person responsible for integration
  adminEmail: string;            // Technical contact email
  adminPhone: string;            // Direct contact for setup issues
}
```

**Step 2: Samsara API Token Configuration**
```bash
# Customer provides their Samsara API token
curl -X POST https://api.fleet.chat/api/tenant/{tenantId}/samsara/configure \
  -H "Content-Type: application/json" \
  -d '{
    "apiToken": "customer_samsara_api_token_here",
    "orgId": "customer_samsara_org_id"
  }'

# FleetChat validates token and creates webhook
# Response includes validation results and webhook status
```

**Step 3: Automatic Driver Discovery**
```typescript
async function discoverCustomerDrivers(tenantId: string): Promise<DriverMapping[]> {
  const tenant = await storage.getTenant(tenantId);
  const samsaraClient = new SamsaraAPIClient(decrypt(tenant.samsaraApiToken));
  
  // Fetch all drivers from customer's Samsara account
  const drivers = await samsaraClient.getDrivers();
  
  return drivers.map(driver => ({
    samsaraDriverId: driver.id,
    driverName: driver.name,
    phoneNumber: driver.phone || null, // May need manual input
    vehicleAssignments: driver.vehicleAssignments || []
  }));
}
```

### **Phase 2: Driver Phone Mapping & Payment Setup (Day 1-2)**

**Step 4: Driver Phone Number Collection**
```typescript
interface DriverPhoneMapping {
  samsaraDriverId: string;       // From Samsara API
  driverName: string;            // For customer reference
  phoneNumber: string;           // WhatsApp-enabled phone number
  isWhatsAppVerified: boolean;   // Verification status
  preferredLanguage: string;     // Default: "en_US"
}

// Customer manually inputs missing phone numbers via web interface
const phoneCollectionUI = {
  discoveredDrivers: 25,         // Found in Samsara
  driversWithPhones: 18,         // Already have phone numbers
  requiresInput: 7,              // Need manual phone number entry
  estimatedSetupTime: "15-30 minutes"
};
```

**Step 5: WhatsApp Number Assignment & Testing**
```typescript
async function assignWhatsAppNumber(tenantId: string): Promise<WhatsAppConfig> {
  // Assign available WhatsApp Business phone number from pool
  const availableNumber = await getAvailableWhatsAppNumber();
  
  // Configure WhatsApp Business API for this tenant
  const config = {
    phoneNumber: availableNumber.phoneNumber,
    phoneNumberId: availableNumber.phoneNumberId,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    webhookUrl: `https://webhooks.fleet.chat/whatsapp/${tenantId}`
  };
  
  // Send test message to verify configuration
  await sendTestMessage(config, "FleetChat setup complete! Ready for communication.");
  
  return config;
}
```

**Step 6: Stripe Customer & Subscription Creation**
```typescript
async function setupCustomerBilling(tenantId: string, customerInfo: CustomerOnboarding): Promise<BillingConfig> {
  // Create Stripe customer
  const customer = await stripe.customers.create({
    name: customerInfo.companyName,
    email: customerInfo.billingEmail,
    metadata: { tenantId, fleetSize: customerInfo.fleetSize.toString() }
  });
  
  // Create subscription with usage-based billing
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{
      price: stripeBillingConfig.priceId,
      quantity: customerInfo.fleetSize // Initial driver count
    }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent']
  });
  
  return {
    stripeCustomerId: customer.id,
    stripeSubscriptionId: subscription.id,
    monthlyRate: customerInfo.fleetSize * 8, // $8 per driver
    billingCycle: "monthly",
    nextBillingDate: subscription.current_period_end
  };
}
```

## Production Security Configuration

### **Data Encryption Implementation**
```typescript
// AES-256-GCM encryption for sensitive data
import { createCipher, createDecipher, randomBytes } from 'crypto';

export function encryptSensitiveData(data: string): EncryptedData {
  const algorithm = 'aes-256-gcm';
  const key = process.env.ENCRYPTION_KEY; // 32-byte key
  const iv = randomBytes(16);
  
  const cipher = createCipher(algorithm, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}
```

### **Webhook Security & Signature Verification**
```typescript
// Samsara webhook signature verification
export function verifySamsaraWebhook(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

// WhatsApp webhook verification
export function verifyWhatsAppWebhook(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WHATSAPP_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
    
  return signature === `sha256=${expectedSignature}`;
}
```

## Operational Monitoring & Health Checks

### **Production Monitoring Setup**
```typescript
const monitoringConfig = {
  healthChecks: {
    '/health': 'Basic application health',
    '/health/database': 'PostgreSQL connectivity',
    '/health/samsara': 'Samsara API connectivity per tenant',
    '/health/whatsapp': 'WhatsApp Business API status',
    '/health/stripe': 'Payment processing status'
  },
  
  metrics: {
    messagesProcessed: 'Total messages relayed',
    webhookEvents: 'Samsara webhook events received',
    apiResponseTimes: 'Average API response times',
    errorRates: 'Error rates by service',
    customerActiveDrivers: 'Billable driver count per customer'
  },
  
  alerting: {
    webhookFailures: 'Alert on 3+ consecutive webhook failures',
    apiLatency: 'Alert on >2 second response times',
    databaseConnections: 'Alert on connection pool exhaustion',
    billingErrors: 'Alert on Stripe payment failures'
  }
};
```

### **Customer Dashboard & Usage Tracking**
```typescript
interface CustomerDashboard {
  // Communication Statistics
  messagesThisMonth: number;         // Total messages sent/received
  activeDrivers: number;             // Drivers who used service this month
  webhookEventsProcessed: number;    // Samsara events processed
  
  // Service Health
  systemUptime: string;              // "99.9% this month"
  averageResponseTime: string;       // "< 200ms"
  lastOutage: string | null;         // Last service interruption
  
  // Billing Information
  currentMonthCost: number;          // Based on active drivers
  nextBillingDate: string;           // Next charge date
  usageDetails: {
    driversUsed: number;             // Unique drivers who sent/received messages
    messagesPerDriver: number;       // Average messages per driver
  };
}
```

## Deployment Timeline & Checklist

### **Pre-Launch Requirements (1-2 weeks)**

**Infrastructure Setup:**
- [ ] Production hosting platform configured (DigitalOcean/AWS)
- [ ] PostgreSQL database with multi-tenant schema deployed
- [ ] SSL certificates configured for all domains
- [ ] Redis cache for session storage configured
- [ ] Environment variables and secrets properly configured

**API Integration Preparation:**
- [ ] WhatsApp Business Platform account verified
- [ ] Message templates submitted to Meta (2-4 week approval)
- [ ] Stripe business account verified and configured
- [ ] Monitoring and alerting systems deployed
- [ ] Backup and disaster recovery procedures tested

### **Customer Onboarding (Day 1-2)**

**Day 1: Technical Setup**
- [ ] Customer company information collected
- [ ] Samsara API token received and validated
- [ ] Required API scopes verified and confirmed
- [ ] Webhook endpoint created in customer's Samsara account
- [ ] Driver list discovered from Samsara API
- [ ] WhatsApp Business phone number assigned

**Day 2: Configuration & Testing**
- [ ] Driver phone numbers collected and mapped
- [ ] WhatsApp number verification completed
- [ ] Test messages sent to verify communication flow
- [ ] Stripe customer and subscription created
- [ ] Payment method collected and verified
- [ ] Customer dashboard access provided

### **Go-Live Verification (Day 2-3)**

**Communication Testing:**
- [ ] End-to-end message flow: Samsara → FleetChat → WhatsApp → Driver
- [ ] Bidirectional testing: Driver response → WhatsApp → FleetChat → Samsara
- [ ] Document upload/download functionality verified
- [ ] Emergency message delivery tested
- [ ] Location sharing functionality confirmed

**Operational Readiness:**
- [ ] Customer admin training completed
- [ ] Support documentation provided
- [ ] Escalation procedures communicated
- [ ] Performance baseline established
- [ ] Billing cycle initiated

## Cost Analysis for Single Customer

### **Monthly Operational Costs**
```
Infrastructure (per customer):
- Hosting: $25-50/month (shared infrastructure)
- Database: $20-30/month (PostgreSQL managed)
- WhatsApp Business API: $5/month base + $0.012-0.028 per message
- Stripe fees: 2.9% + $0.30 per transaction

Customer: 25-driver fleet example:
- Revenue: 25 drivers × $8/month = $200/month
- WhatsApp costs: ~$50-75/month (estimated message volume)
- Infrastructure: ~$50/month (allocated portion)
- Stripe fees: ~$11/month
- Net profit: ~$240-265/month (64-71% margin)
```

### **One-Time Setup Costs**
```
- WhatsApp phone number allocation: $10-25 one-time
- Template development and approval: $500-1000 (amortized)
- Customer onboarding support: 4-8 hours @ $100/hour = $400-800
- Total setup investment: ~$1000-2000 per customer
```

## Support & Maintenance Requirements

### **Ongoing Support Needs**
- **Level 1 Support**: Basic customer questions, billing issues (2-4 hours/week)
- **Level 2 Support**: Technical integration issues, API troubleshooting (1-2 hours/week)
- **Level 3 Support**: Infrastructure maintenance, code updates (4-6 hours/month)

### **Maintenance Schedule**
- **Daily**: Monitor health checks, review error logs
- **Weekly**: Performance analysis, customer usage reports
- **Monthly**: Billing reconciliation, security updates
- **Quarterly**: Infrastructure optimization, feature updates

## Risk Assessment & Mitigation

### **Primary Risks**
1. **WhatsApp Template Rejections**: 2-4 week approval delays
   - *Mitigation*: Submit multiple template variations, maintain approval pipeline
   
2. **Samsara API Changes**: Breaking changes to webhook format
   - *Mitigation*: Version management, backward compatibility layers
   
3. **Customer Churn**: Single customer represents significant revenue
   - *Mitigation*: Strong onboarding, excellent support, multi-customer pipeline

### **Technical Dependencies**
- **Samsara API Stability**: 99.9% uptime required
- **WhatsApp Business API**: Rate limits and message delivery
- **Customer Infrastructure**: Reliable webhook endpoint accessibility

## Success Metrics

### **Technical Performance**
- **Message Delivery Rate**: >99% successful delivery
- **API Response Time**: <200ms average response time
- **System Uptime**: >99.9% monthly uptime
- **Webhook Processing**: <5 second end-to-end latency

### **Business Metrics**
- **Customer Satisfaction**: >90% satisfaction score
- **Driver Adoption**: >80% of mapped drivers actively using WhatsApp
- **Revenue per Customer**: $300+ monthly recurring revenue
- **Customer Retention**: >95% monthly retention rate

This comprehensive deployment guide provides the foundation for successfully onboarding a single Samsara customer onto FleetChat while maintaining production-grade reliability and security standards.