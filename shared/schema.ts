import { z } from "zod";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  decimal,
  jsonb,
  uuid,
  index
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

// Transport Status Enum
export const TransportStatus = {
  PENDING: "pending",
  DISPATCHED: "dispatched", 
  EN_ROUTE: "en_route",
  ARRIVED_PICKUP: "arrived_pickup",
  LOADING: "loading",
  LOADED: "loaded",
  DEPARTED_PICKUP: "departed_pickup",
  ARRIVED_DELIVERY: "arrived_delivery",
  UNLOADING: "unloading",
  DELIVERED: "delivered",
  COMPLETED: "completed",
  CANCELLED: "cancelled"
} as const;

// Document Types
export const DocumentType = {
  POD: "pod",
  LOAD_SLIP: "load_slip",
  DELIVERY_NOTE: "delivery_note",
  INVOICE: "invoice",
  SIGNATURE: "signature",
  PHOTO: "photo"
} as const;

// Workflow Types
export const WorkflowType = {
  FTL: "ftl", // Full Truck Load
  LTL: "ltl", // Less Than Truck Load
  YARD: "yard"
} as const;

// User Roles
export const UserRole = {
  DRIVER: "driver",
  DISPATCHER: "dispatcher",
  YARD_OPERATOR: "yard_operator",
  MANAGER: "manager",
  ADMIN: "admin"
} as const;

// Language Codes
export const LanguageCode = {
  ENGLISH: "ENG",
  SPANISH: "SPA",
  FRENCH: "FRA",
  GERMAN: "GER",
  PORTUGUESE: "POR"
} as const;

// Message Template Types
export const MessageTemplateType = {
  TEXT: "text",
  TEMPLATE: "template",
  INTERACTIVE: "interactive"
} as const;

// Database Tables

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Fleet operators (tenants) table
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  serviceTier: varchar("service_tier", { length: 50 }).notNull().default("professional"), // basic, professional, enterprise
  isActive: boolean("is_active").notNull().default(true),
  
  // Samsara Configuration
  samsaraApiToken: text("samsara_api_token"), // encrypted
  samsaraGroupId: varchar("samsara_group_id", { length: 255 }),
  samsaraWebhookSecret: text("samsara_webhook_secret"), // encrypted
  
  // WhatsApp Configuration (managed by FleetChat)
  whatsappPhoneNumber: varchar("whatsapp_phone_number", { length: 20 }),
  whatsappPhoneNumberId: varchar("whatsapp_phone_number_id", { length: 255 }),
  whatsappBusinessAccountId: varchar("whatsapp_business_account_id", { length: 255 }),
  
  // Billing Configuration
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  billingEmail: varchar("billing_email", { length: 255 }),
  autoPayment: boolean("auto_payment").notNull().default(true),
  
  // Service Settings
  messageTemplates: jsonb("message_templates").default('{}'),
  complianceSettings: jsonb("compliance_settings").default('{"gdprEnabled":true,"dataRetentionDays":365,"driverConsentRequired":true}'),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Users table (fleet administrators and drivers)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  email: varchar("email", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  role: varchar("role", { length: 50 }).notNull(),
  isAnonymous: boolean("is_anonymous").default(false),
  pseudoId: varchar("pseudo_id", { length: 100 }), // For driver anonymity
  whatsappNumber: varchar("whatsapp_number", { length: 20 }), // WhatsApp Business API phone number
  samsaraDriverId: varchar("samsara_driver_id", { length: 255 }), // Link to Samsara driver
  hasConsented: boolean("has_consented").default(false), // GDPR consent
  consentedAt: timestamp("consented_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transports table
export const transports = pgTable("transports", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  externalId: varchar("external_id", { length: 255 }), // TMS reference
  driverId: uuid("driver_id").references(() => users.id),
  dispatcherId: uuid("dispatcher_id").references(() => users.id),
  status: varchar("status", { length: 50 }).notNull(),
  workflowType: varchar("workflow_type", { length: 50 }).notNull(),
  
  // Pickup details
  pickupLocation: varchar("pickup_location", { length: 500 }).notNull(),
  pickupAddress: text("pickup_address"),
  pickupLat: decimal("pickup_lat", { precision: 10, scale: 7 }),
  pickupLng: decimal("pickup_lng", { precision: 10, scale: 7 }),
  pickupEta: timestamp("pickup_eta"),
  pickupActual: timestamp("pickup_actual"),
  
  // Delivery details
  deliveryLocation: varchar("delivery_location", { length: 500 }).notNull(),
  deliveryAddress: text("delivery_address"),
  deliveryLat: decimal("delivery_lat", { precision: 10, scale: 7 }),
  deliveryLng: decimal("delivery_lng", { precision: 10, scale: 7 }),
  deliveryEta: timestamp("delivery_eta"),
  deliveryActual: timestamp("delivery_actual"),
  
  // Load details
  loadReference: varchar("load_reference", { length: 255 }),
  loadDescription: text("load_description"),
  loadWeight: decimal("load_weight", { precision: 10, scale: 2 }),
  loadValue: decimal("load_value", { precision: 10, scale: 2 }),
  
  // Samsara Integration
  samsaraRouteId: varchar("samsara_route_id", { length: 255 }),
  samsaraVehicleId: varchar("samsara_vehicle_id", { length: 255 }),
  samsaraDriverId: varchar("samsara_driver_id", { length: 255 }),
  
  // Metadata
  instructions: text("instructions"),
  priority: integer("priority").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Status updates table
export const statusUpdates = pgTable("status_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  transportId: uuid("transport_id").references(() => transports.id).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  location: varchar("location", { length: 500 }),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  transportId: uuid("transport_id").references(() => transports.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  isApproved: boolean("is_approved").default(false),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Location tracking table
export const locationTracking = pgTable("location_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  transportId: uuid("transport_id").references(() => transports.id).notNull(),
  driverId: uuid("driver_id").references(() => users.id).notNull(),
  lat: decimal("lat", { precision: 10, scale: 7 }).notNull(),
  lng: decimal("lng", { precision: 10, scale: 7 }).notNull(),
  accuracy: decimal("accuracy", { precision: 6, scale: 2 }),
  speed: decimal("speed", { precision: 6, scale: 2 }),
  heading: decimal("heading", { precision: 6, scale: 2 }),
  isGeofenced: boolean("is_geofenced").default(false),
  geofenceType: varchar("geofence_type", { length: 50 }),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Yard operations table
export const yardOperations = pgTable("yard_operations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  transportId: uuid("transport_id").references(() => transports.id).notNull(),
  yardLocation: varchar("yard_location", { length: 500 }).notNull(),
  operationType: varchar("operation_type", { length: 50 }).notNull(), // check_in, call_off, check_out
  operatorId: uuid("operator_id").references(() => users.id),
  driverId: uuid("driver_id").references(() => users.id),
  instructions: text("instructions"),
  qrCode: varchar("qr_code", { length: 255 }),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// TMS integrations table
export const tmsIntegrations = pgTable("tms_integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  transportId: uuid("transport_id").references(() => transports.id),
  platform: varchar("platform", { length: 50 }).notNull(), // samsara, transporeon, etc.
  operation: varchar("operation", { length: 100 }).notNull(), // create, update, status_update, etc.
  payload: jsonb("payload"),
  response: jsonb("response"),
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// WhatsApp messages table for audit and debugging
export const whatsappMessages = pgTable("whatsapp_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  transportId: uuid("transport_id").references(() => transports.id),
  driverId: uuid("driver_id").references(() => users.id),
  messageId: varchar("message_id", { length: 255 }),
  direction: varchar("direction", { length: 10 }).notNull(), // inbound, outbound
  messageType: varchar("message_type", { length: 50 }).notNull(), // text, image, document, etc.
  content: text("content"),
  metadata: jsonb("metadata"),
  status: varchar("status", { length: 50 }).default("sent"), // sent, delivered, read, failed
  timestamp: timestamp("timestamp").defaultNow(),
});

// Billing records table
export const billingRecords = pgTable("billing_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  billingPeriod: varchar("billing_period", { length: 7 }).notNull(), // YYYY-MM format
  activeDrivers: integer("active_drivers").notNull(),
  pricePerDriver: decimal("price_per_driver", { precision: 6, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, paid, failed
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin users table
export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  permissions: jsonb("permissions").default('{"canManagePricing":true,"canViewReports":true,"canManageSystem":true}'),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System pricing configuration table
export const pricingTiers = pgTable("pricing_tiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  pricePerDriver: decimal("price_per_driver", { precision: 6, scale: 2 }).notNull(),
  minDrivers: integer("min_drivers").notNull().default(1),
  maxDrivers: integer("max_drivers"), // null for unlimited
  features: jsonb("features").default('[]'),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System usage analytics table
export const usageAnalytics = pgTable("usage_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  activeDrivers: integer("active_drivers").notNull().default(0),
  totalMessages: integer("total_messages").notNull().default(0),
  totalTransports: integer("total_transports").notNull().default(0),
  totalDocuments: integer("total_documents").notNull().default(0),
  apiCalls: integer("api_calls").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// System configuration table
export const systemConfig = pgTable("system_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: uuid("updated_by").references(() => admins.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Message template catalog - stores template definitions for each event type
export const messageTemplates = pgTable("message_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: varchar("event_type", { length: 100 }).notNull(), // route.assigned, geofence.enter, etc.
  languageCode: varchar("language_code", { length: 3 }).notNull(), // ENG, SPA, FRA, etc.
  templateType: varchar("template_type", { length: 20 }).notNull(), // text, template, interactive
  
  // Message content
  header: varchar("header", { length: 500 }),
  body: text("body").notNull(),
  footer: varchar("footer", { length: 500 }),
  
  // Template metadata
  category: varchar("category", { length: 50 }), // transport, safety, maintenance, etc.
  priority: integer("priority").notNull().default(1), // 1=highest, 5=lowest
  isActive: boolean("is_active").notNull().default(true),
  
  // Audit fields
  createdBy: uuid("created_by").references(() => admins.id),
  updatedBy: uuid("updated_by").references(() => admins.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Unique constraint: one template per event type per language
  index("idx_template_event_lang").on(table.eventType, table.languageCode)
]);

// Response options catalog - stores predefined response buttons for each template
export const responseOptions = pgTable("response_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id").references(() => messageTemplates.id).notNull(),
  
  // Response details
  buttonText: varchar("button_text", { length: 100 }).notNull(),
  buttonPayload: varchar("button_payload", { length: 100 }).notNull(), // acknowledge_route, pickup_confirmed, etc.
  buttonType: varchar("button_type", { length: 20 }).notNull().default("reply"), // reply, call, url
  
  // Response behavior
  sortOrder: integer("sort_order").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  
  // Conditional display (JSON conditions when to show this option)
  displayConditions: jsonb("display_conditions"), // e.g., {"geofenceType": "pickup_location"}
  
  // Audit fields
  createdBy: uuid("created_by").references(() => admins.id),
  updatedBy: uuid("updated_by").references(() => admins.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Message template variables - defines dynamic variables that can be used in templates
export const templateVariables = pgTable("template_variables", {
  id: uuid("id").primaryKey().defaultRandom(),
  variableName: varchar("variable_name", { length: 100 }).notNull(), // {{pickup_location}}, {{delivery_time}}, etc.
  eventType: varchar("event_type", { length: 100 }).notNull(),
  dataPath: varchar("data_path", { length: 255 }).notNull(), // JSON path to extract from event data
  defaultValue: varchar("default_value", { length: 255 }),
  description: text("description"),
  isRequired: boolean("is_required").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Unique constraint: one variable per name per event type
  index("idx_variable_name_event").on(table.variableName, table.eventType)
]);

// Base types for compatibility
export interface User {
  id: string;
  tenantId: string; // Multi-tenant isolation
  email?: string;
  name: string;
  phone?: string;
  role: string;
  isAnonymous?: boolean;
  pseudoId?: string; // For driver anonymity
  whatsappNumber?: string; // WhatsApp Business API phone number
  createdAt: Date;
  updatedAt: Date;
}

export interface Transport {
  id: string;
  tenantId: string; // Multi-tenant isolation
  externalId?: string; // TMS reference
  driverId?: string;
  dispatcherId?: string;
  status: string;
  workflowType: string;
  
  // Pickup details
  pickupLocation: string;
  pickupAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  pickupEta?: Date;
  pickupActual?: Date;
  
  // Delivery details
  deliveryLocation: string;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryEta?: Date;
  deliveryActual?: Date;
  
  // Load details
  loadReference?: string;
  loadDescription?: string;
  loadWeight?: number;
  loadValue?: number;
  
  // Samsara Integration
  samsaraRouteId?: string;
  samsaraVehicleId?: string;
  samsaraDriverId?: string;
  
  // Metadata
  instructions?: string;
  priority?: number;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StatusUpdate {
  id: string;
  tenantId: string; // Multi-tenant isolation
  transportId: string;
  status: string;
  location?: string;
  lat?: number;
  lng?: number;
  notes?: string;
  timestamp: Date;
  createdBy?: string;
}

export interface Document {
  id: string;
  tenantId: string; // Multi-tenant isolation
  transportId: string;
  type: string;
  filename: string;
  originalName?: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  isApproved?: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
  metadata?: string; // JSON string for additional data
  uploadedBy?: string;
  createdAt: Date;
}

export interface LocationTracking {
  id: string;
  tenantId: string; // Multi-tenant isolation
  transportId: string;
  driverId: string;
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  isGeofenced?: boolean;
  geofenceType?: string; // pickup, delivery, yard
  timestamp: Date;
}

export interface YardOperation {
  id: string;
  tenantId: string; // Multi-tenant isolation
  transportId: string;
  yardLocation: string;
  operationType: string; // check_in, call_off, check_out
  operatorId?: string;
  driverId?: string;
  instructions?: string;
  qrCode?: string;
  completedAt?: Date;
  createdAt: Date;
}

export interface TmsIntegration {
  id: string;
  tenantId: string; // Multi-tenant isolation
  transportId: string;
  platform: string; // samsara, transporeon, agheera, project44, wanko, d_soft
  operation: string; // create, update, status_update, webhook_received
  payload?: string; // JSON string
  response?: string; // JSON string
  success?: boolean;
  errorMessage?: string;
  timestamp: Date;
}

// Tenant configuration interface
export interface Tenant {
  id: string;
  companyName: string;
  contactEmail: string;
  serviceTier: string; // basic, professional, enterprise
  isActive: boolean;
  
  // Samsara Configuration
  samsaraApiToken?: string; // encrypted
  samsaraGroupId?: string;
  samsaraWebhookSecret?: string; // encrypted
  
  // WhatsApp Configuration  
  whatsappPhoneNumber: string;
  whatsappPhoneNumberId: string;
  whatsappBusinessAccountId: string;
  
  // Service Settings
  messageTemplates: string;
  complianceSettings: {
    gdprEnabled: boolean;
    dataRetentionDays: number;
    driverConsentRequired: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// Admin interfaces
export interface Admin {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  isActive: boolean;
  permissions: {
    canManagePricing: boolean;
    canViewReports: boolean;
    canManageSystem: boolean;
  };
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PricingTier {
  id: string;
  name: string;
  description?: string;
  pricePerDriver: number;
  minDrivers: number;
  maxDrivers?: number;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageAnalytics {
  id: string;
  tenantId: string;
  date: string; // YYYY-MM-DD format
  activeDrivers: number;
  totalMessages: number;
  totalTransports: number;
  totalDocuments: number;
  apiCalls: number;
  createdAt: Date;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedBy?: string;
  updatedAt: Date;
}

// Message Template Interfaces
export interface MessageTemplate {
  id: string;
  eventType: string;
  languageCode: string;
  templateType: string;
  header?: string;
  body: string;
  footer?: string;
  category?: string;
  priority: number;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResponseOption {
  id: string;
  templateId: string;
  buttonText: string;
  buttonPayload: string;
  buttonType: string;
  sortOrder: number;
  isActive: boolean;
  displayConditions?: any; // JSON object
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  id: string;
  variableName: string;
  eventType: string;
  dataPath: string;
  defaultValue?: string;
  description?: string;
  isRequired: boolean;
  createdAt: Date;
}

export interface BillingRecord {
  id: string;
  tenantId: string;
  billingPeriod: string; // YYYY-MM format
  activeDrivers: number;
  pricePerDriver: number;
  totalAmount: number;
  stripeInvoiceId?: string;
  status: string; // pending, paid, failed
  paidAt?: Date;
  createdAt: Date;
}

// Insert types (without auto-generated fields)
export type InsertUser = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertTransport = Omit<Transport, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertStatusUpdate = Omit<StatusUpdate, 'id' | 'timestamp'>;
export type InsertDocument = Omit<Document, 'id' | 'createdAt'>;
export type InsertLocationTracking = Omit<LocationTracking, 'id' | 'timestamp'>;
export type InsertYardOperation = Omit<YardOperation, 'id' | 'createdAt'>;
export type InsertTmsIntegration = Omit<TmsIntegration, 'id' | 'timestamp'>;
export type InsertTenant = Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertAdmin = Omit<Admin, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertPricingTier = Omit<PricingTier, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertUsageAnalytics = Omit<UsageAnalytics, 'id' | 'createdAt'>;
export type InsertSystemConfig = Omit<SystemConfig, 'id' | 'updatedAt'>;
export type InsertBillingRecord = Omit<BillingRecord, 'id' | 'createdAt'>;

// Admin database tables
export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  permissions: jsonb("permissions").notNull().default({
    canManagePricing: true,
    canViewReports: true,
    canManageSystem: true,
  }),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pricingTiers = pgTable("pricing_tiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  pricePerDriver: decimal("price_per_driver", { precision: 10, scale: 2 }).notNull(),
  minDrivers: integer("min_drivers").notNull().default(1),
  maxDrivers: integer("max_drivers"),
  features: jsonb("features").notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usageAnalytics = pgTable("usage_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  activeDrivers: integer("active_drivers").notNull().default(0),
  totalMessages: integer("total_messages").notNull().default(0),
  totalTransports: integer("total_transports").notNull().default(0),
  totalDocuments: integer("total_documents").notNull().default(0),
  apiCalls: integer("api_calls").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemConfig = pgTable("system_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: varchar("updated_by").references(() => admins.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const billingRecords = pgTable("billing_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  billingPeriod: varchar("billing_period", { length: 7 }).notNull(), // YYYY-MM format
  activeDrivers: integer("active_drivers").notNull(),
  pricePerDriver: decimal("price_per_driver", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  stripeInvoiceId: varchar("stripe_invoice_id"),
  status: varchar("status").notNull().default("pending"), // pending, paid, failed
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin sessions table for session storage
export const adminSessions = pgTable("admin_sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
}, (table) => [
  index("IDX_admin_session_expire").on(table.expire),
]);

// Validation schemas
export const createUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum([UserRole.DRIVER, UserRole.DISPATCHER, UserRole.YARD_OPERATOR, UserRole.MANAGER]),
  isAnonymous: z.boolean().default(false),
  pseudoId: z.string().optional(),
  whatsappNumber: z.string().optional()
});

export const createTransportSchema = z.object({
  externalId: z.string().optional(),
  driverId: z.string().optional(),
  dispatcherId: z.string().optional(),
  status: z.string().default(TransportStatus.PENDING),
  workflowType: z.enum([WorkflowType.FTL, WorkflowType.LTL, WorkflowType.YARD]).default(WorkflowType.FTL),
  pickupLocation: z.string().min(1),
  pickupAddress: z.string().optional(),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  pickupEta: z.string().datetime().optional(),
  deliveryLocation: z.string().min(1),
  deliveryAddress: z.string().optional(),
  deliveryLat: z.number().optional(),
  deliveryLng: z.number().optional(),
  deliveryEta: z.string().datetime().optional(),
  loadReference: z.string().optional(),
  loadDescription: z.string().optional(),
  loadWeight: z.number().optional(),
  loadValue: z.number().optional(),
  instructions: z.string().optional(),
  priority: z.number().default(0),
  isActive: z.boolean().default(true)
});

export const transportStatusUpdateSchema = z.object({
  status: z.enum([
    TransportStatus.PENDING,
    TransportStatus.DISPATCHED,
    TransportStatus.EN_ROUTE,
    TransportStatus.ARRIVED_PICKUP,
    TransportStatus.LOADING,
    TransportStatus.LOADED,
    TransportStatus.DEPARTED_PICKUP,
    TransportStatus.ARRIVED_DELIVERY,
    TransportStatus.UNLOADING,
    TransportStatus.DELIVERED,
    TransportStatus.COMPLETED,
    TransportStatus.CANCELLED
  ] as const),
  location: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  notes: z.string().optional()
});

export const locationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional()
});

export const documentUploadSchema = z.object({
  type: z.enum([
    DocumentType.POD,
    DocumentType.LOAD_SLIP,
    DocumentType.DELIVERY_NOTE,
    DocumentType.INVOICE,
    DocumentType.SIGNATURE,
    DocumentType.PHOTO
  ] as const),
  filename: z.string(),
  originalName: z.string().optional(),
  fileUrl: z.string().url(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.string().optional()
});

export const yardOperationSchema = z.object({
  transportId: z.string(),
  yardLocation: z.string().min(1),
  operationType: z.enum(["check_in", "call_off", "check_out"]),
  operatorId: z.string().optional(),
  driverId: z.string().optional(),
  instructions: z.string().optional(),
  qrCode: z.string().optional()
});

// Fleet onboarding schemas
export const fleetSetupSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactEmail: z.string().email("Valid email is required"),
  serviceTier: z.enum(["basic", "professional", "enterprise"]).default("professional"),
  samsaraApiToken: z.string().min(1, "Samsara API token is required"),
  samsaraGroupId: z.string().optional(),
  billingEmail: z.string().email("Valid billing email is required"),
  autoPayment: z.boolean().default(true),
});

export const driverOnboardingSchema = z.object({
  name: z.string().min(1, "Driver name is required"),
  phone: z.string().min(1, "Phone number is required"),
  samsaraDriverId: z.string().min(1, "Samsara driver ID is required"),
  hasConsented: z.boolean().default(false),
});

// Message Template Insert Schemas
export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResponseOptionSchema = createInsertSchema(responseOptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTemplateVariableSchema = createInsertSchema(templateVariables).omit({
  id: true,
  createdAt: true,
});