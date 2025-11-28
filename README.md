# FleetChat

**Bidirectional Communication Protocol Service for Fleet Management**

FleetChat is an open-source communication middleware that connects fleet management systems (Samsara, Motive, Geotab) with drivers via WhatsApp Business API. It operates as a pure message relay service, enabling automated fleet-to-driver communication without replicating any fleet management functionality.

---

## Overview

FleetChat bridges the gap between fleet management platforms and drivers' preferred communication channel - WhatsApp. When a fleet event occurs (route assignment, delivery update, alert), FleetChat automatically translates it into a WhatsApp message and sends it to the appropriate driver. Driver responses are relayed back to the fleet system.

### Key Principles

- **Pure Message Relay**: No fleet management functionality - just communication
- **Zero Configuration for Clients**: FleetChat manages the entire WhatsApp infrastructure
- **Multi-Tenant SaaS**: Complete logical isolation per client
- **Multi-Platform Support**: Samsara, Motive, and Geotab integrations

---

## Features

### Fleet System Integrations
- **Samsara** - Webhook event processing, driver communication
- **Motive** (formerly KeepTruckin) - Real-time event handling (1-3s response time)
- **Geotab** - Planned integration

### Communication Capabilities
- Automated fleet event notifications to drivers
- Driver response collection and relay
- Document forwarding (PODs, load slips)
- Location ping requests
- Interactive button responses

### WhatsApp Number Pool Management
- Automatic dedicated number assignment per client
- Zero client configuration required
- 10,000+ number capacity
- Complete tenant isolation

### Security
- AES-256-GCM encrypted credential storage
- Webhook signature verification
- Bearer token authentication
- Multi-tenant data isolation

---

## Architecture

```
Fleet Systems                    FleetChat                      Drivers
(Samsara/Motive/Geotab)         (Message Relay)                (WhatsApp)
         │                            │                             │
         │  Webhook Events            │                             │
         ├───────────────────────────►│                             │
         │                            │  WhatsApp Message           │
         │                            ├────────────────────────────►│
         │                            │                             │
         │                            │  Driver Response            │
         │                            │◄────────────────────────────┤
         │  API Update                │                             │
         │◄───────────────────────────┤                             │
         │                            │                             │
```

### Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Drizzle ORM)
- **Frontend**: React, TailwindCSS, shadcn/ui
- **Authentication**: OpenID Connect (Replit Auth)
- **Payments**: Stripe
- **Email**: SendGrid

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Samsara/Motive API access (for fleet integration)
- WhatsApp Business API access

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fleetchat.git
   cd fleetchat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Environment Variables

See `.env.example` for all required configuration:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SAMSARA_API_TOKEN` | Samsara API authentication |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp Business API token |
| `STRIPE_SECRET_KEY` | Stripe payment processing |
| `SESSION_SECRET` | Express session encryption |

---

## Project Structure

```
fleetchat/
├── client/                 # React frontend
│   └── src/
│       ├── pages/         # Page components
│       └── components/    # UI components
├── server/                 # Express backend
│   ├── integrations/      # Fleet system integrations
│   └── routes.ts          # API endpoints
├── shared/                 # Shared types and schemas
├── fleet.chat/            # Public website
└── docs/                  # Documentation
```

---

## Compliance

FleetChat operates under strict **Universal Fleet System Boundaries**:

- **Allowed**: Message relay, driver phone mapping, communication logs
- **Prohibited**: Route creation, vehicle tracking, transport management, analytics

This ensures FleetChat remains a pure communication service that complements rather than competes with fleet management systems.

See `FleetChat_Universal_Fleet_System_Boundaries.md` for complete compliance documentation.

---

## Demo

The repository includes interactive demos:

- `/demo` - Live event propagation demo
- `customer-onboarding-demo.html` - Customer onboarding flow
- `motive-integration-demo.html` - Motive integration showcase

---

## Documentation

- [Technical Documentation](FleetChat_Technical_Documentation.md)
- [API Endpoints](FleetChat_API_Endpoints_Documentation.md)
- [System Boundaries](FleetChat_Universal_Fleet_System_Boundaries.md)
- [Business Summary](FleetChat_Business_Technical_Summary.md)

---

## Contributing

Contributions are welcome! Please read the following before contributing:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Security

For security concerns, please see [SECURITY_REPORT.md](SECURITY_REPORT.md).

**Important**: Never commit real API keys, passwords, or secrets. Use environment variables for all sensitive configuration.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Samsara](https://www.samsara.com/) - Fleet management platform
- [Motive](https://gomotive.com/) - Fleet management platform  
- [WhatsApp Business API](https://business.whatsapp.com/) - Driver communication
- [Replit](https://replit.com/) - Development platform

---

## Contact

- **Website**: [fleet.chat](https://fleet.chat)
- **Email**: info@fleet.chat

---

Built with purpose for the logistics industry.
