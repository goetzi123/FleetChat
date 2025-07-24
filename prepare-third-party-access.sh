#!/bin/bash

# FleetChat Third-Party Access Preparation Script
# This script prepares the codebase for sharing with third parties

echo "🚀 Preparing FleetChat for Third-Party Access..."

# Create backup of current state
echo "📦 Creating backup..."
cp -r . ../fleetchat-backup-$(date +%Y%m%d)

# Create .gitignore for sensitive files
echo "🔒 Creating security .gitignore..."
cat > .gitignore << 'EOF'
# Environment files
.env
.env.local
.env.production
.env.development

# Sensitive configuration
config/secrets.json
config/production.json
server/secrets/
**/secrets/**

# Database files
*.db
*.sqlite
database.url

# API Keys and tokens
**/api-keys/**
**/tokens/**
**.key
**.pem

# Node modules and build files
node_modules/
dist/
build/
.next/

# IDE and editor files
.vscode/
.idea/
*.swp
*.swo

# Log files
*.log
logs/
npm-debug.log*

# Temporary files
tmp/
temp/
.tmp/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Replit specific
.replit
replit.nix
EOF

# Create sanitized environment template
echo "📋 Creating environment template..."
cat > .env.example << 'EOF'
# FleetChat Environment Configuration Template
# Copy this file to .env and fill in your actual values

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/fleetchat

# Samsara API Configuration
SAMSARA_API_TOKEN=your_samsara_api_token_here
SAMSARA_GROUP_ID=your_samsara_group_id

# WhatsApp Business API Configuration
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_whatsapp_business_account_id
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# JWT Secret for authentication
JWT_SECRET=your_jwt_secret_key_here

# Session Configuration
SESSION_SECRET=your_session_secret_here

# Email Configuration (if applicable)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@company.com
SMTP_PASS=your_email_password

# Environment
NODE_ENV=development
PORT=3000
EOF

# Create third-party README
echo "📖 Creating third-party README..."
cat > README_THIRD_PARTY.md << 'EOF'
# FleetChat - Communication Protocol Service

## Overview

FleetChat is a pure communication protocol service that facilitates bidirectional WhatsApp communication between fleet management systems (Samsara, Geotab) and drivers. The system operates as middleware, translating fleet events into WhatsApp messages while maintaining strict boundaries as a communication service only.

## System Architecture

### Core Components
- **Message Relay Engine**: Translates fleet system events into templated WhatsApp messages
- **Response Handler**: Processes driver WhatsApp responses and relays to fleet systems
- **Multi-Tenant System**: Supports unlimited fleet operators with complete isolation
- **Webhook Processing**: Real-time event handling from fleet management systems

### Technology Stack
- **Backend**: Node.js 20, TypeScript, Express.js
- **Database**: PostgreSQL 16 with Drizzle ORM
- **Frontend**: React 18, Vite, TailwindCSS
- **Authentication**: Replit Auth/OpenID Connect
- **Payments**: Stripe integration
- **APIs**: Samsara API, WhatsApp Business API

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Samsara API credentials
- WhatsApp Business API access

### Installation
1. Clone repository
2. Copy `.env.example` to `.env` and configure
3. Install dependencies: `npm install`
4. Initialize database: `npm run db:push`
5. Start development: `npm run dev`

## Documentation Structure

```
docs/
├── FleetChat_System_Overview.md              # High-level system overview
├── FleetChat_Technical_Documentation.md       # Detailed technical specs
├── FleetChat_Multi_Tenant_Architecture.md     # Multi-tenancy design
├── FleetChat_Samsara_Integration_Overview.md  # Samsara API integration
├── FleetChat_API_Endpoints_Documentation.md   # Complete API reference
└── FleetChat_Universal_Fleet_System_Boundaries.md # System boundaries
```

## Key Features

### Communication Protocol Service
- Bidirectional message relay between fleet systems and WhatsApp
- Template-based message generation for fleet events
- Driver response processing and fleet system updates
- Document forwarding and status synchronization

### Multi-Tenant Architecture
- Complete tenant isolation with dedicated credentials
- Independent WhatsApp phone numbers per fleet
- Separate billing and usage tracking
- Scalable infrastructure supporting unlimited tenants

### Integration Capabilities
- **Samsara**: Complete API integration with webhook support
- **WhatsApp Business API**: Full message handling and delivery
- **Stripe**: Automated billing and payment processing
- **Future**: Geotab, Transporeon, and other TMS platforms

### System Boundaries
FleetChat operates as pure communication middleware with strict boundaries:
- ✅ Message relay and translation
- ✅ Driver phone number mapping
- ✅ Communication audit and logging
- ❌ No fleet management functionality duplication
- ❌ No route creation or optimization
- ❌ No telematics or tracking beyond communication

## Demo System

Access the live demo at: [Demo URL]

Features:
- Interactive onboarding process
- Real-time message simulation
- 10 comprehensive use cases
- Professional UI/UX demonstration

## Contact & Support

For questions about this codebase:
- Technical Documentation: See docs/ folder
- Architecture Questions: Review system specifications
- Integration Details: Check API documentation
- Demo Access: Use provided demo links

## License & Usage

This codebase is shared for review and evaluation purposes. Please respect intellectual property and confidentiality requirements.
EOF

# Create sanitized package.json (remove private info)
echo "📦 Creating sanitized package.json..."
cat package.json | jq 'del(.repository.url) | del(.bugs.url) | del(.homepage)' > package-clean.json
mv package-clean.json package.json

# Remove sensitive files if they exist
echo "🧹 Removing sensitive files..."
find . -name "*.key" -delete 2>/dev/null || true
find . -name "*.pem" -delete 2>/dev/null || true
find . -name "*secret*" -delete 2>/dev/null || true
rm -f .env 2>/dev/null || true

# Create documentation index
echo "📚 Creating documentation index..."
cat > DOCUMENTATION_INDEX.md << 'EOF'
# FleetChat Documentation Index

## Core Documentation
1. **README_THIRD_PARTY.md** - Getting started guide for third parties
2. **THIRD_PARTY_ACCESS_GUIDE.md** - Complete access management guide
3. **replit.md** - Project overview and development guidelines

## Technical Specifications
- **FleetChat_System_Overview.md** - High-level system architecture
- **FleetChat_Technical_Documentation.md** - Detailed technical specifications
- **FleetChat_Multi_Tenant_Architecture.md** - Multi-tenancy design patterns
- **FleetChat_API_Endpoints_Documentation.md** - Complete API reference

## Integration Guides
- **FleetChat_Samsara_Integration_Overview.md** - Samsara API integration
- **FleetChat_Universal_Fleet_System_Boundaries.md** - System boundaries
- **FleetChat_Client_Onboarding_Demo_Specification.md** - Onboarding process

## Business Documentation
- **FleetChat_Executive_Summary.md** - Business overview and value proposition
- **FleetChat_Profitability_Optimization_Strategy.md** - Business model analysis
- **Samsara_API_Costs_Summary.md** - Integration cost analysis

## Demo & Examples
- **simple-onboarding-demo.html** - Interactive demo system
- **client-onboarding-demo.html** - Full onboarding demonstration
- **demo/** - Additional demo files and examples

## Code Structure
```
fleetchat/
├── client/           # React frontend application
├── server/           # Node.js backend services
├── shared/           # Shared TypeScript schemas and types
├── docs/             # Complete documentation library
├── demo/             # Demo systems and examples
└── attached_assets/  # Supporting documentation files
```

Use this index to navigate the FleetChat codebase and documentation efficiently.
EOF

# Create code samples directory
echo "💻 Creating code samples..."
mkdir -p code_samples

# Copy key code examples (without sensitive information)
cp shared/schema.ts code_samples/ 2>/dev/null || true
cp server/routes.ts code_samples/ 2>/dev/null || true

# Create architecture diagram in text format
cat > ARCHITECTURE_OVERVIEW.txt << 'EOF'
FleetChat System Architecture

┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Fleet System │    │    FleetChat     │    │   WhatsApp      │
│   (Samsara)    │◄──►│   Middleware     │◄──►│   Business API  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
            ┌───────▼────────┐ ┌────────▼────────┐
            │   PostgreSQL   │ │   Stripe API    │
            │   Database     │ │   (Billing)     │
            └────────────────┘ └─────────────────┘

Communication Flow:
1. Fleet Event → FleetChat → WhatsApp Message → Driver
2. Driver Response → WhatsApp → FleetChat → Fleet System Update
3. Document Upload → WhatsApp → FleetChat → Fleet System Storage
4. Status Update → Driver → FleetChat → Fleet System API

Multi-Tenant Architecture:
- Each fleet operator = separate tenant
- Isolated credentials and phone numbers
- Independent billing and usage tracking
- Shared infrastructure with complete separation
EOF

echo "✅ Third-party access preparation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review generated files for any remaining sensitive information"
echo "2. Test access with a clean environment"
echo "3. Create GitHub repository or share via Replit"
echo "4. Provide third party with README_THIRD_PARTY.md"
echo ""
echo "📁 Generated files:"
echo "   - .gitignore (security filtering)"
echo "   - .env.example (configuration template)"
echo "   - README_THIRD_PARTY.md (third-party guide)"
echo "   - DOCUMENTATION_INDEX.md (navigation guide)"
echo "   - ARCHITECTURE_OVERVIEW.txt (system diagram)"
echo "   - code_samples/ (key code examples)"
echo ""
echo "🔒 Backup created at: ../fleetchat-backup-$(date +%Y%m%d)"