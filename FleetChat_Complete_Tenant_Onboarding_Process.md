# FleetChat Complete Tenant Onboarding Process

## Overview

FleetChat's tenant onboarding process is designed to configure a complete fleet communication system in 2-3 days through a streamlined three-phase approach. Each new trucking company (tenant) is guided through Samsara integration, driver phone number management, WhatsApp setup, and billing configuration with automated validation and compliance checks throughout the process.

## Pre-Onboarding Requirements

### Fleet Operator Prerequisites
- **Samsara Fleet Management Account** - Active Samsara subscription with API access
- **Fleet Administrator Access** - Single designated admin with full Samsara permissions
- **Driver Phone Numbers** - Known phone numbers for drivers (may not be in Samsara)
- **Payment Method** - Credit card for automated monthly billing
- **Company Information** - Legal business name and contact details

### FleetChat System Prerequisites
- **WhatsApp Business Phone Pool** - Available phone numbers for assignment
- **PostgreSQL Database** - Multi-tenant database with tenant isolation
- **Stripe Payment Processing** - Automated billing infrastructure
- **Samsara Webhook Infrastructure** - Per-customer webhook endpoints ready

## Phase 1: Company Setup & Samsara Integration

### 1.1 Company Information Collection
```typescript
interface CompanyOnboarding {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  fleetSize: number;
  operationType: 'local' | 'regional' | 'otr' | 'specialized';
  adminName: string;
  adminEmail: string;
  adminPhone: string;
}
```

**Data Validation:**
- Company name uniqueness check
- Email format validation
- Phone number format verification
- Fleet size categorization for pricing tier recommendation

### 1.2 Samsara API Configuration
```typescript
interface SamsaraConfig {
  apiToken: string;
  groupId?: string;
  orgId?: string;
  webhookUrl: string;
  requiredScopes: string[];
}
```

**API Token Validation Process:**
1. **Token Format Verification** - Validate Samsara API token structure
2. **Scope Validation** - Verify required API scopes are available:
   - `fleet:drivers:read` - Driver data access
   - `fleet:drivers:appSettings:read` - Phone number access
   - `fleet:vehicles:read` - Vehicle data access
   - `fleet:routes:read` - Route data access
   - `fleet:routes:write` - Route creation/updates
   - `fleet:documents:read` - Document access
   - `fleet:documents:write` - Document uploads
3. **Connection Test** - Perform test API calls to verify connectivity
4. **Data Access Validation** - Confirm access to driver and vehicle data

**Automatic Webhook Creation:**
```typescript
async createTenantWebhook(tenantId: string, samsaraConfig: SamsaraConfig): Promise<void> {
  const samsaraClient = new SamsaraAPIClient(samsaraConfig.apiToken);
  const webhookUrl = `${process.env.BASE_URL}/api/samsara/webhook/${tenantId}`;
  
  const webhook = await samsaraClient.createWebhook({
    name: `FleetChat-${companyName}-${tenantId}`,
    url: webhookUrl,
    eventTypes: [
      "vehicle.location.updated",
      "route.started",
      "route.completed",
      "geofence.entered",
      "geofence.exited",
      "document.uploaded",
      "driver.dutyStatus.changed"
    ],
    customHeaders: [
      { key: "x-FleetChat-Tenant-ID", value: tenantId }
    ]
  });
  
  // Store webhook configuration for signature verification
  await storage.updateTenant(tenantId, {
    samsaraWebhookId: webhook.id,
    samsaraWebhookSecret: webhook.secretKey,
    samsaraWebhookUrl: webhookUrl
  });
}
```

### 1.3 Tenant Database Creation
```sql
-- Create tenant record with complete isolation
INSERT INTO tenants (
  id, company_name, contact_email, admin_email,
  samsara_api_token, samsara_group_id, samsara_webhook_id,
  samsara_webhook_secret, samsara_webhook_url,
  pricing_tier, created_at, status
) VALUES (
  gen_random_uuid(), -- Unique tenant identifier
  'Company Name',
  'contact@company.com',
  'admin@company.com',
  encrypt(samsara_api_token), -- Encrypted API token
  'samsara_group_123',
  'webhook_id_456',
  encrypt(webhook_secret), -- Encrypted webhook secret
  'https://fleet-chat.replit.app/api/samsara/webhook/tenant_123',
  'professional',
  NOW(),
  'configuring'
);
```

## Phase 2: Driver Discovery & Phone Number Management

### 2.1 Samsara Driver Discovery
```typescript
async discoverSamsaraDrivers(tenantId: string): Promise<DriverDiscoveryResult> {
  const tenant = await storage.getTenantById(tenantId);
  const samsaraClient = new SamsaraAPIClient(tenant.samsaraApiToken, tenant.samsaraGroupId);
  
  const drivers = await samsaraClient.getDrivers();
  const driverAnalysis = {
    totalDrivers: drivers.length,
    driversWithPhone: 0,
    driversWithoutPhone: 0,
    phoneNumbers: [] as string[],
    driverDetails: [] as DriverDetail[]
  };
  
  for (const driver of drivers) {
    const phoneNumber = driver.phone || driver.phoneNumber || driver.mobilePhone;
    const driverDetail = {
      samsaraDriverId: driver.id,
      name: driver.name,
      username: driver.username,
      hasPhoneInSamsara: Boolean(phoneNumber),
      samsaraPhone: phoneNumber,
      isActive: driver.isActive,
      currentVehicle: driver.currentVehicleId,
      whatsappEligible: false, // Will be determined in next step
      selected: false // Fleet operator selection
    };
    
    driverAnalysis.driverDetails.push(driverDetail);
    
    if (phoneNumber) {
      driverAnalysis.driversWithPhone++;
      driverAnalysis.phoneNumbers.push(phoneNumber);
    } else {
      driverAnalysis.driversWithoutPhone++;
    }
  }
  
  return driverAnalysis;
}
```

### 2.2 Phone Number Collection & Validation
```typescript
interface DriverPhoneCollection {
  samsaraDriverId: string;
  name: string;
  samsaraPhone?: string; // From Samsara API
  manualPhone?: string; // Fleet operator input
  finalPhone: string; // Resolved phone number
  phoneSource: 'samsara' | 'manual' | 'verified';
  whatsappCompatible: boolean;
  validationStatus: 'pending' | 'valid' | 'invalid';
}

async validateAndCollectPhoneNumbers(
  tenantId: string, 
  driverSelections: DriverPhoneCollection[]
): Promise<PhoneValidationResult> {
  const results = [];
  
  for (const driver of driverSelections) {
    // Determine final phone number
    const finalPhone = driver.manualPhone || driver.samsaraPhone;
    
    if (!finalPhone) {
      results.push({
        ...driver,
        validationStatus: 'invalid',
        error: 'No phone number available'
      });
      continue;
    }
    
    // Format validation
    const formattedPhone = formatPhoneNumber(finalPhone);
    if (!isValidPhoneNumber(formattedPhone)) {
      results.push({
        ...driver,
        validationStatus: 'invalid',
        error: 'Invalid phone number format'
      });
      continue;
    }
    
    // WhatsApp compatibility check
    const whatsappCompatible = await checkWhatsAppCompatibility(formattedPhone);
    
    // Create driver record in FleetChat database
    await storage.createUser({
      tenantId,
      samsaraDriverId: driver.samsaraDriverId,
      name: driver.name,
      phone: formattedPhone,
      phoneSource: driver.manualPhone ? 'manual' : 'samsara',
      whatsappNumber: formattedPhone,
      whatsappCompatible,
      role: 'driver',
      isActive: true,
      hasConsented: false // Will be updated after SMS invitation
    });
    
    results.push({
      ...driver,
      finalPhone: formattedPhone,
      whatsappCompatible,
      validationStatus: 'valid'
    });
  }
  
  return {
    totalProcessed: results.length,
    validDrivers: results.filter(r => r.validationStatus === 'valid').length,
    invalidDrivers: results.filter(r => r.validationStatus === 'invalid').length,
    whatsappCompatible: results.filter(r => r.whatsappCompatible).length,
    results
  };
}
```

### 2.3 WhatsApp Phone Number Assignment
```typescript
async assignWhatsAppBusinessNumber(tenantId: string): Promise<WhatsAppAssignment> {
  // Get available WhatsApp Business phone number from pool
  const availableNumbers = await getAvailableWhatsAppNumbers();
  
  if (availableNumbers.length === 0) {
    throw new Error('No WhatsApp Business phone numbers available');
  }
  
  // Assign first available number to tenant
  const assignedNumber = availableNumbers[0];
  
  // Configure WhatsApp Business API for tenant
  await configureWhatsAppForTenant(tenantId, assignedNumber);
  
  // Update tenant record
  await storage.updateTenant(tenantId, {
    whatsappPhoneNumber: assignedNumber.phoneNumber,
    whatsappPhoneNumberId: assignedNumber.phoneNumberId,
    whatsappBusinessAccountId: assignedNumber.businessAccountId
  });
  
  return {
    phoneNumber: assignedNumber.phoneNumber,
    phoneNumberId: assignedNumber.phoneNumberId,
    businessAccountId: assignedNumber.businessAccountId,
    status: 'active'
  };
}
```

## Phase 3: SMS Invitations & Driver Consent

### 3.1 SMS Invitation System
```typescript
async sendDriverInvitations(tenantId: string): Promise<InvitationResult> {
  const tenant = await storage.getTenantById(tenantId);
  const drivers = await storage.getUsersByTenant(tenantId);
  const invitationResults = [];
  
  for (const driver of drivers) {
    if (!driver.phone || driver.hasConsented) continue;
    
    const invitationLink = generateInvitationLink(tenantId, driver.id);
    const smsMessage = `
${tenant.companyName} Fleet Communication Setup

You're invited to join our WhatsApp communication system for:
• Route updates and notifications
• Document requests and uploads  
• Real-time transport coordination

Complete setup: ${invitationLink}

Questions? Contact: ${tenant.contactEmail}
`;
    
    try {
      await sendSMS(driver.phone, smsMessage);
      
      await storage.createInvitation({
        tenantId,
        driverId: driver.id,
        invitationType: 'sms',
        phoneNumber: driver.phone,
        invitationLink,
        status: 'sent',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
      
      invitationResults.push({
        driverId: driver.id,
        name: driver.name,
        phone: driver.phone,
        status: 'sent'
      });
    } catch (error) {
      invitationResults.push({
        driverId: driver.id,
        name: driver.name,
        phone: driver.phone,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  return {
    totalInvitations: invitationResults.length,
    successfulInvitations: invitationResults.filter(r => r.status === 'sent').length,
    failedInvitations: invitationResults.filter(r => r.status === 'failed').length,
    results: invitationResults
  };
}
```

### 3.2 Driver Consent & Verification Process
```typescript
// Driver clicks invitation link and completes consent
async processDriverConsent(tenantId: string, driverId: string, consentData: {
  privacyPolicyAccepted: boolean;
  communicationConsent: boolean;
  whatsappNumber: string;
}): Promise<ConsentResult> {
  
  if (!consentData.privacyPolicyAccepted || !consentData.communicationConsent) {
    throw new Error('Privacy policy and communication consent required');
  }
  
  // Verify WhatsApp number
  const whatsappVerified = await verifyWhatsAppNumber(consentData.whatsappNumber);
  
  if (!whatsappVerified) {
    throw new Error('WhatsApp number verification failed');
  }
  
  // Update driver record
  await storage.updateUser(driverId, {
    hasConsented: true,
    consentDate: new Date(),
    privacyPolicyAccepted: true,
    communicationConsent: true,
    whatsappNumber: consentData.whatsappNumber,
    whatsappVerified: true,
    status: 'active'
  });
  
  // Send welcome message
  await sendWelcomeMessage(tenantId, driverId);
  
  return {
    driverId,
    consentCompleted: true,
    whatsappVerified: true,
    welcomeMessageSent: true
  };
}
```

## Phase 4: Billing Configuration & Payment Setup

### 4.1 Pricing Tier Selection
```typescript
interface PricingTierSelection {
  selectedTier: 'starter' | 'professional' | 'enterprise';
  monthlyDriverCount: number;
  monthlyAmount: number;
  features: string[];
  billingCycle: 'monthly' | 'annual';
}

async calculatePricingForTenant(tenantId: string): Promise<PricingCalculation> {
  const drivers = await storage.getUsersByTenant(tenantId);
  const activeDrivers = drivers.filter(d => d.hasConsented && d.isActive);
  
  const pricingTiers = await getPricingTiers();
  const recommendations = [];
  
  for (const tier of pricingTiers) {
    const monthlyAmount = activeDrivers.length * tier.pricePerDriver;
    const annualAmount = monthlyAmount * 12 * 0.9; // 10% annual discount
    
    recommendations.push({
      tierName: tier.name,
      pricePerDriver: tier.pricePerDriver,
      activeDriverCount: activeDrivers.length,
      monthlyAmount,
      annualAmount,
      features: tier.features,
      maxDrivers: tier.maxDrivers
    });
  }
  
  return {
    activeDriverCount: activeDrivers.length,
    recommendations,
    recommendedTier: determineRecommendedTier(activeDrivers.length)
  };
}
```

### 4.2 Stripe Customer & Payment Setup
```typescript
async setupBillingForTenant(tenantId: string, billingConfig: {
  selectedTier: string;
  billingEmail: string;
  billingAddress: Address;
  paymentMethodId: string;
}): Promise<BillingSetupResult> {
  
  const tenant = await storage.getTenantById(tenantId);
  
  // Create Stripe customer
  const customer = await stripe.customers.create({
    email: billingConfig.billingEmail,
    name: tenant.companyName,
    address: billingConfig.billingAddress,
    metadata: {
      tenantId: tenantId,
      companyName: tenant.companyName,
      selectedTier: billingConfig.selectedTier
    }
  });
  
  // Attach payment method
  await stripe.paymentMethods.attach(billingConfig.paymentMethodId, {
    customer: customer.id
  });
  
  // Set default payment method
  await stripe.customers.update(customer.id, {
    invoice_settings: {
      default_payment_method: billingConfig.paymentMethodId
    }
  });
  
  // Update tenant record
  await storage.updateTenant(tenantId, {
    stripeCustomerId: customer.id,
    billingEmail: billingConfig.billingEmail,
    pricingTier: billingConfig.selectedTier,
    billingAddress: billingConfig.billingAddress,
    paymentMethodId: billingConfig.paymentMethodId,
    billingStatus: 'active'
  });
  
  // Create first invoice
  const activeDrivers = await storage.getUsersByTenant(tenantId);
  const driverCount = activeDrivers.filter(d => d.hasConsented && d.isActive).length;
  const pricingTier = await getPricingTier(billingConfig.selectedTier);
  const monthlyAmount = driverCount * pricingTier.pricePerDriver;
  
  const invoice = await stripe.invoices.create({
    customer: customer.id,
    description: `Fleet.Chat - ${tenant.companyName} - ${driverCount} active drivers`,
    metadata: {
      tenantId,
      driverCount: driverCount.toString(),
      pricingTier: billingConfig.selectedTier
    }
  });
  
  await stripe.invoices.finalizeInvoice(invoice.id);
  
  return {
    stripeCustomerId: customer.id,
    invoiceId: invoice.id,
    monthlyAmount,
    driverCount,
    billingStatus: 'active'
  };
}
```

## Phase 5: System Activation & Validation

### 5.1 Complete System Validation
```typescript
async validateTenantSetup(tenantId: string): Promise<ValidationResult> {
  const tenant = await storage.getTenantById(tenantId);
  const drivers = await storage.getUsersByTenant(tenantId);
  
  const validationChecks = {
    // Samsara Integration
    samsaraApiConnected: Boolean(tenant.samsaraApiToken),
    samsaraWebhookCreated: Boolean(tenant.samsaraWebhookId),
    samsaraDriverAccess: false,
    
    // Driver Management
    driversDiscovered: drivers.length > 0,
    driversWithPhone: drivers.filter(d => d.phone).length,
    driversConsented: drivers.filter(d => d.hasConsented).length,
    
    // WhatsApp Integration
    whatsappNumberAssigned: Boolean(tenant.whatsappPhoneNumber),
    whatsappConfigured: Boolean(tenant.whatsappPhoneNumberId),
    
    // Billing Setup
    stripeCustomerCreated: Boolean(tenant.stripeCustomerId),
    paymentMethodAttached: Boolean(tenant.paymentMethodId),
    
    // System Status
    tenantStatus: tenant.status,
    readyForProduction: false
  };
  
  // Test Samsara API access
  try {
    const samsaraClient = new SamsaraAPIClient(tenant.samsaraApiToken, tenant.samsaraGroupId);
    await samsaraClient.getDrivers();
    validationChecks.samsaraDriverAccess = true;
  } catch (error) {
    validationChecks.samsaraDriverAccess = false;
  }
  
  // Determine if ready for production
  validationChecks.readyForProduction = 
    validationChecks.samsaraApiConnected &&
    validationChecks.samsaraWebhookCreated &&
    validationChecks.samsaraDriverAccess &&
    validationChecks.driversConsented > 0 &&
    validationChecks.whatsappConfigured &&
    validationChecks.stripeCustomerCreated;
  
  return {
    tenantId,
    validationChecks,
    summary: {
      totalDrivers: drivers.length,
      activeDrivers: drivers.filter(d => d.hasConsented && d.isActive).length,
      setupComplete: validationChecks.readyForProduction
    }
  };
}
```

### 5.2 Production Activation
```typescript
async activateTenantForProduction(tenantId: string): Promise<ActivationResult> {
  const validation = await validateTenantSetup(tenantId);
  
  if (!validation.validationChecks.readyForProduction) {
    throw new Error('Tenant setup validation failed - cannot activate');
  }
  
  // Update tenant status to active
  await storage.updateTenant(tenantId, {
    status: 'active',
    activatedAt: new Date(),
    productionReady: true
  });
  
  // Initialize transport monitoring
  await initializeTenantMonitoring(tenantId);
  
  // Send activation notifications
  await sendActivationNotifications(tenantId);
  
  return {
    tenantId,
    status: 'active',
    activatedAt: new Date(),
    activeDrivers: validation.summary.activeDrivers,
    webhookEndpoint: `${process.env.BASE_URL}/api/samsara/webhook/${tenantId}`,
    whatsappNumber: tenant.whatsappPhoneNumber,
    dashboardUrl: `${process.env.BASE_URL}/dashboard/${tenantId}`
  };
}
```

## Post-Onboarding: Ongoing Operations

### Automated Monitoring & Sync
- **Daily driver sync** from Samsara to FleetChat
- **Weekly phone number validation** for all drivers
- **Monthly billing calculation** and invoice generation
- **Quarterly compliance review** and documentation updates

### Support & Maintenance
- **24/7 webhook processing** for real-time transport updates
- **Automated error recovery** for failed API calls
- **Performance monitoring** with alerting for fleet operators
- **Regular system updates** with zero-downtime deployments

## Security & Compliance

### Data Protection
- **Encryption at rest** for all sensitive data (API tokens, phone numbers)
- **TLS encryption** for all API communications
- **Row-level security** for complete tenant isolation
- **GDPR compliance** with right-to-be-forgotten capabilities

### Audit & Compliance
- **Complete audit trail** for all onboarding activities
- **Webhook signature verification** for all Samsara events
- **Payment processing compliance** with PCI DSS requirements
- **Regular security assessments** and penetration testing

## Conclusion

FleetChat's comprehensive onboarding process ensures each fleet operator is fully configured with secure Samsara integration, verified driver phone numbers, active WhatsApp communication, and automated billing within 2-3 days. The multi-phase approach with validation checkpoints guarantees reliable production deployment while maintaining enterprise-grade security and compliance standards.