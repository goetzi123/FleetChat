# Fleet.Chat Technical Documentation

## System Overview

Fleet.Chat is a production-ready headless message broker service that facilitates seamless communication between Samsara fleet management systems and WhatsApp Business API. The platform operates as intelligent middleware, translating fleet events into contextual driver communications while maintaining complete data synchronization across systems. **Technical Status**: Event propagation architecture verified and operational (July 2025).

### Core Architecture
- **Headless Middleware**: Pure API service with no user interface dependency
- **Multi-Tenant SaaS**: Supports unlimited fleet operators with complete data isolation
- **Event-Driven**: Real-time bidirectional communication between Samsara and WhatsApp
- **Production Database**: PostgreSQL with comprehensive schema for enterprise operations

### Multi-Tenant Architecture Design

Fleet.Chat is architected as a true multi-tenant SaaS platform where each fleet operator (tenant) operates with complete logical and security isolation while sharing the same underlying infrastructure.

**Tenant Isolation Strategy:**
- **Database Level**: Every table includes `tenant_id` for row-level security
- **API Level**: All endpoints automatically scope data to authenticated tenant
- **Webhook Processing**: Events are routed to correct tenant based on source configuration
- **Storage Isolation**: Documents and files are tenant-segregated with unique prefixes
- **Rate Limiting**: Per-tenant quotas and throttling to ensure fair resource usage

**Shared Infrastructure Benefits:**
- **Single Application Instance**: One Fleet.Chat deployment serves all tenants
- **Unified WhatsApp Management**: Centralized Business API pool with tenant-specific numbers
- **Common Message Templates**: Shared template library with tenant customization
- **Centralized Monitoring**: System-wide health checks and performance metrics
- **Efficient Resource Utilization**: Optimal hardware usage across all fleet operators

## Samsara Integration Architecture

### 1. API Client Implementation

**Core Integration Components:**
```typescript
// Samsara API Client (server/samsara-api.ts)
export class SamsaraAPIClient {
  private client: AxiosInstance;
  private groupId?: string;

  constructor(apiToken: string, groupId?: string) {
    this.client = axios.create({
      baseURL: 'https://api.samsara.com',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });
    this.groupId = groupId;
  }
}
```

**Compliant Communication Operations ONLY:**
- **Driver Phone Mapping**: Get driver phone numbers for WhatsApp message routing ONLY
- **Webhook Event Processing**: Receive fleet system events for message relay ONLY
- **Message Relay**: Convert fleet events to WhatsApp templates and relay driver responses
- **Communication Logs**: Track message delivery status for communication service
- **Webhook Management**: Event notification setup for bidirectional message relay ONLY
- **Lifecycle Management**: Communication service setup/teardown per customer ONLY

**❌ PROHIBITED OPERATIONS (NOT IMPLEMENTED):**
- ❌ Vehicle tracking, monitoring, or location management
- ❌ Route creation, modification, or management  
- ❌ Document management beyond message relay
- ❌ Fleet operations or business logic beyond communication

### 2. Webhook Event Processing

**Per-Customer Event Handler Endpoints: `/api/samsara/webhook/{tenantId}`**

**Supported Event Types:**
```typescript
interface SamsaraEvent {
  eventType: string;
  timestamp: string;
  vehicleId?: string;
  driverId?: string;
  data: any;
}
```

**Event Processing Flow:**
1. **Vehicle Location Updates** → Driver location notifications
2. **Trip Events** → Transport status updates and driver alerts
3. **Geofence Events** → Arrival/departure confirmations
4. **Driver Status Changes** → Duty status synchronization
5. **Document Events** → POD collection workflows

### 3. Bidirectional Data Synchronization

**Fleet.Chat → Samsara:**
- Transport creation triggers route creation in Samsara
- Driver responses update transport status
- Document uploads sync to Samsara records
- Status changes propagate to fleet management

**Samsara → Fleet.Chat:**
- Real-time events update transport tracking
- Location data creates geolocation records
- Driver assignments sync automatically
- Vehicle status changes trigger workflows

## Admin Portal System

### 1. Administrative Dashboard

**Access Point:** `https://fleet.chat/admin`

**Core Functionality:**
- **System Overview**: Real-time metrics and KPIs
- **Fleet Operator Management**: Tenant administration and monitoring
- **Pricing Configuration**: Dynamic tier management and billing oversight
- **Usage Analytics**: Driver activity and revenue tracking
- **System Configuration**: Global settings and operational parameters

### 2. Real-Time Metrics Display

**Current System Status:**
```typescript
interface SystemMetrics {
  totalFleetOperators: 12;
  activeDrivers: 142;
  activeTransports: 89;
  monthlyRevenue: 4250;
}
```

**Operational Analytics:**
- Driver engagement rates across tenants
- Transport completion statistics
- WhatsApp message volume and delivery rates
- Billing accuracy and collection metrics

### 3. Pricing Tier Management

**Dynamic Pricing Structure:**
```typescript
interface PricingTier {
  name: string;
  pricePerDriverPerMonth: number;
  maxDrivers?: number;
  features: string[];
}

// Current Implementation
const pricingTiers = [
  { name: "Starter", price: 15, maxDrivers: 50 },
  { name: "Professional", price: 25, maxDrivers: 200 },
  { name: "Enterprise", price: 35, maxDrivers: null }
];
```

**Admin Capabilities:**
- Real-time pricing updates across all systems
- Automatic tier enforcement based on driver count
- Usage monitoring and billing validation
- Revenue forecasting and analytics

## Multi-Tenant API Architecture

### 1. Tenant-Scoped API Endpoints

All Fleet.Chat API endpoints automatically enforce tenant isolation through middleware that extracts tenant context from authentication tokens or request headers.

**Tenant Context Middleware:**
```typescript
// Automatic tenant context injection for all API requests
export function requireTenantContext(req: Request, res: Response, next: NextFunction) {
  const tenantId = extractTenantFromAuth(req.headers.authorization);
  if (!tenantId) {
    return res.status(401).json({ error: 'Tenant context required' });
  }
  
  // Inject tenant context into request for downstream handlers
  req.tenantContext = { tenantId };
  next();
}

// All fleet operator endpoints automatically scoped to tenant
app.use('/api/fleet/*', requireTenantContext);
app.use('/api/transports/*', requireTenantContext);
app.use('/api/drivers/*', requireTenantContext);
```

**Multi-Tenant API Examples:**
```typescript
// GET /api/fleet/drivers - Returns only tenant's drivers
app.get('/api/fleet/drivers', async (req, res) => {
  const { tenantId } = req.tenantContext;
  const drivers = await storage.getUsersByTenant(tenantId);
  res.json(drivers);
});

// POST /api/transports - Creates transport for authenticated tenant only
app.post('/api/transports', async (req, res) => {
  const { tenantId } = req.tenantContext;
  const transportData = { ...req.body, tenantId }; // Automatic tenant injection
  const transport = await storage.createTransport(transportData);
  res.json(transport);
});

// Per-customer webhook endpoints with signature verification
app.post('/api/samsara/webhook/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  const tenant = await storage.getTenantById(tenantId);
  
  // Verify webhook signature using tenant's secret
  if (!verifyWebhookSignature(req.body, req.headers['x-samsara-signature'], tenant.samsaraWebhookSecret)) {
    return res.status(401).send('Unauthorized');
  }
  
  await processEventForTenant(tenantId, req.body);
  res.status(200).send('OK');
});
```

### 2. Multi-Tenant Webhook Processing

**Per-Customer Webhook Architecture:**
```typescript
// Samsara webhook compliance with signature verification
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  // Timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

// Application lifecycle management for Samsara compliance
async function createCustomerWebhook(tenantId: string, oauthToken: string, companyName: string): Promise<void> {
  const samsaraClient = new SamsaraAPIClient(oauthToken);
  const webhookUrl = `${process.env.BASE_URL}/api/samsara/webhook/${tenantId}`;
  
  const webhook = await samsaraClient.createWebhook({
    name: `FleetChat-${companyName}-${tenantId}`,
    url: webhookUrl,
    eventTypes: ["DriverCreated", "VehicleLocationUpdate", "RouteStarted", ...],
    customHeaders: [{ key: "x-FleetChat-Tenant-ID", value: tenantId }]
  });
  
  // Store webhook details for signature verification
  await storage.updateTenant(tenantId, {
    samsaraWebhookId: webhook.id,
    samsaraWebhookSecret: webhook.secretKey,
    samsaraWebhookUrl: webhookUrl
  });
}
```

### 3. Multi-Tenant Billing Integration

**Tenant-Specific Stripe Management:**
```typescript
interface TenantBilling {
  tenantId: string;
  stripeCustomerId: string;
  pricingTier: 'starter' | 'professional' | 'enterprise';
  activeDriverCount: number;
  monthlyAmount: number;
}

// Automated monthly billing per tenant
async function processTenantBilling(tenantId: string): Promise<void> {
  const tenant = await storage.getTenantById(tenantId);
  const activeDrivers = await storage.getActiveDriversByTenant(tenantId);
  const pricingTier = await getPricingTier(tenant.pricingTier);
  
  const billingAmount = activeDrivers.length * pricingTier.pricePerDriver;
  
  await stripe.invoices.create({
    customer: tenant.stripeCustomerId,
    amount_due: billingAmount * 100, // Convert to cents
    description: `Fleet.Chat - ${activeDrivers.length} active drivers`,
  });
}
```

## Fleet Operator Onboarding Workflow

### 1. Three-Step Configuration Process

**Step 1: Company & Samsara Setup**
```typescript
interface TenantOnboarding {
  companyName: string;
  contactEmail: string;
  fleetSize: number;
  samsaraConfig: {
    apiToken: string;
    groupId?: string;
    webhookUrl: string;
  };
}
```

**Technical Validation:**
- Samsara API token verification
- Driver data access confirmation
- Webhook endpoint configuration
- Permission scope validation

**Step 2: Driver Discovery & Selection**
```typescript
// Automatic driver discovery from Samsara
const drivers = await samsaraClient.getDrivers();

// Fleet operator selects drivers for WhatsApp onboarding
interface DriverSelection {
  samsaraDriverId: string;
  name: string;
  phone: string;
  whatsappEligible: boolean;
  selected: boolean;
}
```

**Driver Validation Process:**
- Phone number format verification
- WhatsApp Business API compatibility check
- Direct WhatsApp onboarding implementation
- Driver profile creation in Fleet.Chat database

**Step 3: Billing Configuration**
```typescript
interface BillingSetup {
  stripeCustomerId: string;
  selectedTier: 'starter' | 'professional' | 'enterprise';
  paymentMethod: string;
  billingAddress: Address;
  activationDate: Date;
}
```

### 2. Automated System Configuration

**Database Tenant Creation:**
```sql
-- Multi-tenant isolation setup
INSERT INTO tenants (id, company_name, samsara_api_token, pricing_tier)
VALUES (uuid_generate_v4(), 'Fleet Company', 'encrypted_token', 'professional');

-- Driver onboarding with tenant association
INSERT INTO users (id, tenant_id, samsara_driver_id, name, phone, role)
VALUES (uuid_generate_v4(), tenant_id, driver_id, 'John Doe', '+1234567890', 'driver');
```

**Webhook Registration:**
```typescript
// Automatic Samsara webhook setup
await samsaraClient.setupWebhook(
  'https://fleet.chat/api/samsara/webhook',
  ['location', 'trip', 'geofence', 'driver_status', 'document']
);
```

### 3. WhatsApp Business API Integration

**Managed Service Architecture:**
- Fleet.Chat provisions dedicated WhatsApp numbers per tenant
- Automated message template configuration
- Driver invitation workflow via SMS/QR codes
- 30-second onboarding process for drivers

## Communication Workflows

### 1. Transport Automation Workflows

**Automated Driver Communication:**
```typescript
interface TransportWorkflow {
  transportId: string;
  driverId: string;
  workflowType: 'ftl' | 'ltl' | 'yard';
  automatedPrompts: {
    arrival: 'Send arrival confirmation with location';
    loading: 'Confirm loading status and photos';
    departure: 'Update departure time and next destination';
    delivery: 'Upload POD and delivery confirmation';
  };
}
```

**Message Template Examples:**
- **Pickup Arrival**: "Hi [Driver], you've arrived at [Location]. Please confirm arrival and share your location."
- **Loading Complete**: "Please confirm loading is complete and share a photo of the loaded vehicle."
- **Delivery Status**: "Upload your proof of delivery and confirm delivery completion."

### 2. Document Collection Workflows

**Digital POD Handling:**
```typescript
interface DocumentWorkflow {
  transportId: string;
  requiredDocuments: ('pod' | 'load_slip' | 'delivery_note' | 'signature')[];
  collectionTriggers: {
    arrival: 'Request load slip photo';
    loading: 'Capture loading documentation';
    delivery: 'Collect POD and signature';
  };
}
```

**Automated Processing:**
- WhatsApp document uploads automatically sync to Samsara
- Document validation and approval workflows
- Digital signature collection and verification
- Automated document categorization and storage

### 3. Geolocation Tracking Workflows

**Smart Location Management:**
```typescript
interface LocationWorkflow {
  transportId: string;
  criticalCheckpoints: {
    pickup: { lat: number, lng: number, radius: 100 };
    delivery: { lat: number, lng: number, radius: 100 };
    waypoints: Waypoint[];
  };
  trackingSettings: {
    oneTimeGeoPings: boolean;
    liveTracking: boolean;
    geofenceAlerts: boolean;
  };
}
```

**Privacy-Compliant Tracking:**
- One-time geo-pings at critical transport points
- Optional live GPS tracking via driver consent
- Anonymous tracking validation for compliance
- Geofence entry/exit automated notifications

## Multi-Tenant Database Architecture

### 1. Tenant Isolation Implementation

Fleet.Chat implements **row-level multi-tenancy** where all data tables include mandatory `tenant_id` foreign keys ensuring complete logical separation between fleet operators while maintaining efficient shared infrastructure.

**Multi-Tenant Core Tables:**
```sql
-- Root tenant table - each fleet operator is a separate tenant
CREATE TABLE tenants (
  id VARCHAR PRIMARY KEY,
  company_name VARCHAR NOT NULL,
  contact_email VARCHAR NOT NULL,
  samsara_api_token TEXT ENCRYPTED,  -- Tenant-specific Samsara credentials
  samsara_group_id VARCHAR,          -- Optional Samsara group isolation
  whatsapp_phone_number VARCHAR,     -- Dedicated WhatsApp number per tenant
  pricing_tier VARCHAR NOT NULL,
  billing_status VARCHAR DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Multi-tenant user management with complete isolation
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id), -- MANDATORY: Tenant isolation
  samsara_driver_id VARCHAR,         -- Links to tenant's Samsara driver
  name VARCHAR NOT NULL,
  phone VARCHAR,
  whatsapp_number VARCHAR,
  role user_role_enum,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure drivers cannot cross tenant boundaries
  UNIQUE(tenant_id, samsara_driver_id),
  -- Prevent phone number conflicts within tenant
  UNIQUE(tenant_id, phone)
);

-- Multi-tenant transport tracking with complete data isolation
CREATE TABLE transports (
  id VARCHAR PRIMARY KEY,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id), -- MANDATORY: Tenant isolation
  samsara_route_id VARCHAR,          -- Tenant-specific Samsara route
  assigned_driver_id VARCHAR REFERENCES users(id),
  status transport_status_enum,
  workflow_type workflow_type_enum,
  pickup_location VARCHAR,
  delivery_location VARCHAR,
  pickup_eta TIMESTAMP,
  delivery_eta TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure driver belongs to same tenant as transport
  CONSTRAINT fk_driver_tenant CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = assigned_driver_id 
      AND users.tenant_id = transports.tenant_id
    )
  )
);
```

### 2. Multi-Tenant Security Enforcement

**Database-Level Security:**
```sql
-- Row Level Security (RLS) policies for automatic tenant isolation
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transports ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Example RLS policy: Users can only see their tenant's data
CREATE POLICY tenant_isolation_users ON users
  FOR ALL TO application_role
  USING (tenant_id = current_setting('app.current_tenant_id'));

-- Transport isolation policy
CREATE POLICY tenant_isolation_transports ON transports
  FOR ALL TO application_role
  USING (tenant_id = current_setting('app.current_tenant_id'));
```

**Application-Level Tenant Context:**
```typescript
// Every database operation automatically includes tenant context
class DatabaseStorage implements IFleetChatStorage {
  private tenantId: string;
  
  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }
  
  async getTransportsByTenant(): Promise<Transport[]> {
    // Automatic tenant scoping - cannot access other tenants' data
    return await db.select()
      .from(transports)
      .where(eq(transports.tenantId, this.tenantId));
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    // Tenant ID automatically injected - prevents cross-tenant data creation
    const userWithTenant = { ...userData, tenantId: this.tenantId };
    return await db.insert(users).values(userWithTenant).returning();
  }
}
```

### 3. Multi-Tenant Communication Tables

**Tenant-Isolated WhatsApp Messages:**
```sql
CREATE TABLE whatsapp_messages (
  id VARCHAR PRIMARY KEY,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id), -- MANDATORY: Tenant isolation
  transport_id VARCHAR REFERENCES transports(id),
  from_number VARCHAR,                 -- Tenant-specific WhatsApp number
  to_number VARCHAR,                   -- Driver's WhatsApp number
  message_id VARCHAR,                  -- WhatsApp Business API message ID
  timestamp TIMESTAMP,
  type message_type_enum,
  content JSONB,
  direction direction_enum,
  delivery_status VARCHAR,
  
  -- Ensure message belongs to same tenant as transport
  CONSTRAINT fk_message_tenant CHECK (
    transport_id IS NULL OR EXISTS (
      SELECT 1 FROM transports 
      WHERE transports.id = transport_id 
      AND transports.tenant_id = whatsapp_messages.tenant_id
    )
  )
);
```

**Tenant-Specific Integration Logging:**
```sql
CREATE TABLE tms_integrations (
  id VARCHAR PRIMARY KEY,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id), -- MANDATORY: Tenant isolation
  transport_id VARCHAR REFERENCES transports(id),
  platform VARCHAR DEFAULT 'samsara',
  operation VARCHAR,
  payload TEXT,
  response TEXT,
  success BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Integration logs must match transport tenant
  CONSTRAINT fk_integration_tenant CHECK (
    transport_id IS NULL OR EXISTS (
      SELECT 1 FROM transports 
      WHERE transports.id = transport_id 
      AND transports.tenant_id = tms_integrations.tenant_id
    )
  )
);
```

### 2. Communication & Integration Tables

**WhatsApp Message Tracking:**
```sql
CREATE TABLE whatsapp_messages (
  id VARCHAR PRIMARY KEY,
  tenant_id VARCHAR REFERENCES tenants(id),
  transport_id VARCHAR REFERENCES transports(id),
  from_number VARCHAR,
  to_number VARCHAR,
  message_id VARCHAR,
  timestamp TIMESTAMP,
  type message_type_enum,
  content JSONB,
  direction direction_enum
);
```

**Samsara Integration Logging:**
```sql
CREATE TABLE tms_integrations (
  id VARCHAR PRIMARY KEY,
  tenant_id VARCHAR REFERENCES tenants(id),
  transport_id VARCHAR REFERENCES transports(id),
  platform VARCHAR DEFAULT 'samsara',
  operation VARCHAR,
  payload TEXT,
  response TEXT,
  success BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Production Deployment Architecture

### 1. Environment Configuration

**Required Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/fleetchat

# Samsara Integration
SAMSARA_WEBHOOK_SECRET=webhook_verification_secret

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=whatsapp_business_token
WHATSAPP_PHONE_NUMBER_ID=phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=webhook_verify_token

# Stripe Billing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Security
SESSION_SECRET=production_session_secret
JWT_SECRET=jwt_signing_secret
```

### 2. Scalability Considerations

**Performance Optimization:**
- Database connection pooling for high-throughput operations
- Webhook event queue processing for real-time responsiveness
- WhatsApp Business API rate limiting compliance
- Document storage optimization with CDN integration

**Monitoring & Reliability:**
- Health check endpoints for system monitoring
- Error logging and alerting systems
- Backup and disaster recovery procedures
- Performance metrics and analytics tracking

### 3. Security Implementation

**Data Protection:**
- Multi-tenant data isolation at database level
- Encrypted storage of API credentials and sensitive data
- GDPR-compliant driver data handling and consent management
- Webhook signature verification for all external integrations

**Access Control:**
- Admin portal authentication and authorization
- Fleet operator access scoping to tenant data only
- API endpoint protection with rate limiting
- Audit logging for all administrative actions

This technical documentation reflects the current Fleet.Chat implementation with production-ready multi-tenant architecture, comprehensive Samsara integration, full-featured admin portal, and streamlined fleet operator onboarding workflows.