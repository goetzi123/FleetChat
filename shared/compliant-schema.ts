import { z } from "zod";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  jsonb,
  uuid,
  index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// User Roles - Limited to communication service only
export const UserRole = {
  DRIVER: "driver",
  ADMIN: "admin"
} as const;

// Language Codes for message templates
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

// Fleet operators (tenants) table - COMPLIANT
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  serviceTier: varchar("service_tier", { length: 50 }).notNull().default("professional"),
  isActive: boolean("is_active").notNull().default(true),
  
  // Fleet Management System Platform
  platform: varchar("platform", { length: 50 }).default("samsara"), // 'samsara' | 'motive' | 'geotab'
  
  // Samsara Configuration - For message relay only
  samsaraApiToken: jsonb("samsara_api_token"), // encrypted object {encrypted, iv, tag}
  samsaraOrgId: varchar("samsara_org_id", { length: 255 }),
  samsaraWebhookId: varchar("samsara_webhook_id", { length: 255 }),
  samsaraWebhookSecret: jsonb("samsara_webhook_secret"), // encrypted object
  samsaraWebhookUrl: varchar("samsara_webhook_url", { length: 500 }),
  samsaraValidated: boolean("samsara_validated").default(false),
  samsaraValidatedAt: timestamp("samsara_validated_at"),
  webhookEventTypes: jsonb("webhook_event_types").$type<string[]>().default([
    "vehicle.location", "route.started", "route.completed", 
    "driver.dutyStatus", "geofence.enter", "geofence.exit"
  ]),
  
  // Motive Configuration - For message relay only
  motiveApiToken: jsonb("motive_api_token"), // encrypted object {encrypted, iv, tag}
  motiveCompanyId: varchar("motive_company_id", { length: 255 }),
  motiveWebhookId: varchar("motive_webhook_id", { length: 255 }),
  motiveWebhookSecret: jsonb("motive_webhook_secret"), // encrypted object
  motiveWebhookUrl: varchar("motive_webhook_url", { length: 500 }),
  motiveValidated: boolean("motive_validated").default(false),
  motiveValidatedAt: timestamp("motive_validated_at"),
  
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
  complianceSettings: jsonb("compliance_settings").default('{"gdprEnabled":false,"dataRetentionDays":365,"driverConsentRequired":false}'),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Driver phone mapping table - COMPLIANT (Only data FleetChat can store)
export const driverPhoneMappings = pgTable("driver_phone_mappings", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  
  // Fleet system driver identifiers for mapping
  samsaraDriverId: varchar("samsara_driver_id", { length: 255 }),
  motiveDriverId: varchar("motive_driver_id", { length: 255 }),
  geotabDriverId: varchar("geotab_driver_id", { length: 255 }),
  
  // Driver contact information for message routing
  driverName: varchar("driver_name", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  whatsappNumber: varchar("whatsapp_number", { length: 20 }),
  whatsappActive: boolean("whatsapp_active").default(false),
  phoneSource: varchar("phone_source", { length: 50 }).default("fleet_system"), // 'samsara' | 'motive' | 'manual'
  
  // Communication preferences only
  languageCode: varchar("language_code", { length: 3 }).default("ENG"),
  isActive: boolean("is_active").default(true),
  activatedAt: timestamp("activated_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Communication logs table - COMPLIANT (Delivery tracking only)
export const communicationLogs = pgTable("communication_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  driverMappingId: uuid("driver_mapping_id").references(() => driverPhoneMappings.id),
  
  // Message metadata for delivery tracking
  messageId: varchar("message_id", { length: 255 }),
  direction: varchar("direction", { length: 10 }).notNull(), // 'outbound' | 'inbound'
  messageType: varchar("message_type", { length: 50 }).notNull(),
  
  // Delivery status tracking only (not content storage)
  deliveryStatus: varchar("delivery_status", { length: 50 }).default("sent"), // sent, delivered, read, failed
  fleetSystemEventType: varchar("fleet_system_event_type", { length: 100 }),
  
  // Metadata for audit trail
  metadata: jsonb("metadata"),
  errorMessage: text("error_message"),
  
  timestamp: timestamp("timestamp").defaultNow(),
});

// Admin users table for FleetChat administration
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
  pricePerDriver: varchar("price_per_driver", { length: 10 }).notNull(), // Changed to varchar for pricing like "$8"
  minDrivers: varchar("min_drivers", { length: 10 }).notNull().default("1"),
  maxDrivers: varchar("max_drivers", { length: 20 }), // null for unlimited, supports "unlimited"
  features: jsonb("features").default('[]'),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Message template catalog for fleet system events
export const messageTemplates = pgTable("message_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  
  eventType: varchar("event_type", { length: 100 }).notNull(), // route.assigned, geofence.enter, etc.
  platform: varchar("platform", { length: 50 }).notNull(), // samsara, motive, geotab
  languageCode: varchar("language_code", { length: 3 }).notNull().default("ENG"),
  
  templateName: varchar("template_name", { length: 255 }).notNull(),
  templateBody: text("template_body").notNull(),
  templateType: varchar("template_type", { length: 50 }).notNull().default("text"),
  
  // WhatsApp template configuration
  whatsappTemplateId: varchar("whatsapp_template_id", { length: 255 }),
  templateButtons: jsonb("template_buttons"),
  templateParameters: jsonb("template_parameters"),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Backward compatibility exports for removed types
export type User = any;
export type InsertUser = any;
export type Transport = any;
export type InsertTransport = any;

// Type exports for the compliant schema
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

export type DriverPhoneMapping = typeof driverPhoneMappings.$inferSelect;
export type InsertDriverPhoneMapping = typeof driverPhoneMappings.$inferInsert;

export type CommunicationLog = typeof communicationLogs.$inferSelect;
export type InsertCommunicationLog = typeof communicationLogs.$inferInsert;

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;

export type PricingTier = typeof pricingTiers.$inferSelect;
export type InsertPricingTier = typeof pricingTiers.$inferInsert;

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = typeof systemConfig.$inferInsert;

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = typeof messageTemplates.$inferInsert;

// Zod schemas for validation
export const createDriverPhoneMappingSchema = createInsertSchema(driverPhoneMappings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createCommunicationLogSchema = createInsertSchema(communicationLogs).omit({
  id: true,
  timestamp: true,
});

export const createMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateDriverPhoneMapping = z.infer<typeof createDriverPhoneMappingSchema>;
export type CreateCommunicationLog = z.infer<typeof createCommunicationLogSchema>;
export type CreateMessageTemplate = z.infer<typeof createMessageTemplateSchema>;