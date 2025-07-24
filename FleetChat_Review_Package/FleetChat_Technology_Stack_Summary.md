# FleetChat Technology Stack Summary
*Date: July 19, 2025*
*Status: Production-Ready Architecture*

## Overview

FleetChat is built as a modern, scalable communication middleware platform using enterprise-grade technologies to provide reliable bidirectional message relay between fleet management systems and WhatsApp Business API.

## Core Technology Architecture

### **Backend Technologies**

#### **Runtime & Language**
- **Node.js 20**: Primary runtime environment for server-side JavaScript execution
- **TypeScript**: Type-safe development with full static type checking
- **Express.js**: Web application framework for REST API endpoints and middleware

#### **Database & Persistence**
- **PostgreSQL 16**: Primary relational database for production data storage
- **Drizzle ORM**: Type-safe database ORM with SQL-like query building
- **Drizzle Kit**: Database migration and schema management tools
- **Connection Pooling**: Managed database connections for high availability

#### **Authentication & Security**
- **OpenID Connect**: Standard OAuth 2.0 authentication protocol
- **Replit Auth**: Integrated authentication provider for seamless user management
- **Express Session**: Secure session management with database storage
- **Passport.js**: Authentication middleware with multiple strategy support
- **bcrypt**: Password hashing and security utilities

### **Frontend Technologies**

#### **Client Framework**
- **React 18**: Modern component-based UI framework
- **Vite**: Fast build tool with hot module replacement for development
- **Wouter**: Lightweight client-side routing library
- **TypeScript**: Full-stack type safety from frontend to backend

#### **UI & Styling**
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **shadcn/ui**: Production-ready React component library
- **Lucide React**: Modern icon library for consistent visual elements
- **PostCSS**: CSS processing with autoprefixer for browser compatibility

#### **State Management & Data**
- **TanStack React Query**: Server state management with caching and synchronization
- **React Hook Form**: Performant forms with minimal re-renders
- **Zod**: TypeScript-first schema validation library
- **@hookform/resolvers**: Form validation resolvers for React Hook Form

### **Integration Technologies**

#### **Fleet Management APIs**
- **Samsara API**: Primary fleet management system integration
  - Vehicle and driver data access
  - Real-time event webhook processing
  - Document management integration
  - GPS and telematics data relay
- **Geotab API**: Secondary fleet system support with unified provider interface
- **Universal Fleet Provider Architecture**: Abstraction layer for multiple TMS systems

#### **Communication APIs**
- **WhatsApp Business API**: Primary messaging platform integration
  - Message template management
  - Bidirectional message handling
  - Document and media relay
  - Webhook event processing
- **Message Broker System**: Event-driven communication architecture

#### **Payment Processing**
- **Stripe API**: Payment processing and subscription management
  - Customer and subscription lifecycle management
  - Automated billing based on active driver usage
  - Webhook event handling for payment notifications
- **@stripe/stripe-js & @stripe/react-stripe-js**: Frontend payment components

### **Database Architecture**

#### **Schema Design**
- **Multi-tenant Architecture**: Complete tenant isolation with row-level security
- **Driver Phone Mapping**: Secure driver ID to WhatsApp number relationships
- **Fleet System Credentials**: Encrypted API tokens and configuration storage
- **Message Templates**: Database-driven message content with variable substitution
- **Billing Records**: Usage tracking and payment history management
- **Session Storage**: Secure user session persistence

#### **Database Features**
- **ACID Compliance**: Full transaction support for data integrity
- **Connection Pooling**: Optimized database connection management
- **Migration System**: Version-controlled schema evolution
- **Backup & Recovery**: Automated data protection strategies

### **Development & DevOps Technologies**

#### **Development Tools**
- **tsx**: TypeScript execution for development and production
- **Concurrently**: Parallel script execution for development workflows
- **Drizzle Studio**: Visual database management and query interface

#### **Code Quality & Type Safety**
- **TypeScript Strict Mode**: Maximum type safety enforcement
- **Drizzle Zod Integration**: Database schema to TypeScript type generation
- **ESLint**: Code quality and consistency enforcement
- **Type-safe API Design**: End-to-end type safety from database to frontend

#### **Deployment & Infrastructure**
- **Replit Deployments**: Managed hosting with automatic scaling
- **Static Site Deployment**: Optimized frontend asset delivery
- **Environment Management**: Secure configuration and secrets management
- **Health Monitoring**: Built-in application health checks

### **External Service Integrations**

#### **Fleet Management Systems**
```typescript
interface FleetProvider {
  // Unified interface for all fleet systems
  getDrivers(): Promise<Driver[]>
  processWebhook(event: WebhookEvent): Promise<void>
  updateDriverStatus(driverId: string, status: DriverStatus): Promise<void>
}
```

#### **Messaging Platform**
- **WhatsApp Business API Management**: Multi-tenant phone number provisioning
- **Template Message System**: Predefined message templates with variable substitution
- **Media Handling**: Document, image, and location message processing
- **Delivery Status Tracking**: Message delivery confirmation and failure handling

#### **Payment & Billing**
- **Stripe Integration**: Complete payment lifecycle management
- **Usage-based Billing**: Automated invoicing based on active driver metrics
- **Enterprise Billing**: Volume discounts and custom pricing tiers
- **Payment Method Management**: Secure customer payment information storage

## Architecture Patterns

### **Microservices Communication**
- **Event-driven Architecture**: Asynchronous message processing between services
- **API Gateway Pattern**: Centralized request routing and authentication
- **Service Isolation**: Independent scaling and deployment of system components

### **Data Flow Architecture**
```
Fleet System → FleetChat Event Processing → WhatsApp Message → Driver
Driver Response → FleetChat Processing → Fleet System API Update
```

### **Multi-tenant Design**
- **Tenant Isolation**: Complete data separation between fleet operators
- **Shared Infrastructure**: Optimized resource utilization across tenants
- **Scalable Architecture**: Support for unlimited fleet operator onboarding

## Security Technologies

### **Authentication & Authorization**
- **OAuth 2.0 / OpenID Connect**: Industry-standard authentication protocols
- **Session Management**: Secure session tokens with automatic expiration
- **API Key Management**: Encrypted storage of third-party service credentials
- **Webhook Verification**: Signature validation for external service events

### **Data Protection**
- **Encryption at Rest**: Database encryption for sensitive information
- **Encryption in Transit**: TLS/SSL for all network communications
- **PII Handling**: Minimal personal data storage with GDPR considerations
- **Audit Logging**: Comprehensive activity tracking for compliance

## Performance & Scalability

### **Optimization Technologies**
- **Database Connection Pooling**: Efficient database resource management
- **React Query Caching**: Intelligent client-side data caching
- **Vite Build Optimization**: Fast development and production builds
- **Lazy Loading**: Component-level code splitting for faster initial loads

### **Monitoring & Observability**
- **Health Check Endpoints**: System health monitoring for uptime verification
- **Error Tracking**: Comprehensive error logging and alerting
- **Performance Metrics**: Application performance monitoring and optimization
- **Usage Analytics**: Business intelligence for operational insights

## Production Deployment Stack

### **Runtime Environment**
- **Node.js 20**: LTS runtime with production optimizations
- **PostgreSQL 16**: Enterprise-grade database with high availability
- **Replit Infrastructure**: Managed hosting with automatic scaling and monitoring

### **Configuration Management**
- **Environment Variables**: Secure configuration through environment-based settings
- **Secrets Management**: Encrypted storage of API keys and sensitive configuration
- **Multi-environment Support**: Development, staging, and production configurations

### **Backup & Recovery**
- **Database Backups**: Automated daily backups with point-in-time recovery
- **Configuration Backups**: Version-controlled infrastructure configuration
- **Disaster Recovery**: Multi-region backup strategies for business continuity

## Development Workflow Technologies

### **Version Control & Collaboration**
- **Git**: Distributed version control with branch-based development
- **Replit Integration**: Built-in development environment with real-time collaboration
- **Automated Testing**: Unit and integration test frameworks for quality assurance

### **Build & Deployment Pipeline**
- **Vite Build System**: Fast, optimized production builds
- **TypeScript Compilation**: Type checking and JavaScript generation
- **Asset Optimization**: Minification and compression for production deployment
- **Continuous Deployment**: Automated deployment pipeline with health checks

## Summary

FleetChat leverages a modern, production-ready technology stack designed for:

- **Scalability**: Multi-tenant architecture supporting unlimited fleet operators
- **Reliability**: Enterprise-grade databases and managed hosting infrastructure
- **Security**: Industry-standard authentication and data protection protocols
- **Performance**: Optimized frontend and backend with intelligent caching
- **Maintainability**: TypeScript throughout the stack with comprehensive type safety
- **Integration**: Flexible architecture supporting multiple fleet management systems

The technology choices prioritize developer productivity, system reliability, and business scalability while maintaining strict compliance with FleetChat's communication middleware boundaries.