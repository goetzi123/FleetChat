# FleetChat Message Broker Architecture
## Headless Communication Bridge Between WhatsApp and Samsara

---

## Architectural Overview

FleetChat operates as a **pure message broker** that facilitates bidirectional communication between WhatsApp Business API and Samsara fleet management system. The service has no user interface and functions entirely through API integrations and webhook processing.

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Samsara   │◄──►│ FleetChat   │◄──►│  WhatsApp   │
│    TMS      │    │   Broker    │    │ Business API│
└─────────────┘    └─────────────┘    └─────────────┘
      │                    │                    │
      ▼                    ▼                    ▼
 Fleet Events         Message         Driver Responses
 Driver Data          Routing         Document Uploads
 Route Updates        Translation     Status Updates
```

## Core Functions

### 1. Event Translation Service
- **Samsara → WhatsApp**: Translates fleet events into contextual WhatsApp messages
- **WhatsApp → Samsara**: Processes driver responses and updates Samsara systems
- **Message Formatting**: Converts technical data into driver-friendly messages

### 2. Phone Number Resolution
- Retrieves driver phone numbers from Samsara API
- Maps Samsara driver IDs to WhatsApp numbers
- Maintains GDPR-compliant driver identification

### 3. Workflow Automation
- Automatic message routing based on transport events
- Context-aware response processing
- Document handling and approval workflows

---

## Message Flow Scenarios

### Scenario 1: Transport Assignment
```
1. Samsara: Route created with assigned driver
2. FleetChat: Retrieves driver phone from Samsara
3. FleetChat → WhatsApp: "New delivery assigned to Berlin"
4. WhatsApp → Driver: Message with pickup details
5. Driver → WhatsApp: "Acknowledged"
6. FleetChat → Samsara: Update driver acknowledgment status
```

### Scenario 2: Proof of Delivery
```
1. Driver → WhatsApp: Photo of signed POD
2. FleetChat: Processes document upload
3. FleetChat → Samsara: Upload POD to transport record
4. Samsara: Transport marked as completed
5. FleetChat → WhatsApp: "Delivery confirmed - thank you!"
```

### Scenario 3: Status Updates
```
1. Driver → WhatsApp: "Arrived at pickup"
2. FleetChat: Parse location and status
3. FleetChat → Samsara: Update transport status + location
4. Samsara: Trigger ETA recalculation
5. FleetChat → Customer: "Driver arrived, loading in progress"
```

---

## Technical Implementation

### Service Components

#### 1. Webhook Processors
```typescript
// Samsara webhook handler
app.post('/webhook/samsara', async (req, res) => {
  const event = req.body;
  const message = await translateSamsaraEvent(event);
  await sendWhatsAppMessage(message);
});

// WhatsApp webhook handler
app.post('/webhook/whatsapp', async (req, res) => {
  const message = req.body;
  const samsaraUpdate = await processDriverResponse(message);
  await updateSamsaraRecord(samsaraUpdate);
});
```

#### 2. Message Translation Engine
```typescript
async function translateSamsaraEvent(event: SamsaraEvent): Promise<WhatsAppMessage> {
  const driver = await getDriverPhone(event.driverId);
  const template = getMessageTemplate(event.type);
  
  return {
    to: driver.phoneNumber,
    template: template.name,
    parameters: extractEventParameters(event)
  };
}
```

#### 3. Response Processing
```typescript
async function processDriverResponse(message: WhatsAppMessage): Promise<SamsaraUpdate> {
  const driver = await identifyDriver(message.from);
  const action = await parseDriverAction(message.content);
  
  return {
    driverId: driver.samsaraId,
    transportId: action.transportId,
    status: action.status,
    location: action.location,
    documents: action.documents
  };
}
```

### 4. Data Persistence
FleetChat maintains minimal state:
- **Driver Phone Mappings**: Samsara ID ↔ WhatsApp Number
- **Active Transport Context**: Current conversations and workflows
- **Message History**: For audit and retry mechanisms

---

## Deployment Architecture

### Headless Service Stack
```yaml
services:
  fleetchat-broker:
    image: fleetchat/message-broker
    environment:
      - SAMSARA_API_TOKEN
      - SAMSARA_ORG_ID
      - WHATSAPP_BUSINESS_TOKEN
      - WHATSAPP_PHONE_NUMBER_ID
    ports:
      - "3000:3000"  # Webhook endpoints only
    networks:
      - fleet-network
```

### No Frontend Required
- No web UI or dashboard
- Configuration via environment variables
- Monitoring through logs and metrics
- Health checks via `/health` endpoint

### Integration Points
```
External Systems:
├── Samsara TMS (Primary fleet management)
├── WhatsApp Business API (Driver communication)
├── SMS Gateway (Fallback communication)
└── Logging/Monitoring (Observability)

Internal Services:
├── Message Translation Engine
├── Phone Number Resolution
├── Document Processing
└── Webhook Handlers
```

---

## Benefits of Broker Architecture

### 1. Separation of Concerns
- **Samsara**: Fleet management, driver data, route optimization
- **FleetChat**: Pure communication layer
- **WhatsApp**: Message delivery and driver interface

### 2. Simplified Maintenance
- No frontend code to maintain
- Single responsibility: message brokering
- Easier testing and deployment

### 3. Scalability
- Stateless message processing
- Horizontal scaling capability
- Event-driven architecture

### 4. Integration Flexibility
- Works with any TMS that provides webhooks
- Pluggable message templates
- Multiple communication channels (WhatsApp, SMS, Telegram)

---

## Configuration Requirements

### Environment Variables
```bash
# Samsara Integration
SAMSARA_API_TOKEN=your_token_with_driver_scopes
SAMSARA_ORG_ID=your_organization_id
SAMSARA_WEBHOOK_SECRET=webhook_verification_secret

# WhatsApp Business API
WHATSAPP_BUSINESS_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_business_phone_id
WHATSAPP_WEBHOOK_SECRET=webhook_verification_secret

# Service Configuration
LOG_LEVEL=info
HEALTH_CHECK_PORT=3001
METRICS_PORT=3002
```

### Webhook Endpoints
```
POST /webhook/samsara     - Receive fleet events
POST /webhook/whatsapp    - Receive driver messages
GET  /health             - Health check
GET  /metrics            - Prometheus metrics
```

---

## Message Templates

### Driver Communication Templates
```json
{
  "transport_assigned": {
    "template": "delivery_assignment",
    "parameters": ["pickup_location", "delivery_location", "eta"]
  },
  "pickup_reminder": {
    "template": "pickup_notification",
    "parameters": ["location", "time_window"]
  },
  "document_request": {
    "template": "pod_request",
    "parameters": ["delivery_address", "customer_name"]
  }
}
```

### Response Processing Patterns
```json
{
  "status_patterns": {
    "arrived": ["arrived", "here", "at location"],
    "loaded": ["loaded", "picked up", "goods collected"],
    "delivered": ["delivered", "completed", "unloaded"]
  },
  "document_types": {
    "pod": ["delivery note", "signed", "proof"],
    "damage": ["damage", "incident", "problem"]
  }
}
```

---

## Monitoring and Observability

### Key Metrics
- Message processing rate
- Translation accuracy
- Webhook delivery success
- Driver response time
- Integration error rates

### Logging Strategy
```json
{
  "event_type": "message_processed",
  "timestamp": "2025-06-27T10:30:00Z",
  "source": "samsara",
  "destination": "whatsapp",
  "driver_id": "driver_12345",
  "transport_id": "transport_67890",
  "message_template": "delivery_assignment",
  "success": true
}
```

### Health Checks
```
GET /health/samsara     - Samsara API connectivity
GET /health/whatsapp    - WhatsApp API connectivity
GET /health/database    - Data store status
GET /health/overall     - Service health summary
```

---

## Security Considerations

### Data Protection
- Driver phone numbers encrypted at rest
- Webhook signature verification
- API token rotation support
- GDPR compliance for EU drivers

### Communication Security
- TLS encryption for all API calls
- Webhook payload validation
- Rate limiting and DDoS protection
- Message content sanitization

---

This headless broker architecture eliminates the complexity of maintaining a user interface while providing robust, scalable communication between Samsara and WhatsApp. The service focuses purely on its core competency: intelligent message routing and translation.