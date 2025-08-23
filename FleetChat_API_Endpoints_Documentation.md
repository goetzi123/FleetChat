# FleetChat API Endpoints Documentation

## Overview

This document provides comprehensive documentation for all FleetChat API endpoints, including the completed Samsara webhook compliance implementation with per-customer webhook management, signature verification, and complete CRUD operations.

## Fleet Management Endpoints

### Fleet Setup
- `POST /api/fleet/setup` - Complete fleet onboarding with automatic webhook creation
- `GET /api/samsara/drivers/:tenantId` - Discover Samsara drivers for tenant
- `POST /api/fleet/drivers/onboard` - Onboard selected drivers to WhatsApp
- `POST /api/fleet/billing/setup` - Configure Stripe payment integration
- `GET /api/dashboard/:tenantId` - Fleet dashboard data and statistics

### Driver Management
- `GET /api/drivers/:tenantId` - List all drivers for tenant
- `POST /api/drivers` - Create new driver record
- `PATCH /api/drivers/:driverId` - Update driver information
- `DELETE /api/drivers/:driverId` - Remove driver from system

### Communication Protocol Operations (COMPLIANT)
**❌ PROHIBITED:** FleetChat does NOT implement transport management operations
**✅ COMPLIANT ALTERNATIVE:** Webhook relay endpoints only
- `POST /api/webhook/{platform}/{tenantId}` - Fleet system event relay
- `POST /api/webhook/whatsapp/{tenantId}` - Driver response relay
- `GET /api/communication-logs/{tenantId}` - Message delivery tracking

## Samsara Integration Endpoints

### Per-Customer Webhook Management ✅ COMPLIANCE COMPLETE

#### Webhook Event Processing
```typescript
POST /api/samsara/webhook/:tenantId
```
**Description:** Per-customer webhook endpoint for receiving Samsara events with signature verification

**Parameters:**
- `tenantId` (path): Unique tenant identifier

**Headers:**
- `x-samsara-signature`: Webhook signature for verification
- `x-FleetChat-Tenant-ID`: Tenant identification header

**Request Body:** Samsara event payload

**Security:** 
- Webhook signature verification using tenant-specific secrets
- Timing-safe comparison to prevent timing attacks

**Response:**
- `200 OK` - Event processed successfully
- `401 Unauthorized` - Invalid signature or tenant
- `500 Internal Server Error` - Processing error

#### Webhook CRUD Operations

```typescript
GET /api/samsara/webhooks/:tenantId
```
**Description:** List all webhooks for a specific tenant

**Parameters:**
- `tenantId` (path): Tenant identifier

**Response:**
```json
{
  "webhooks": [
    {
      "id": "webhook_123",
      "name": "FleetChat-CompanyName-tenant_123",
      "url": "https://fleet-chat.replit.app/api/samsara/webhook/tenant_123",
      "eventTypes": ["DriverCreated", "VehicleLocationUpdate", ...],
      "isActive": true,
      "createdAt": "2025-07-15T10:00:00Z"
    }
  ]
}
```

```typescript
PATCH /api/samsara/webhooks/:tenantId/:webhookId
```
**Description:** Update webhook configuration

**Parameters:**
- `tenantId` (path): Tenant identifier
- `webhookId` (path): Webhook identifier

**Request Body:**
```json
{
  "eventTypes": ["DriverCreated", "VehicleLocationUpdate", "RouteStarted"],
  "isActive": true
}
```

**Response:** Updated webhook object

```typescript
DELETE /api/samsara/webhooks/:tenantId/:webhookId
```
**Description:** Delete specific webhook

**Parameters:**
- `tenantId` (path): Tenant identifier
- `webhookId` (path): Webhook identifier

**Response:**
```json
{
  "success": true,
  "message": "Webhook deleted successfully"
}
```

### Application Lifecycle Management

```typescript
POST /api/fleet/disconnect/:tenantId
```
**Description:** Customer disconnection with complete webhook cleanup

**Parameters:**
- `tenantId` (path): Tenant identifier

**Actions Performed:**
1. Delete customer webhook from Samsara
2. Deactivate tenant account
3. Clear Samsara API credentials
4. Maintain data for compliance/billing

**Response:**
```json
{
  "success": true,
  "message": "Customer disconnected and webhook removed successfully"
}
```

## WhatsApp Integration Endpoints

### Message Processing
- `POST /api/whatsapp/webhook` - Process incoming WhatsApp messages
- `POST /api/whatsapp/send` - Send message to driver
- `GET /api/whatsapp/status/:messageId` - Check message delivery status

### Media Handling
- `POST /api/whatsapp/media/upload` - Upload media to WhatsApp
- `GET /api/whatsapp/media/:mediaId` - Retrieve media from WhatsApp
- `DELETE /api/whatsapp/media/:mediaId` - Delete media file

## System Administration Endpoints

### Health Monitoring
```typescript
GET /api/health
```
**Description:** Service health check with WhatsApp pool statistics

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-15T10:00:00Z",
  "services": {
    "database": "healthy",
    "whatsapp": "healthy",
    "samsara": "healthy"
  },
  "metrics": {
    "totalTenants": 12,
    "activeDrivers": 142,
    "activeTransports": 89,
    "whatsappPoolAvailable": 25
  }
}
```

### Configuration
- `GET /api/config/:tenantId` - Get tenant configuration
- `PATCH /api/config/:tenantId` - Update tenant settings
- `GET /api/pricing` - Get current pricing tiers
- `GET /api/features/:tenantId` - Get available features for tenant

## Authentication & Security

### Tenant Authentication
All fleet operator endpoints require tenant context authentication:

```typescript
// Header-based authentication
Authorization: Bearer <tenant_jwt_token>

// Automatic tenant scoping in middleware
req.tenantContext = { tenantId: "extracted_from_token" }
```

### Webhook Security
Samsara webhooks use signature verification:

```typescript
// Webhook signature verification
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
```

## Error Handling

### Standard Error Responses
```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "timestamp": "2025-07-15T10:00:00Z",
  "details": {
    "field": "Additional error context"
  }
}
```

### Common Error Codes
- `TENANT_NOT_FOUND` - Invalid or missing tenant
- `WEBHOOK_SIGNATURE_INVALID` - Webhook signature verification failed
- `SAMSARA_API_ERROR` - Samsara API integration error
- `WHATSAPP_API_ERROR` - WhatsApp Business API error
- `BILLING_ERROR` - Payment or billing related error

## Rate Limiting

### API Rate Limits
- **Fleet Operations**: 100 requests per minute per tenant
- **Webhook Processing**: No limit (verified webhooks only)
- **WhatsApp Messages**: Respects WhatsApp Business API limits
- **Admin Operations**: 1000 requests per minute

### Webhook Processing
- **Signature Verification**: Required for all Samsara webhooks
- **Tenant Isolation**: Events automatically scoped to correct tenant
- **Event Deduplication**: Prevents duplicate event processing

## Compliance Features

### Samsara Marketplace App Compliance ✅ COMPLETE
- **Per-Customer Webhooks**: Individual webhook endpoints per tenant
- **Signature Verification**: Timing-safe webhook signature validation
- **Complete CRUD Operations**: Full webhook lifecycle management
- **Application Lifecycle**: Automatic webhook creation/deletion
- **OAuth Token Management**: Secure per-customer API token handling

### GDPR Compliance
- **Data Isolation**: Complete tenant data separation
- **Consent Management**: Driver communication consent tracking
- **Data Portability**: Export capabilities for tenant data
- **Right to be Forgotten**: Complete data removal on request

## Production Deployment

### Environment Variables
```bash
# Core Configuration
DATABASE_URL=postgresql://user:pass@host:port/dbname
BASE_URL=https://fleet-chat.replit.app

# Samsara Integration
SAMSARA_WEBHOOK_SECRET_KEY=webhook_secret

# WhatsApp Business API
WHATSAPP_BUSINESS_API_TOKEN=whatsapp_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=webhook_verify_token

# Stripe Billing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Database Migration
```bash
# Apply schema changes for webhook compliance
npm run db:push
```

### Monitoring
- Application performance monitoring
- Webhook delivery tracking
- Error rate monitoring
- Revenue and usage analytics

## Conclusion

FleetChat's API architecture provides complete Samsara marketplace app compliance with robust multi-tenant support, comprehensive webhook management, and enterprise-grade security. The implementation ensures scalable, secure, and compliant fleet communication services for production deployment.