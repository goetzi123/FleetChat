
# ZeKju Platform – Technical Specification Document

## 1. Overview

ZeKju provides GDPR-compliant, app-free transport communication and workflow automation using familiar messenger platforms (WhatsApp, Telegram, Viber). It targets truck drivers, dispatchers, shippers, and yard personnel by integrating structured workflows into chat-based communication, eliminating language barriers and minimizing digital friction.

---

## 2. Documented Workflows

### 2.1 Transport Communication Workflow
- **Onboarding**: Drivers receive an SMS or QR code, launch a chat in their preferred messenger, select language, and join workflows in ~30 seconds.
- **Status Collection**: Automated prompts guide drivers through FTL or LTL workflows, collecting arrival, loading, and unloading statuses.
- **Document Submission**: Drivers send PODs, load slips, and delivery documents as chat attachments.
- **Geo-Tracking**: One-off pings or live GPS tracking (via the optional Tracking Companion) with geofence and ETA analytics.
- **Chat & Translation**: Free-text chat with live translation in 24 languages ensures seamless dispatcher-driver communication.

### 2.2 Yard Communication Workflow
- **Gate Registration**: QR-triggered digital check-in via messenger (no hardware).
- **ETA Confirmation**: Drivers confirm arrival time in advance.
- **Call-Off & Navigation**: Yard operators send turn-by-turn instructions and sequencing in the driver’s native language.
- **Check-Out**: Exit documents and instructions sent digitally via messenger.

### 2.3 KRONE Smart Assistant
- Workflow for trailer checks: record condition, take photos, confirm load integrity, and access e‑CMR—all via messenger.

---

## 3. User Groups

| Group                | Role Description |
|----------------------|------------------|
| **Drivers**          | Use messenger apps; interact via chat-based workflows without app installation |
| **Dispatchers**      | Manage transports via Transport Center UI; invite drivers, track status, and approve documents |
| **Yard Operators**   | Automate registration, call-off, and checkout using structured chat interactions |
| **Shippers/Managers**| Monitor transport progress and documents via integrations or shared dashboards |

---

## 4. TMS Integration Points

### Native Connectors
- **Transporeon**
- **Agheera**
- **project44**
- **Wanko**
- **D-Soft (bluecargo)**

### Integration Capabilities
- **Inbound (TMS → ZeKju)**:
  - POST /transports: Create new transport order with pickup/drop-off, driver pseudo ID, and workflow metadata
  - File-based uploads via SFTP or email (CSV/Excel)
- **Outbound (ZeKju → TMS/Platforms)**:
  - Status updates (POST /transports/{id}/status)
  - Location data (POST /transports/{id}/location)
  - Document uploads (POST /transports/{id}/documents)
  - Transport completion (POST /transports/{id}/completed)

### Middleware Support
- REST APIs, email, SFTP, Seeburger, Lobster Data, custom connectors

---

## 5. Messenger Integration

- Supported platforms: **WhatsApp, Telegram, Viber**
- Driver onboarding via SMS or QR code – no app installation required
- Auto-translation in real time (~24 languages)
- Privacy features: driver identity anonymized; messages encrypted
- Messenger workflows support document upload, geo sharing, and guided status prompts

---

## 6. Technical Architecture

### System Components

```
[Dispatcher / TMS]
       |
   (API / CSV / SFTP)
       |
   [ZeKju Backend]
       ├─ Workflow Engine
       ├─ Language Translation Service
       ├─ Document & Data Store
       ├─ Privacy Layer (anonymization & GDPR compliance)
       └─ API/Webhooks
        |
[Messenger Gateways: WhatsApp / Telegram / Viber]
        |
   [Driver’s Messenger App]
```

### Message Flow

1. Transport created in TMS → pushed to ZeKju
2. Driver onboarded via SMS/QR → joins messenger workflow
3. Driver updates status & uploads docs via chat
4. Live geo or one-off location shared as needed
5. Dispatcher sees updates, forwards to TMS or visibility tools
6. Yard workflows and trailer inspections handled via Smart Assistant

---

## 7. Feature Plans

| Feature                                | Starter         | Smart             | Pro                | Enterprise                  |
|----------------------------------------|------------------|--------------------|---------------------|------------------------------|
| Driver Messenger Chat                  | ✅               | ✅                 | ✅                   | ✅                           |
| Geo Tracking                           | One-off only     | Basic Tracking     | Advanced Alerts     | Multimodal Visibility        |
| TMS Integration                        | ❌               | ❌                 | Single Connector    | Multi-System API             |
| Yard + KRONE Workflows                 | ❌               | ❌                 | ❌                   | ✅                           |
| Document Module & Signatures           | ❌               | ✅ Basic Upload     | Approval & Sign-on-glass | Full Docs Workflow     |

---

## 8. Compliance

- GDPR Compliant
- EU-hosted data centers
- End-to-end encrypted messaging
- Masked driver identifiers (phone/name)
- Consent-based opt-in (via privacy agreement at onboarding)

---

## 9. Add-Ons and Extensions

- **Document Management Module**: tagging, approval, rejection UI
- **Digital Signature**: Sign-on-glass feature in messenger
- **KRONE Smart Assistant**: trailer inspection automation
- **Tracking Companion**: Enhanced GPS-based visibility

---

## Appendix: Sample API Payload

```json
{
  "transportId": "T-12345",
  "driverPhonePseudo": "anon-87452",
  "pickup": {
    "location": "Berlin",
    "time": "2025-06-26T10:00:00Z"
  },
  "dropoff": {
    "location": "Munich",
    "time": "2025-06-27T18:00:00Z"
  },
  "workflowType": "FTL",
  "language": "pl",
  "tmsRef": "REF-9988"
}
```

---

## Next Steps

- Add API access to customer-specific TMS systems via REST or middleware.
- Explore data model customizations for complex, multi-modal logistics.
- Evaluate webhook-driven real-time integrations with project44/Transporeon.

