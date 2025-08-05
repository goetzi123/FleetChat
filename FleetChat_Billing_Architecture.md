# FleetChat Billing Architecture

## Overview
FleetChat uses a driver-based subscription model with automated billing through the middleware platform. Fleet operators receive consolidated monthly invoices covering all communication services. **Implementation Status**: Production-ready billing system with Stripe integration operational (July 2025).

## Billing Model

### Driver-Based Pricing
**Primary Metric**: Active drivers per month
- Driver is considered "active" if they receive at least one message or send one response during the billing period
- Pricing tiers: Basic ($8), Professional ($15), Enterprise ($20) per active driver per month
- Inactive drivers (no communication activity) are not billed

### Automated Driver Counting
FleetChat automatically tracks active drivers through:
```
Active Driver Criteria:
- Received at least 1 WhatsApp message from FleetChat
- Sent at least 1 WhatsApp response to FleetChat
- Associated with active transport in Samsara during billing period
```

## Billing Process

### 1. Monthly Usage Tracking
**Real-time Monitoring**:
- Driver activity tracking per fleet
- Message volume per driver
- Transport completion rates
- Template usage analytics

**Data Collection**:
```javascript
// Example billing data structure
{
  fleet_id: "fleet_abc_123",
  billing_period: "2025-06",
  active_drivers: [
    {
      samsara_driver_id: "driver_001",
      whatsapp_number: "+1234567890",
      messages_sent: 15,
      messages_received: 8,
      transports_completed: 3,
      first_activity: "2025-06-05",
      last_activity: "2025-06-28"
    }
  ],
  total_active_drivers: 47,
  service_tier: "professional",
  monthly_cost: 1175.00
}
```

### 2. Automated Invoice Generation
**Monthly Billing Cycle**:
- Billing period: 1st to last day of month
- Invoice generation: 1st of following month
- Payment due: 15th of invoice month
- Auto-payment processing through Stripe

**Invoice Components**:
```
FleetChat Invoice - June 2025
Fleet: ABC Trucking Company

Service Details:
- Service Tier: Professional ($25/driver/month)
- Active Drivers: 47
- Subtotal: $1,175.00

Volume Discounts:
- 25% discount (200+ drivers): -$293.75

Additional Services:
- Custom Templates (2 sets): $1,000.00
- Advanced Analytics: $200.00

Total: $2,081.25
```

### 3. Payment Processing
**Automated Collection**:
- Primary: ACH bank transfer (preferred for fleet operators)
- Secondary: Credit card processing via Stripe
- Enterprise: Net-30 terms with credit approval

**Payment Security**:
- PCI DSS compliant payment processing
- Bank-grade encryption for financial data
- Automated retry logic for failed payments
- Grace period: 15 days before service suspension

## Fleet Operator Billing Dashboard

### Self-Service Portal
Fleet operators access billing through secure web portal:

**Dashboard Features**:
- Real-time active driver count
- Current month usage tracking
- Historical billing and payment records
- Driver activity breakdown
- Cost projection for current month

**Usage Analytics**:
```
Current Month (June 2025):
├── Active Drivers: 47/52 total drivers
├── Messages Sent: 1,247
├── Driver Response Rate: 94%
├── Projected Monthly Cost: $1,175.00
└── Compared to May: +3 drivers (+$75)
```

### Cost Management Tools
**Driver Management**:
- Add/remove drivers from billing
- Set driver activity thresholds
- Seasonal driver scaling options
- Bulk driver import/export

**Budget Controls**:
- Monthly spending limits
- Alert thresholds for cost increases
- Automatic scaling restrictions
- Cost center allocation for multi-fleet operations

## Billing Integration Architecture

### 1. Usage Data Collection
**Real-time Tracking**:
```javascript
// FleetChat billing service integration
class BillingTracker {
  async recordDriverActivity(fleetId, driverId, activityType) {
    // Track message sent/received
    // Update active driver status
    // Calculate real-time usage
  }
  
  async generateMonthlyBilling(fleetId, billingPeriod) {
    // Aggregate driver activity
    // Apply volume discounts
    // Generate invoice data
  }
}
```

### 2. Payment Processing Integration
**Stripe Integration**:
- Automated subscription management
- Failed payment handling
- Dunning management for overdue accounts
- Compliance with banking regulations

**Enterprise Billing**:
- Custom invoicing for large fleets
- Purchase order processing
- Multi-entity billing for corporate accounts
- Integration with fleet operator accounting systems

### 3. Billing Database Schema
```sql
-- Fleet billing configuration
fleets_billing {
  fleet_id: varchar
  service_tier: enum(basic, professional, enterprise)
  billing_email: varchar
  payment_method_id: varchar
  auto_payment: boolean
  volume_discount_tier: varchar
}

-- Monthly usage tracking
driver_activity_monthly {
  fleet_id: varchar
  driver_id: varchar
  billing_period: varchar (YYYY-MM)
  messages_sent: integer
  messages_received: integer
  is_active: boolean
  first_activity: timestamp
  last_activity: timestamp
}

-- Invoice records
invoices {
  invoice_id: varchar
  fleet_id: varchar
  billing_period: varchar
  active_driver_count: integer
  subtotal: decimal
  discounts: decimal
  additional_services: decimal
  total_amount: decimal
  status: enum(pending, paid, overdue, cancelled)
  due_date: date
  paid_date: date
}
```

## Billing Transparency

### Real-time Cost Visibility
Fleet operators can monitor costs in real-time:
- Daily active driver counts
- Message volume tracking
- Cost accumulation throughout month
- Projected monthly billing

### Detailed Usage Reports
**Monthly Reports Include**:
- Driver-by-driver activity breakdown
- Message delivery success rates
- Response time analytics
- Transport completion correlation
- Cost optimization recommendations

### Billing Support
**Customer Success**:
- Dedicated billing support team
- Monthly usage review calls for Enterprise clients
- Cost optimization consulting
- Custom reporting for accounting departments

## Enterprise Billing Features

### Multi-Fleet Management
**Corporate Account Structure**:
- Consolidated billing across multiple fleets
- Department-level cost allocation
- Regional billing breakdowns
- Centralized payment processing

### Integration Options
**ERP Integration**:
- SAP, Oracle, QuickBooks connectors
- Automated GL posting
- Purchase order matching
- Vendor management integration

**Custom Billing**:
- Volume-based pricing for large deployments
- Custom contract terms and pricing
- Quarterly or annual payment options
- Dedicated account management

This billing architecture ensures transparent, automated, and scalable pricing that grows with fleet operations while providing detailed cost visibility and management tools.