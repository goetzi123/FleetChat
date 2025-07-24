# FleetChat Twilio Integration Specification [DEPRECATED]

## ⚠️ DEPRECATED NOTICE

This document is deprecated as of July 18, 2025. FleetChat has been updated to remove Twilio SMS integration entirely in favor of direct WhatsApp onboarding. This document is preserved for historical reference only.

**Current Implementation**: FleetChat now uses direct WhatsApp template messages for driver onboarding, eliminating the need for SMS integration, GDPR compliance, and Twilio dependencies.

**See Instead**: 
- `FleetChat_Simplified_Architecture_Summary.md` for current architecture
- `FleetChat_Complete_Tenant_Onboarding_Process.md` for updated onboarding process

---

## Overview [DEPRECATED]

FleetChat previously required Twilio SMS integration for driver onboarding, consent management, and emergency communication. Twilio served as the primary SMS gateway for driver invitations, WhatsApp setup verification, and fallback communication when WhatsApp is unavailable.

## Integration Requirements

### Twilio Services Needed
- **SMS Messaging API** - Driver invitations and notifications
- **Phone Number Validation** - Verify driver phone numbers
- **Delivery Status Tracking** - Monitor SMS delivery success
- **International SMS Support** - Multi-country fleet operations

### Required Twilio Credentials
```bash
# Environment variables needed
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1555XXXXXXX
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxx (optional)
```

## Technical Implementation

### 1. Twilio Client Setup
```typescript
import twilio from 'twilio';

export class TwilioSMSService {
  private client: twilio.Twilio;
  private fromNumber: string;
  
  constructor() {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured');
    }
    
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER!;
  }
  
  async sendSMS(to: string, message: string, tenantId?: string): Promise<SMSResult> {
    try {
      const smsResult = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: to,
        statusCallback: `${process.env.BASE_URL}/api/twilio/status-callback`,
        statusCallbackMethod: 'POST'
      });
      
      // Log SMS for tenant tracking
      if (tenantId) {
        await this.logSMSActivity(tenantId, {
          twilioMessageSid: smsResult.sid,
          to: to,
          message: message,
          status: smsResult.status,
          direction: 'outbound'
        });
      }
      
      return {
        success: true,
        messageSid: smsResult.sid,
        status: smsResult.status,
        to: to
      };
    } catch (error) {
      console.error('Twilio SMS error:', error);
      return {
        success: false,
        error: error.message,
        to: to
      };
    }
  }
}
```

### 2. Driver Invitation SMS
```typescript
async sendDriverInvitation(tenantId: string, driver: any): Promise<InvitationResult> {
  const tenant = await storage.getTenantById(tenantId);
  const invitationLink = this.generateInvitationLink(tenantId, driver.id);
  
  const message = `
${tenant.companyName} Fleet Communication Setup

You're invited to join our WhatsApp system for:
• Route updates and notifications
• Document requests and uploads
• Real-time transport coordination

Complete setup (2 minutes): ${invitationLink}

Questions? Contact: ${tenant.contactEmail}
Reply STOP to opt out.
`;
  
  const smsResult = await this.twilioService.sendSMS(
    driver.phone, 
    message, 
    tenantId
  );
  
  if (smsResult.success) {
    await storage.createInvitation({
      tenantId,
      driverId: driver.id,
      invitationType: 'sms',
      phoneNumber: driver.phone,
      invitationLink,
      twilioMessageSid: smsResult.messageSid,
      status: 'sent',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
  }
  
  return {
    driverId: driver.id,
    success: smsResult.success,
    messageSid: smsResult.messageSid,
    error: smsResult.error
  };
}
```

### 3. WhatsApp Setup Verification
```typescript
async sendWhatsAppVerification(tenantId: string, driverId: string, whatsappNumber: string): Promise<VerificationResult> {
  const verificationCode = this.generateVerificationCode();
  
  const message = `
FleetChat WhatsApp Setup

Your verification code: ${verificationCode}

Enter this code to complete your WhatsApp setup.

Valid for 10 minutes.
`;
  
  const smsResult = await this.twilioService.sendSMS(
    whatsappNumber, 
    message, 
    tenantId
  );
  
  if (smsResult.success) {
    await storage.createVerification({
      tenantId,
      driverId,
      phoneNumber: whatsappNumber,
      verificationCode,
      verificationMethod: 'sms',
      twilioMessageSid: smsResult.messageSid,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
  }
  
  return {
    success: smsResult.success,
    verificationCode: smsResult.success ? verificationCode : null,
    messageSid: smsResult.messageSid
  };
}
```

### 4. Emergency & Fallback Communication
```typescript
async sendEmergencyNotification(tenantId: string, driverId: string, emergencyType: string, details: any): Promise<void> {
  const driver = await storage.getUserById(driverId);
  const tenant = await storage.getTenantById(tenantId);
  
  const message = `
🚨 EMERGENCY ALERT - ${tenant.companyName}

Type: ${emergencyType}
Driver: ${driver.name}
Vehicle: ${details.vehicleId}
Location: ${details.location}
Time: ${new Date().toLocaleString()}

Contact dispatch immediately: ${tenant.emergencyPhone}
`;
  
  // Send to driver
  await this.twilioService.sendSMS(driver.phone, message, tenantId);
  
  // Send to dispatch
  if (tenant.emergencyPhone) {
    await this.twilioService.sendSMS(tenant.emergencyPhone, message, tenantId);
  }
}
```

## SMS Status Tracking

### Webhook Handler for Delivery Status
```typescript
app.post('/api/twilio/status-callback', async (req, res) => {
  const { MessageSid, MessageStatus, To, From } = req.body;
  
  // Update SMS delivery status
  await storage.updateSMSLog({
    twilioMessageSid: MessageSid,
    status: MessageStatus,
    deliveredAt: MessageStatus === 'delivered' ? new Date() : null,
    failedAt: MessageStatus === 'failed' ? new Date() : null
  });
  
  // Handle failed SMS
  if (MessageStatus === 'failed') {
    await handleFailedSMS(MessageSid, To);
  }
  
  res.status(200).send('OK');
});
```

### SMS Analytics & Reporting
```typescript
async getSMSAnalytics(tenantId: string, dateRange: DateRange): Promise<SMSAnalytics> {
  const smsLogs = await storage.getSMSLogsByTenant(tenantId, dateRange);
  
  return {
    totalSent: smsLogs.length,
    delivered: smsLogs.filter(log => log.status === 'delivered').length,
    failed: smsLogs.filter(log => log.status === 'failed').length,
    pending: smsLogs.filter(log => log.status === 'sent').length,
    deliveryRate: (smsLogs.filter(log => log.status === 'delivered').length / smsLogs.length) * 100,
    avgDeliveryTime: calculateAverageDeliveryTime(smsLogs),
    costAnalysis: calculateSMSCosts(smsLogs)
  };
}
```

## International SMS Support

### Multi-Country Configuration
```typescript
const TWILIO_COUNTRY_CODES = {
  'US': '+1',
  'CA': '+1',
  'MX': '+52',
  'UK': '+44',
  'DE': '+49',
  'FR': '+33',
  'AU': '+61'
};

async sendInternationalSMS(phoneNumber: string, message: string, countryCode: string): Promise<SMSResult> {
  const formattedNumber = this.formatInternationalNumber(phoneNumber, countryCode);
  
  // Use country-specific Twilio phone number if available
  const fromNumber = this.getCountrySpecificNumber(countryCode) || this.fromNumber;
  
  return await this.client.messages.create({
    body: message,
    from: fromNumber,
    to: formattedNumber,
    statusCallback: `${process.env.BASE_URL}/api/twilio/status-callback`
  });
}
```

## Cost Management

### SMS Cost Tracking
```typescript
interface SMSCostAnalysis {
  totalSMS: number;
  estimatedCost: number;
  costPerSMS: number;
  internationalSMS: number;
  domesticSMS: number;
  monthlyProjection: number;
}

async calculateTwilioCosts(tenantId: string, month: string): Promise<SMSCostAnalysis> {
  const smsLogs = await storage.getSMSLogsByTenant(tenantId, { month });
  
  const domesticCost = 0.0075; // $0.0075 per SMS (US)
  const internationalCost = 0.04; // $0.04 per SMS (average)
  
  let totalCost = 0;
  let domesticCount = 0;
  let internationalCount = 0;
  
  for (const log of smsLogs) {
    if (log.phoneNumber.startsWith('+1')) {
      totalCost += domesticCost;
      domesticCount++;
    } else {
      totalCost += internationalCost;
      internationalCount++;
    }
  }
  
  return {
    totalSMS: smsLogs.length,
    estimatedCost: totalCost,
    costPerSMS: totalCost / smsLogs.length,
    domesticSMS: domesticCount,
    internationalSMS: internationalCount,
    monthlyProjection: totalCost * (30 / new Date().getDate())
  };
}
```

## Error Handling & Retry Logic

### Failed SMS Recovery
```typescript
async handleFailedSMS(messageSid: string, phoneNumber: string): Promise<void> {
  const smsLog = await storage.getSMSLogByMessageSid(messageSid);
  
  if (smsLog.retryCount < 3) {
    // Retry after delay
    setTimeout(async () => {
      await this.retrySMS(smsLog);
    }, 5000 * smsLog.retryCount); // Exponential backoff
  } else {
    // Mark as permanently failed
    await storage.updateSMSLog({
      twilioMessageSid: messageSid,
      status: 'permanently_failed',
      failedAt: new Date()
    });
    
    // Notify tenant admin
    await this.notifyAdminOfFailedSMS(smsLog);
  }
}
```

## Security & Compliance

### Phone Number Validation
```typescript
async validatePhoneNumber(phoneNumber: string): Promise<ValidationResult> {
  try {
    const lookup = await this.client.lookups.v1.phoneNumbers(phoneNumber).fetch();
    
    return {
      valid: true,
      formatted: lookup.phoneNumber,
      countryCode: lookup.countryCode,
      carrier: lookup.carrier,
      smsCapable: lookup.carrier?.type !== 'landline'
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      phoneNumber
    };
  }
}
```

### Opt-Out Management
```typescript
async handleOptOut(phoneNumber: string): Promise<void> {
  // Add to global opt-out list
  await storage.addToOptOutList(phoneNumber);
  
  // Find and deactivate all drivers with this number
  const drivers = await storage.getUsersByPhone(phoneNumber);
  
  for (const driver of drivers) {
    await storage.updateUser(driver.id, {
      hasConsented: false,
      optedOut: true,
      optOutDate: new Date()
    });
  }
}
```

## Implementation Steps

### 1. Install Twilio SDK
```bash
npm install twilio
npm install @types/twilio
```

### 2. Environment Configuration
```bash
# Add to .env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1555XXXXXXX
```

### 3. Database Schema Updates
```sql
-- Add SMS tracking table
CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  twilio_message_sid VARCHAR NOT NULL,
  phone_number VARCHAR NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR DEFAULT 'sent',
  direction VARCHAR DEFAULT 'outbound',
  retry_count INTEGER DEFAULT 0,
  sent_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  failed_at TIMESTAMP,
  cost_cents INTEGER
);

-- Add opt-out tracking
CREATE TABLE sms_opt_outs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR NOT NULL UNIQUE,
  opted_out_at TIMESTAMP DEFAULT NOW(),
  reason VARCHAR
);
```

### 4. Integration Testing
```typescript
async testTwilioIntegration(): Promise<TestResult> {
  const testPhone = process.env.TEST_PHONE_NUMBER;
  
  if (!testPhone) {
    throw new Error('TEST_PHONE_NUMBER not configured');
  }
  
  const testMessage = 'FleetChat Twilio Integration Test';
  const result = await this.twilioService.sendSMS(testPhone, testMessage);
  
  return {
    success: result.success,
    messageSid: result.messageSid,
    testPhone,
    timestamp: new Date()
  };
}
```

## Cost Estimation

### Monthly SMS Costs by Fleet Size
- **Small Fleet (10-25 drivers)**: $15-30/month
- **Medium Fleet (50-100 drivers)**: $50-100/month  
- **Large Fleet (200+ drivers)**: $150-300/month

### Cost Factors
- **Invitation SMS**: 1-2 SMS per driver onboarding
- **Verification SMS**: 1-2 SMS per driver setup
- **Emergency SMS**: Variable based on incidents
- **International SMS**: Higher costs for global fleets

## Conclusion

Twilio integration is essential for FleetChat's driver onboarding process, providing reliable SMS delivery for invitations, verification, and emergency communications. The implementation ensures GDPR compliance, international support, and cost-effective messaging for fleet operators of all sizes.