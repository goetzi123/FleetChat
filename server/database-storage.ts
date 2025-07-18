import { db } from "./db";
import { 
  tenants, 
  users, 
  transports, 
  statusUpdates, 
  documents, 
  locationTracking, 
  yardOperations, 
  tmsIntegrations, 
  whatsappMessages, 
  billingRecords 
} from "@shared/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import type { 
  Tenant, 
  User, 
  Transport, 
  StatusUpdate, 
  Document, 
  LocationTracking, 
  YardOperation, 
  TmsIntegration, 
  WhatsappMessage, 
  BillingRecord,
  InsertTenant,
  InsertUser,
  InsertTransport,
  InsertStatusUpdate,
  InsertDocument,
  InsertLocationTracking,
  InsertYardOperation,
  InsertTmsIntegration,
  InsertWhatsappMessage,
  InsertBillingRecord
} from "@shared/schema";

export interface IFleetChatStorage {
  // Tenant Management
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  getTenantById(id: string): Promise<Tenant | null>;
  getTenantByEmail(email: string): Promise<Tenant | null>;
  updateTenant(id: string, updates: Partial<InsertTenant>): Promise<Tenant>;
  
  // User Management
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUsersByTenant(tenantId: string): Promise<User[]>;
  getUserBySamsaraDriverId(samsaraDriverId: string): Promise<User | null>;
  getUserByPhone(phone: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  getActiveDriversByTenant(tenantId: string): Promise<User[]>;
  
  // Transport Management
  createTransport(transport: InsertTransport): Promise<Transport>;
  getTransportById(id: string): Promise<Transport | null>;
  getTransportsByTenant(tenantId: string): Promise<Transport[]>;
  getTransportsByDriver(driverId: string): Promise<Transport[]>;
  getActiveTransportsByTenant(tenantId: string): Promise<Transport[]>;
  updateTransport(id: string, updates: Partial<InsertTransport>): Promise<Transport>;
  
  // Status Updates
  createStatusUpdate(statusUpdate: InsertStatusUpdate): Promise<StatusUpdate>;
  getStatusUpdatesByTransport(transportId: string): Promise<StatusUpdate[]>;
  getLatestStatusUpdate(transportId: string): Promise<StatusUpdate | null>;
  
  // Document Management
  createDocument(document: InsertDocument): Promise<Document>;
  getDocumentsByTransport(transportId: string): Promise<Document[]>;
  updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document>;
  
  // Location Tracking
  createLocationTracking(location: InsertLocationTracking): Promise<LocationTracking>;
  getLocationsByTransport(transportId: string): Promise<LocationTracking[]>;
  getLatestLocationByTransport(transportId: string): Promise<LocationTracking | null>;
  
  // Yard Operations
  createYardOperation(yardOp: InsertYardOperation): Promise<YardOperation>;
  getYardOperationsByTransport(transportId: string): Promise<YardOperation[]>;
  
  // TMS Integrations
  createTmsIntegration(integration: InsertTmsIntegration): Promise<TmsIntegration>;
  getTmsIntegrationsByTransport(transportId: string): Promise<TmsIntegration[]>;
  
  // WhatsApp Messages
  createWhatsappMessage(message: InsertWhatsappMessage): Promise<WhatsappMessage>;
  getWhatsappMessagesByTransport(transportId: string): Promise<WhatsappMessage[]>;
  
  // Billing
  createBillingRecord(billing: InsertBillingRecord): Promise<BillingRecord>;
  getBillingRecordsByTenant(tenantId: string): Promise<BillingRecord[]>;
  getCurrentMonthBilling(tenantId: string): Promise<BillingRecord | null>;
}

export class DatabaseStorage implements IFleetChatStorage {
  // Tenant Management
  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const [newTenant] = await db.insert(tenants).values(tenant).returning();
    return newTenant;
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant || null;
  }

  async getTenantByEmail(email: string): Promise<Tenant | null> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.contactEmail, email));
    return tenant || null;
  }

  async updateTenant(id: string, updates: Partial<InsertTenant>): Promise<Tenant> {
    const [updatedTenant] = await db
      .update(tenants)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return updatedTenant;
  }

  // User Management
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getUserById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async getUsersByTenant(tenantId: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.tenantId, tenantId));
  }

  async getUserBySamsaraDriverId(samsaraDriverId: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.samsaraDriverId, samsaraDriverId));
    return user || null;
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || null;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getActiveDriversByTenant(tenantId: string): Promise<User[]> {
    return db.select().from(users).where(
      and(
        eq(users.tenantId, tenantId),
        eq(users.role, 'driver'),
        eq(users.isActive, true),
        eq(users.whatsappActive, true)
      )
    );
  }

  // Transport Management
  async createTransport(transport: InsertTransport): Promise<Transport> {
    const [newTransport] = await db.insert(transports).values(transport).returning();
    return newTransport;
  }

  async getTransportById(id: string): Promise<Transport | null> {
    const [transport] = await db.select().from(transports).where(eq(transports.id, id));
    return transport || null;
  }

  async getTransportsByTenant(tenantId: string): Promise<Transport[]> {
    return db.select().from(transports).where(eq(transports.tenantId, tenantId)).orderBy(desc(transports.createdAt));
  }

  async getTransportsByDriver(driverId: string): Promise<Transport[]> {
    return db.select().from(transports).where(eq(transports.driverId, driverId)).orderBy(desc(transports.createdAt));
  }

  async getActiveTransportsByTenant(tenantId: string): Promise<Transport[]> {
    return db.select().from(transports).where(
      and(
        eq(transports.tenantId, tenantId),
        eq(transports.isActive, true)
      )
    ).orderBy(desc(transports.createdAt));
  }

  async updateTransport(id: string, updates: Partial<InsertTransport>): Promise<Transport> {
    const [updatedTransport] = await db
      .update(transports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transports.id, id))
      .returning();
    return updatedTransport;
  }

  // Status Updates
  async createStatusUpdate(statusUpdate: InsertStatusUpdate): Promise<StatusUpdate> {
    const [newStatusUpdate] = await db.insert(statusUpdates).values(statusUpdate).returning();
    return newStatusUpdate;
  }

  async getStatusUpdatesByTransport(transportId: string): Promise<StatusUpdate[]> {
    return db.select().from(statusUpdates).where(eq(statusUpdates.transportId, transportId)).orderBy(desc(statusUpdates.timestamp));
  }

  async getLatestStatusUpdate(transportId: string): Promise<StatusUpdate | null> {
    const [latest] = await db.select().from(statusUpdates)
      .where(eq(statusUpdates.transportId, transportId))
      .orderBy(desc(statusUpdates.timestamp))
      .limit(1);
    return latest || null;
  }

  // Document Management
  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async getDocumentsByTransport(transportId: string): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.transportId, transportId)).orderBy(desc(documents.createdAt));
  }

  async updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document> {
    const [updatedDocument] = await db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }

  // Location Tracking
  async createLocationTracking(location: InsertLocationTracking): Promise<LocationTracking> {
    const [newLocation] = await db.insert(locationTracking).values(location).returning();
    return newLocation;
  }

  async getLocationsByTransport(transportId: string): Promise<LocationTracking[]> {
    return db.select().from(locationTracking).where(eq(locationTracking.transportId, transportId)).orderBy(desc(locationTracking.timestamp));
  }

  async getLatestLocationByTransport(transportId: string): Promise<LocationTracking | null> {
    const [latest] = await db.select().from(locationTracking)
      .where(eq(locationTracking.transportId, transportId))
      .orderBy(desc(locationTracking.timestamp))
      .limit(1);
    return latest || null;
  }

  // Yard Operations
  async createYardOperation(yardOp: InsertYardOperation): Promise<YardOperation> {
    const [newYardOp] = await db.insert(yardOperations).values(yardOp).returning();
    return newYardOp;
  }

  async getYardOperationsByTransport(transportId: string): Promise<YardOperation[]> {
    return db.select().from(yardOperations).where(eq(yardOperations.transportId, transportId)).orderBy(desc(yardOperations.createdAt));
  }

  // TMS Integrations
  async createTmsIntegration(integration: InsertTmsIntegration): Promise<TmsIntegration> {
    const [newIntegration] = await db.insert(tmsIntegrations).values(integration).returning();
    return newIntegration;
  }

  async getTmsIntegrationsByTransport(transportId: string): Promise<TmsIntegration[]> {
    return db.select().from(tmsIntegrations).where(eq(tmsIntegrations.transportId, transportId)).orderBy(desc(tmsIntegrations.timestamp));
  }

  // WhatsApp Messages
  async createWhatsappMessage(message: InsertWhatsappMessage): Promise<WhatsappMessage> {
    const [newMessage] = await db.insert(whatsappMessages).values(message).returning();
    return newMessage;
  }

  async getWhatsappMessagesByTransport(transportId: string): Promise<WhatsappMessage[]> {
    return db.select().from(whatsappMessages).where(eq(whatsappMessages.transportId, transportId)).orderBy(desc(whatsappMessages.timestamp));
  }

  // Billing
  async createBillingRecord(billing: InsertBillingRecord): Promise<BillingRecord> {
    const [newBilling] = await db.insert(billingRecords).values(billing).returning();
    return newBilling;
  }

  async getBillingRecordsByTenant(tenantId: string): Promise<BillingRecord[]> {
    return db.select().from(billingRecords).where(eq(billingRecords.tenantId, tenantId)).orderBy(desc(billingRecords.createdAt));
  }

  async getCurrentMonthBilling(tenantId: string): Promise<BillingRecord | null> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const [billing] = await db.select().from(billingRecords).where(
      and(
        eq(billingRecords.tenantId, tenantId),
        eq(billingRecords.billingPeriod, currentMonth)
      )
    );
    return billing || null;
  }
}

export const fleetChatStorage = new DatabaseStorage();