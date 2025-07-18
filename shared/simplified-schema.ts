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

// Fleet operators (tenants) table - ONLY credentials and billing
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  serviceTier: varchar("service_tier", { length: 50 }).notNull().default("professional"),
  isActive: boolean("is_active").notNull().default(true),
  
  // Samsara Configuration - ONLY API credentials
  samsaraApiToken: text("samsara_api_token"), // encrypted
  samsaraGroupId: varchar("samsara_group_id", { length: 255 }),
  samsaraWebhookId: varchar("samsara_webhook_id", { length: 255 }),
  samsaraWebhookSecret: text("samsara_webhook_secret"), // encrypted
  samsaraWebhookUrl: varchar("samsara_webhook_url", { length: 500 }),
  webhookEventTypes: jsonb("webhook_event_types").$type<string[]>().default('["RouteStarted","RouteCompleted","LocationUpdate","GeofenceEnter","GeofenceExit"]'),
  
  // WhatsApp Configuration (managed by FleetChat)
  whatsappPhoneNumber: varchar("whatsapp_phone_number", { length: 20 }),
  whatsappPhoneNumberId: varchar("whatsapp_phone_number_id", { length: 255 }),
  whatsappBusinessAccountId: varchar("whatsapp_business_account_id", { length: 255 }),
  
  // Billing Configuration - ONLY payment details
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  billingEmail: varchar("billing_email", { length: 255 }),
  autoPayment: boolean("auto_payment").notNull().default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Driver phone number mapping - ONLY links Samsara drivers to WhatsApp
export const driverMapping = pgTable("driver_mapping", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  
  // Samsara driver identification
  samsaraDriverId: varchar("samsara_driver_id", { length: 255 }).notNull(),
  samsaraDriverName: varchar("samsara_driver_name", { length: 255 }),
  
  // WhatsApp communication details
  whatsappNumber: varchar("whatsapp_number", { length: 20 }).notNull(),
  whatsappActive: boolean("whatsapp_active").default(false),
  phoneSource: varchar("phone_source", { length: 50 }).default("samsara"), // 'samsara' | 'manual'
  
  // Communication status
  lastMessageAt: timestamp("last_message_at"),
  isActive: boolean("is_active").default(true),
  activatedAt: timestamp("activated_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Unique constraint: one mapping per Samsara driver per tenant
  index("idx_driver_mapping_unique").on(table.tenantId, table.samsaraDriverId)
]);

// Communication logs - ONLY for audit and debugging WhatsApp messages
export const communicationLogs = pgTable("communication_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  driverMappingId: uuid("driver_mapping_id").references(() => driverMapping.id),
  
  // Samsara reference (optional - only if message relates to specific route)
  samsaraRouteId: varchar("samsara_route_id", { length: 255 }),
  samsaraEventType: varchar("samsara_event_type", { length: 100 }),
  
  // WhatsApp message details
  whatsappMessageId: varchar("whatsapp_message_id", { length: 255 }),
  direction: varchar("direction", { length: 10 }).notNull(), // inbound, outbound
  messageType: varchar("message_type", { length: 50 }).notNull(), // text, image, document, etc.
  content: text("content"),
  
  // Status tracking
  status: varchar("status", { length: 50 }).default("sent"), // sent, delivered, read, failed
  errorMessage: text("error_message"),
  
  timestamp: timestamp("timestamp").defaultNow(),
});

// Billing records - ONLY for payment tracking
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

// Message template catalog
export const messageTemplates = pgTable("message_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: varchar("event_type", { length: 100 }).notNull(), // route.started, geofence.entered, etc.
  languageCode: varchar("language_code", { length: 3 }).notNull(), // ENG, SPA, FRA, etc.
  templateType: varchar("template_type", { length: 20 }).notNull(), // text, template, interactive
  
  // Message content
  header: varchar("header", { length: 500 }),
  body: text("body").notNull(),
  footer: varchar("footer", { length: 500 }),
  
  // Template metadata
  category: varchar("category", { length: 50 }), // transport, safety, maintenance, etc.
  priority: integer("priority").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  
  createdBy: uuid("created_by").references(() => admins.id),
  updatedBy: uuid("updated_by").references(() => admins.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_template_event_lang").on(table.eventType, table.languageCode)
]);

// Response options for interactive messages
export const responseOptions = pgTable("response_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id").references(() => messageTemplates.id).notNull(),
  
  buttonText: varchar("button_text", { length: 100 }).notNull(),
  buttonPayload: varchar("button_payload", { length: 100 }).notNull(),
  buttonType: varchar("button_type", { length: 20 }).notNull().default("reply"),
  
  sortOrder: integer("sort_order").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  displayConditions: jsonb("display_conditions"),
  
  createdBy: uuid("created_by").references(() => admins.id),
  updatedBy: uuid("updated_by").references(() => admins.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System pricing configuration
export const pricingTiers = pgTable("pricing_tiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  pricePerDriver: decimal("price_per_driver", { precision: 6, scale: 2 }).notNull(),
  minDrivers: integer("min_drivers").notNull().default(1),
  maxDrivers: integer("max_drivers"),
  features: jsonb("features").default('[]'),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System usage analytics
export const usageAnalytics = pgTable("usage_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  activeDrivers: integer("active_drivers").notNull().default(0),
  totalMessages: integer("total_messages").notNull().default(0),
  apiCalls: integer("api_calls").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Database Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  drivers: many(driverMapping),
  communicationLogs: many(communicationLogs),
  billingRecords: many(billingRecords),
  usageAnalytics: many(usageAnalytics),
}));

export const driverMappingRelations = relations(driverMapping, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [driverMapping.tenantId],
    references: [tenants.id],
  }),
  communicationLogs: many(communicationLogs),
}));

export const communicationLogsRelations = relations(communicationLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [communicationLogs.tenantId],
    references: [tenants.id],
  }),
  driver: one(driverMapping, {
    fields: [communicationLogs.driverMappingId],
    references: [driverMapping.id],
  }),
}));

// Type definitions
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

export type DriverMapping = typeof driverMapping.$inferSelect;
export type InsertDriverMapping = typeof driverMapping.$inferInsert;

export type CommunicationLog = typeof communicationLogs.$inferSelect;
export type InsertCommunicationLog = typeof communicationLogs.$inferInsert;

export type BillingRecord = typeof billingRecords.$inferSelect;
export type InsertBillingRecord = typeof billingRecords.$inferInsert;

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = typeof messageTemplates.$inferInsert;

export type ResponseOption = typeof responseOptions.$inferSelect;
export type InsertResponseOption = typeof responseOptions.$inferInsert;

export type PricingTier = typeof pricingTiers.$inferSelect;
export type InsertPricingTier = typeof pricingTiers.$inferInsert;

export type UsageAnalytics = typeof usageAnalytics.$inferSelect;
export type InsertUsageAnalytics = typeof usageAnalytics.$inferInsert;

// Zod schemas for validation
export const insertTenantSchema = createInsertSchema(tenants);
export const insertDriverMappingSchema = createInsertSchema(driverMapping);
export const insertCommunicationLogSchema = createInsertSchema(communicationLogs);
export const insertBillingRecordSchema = createInsertSchema(billingRecords);
export const insertAdminSchema = createInsertSchema(admins);
export const insertMessageTemplateSchema = createInsertSchema(messageTemplates);
export const insertResponseOptionSchema = createInsertSchema(responseOptions);
export const insertPricingTierSchema = createInsertSchema(pricingTiers);
export const insertUsageAnalyticsSchema = createInsertSchema(usageAnalytics);

export type InsertTenantInput = z.infer<typeof insertTenantSchema>;
export type InsertDriverMappingInput = z.infer<typeof insertDriverMappingSchema>;
export type InsertCommunicationLogInput = z.infer<typeof insertCommunicationLogSchema>;
export type InsertBillingRecordInput = z.infer<typeof insertBillingRecordSchema>;
export type InsertAdminInput = z.infer<typeof insertAdminSchema>;
export type InsertMessageTemplateInput = z.infer<typeof insertMessageTemplateSchema>;
export type InsertResponseOptionInput = z.infer<typeof insertResponseOptionSchema>;
export type InsertPricingTierInput = z.infer<typeof insertPricingTierSchema>;
export type InsertUsageAnalyticsInput = z.infer<typeof insertUsageAnalyticsSchema>;