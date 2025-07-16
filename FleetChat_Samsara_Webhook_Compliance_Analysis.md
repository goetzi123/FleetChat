# FleetChat Samsara Webhook Compliance Analysis

## Executive Summary

**Compliance Status: ⚠️ PARTIALLY COMPLIANT - Requires Updates**

Fleet.Chat's current implementation partially aligns with Samsara's webhook requirements for marketplace apps but needs specific modifications to achieve full compliance. Key areas requiring attention include per-customer webhook management, OAuth token handling, and webhook lifecycle management.

## Detailed Compliance Analysis

### ✅ COMPLIANT Areas

**1. Authentication & Authorization**
- ✅ Fleet.Chat correctly stores customer OAuth access tokens per tenant
- ✅ Proper Bearer token authentication in API requests: `Authorization: Bearer <TOKEN>`
- ✅ Per-tenant API token isolation implemented in database schema

**2. Webhook Endpoint Structure**
- ✅ Dedicated webhook endpoint: `/api/samsara/webhook`
- ✅ HTTPS requirement supported (Replit provides HTTPS by default)
- ✅ Multi-tenant event processing with tenant identification logic

**3. Event Processing**
- ✅ Webhook payload validation and parsing
- ✅ Event type classification and routing
- ✅ Error handling and response status codes (200, 400, 500)

### ⚠️ REQUIRES UPDATES

**1. Per-Customer Webhook Creation**
```diff
- Current: Single global webhook endpoint for all customers
+ Required: Dedicated webhook per customer using their OAuth token
```

**Implementation Gap:**
Fleet.Chat currently uses a single webhook endpoint (`/api/samsara/webhook`) for all customers, but Samsara requires creating individual webhooks per customer using their specific OAuth access token.

**2. Webhook Lifecycle Management**
```diff
- Current: Basic webhook setup during tenant creation
+ Required: Complete CRUD operations for webhooks per customer
```

**Missing Features:**
- List existing webhooks per customer
- Update webhook configurations
- Delete webhooks during customer offboarding

**3. Required API Scopes**
```diff
- Current: General API access assumed
+ Required: Explicit "Read Webhooks" and "Write Webhooks" scopes
```

**4. Webhook Secret Validation**
```diff
- Current: No signature verification implemented
+ Required: Webhook signature validation using Samsara-provided secret
```

### ❌ NON-COMPLIANT Areas

**1. Application Lifecycle Management**
```diff
- Missing: Automatic webhook creation during OAuth installation
- Missing: Automatic webhook deletion during OAuth disconnection
```

**2. Alert Configuration Integration**
```diff
- Missing: Integration with Samsara Alert Configurations
- Missing: Support for actionTypeId=4 (webhook actions)
```

## Required Implementation Changes

### 1. Update Webhook Management in SamsaraAPIClient

**Current Implementation:**
```typescript
// server/samsara-api.ts
async setupWebhook(webhookUrl: string, eventTypes: string[]): Promise<{ webhookId: string }> {
  const response = await this.client.post('/fleet/webhooks', {
    url: webhookUrl,
    eventTypes,
    isActive: true
  });
  return { webhookId: response.data.data.id };
}
```

**Required Updates:**
```typescript
// Add complete webhook CRUD operations
async createWebhook(name: string, url: string, eventTypes: string[], customHeaders?: Array<{key: string, value: string}>): Promise<WebhookResponse> {
  const response = await this.client.post('/webhooks', {
    name,
    url,
    version: "2018-01-01",
    eventTypes,
    customHeaders
  });
  return response.data;
}

async listWebhooks(): Promise<WebhookResponse[]> {
  const response = await this.client.get('/webhooks');
  return response.data.data;
}

async updateWebhook(webhookId: string, updates: Partial<WebhookConfig>): Promise<WebhookResponse> {
  const response = await this.client.patch(`/webhooks/${webhookId}`, updates);
  return response.data;
}

async deleteWebhook(webhookId: string): Promise<void> {
  await this.client.delete(`/webhooks/${webhookId}`);
}
```

### 2. Per-Customer Webhook URLs

**Current Approach:**
```
Single endpoint: /api/samsara/webhook
```

**Required Approach:**
```
Customer-specific endpoints: /api/samsara/webhook/{tenantId}
or
Shared endpoint with tenant identification via custom headers
```

**Implementation:**
```typescript
// During tenant setup
const webhookUrl = `${process.env.BASE_URL}/api/samsara/webhook/${tenant.id}`;
const customHeaders = [
  { key: "x-FleetChat-Tenant-ID", value: tenant.id }
];

const webhook = await samsaraClient.createWebhook(
  `FleetChat-${tenant.companyName}`,
  webhookUrl,
  ["DriverCreated", "DriverUpdated", "LocationUpdate", "RouteStarted", "RouteCompleted"],
  customHeaders
);
```

### 3. Webhook Signature Verification

**Add to webhook handler:**
```typescript
app.post("/api/samsara/webhook/:tenantId", async (req, res) => {
  const signature = req.headers['x-samsara-signature'] as string;
  const tenantId = req.params.tenantId;
  
  // Get tenant's webhook secret from database
  const tenant = await fleetChatStorage.getTenantById(tenantId);
  if (!tenant?.samsaraWebhookSecret) {
    return res.status(400).json({ error: "Invalid tenant or missing webhook secret" });
  }
  
  // Verify webhook signature
  if (!verifyWebhookSignature(JSON.stringify(req.body), signature, tenant.samsaraWebhookSecret)) {
    return res.status(401).json({ error: "Invalid webhook signature" });
  }
  
  // Process event...
});
```

### 4. Application Lifecycle Integration

**Add to OAuth completion flow:**
```typescript
// After successful OAuth token exchange
async function onCustomerInstallation(tenantId: string, oauthToken: string) {
  const samsaraClient = new SamsaraAPIClient(oauthToken);
  
  // Create webhook for this customer
  const webhook = await samsaraClient.createWebhook(
    `FleetChat-${tenantId}`,
    `${process.env.BASE_URL}/api/samsara/webhook/${tenantId}`,
    ["DriverCreated", "DriverUpdated", "LocationUpdate", "RouteStarted", "RouteCompleted"]
  );
  
  // Store webhook details
  await fleetChatStorage.updateTenant(tenantId, {
    samsaraWebhookId: webhook.id,
    samsaraWebhookSecret: webhook.secretKey
  });
}

// During customer offboarding
async function onCustomerDisconnection(tenantId: string) {
  const tenant = await fleetChatStorage.getTenantById(tenantId);
  if (tenant?.samsaraWebhookId && tenant.samsaraApiToken) {
    const samsaraClient = new SamsaraAPIClient(tenant.samsaraApiToken);
    await samsaraClient.deleteWebhook(tenant.samsaraWebhookId);
  }
}
```

### 5. Database Schema Updates

**Add to shared/schema.ts:**
```typescript
export const tenants = pgTable("tenants", {
  // ... existing fields
  samsaraWebhookId: varchar("samsara_webhook_id"),
  samsaraWebhookSecret: varchar("samsara_webhook_secret"),
  webhookEventTypes: jsonb("webhook_event_types").$type<string[]>(),
});
```

## Alert Configuration Integration

**Add support for Samsara Alert Configurations:**
```typescript
async createAlertConfiguration(config: {
  name: string;
  webhookId: string;
  triggerTypeId: number;
  triggerParams: any;
  scope: { all: boolean } | { groupIds: string[] };
}): Promise<AlertConfiguration> {
  const response = await this.client.post('/alerts/configurations', {
    name: config.name,
    isEnabled: true,
    triggers: [{
      triggerTypeId: config.triggerTypeId,
      triggerParams: config.triggerParams
    }],
    actions: [{
      actionTypeId: 4, // Webhook action
      actionParams: {
        webhooks: {
          webhookIds: [config.webhookId],
          payloadType: "enriched"
        }
      }
    }],
    scope: config.scope
  });
  
  return response.data;
}
```

## Implementation Priority

### Phase 1: Critical Compliance (Required for Production)
1. ✅ Per-customer webhook creation with OAuth tokens
2. ✅ Webhook signature verification
3. ✅ Application lifecycle management (install/uninstall)
4. ✅ Database schema updates

### Phase 2: Enhanced Features
1. ✅ Alert configuration integration
2. ✅ Webhook management UI for fleet operators
3. ✅ Advanced event filtering and routing

### Phase 3: Optimization
1. ✅ Webhook health monitoring
2. ✅ Advanced error handling and retry logic
3. ✅ Performance optimization for high-volume events

## Conclusion

Fleet.Chat's foundation is solid and the core webhook processing logic is compliant with Samsara's requirements. The primary updates needed focus on implementing per-customer webhook management and proper application lifecycle handling. These changes will ensure full compliance with Samsara's marketplace app webhook requirements while maintaining Fleet.Chat's existing functionality.

**Estimated Implementation Time:** 2-3 days for Phase 1 critical compliance updates.

**Risk Assessment:** Low risk - changes are primarily additive and don't affect existing core functionality.