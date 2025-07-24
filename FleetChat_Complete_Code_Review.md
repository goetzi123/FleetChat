# FleetChat - Complete Code Review Package

## Project Overview

FleetChat is a pure communication protocol service that integrates with fleet management systems (Samsara, Geotab) to facilitate bidirectional WhatsApp communication with drivers. The system operates as middleware only, without replicating any fleet management functionality.

## Architecture Summary

**Core Components:**
- Communication middleware between fleet systems and WhatsApp
- Driver phone number mapping service
- Message template and response processing
- Multi-tenant billing and administration

**Technology Stack:**
- Backend: Node.js 20, TypeScript, Express
- Frontend: React 18, Vite, TypeScript
- Database: PostgreSQL 16 with Drizzle ORM
- Authentication: Replit Auth/OpenID Connect
- APIs: Samsara, WhatsApp Business API
- Payments: Stripe integration

## Key Files for Review

### Database Schema (`shared/schema.ts`)
```typescript
// Core tenant and user management
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey(),
  companyName: varchar("company_name").notNull(),
  samsaraApiToken: varchar("samsara_api_token"),
  whatsappPhoneNumber: varchar("whatsapp_phone_number"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const drivers = pgTable("drivers", {
  id: varchar("id").primaryKey(),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  samsaraDriverId: varchar("samsara_driver_id"),
  phoneNumber: varchar("phone_number"),
  whatsappActive: boolean("whatsapp_active").default(false),
});
```

### API Routes (`server/routes.ts`)
Main endpoints for fleet integration and communication processing.

### Samsara Integration (`server/integrations/samsara.ts`)
Read-only fleet system integration with webhook processing.

### WhatsApp Integration (`server/whatsapp-business-api.ts`)
Message sending and response handling for driver communication.

## System Boundaries

**What FleetChat Does:**
- Relay messages between fleet systems and WhatsApp
- Map driver IDs to phone numbers
- Process driver responses back to fleet systems
- Handle billing for communication services

**What FleetChat Does NOT Do:**
- Create or manage fleet routes
- Track vehicles or telematics
- Duplicate any fleet management functionality
- Store fleet operational data

## Demo System

The interactive demo (`simple-onboarding-demo.html`) shows:
- 3-step fleet onboarding process
- Samsara credential setup
- Driver discovery and WhatsApp mapping
- Payment configuration
- Live event simulation

## Security & Compliance

- No storage of sensitive fleet data
- Driver phone numbers only (no personal data)
- GDPR-compliant communication processing
- Webhook signature verification
- Multi-tenant data isolation

## Business Model

- Per-driver monthly billing
- $15-45/driver/month pricing tiers
- Automated Stripe payment processing
- Usage-based cost optimization

## Production Status

All systems operational and deployment-ready:
- Database schema implemented
- API integrations complete
- Demo system functional
- Documentation comprehensive
- Multi-tenant architecture verified

## Key Documentation Files

1. `FleetChat_System_Overview.md` - High-level architecture
2. `FleetChat_Technical_Documentation.md` - Detailed implementation
3. `FleetChat_Universal_Fleet_System_Boundaries.md` - System compliance
4. `FleetChat_Multi_Tenant_Architecture.md` - Scalability design
5. `FleetChat_Samsara_Integration_Overview.md` - Primary integration
6. `replit.md` - Complete development history and specifications

## Contact for Code Access

For complete source code access:
1. Request Replit project sharing link
2. GitHub repository creation available
3. Specific file review via direct sharing

This review package provides comprehensive understanding of FleetChat's architecture, implementation, and business model for technical evaluation.