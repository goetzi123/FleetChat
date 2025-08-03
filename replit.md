# FleetChat Message Broker - Replit Development Guide

## Overview
FleetChat is a communication protocol service designed to relay templated messages between fleet management systems (like Samsara and Geotab) and the WhatsApp Business API. Its core purpose is to act as pure message relay middleware, translating fleet events into WhatsApp messages and forwarding driver responses back to fleet systems without replicating any fleet management functionality. The project aims to provide an essential communication layer for logistics and transport, bridging the gap between existing fleet management tools and drivers' preferred communication channel, WhatsApp. This service enables streamlined, automated communication workflows for transport and yard operations, enhancing efficiency and reducing manual communication overhead in the logistics industry.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Design Principles
- **Pure Message Relay**: FleetChat functions exclusively as a message relay, translating fleet events into WhatsApp messages and forwarding driver responses to fleet systems. It explicitly avoids replicating any fleet management system functionality (e.g., route creation, vehicle tracking, analytics).
- **Unidirectional Event Flow (Fleet to Driver)**: Fleet system events trigger templated WhatsApp messages to drivers.
- **Bidirectional Response Flow (Driver to Fleet)**: Driver WhatsApp responses are processed and relayed back to fleet management systems via API updates.
- **Headless Service**: FleetChat operates as a pure API service with webhook endpoints only, without a dedicated user interface for message handling.
- **Multi-Tenant Architecture**: Designed as a SaaS platform supporting unlimited trucking companies with complete logical separation (isolated credentials, WhatsApp numbers, API configurations, and communication logs per tenant) on shared infrastructure.

### Technical Implementation
- **Message Relay Engine**: Translates fleet system events into templated WhatsApp messages.
- **Response Relay System**: Forwards driver WhatsApp responses (including text, button clicks, location, documents) to fleet systems, linking them to active transports and driver profiles.
- **Phone Number Mapping**: Maps fleet system driver IDs to WhatsApp numbers for message routing.
- **Webhook Relay**: Receives fleet system events and relays them as WhatsApp messages.
- **Message Templates**: Utilizes predefined templates for fleet-system-to-driver communication.
- **Document Relay**: Forwards WhatsApp attachments to fleet systems without local processing.
- **Driver Onboarding**: Direct WhatsApp template message invitations for driver onboarding, eliminating SMS dependencies.
- **Multi-platform Abstraction**: Supports both Samsara and Geotab through a unified interface.
- **Security**: Authorization tokens, webhook signature verification, and encrypted token storage (AES-256-GCM).

### Feature Specifications
- **Transport Communication Workflows**: Automated status prompts, document collection/validation, geolocation tracking at critical points.
- **Yard Communication Workflows**: Gate registration, ETA confirmation, navigation instructions, digital check-out.
- **Document Management**: Handling of digital PODs and load slips, with forwarding to fleet systems.
- **Geolocation & Tracking**: One-off geo-pings at critical points, optional live GPS tracking through external companion, geofencing capabilities.
- **Communication Management**: Unified messaging, automated status notifications, context-aware terminology, message routing and delivery tracking.

### UI/UX Decisions (Admin & Onboarding)
- **Fleet Onboarding UI**: Two-step setup process for fleet system credentials and payment.
- **Public Website**: Professional marketing site for service capabilities.
- **Admin Management System**: Dashboard for usage monitoring and pricing configuration.
- **Customer Token Input System**: React UI for Samsara API token configuration and validation.

## External Dependencies

### Messenger Platform APIs
- WhatsApp Business API

### Fleet Management System Integrations
- Samsara (Primary Fleet Management Platform)
- Geotab (Secondary Fleet Management Platform)
- Transporeon
- Agheera
- project44
- Wanko
- D-Soft (bluecargo)

### Core Services
- Stripe (for payment processing and automated driver-based billing)

### Compliance & Security Related
- Authorization tokens
- Webhook signature verification

## Development Changelog

### Recent Changes
- July 30, 2025. Created comprehensive FleetChat Market & System Summary document - detailed Samsara integration architecture including Webhooks 2.0 event types (PanicButtonPressed, HarshEvent, DeviceLocationInsideGeofence, etc.), extensive WhatsApp Business API template system with 7 template categories, bidirectional message flow examples, system boundaries compliance verification, and complete market positioning for communication protocol service
- July 30, 2025. Created comprehensive Replit Technology Stack Summary document - detailed Replit platform architecture including managed PostgreSQL, OpenID Connect authentication, autoscale deployments, Node.js 20 runtime, React 18 frontend, multi-tenant database design, integrated development environment, automatic scaling, security implementation, and production monitoring capabilities demonstrating how Replit's cloud infrastructure powers FleetChat's communication middleware service
- July 30, 2025. Created Single Customer Operational Deployment Guide - comprehensive production deployment requirements for onboarding one Samsara customer including cloud infrastructure setup, multi-tenant PostgreSQL schema, Samsara API integration with customer-provided credentials, WhatsApp Business API configuration with template approval process, Stripe billing setup, security implementation with AES-256-GCM encryption, 2-day onboarding timeline, and operational monitoring for production-ready communication middleware deployment