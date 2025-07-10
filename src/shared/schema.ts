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
  index,
  unique
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Enums
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

export const DocumentType = {
  POD: "pod",
  LOAD_SLIP: "load_slip",
  DELIVERY_NOTE: "delivery_note",
  INVOICE: "invoice",
  SIGNATURE: "signature",
  PHOTO: "photo"
} as const;

export const WorkflowType = {
  FTL: "ftl",
  LTL: "ltl",
  YARD: "yard"
} as const;

export const UserRole = {
  DRIVER: "driver",
  DISPATCHER: "dispatcher",
  YARD_OPERATOR: "yard_operator",
  MANAGER: "manager",
  ADMIN: "admin"
} as const;

export const LanguageCode = {
  ENGLISH: "ENG",
  SPANISH: "SPA",
  FRENCH: "FRA",
  GERMAN: "GER",
  PORTUGUESE: "POR"
} as const;

export const MessageTemplateType = {
  TEXT: "text",
  TEMPLATE: "template",
  INTERACTIVE: "interactive"
} as const;

// Database Tables

// Session storage for authentication
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
}, (table) => [
  index("idx_session_expire").on(table.expire)
]);

// Multi-tenant organization table
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  serviceTier: varchar("service_tier", { length: 50 }).notNull().default("professional"),
  isActive: boolean("is_active").notNull().default(true),
  
  // Samsara Integration
  samsaraApiToken: text("samsara_api_token"),
  samsaraGroupId: varchar("samsara_group_id", { length: 255 }),
  samsaraWebhookSecret: text("samsara_webhook_secret"),
  
  // WhatsApp Configuration
  whatsappPhoneNumber: varchar("whatsapp_phone_number", { length: 20 }),
  whatsappPhoneNumberId: varchar("whatsapp_phone_number_id", { length: 255 }),
  whatsappBusinessAccountId: varchar("whatsapp_business_account_id", { length: 255 }),
  
  // Billing
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  billingEmail: varchar("billing_email", { length: 255 }),
  autoPayment: boolean("auto_payment").notNull().default(true),
  
  // Settings
  messageTemplates: jsonb("message_templates").default('{}'),
  complianceSettings: jsonb("compliance_settings").default('{"gdprEnabled":true,"dataRetentionDays":365,"driverConsentRequired":true}'),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Users (drivers, dispatchers, managers)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  email: varchar("email", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  role: varchar("role", { length: 50 }).notNull(),
  isAnonymous: boolean("is_anonymous").default(false),
  pseudoId: varchar("pseudo_id", { length: 100 }),
  whatsappNumber: varchar("whatsapp_number", { length: 20 }),
  
  // Samsara Integration
  samsaraDriverId: varchar("samsara_driver_id", { length: 255 }),
  samsaraVehicleId: varchar("samsara_vehicle_id", { length: 255 }),
  
  // Metadata
  isActive: boolean("is_active").default(true),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_users_tenant_role").on(table.tenantId, table.role),
  index("idx_users_phone").on(table.phone),
  unique("uk_users_email_tenant").on(table.email, table.tenantId),
]);

// Transport orders
export const transports = pgTable("transports", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  externalId: varchar("external_id", { length: 255 }),
  driverId: uuid("driver_id").references(() => users.id),
  dispatcherId: uuid("dispatcher_id").references(() => users.id),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  workflowType: varchar("workflow_type", { length: 50 }).notNull().default("ftl"),
  
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
  loadValue: decimal("load_value", { precision: 12, scale: 2 }),
  
  // Samsara Integration
  samsaraRouteId: varchar("samsara_route_id", { length: 255 }),
  samsaraVehicleId: varchar("samsara_vehicle_id", { length: 255 }),
  samsaraDriverId: varchar("samsara_driver_id", { length: 255 }),
  
  // Metadata
  instructions: text("instructions"),
  priority: integer("priority").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_transports_tenant_status").on(table.tenantId, table.status),
  index("idx_transports_driver").on(table.driverId),
  index("idx_transports_external_id").on(table.externalId),
]);

// Transport status updates
export const statusUpdates = pgTable("status_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  transportId: uuid("transport_id").references(() => transports.id, { onDelete: "cascade" }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  location: varchar("location", { length: 500 }),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("idx_status_updates_transport").on(table.transportId),
  index("idx_status_updates_timestamp").on(table.timestamp),
]);

// Documents and attachments
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  transportId: uuid("transport_id").references(() => transports.id, { onDelete: "cascade" }).notNull(),
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
}, (table) => [
  index("idx_documents_transport").on(table.transportId),
  index("idx_documents_type").on(table.type),
]);

// Location tracking
export const locationTracking = pgTable("location_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  transportId: uuid("transport_id").references(() => transports.id, { onDelete: "cascade" }).notNull(),
  driverId: uuid("driver_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  lat: decimal("lat", { precision: 10, scale: 7 }).notNull(),
  lng: decimal("lng", { precision: 10, scale: 7 }).notNull(),
  accuracy: decimal("accuracy", { precision: 6, scale: 2 }),
  speed: decimal("speed", { precision: 6, scale: 2 }),
  heading: decimal("heading", { precision: 6, scale: 2 }),
  isGeofenced: boolean("is_geofenced").default(false),
  geofenceType: varchar("geofence_type", { length: 50 }),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("idx_location_tracking_transport").on(table.transportId),
  index("idx_location_tracking_driver").on(table.driverId),
  index("idx_location_tracking_timestamp").on(table.timestamp),
]);

// WhatsApp messages audit
export const whatsappMessages = pgTable("whatsapp_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  transportId: uuid("transport_id").references(() => transports.id, { onDelete: "cascade" }),
  driverId: uuid("driver_id").references(() => users.id),
  messageId: varchar("message_id", { length: 255 }),
  direction: varchar("direction", { length: 10 }).notNull(),
  messageType: varchar("message_type", { length: 50 }).notNull(),
  content: text("content"),
  metadata: jsonb("metadata"),
  status: varchar("status", { length: 50 }).default("sent"),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("idx_whatsapp_messages_transport").on(table.transportId),
  index("idx_whatsapp_messages_driver").on(table.driverId),
  index("idx_whatsapp_messages_timestamp").on(table.timestamp),
]);

// Message templates
export const messageTemplates = pgTable("message_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  languageCode: varchar("language_code", { length: 3 }).notNull(),
  templateType: varchar("template_type", { length: 20 }).notNull(),
  header: varchar("header", { length: 500 }),
  body: text("body").notNull(),
  footer: varchar("footer", { length: 500 }),
  category: varchar("category", { length: 50 }),
  priority: integer("priority").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_template_event_lang").on(table.eventType, table.languageCode),
  unique("uk_template_event_lang").on(table.eventType, table.languageCode),
]);

// Response options for templates
export const responseOptions = pgTable("response_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id").references(() => messageTemplates.id, { onDelete: "cascade" }).notNull(),
  buttonText: varchar("button_text", { length: 100 }).notNull(),
  buttonPayload: varchar("button_payload", { length: 100 }).notNull(),
  buttonType: varchar("button_type", { length: 20 }).notNull().default("reply"),
  sortOrder: integer("sort_order").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  displayConditions: jsonb("display_conditions"),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_response_options_template").on(table.templateId),
]);

// Template variables
export const templateVariables = pgTable("template_variables", {
  id: uuid("id").primaryKey().defaultRandom(),
  variableName: varchar("variable_name", { length: 100 }).notNull(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  dataPath: varchar("data_path", { length: 255 }).notNull(),
  defaultValue: varchar("default_value", { length: 255 }),
  description: text("description"),
  isRequired: boolean("is_required").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_variable_name_event").on(table.variableName, table.eventType),
]);

// Admin users
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

// Billing records
export const billingRecords = pgTable("billing_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  billingPeriod: varchar("billing_period", { length: 7 }).notNull(),
  activeDrivers: integer("active_drivers").notNull(),
  pricePerDriver: decimal("price_per_driver", { precision: 6, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_billing_records_tenant").on(table.tenantId),
  index("idx_billing_records_period").on(table.billingPeriod),
]);

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  transports: many(transports),
  statusUpdates: many(statusUpdates),
  documents: many(documents),
  locationTracking: many(locationTracking),
  whatsappMessages: many(whatsappMessages),
  billingRecords: many(billingRecords),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  drivenTransports: many(transports, { relationName: "driver" }),
  dispatchedTransports: many(transports, { relationName: "dispatcher" }),
  statusUpdates: many(statusUpdates),
  documents: many(documents),
  locationTracking: many(locationTracking),
  whatsappMessages: many(whatsappMessages),
}));

export const transportsRelations = relations(transports, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [transports.tenantId],
    references: [tenants.id],
  }),
  driver: one(users, {
    fields: [transports.driverId],
    references: [users.id],
    relationName: "driver",
  }),
  dispatcher: one(users, {
    fields: [transports.dispatcherId],
    references: [users.id],
    relationName: "dispatcher",
  }),
  statusUpdates: many(statusUpdates),
  documents: many(documents),
  locationTracking: many(locationTracking),
  whatsappMessages: many(whatsappMessages),
}));

export const messageTemplatesRelations = relations(messageTemplates, ({ many }) => ({
  responseOptions: many(responseOptions),
}));

export const responseOptionsRelations = relations(responseOptions, ({ one }) => ({
  template: one(messageTemplates, {
    fields: [responseOptions.templateId],
    references: [messageTemplates.id],
  }),
}));

// Schema exports
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectTenantSchema = createSelectSchema(tenants);

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectUserSchema = createSelectSchema(users);

export const insertTransportSchema = createInsertSchema(transports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectTransportSchema = createSelectSchema(transports);

export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectMessageTemplateSchema = createSelectSchema(messageTemplates);

export const insertResponseOptionSchema = createInsertSchema(responseOptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectResponseOptionSchema = createSelectSchema(responseOptions);

export const insertTemplateVariableSchema = createInsertSchema(templateVariables).omit({
  id: true,
  createdAt: true,
});

export const selectTemplateVariableSchema = createSelectSchema(templateVariables);

// Type exports
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Transport = typeof transports.$inferSelect;
export type InsertTransport = typeof transports.$inferInsert;
export type StatusUpdate = typeof statusUpdates.$inferSelect;
export type InsertStatusUpdate = typeof statusUpdates.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export type LocationTracking = typeof locationTracking.$inferSelect;
export type InsertLocationTracking = typeof locationTracking.$inferInsert;
export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = typeof whatsappMessages.$inferInsert;
export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = typeof messageTemplates.$inferInsert;
export type ResponseOption = typeof responseOptions.$inferSelect;
export type InsertResponseOption = typeof responseOptions.$inferInsert;
export type TemplateVariable = typeof templateVariables.$inferSelect;
export type InsertTemplateVariable = typeof templateVariables.$inferInsert;
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;
export type BillingRecord = typeof billingRecords.$inferSelect;
export type InsertBillingRecord = typeof billingRecords.$inferInsert;