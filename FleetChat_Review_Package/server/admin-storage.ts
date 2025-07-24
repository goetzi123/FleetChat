import {
  admins,
  pricingTiers,
  usageAnalytics,
  systemConfig,
  billingRecords,
  tenants,
  users,
  transports,
  whatsappMessages,
  type Admin,
  type PricingTier,
  type UsageAnalytics,
  type SystemConfig,
  type BillingRecord,
  type InsertAdmin,
  type InsertPricingTier,
  type InsertUsageAnalytics,
  type InsertSystemConfig,
  type InsertBillingRecord,
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc, gte, lte, and, count } from "drizzle-orm";
import bcrypt from "bcrypt";

// Admin management interface
export interface IAdminStorage {
  // Admin authentication
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  getAdminByEmail(email: string): Promise<Admin | null>;
  getAdminById(id: string): Promise<Admin | null>;
  updateAdminLastLogin(id: string): Promise<void>;
  validateAdminPassword(email: string, password: string): Promise<Admin | null>;
  
  // Pricing management
  createPricingTier(tier: InsertPricingTier): Promise<PricingTier>;
  getPricingTiers(): Promise<PricingTier[]>;
  getActivePricingTiers(): Promise<PricingTier[]>;
  updatePricingTier(id: string, updates: Partial<InsertPricingTier>): Promise<PricingTier>;
  deletePricingTier(id: string): Promise<void>;
  
  // System configuration
  getSystemConfig(key: string): Promise<SystemConfig | null>;
  setSystemConfig(config: InsertSystemConfig): Promise<SystemConfig>;
  getAllSystemConfig(): Promise<SystemConfig[]>;
  
  // Usage analytics and reporting
  recordDailyUsage(analytics: InsertUsageAnalytics): Promise<UsageAnalytics>;
  getUsageAnalytics(startDate: string, endDate: string): Promise<UsageAnalytics[]>;
  getTenantUsageAnalytics(tenantId: string, startDate: string, endDate: string): Promise<UsageAnalytics[]>;
  
  // Billing management
  createBillingRecord(billing: InsertBillingRecord): Promise<BillingRecord>;
  getBillingRecords(limit?: number): Promise<BillingRecord[]>;
  getTenantBillingRecords(tenantId: string): Promise<BillingRecord[]>;
  updateBillingRecord(id: string, updates: Partial<InsertBillingRecord>): Promise<BillingRecord>;
  
  // Dashboard reports
  getSystemOverview(): Promise<{
    totalTenants: number;
    activeTenants: number;
    totalDrivers: number;
    activeDrivers: number;
    totalTransports: number;
    totalMessages: number;
    monthlyRevenue: number;
  }>;
  
  getTenantStats(): Promise<Array<{
    tenantId: string;
    companyName: string;
    activeDrivers: number;
    totalTransports: number;
    totalMessages: number;
    monthlyBilling: number;
    serviceTier: string;
  }>>;
}

export class AdminStorage implements IAdminStorage {
  // Admin authentication
  async createAdmin(adminData: InsertAdmin): Promise<Admin> {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminData.passwordHash, saltRounds);
    
    const [admin] = await db
      .insert(admins)
      .values({
        ...adminData,
        passwordHash: hashedPassword,
      })
      .returning();
    return admin;
  }

  async getAdminByEmail(email: string): Promise<Admin | null> {
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.email, email));
    return admin || null;
  }

  async getAdminById(id: string): Promise<Admin | null> {
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.id, id));
    return admin || null;
  }

  async updateAdminLastLogin(id: string): Promise<void> {
    await db
      .update(admins)
      .set({ lastLoginAt: new Date() })
      .where(eq(admins.id, id));
  }

  async validateAdminPassword(email: string, password: string): Promise<Admin | null> {
    const admin = await this.getAdminByEmail(email);
    if (!admin || !admin.isActive) {
      return null;
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return null;
    }

    await this.updateAdminLastLogin(admin.id);
    return admin;
  }

  // Pricing management
  async createPricingTier(tierData: InsertPricingTier): Promise<PricingTier> {
    const [tier] = await db
      .insert(pricingTiers)
      .values(tierData)
      .returning();
    return tier;
  }

  async getPricingTiers(): Promise<PricingTier[]> {
    return await db
      .select()
      .from(pricingTiers)
      .orderBy(desc(pricingTiers.pricePerDriver));
  }

  async getActivePricingTiers(): Promise<PricingTier[]> {
    return await db
      .select()
      .from(pricingTiers)
      .where(eq(pricingTiers.isActive, true))
      .orderBy(desc(pricingTiers.pricePerDriver));
  }

  async updatePricingTier(id: string, updates: Partial<InsertPricingTier>): Promise<PricingTier> {
    const [tier] = await db
      .update(pricingTiers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pricingTiers.id, id))
      .returning();
    return tier;
  }

  async deletePricingTier(id: string): Promise<void> {
    await db
      .update(pricingTiers)
      .set({ isActive: false })
      .where(eq(pricingTiers.id, id));
  }

  // System configuration
  async getSystemConfig(key: string): Promise<SystemConfig | null> {
    const [config] = await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.key, key));
    return config || null;
  }

  async setSystemConfig(configData: InsertSystemConfig): Promise<SystemConfig> {
    const [config] = await db
      .insert(systemConfig)
      .values(configData)
      .onConflictDoUpdate({
        target: systemConfig.key,
        set: {
          value: configData.value,
          description: configData.description,
          updatedBy: configData.updatedBy,
          updatedAt: new Date(),
        },
      })
      .returning();
    return config;
  }

  async getAllSystemConfig(): Promise<SystemConfig[]> {
    return await db
      .select()
      .from(systemConfig)
      .orderBy(systemConfig.key);
  }

  // Usage analytics
  async recordDailyUsage(analyticsData: InsertUsageAnalytics): Promise<UsageAnalytics> {
    const [analytics] = await db
      .insert(usageAnalytics)
      .values(analyticsData)
      .onConflictDoUpdate({
        target: [usageAnalytics.tenantId, usageAnalytics.date],
        set: {
          activeDrivers: analyticsData.activeDrivers,
          totalMessages: analyticsData.totalMessages,
          totalTransports: analyticsData.totalTransports,
          totalDocuments: analyticsData.totalDocuments,
          apiCalls: analyticsData.apiCalls,
        },
      })
      .returning();
    return analytics;
  }

  async getUsageAnalytics(startDate: string, endDate: string): Promise<UsageAnalytics[]> {
    return await db
      .select()
      .from(usageAnalytics)
      .where(and(
        gte(usageAnalytics.date, startDate),
        lte(usageAnalytics.date, endDate)
      ))
      .orderBy(desc(usageAnalytics.date));
  }

  async getTenantUsageAnalytics(tenantId: string, startDate: string, endDate: string): Promise<UsageAnalytics[]> {
    return await db
      .select()
      .from(usageAnalytics)
      .where(and(
        eq(usageAnalytics.tenantId, tenantId),
        gte(usageAnalytics.date, startDate),
        lte(usageAnalytics.date, endDate)
      ))
      .orderBy(desc(usageAnalytics.date));
  }

  // Billing management
  async createBillingRecord(billingData: InsertBillingRecord): Promise<BillingRecord> {
    const [billing] = await db
      .insert(billingRecords)
      .values(billingData)
      .returning();
    return billing;
  }

  async getBillingRecords(limit: number = 100): Promise<BillingRecord[]> {
    return await db
      .select()
      .from(billingRecords)
      .orderBy(desc(billingRecords.createdAt))
      .limit(limit);
  }

  async getTenantBillingRecords(tenantId: string): Promise<BillingRecord[]> {
    return await db
      .select()
      .from(billingRecords)
      .where(eq(billingRecords.tenantId, tenantId))
      .orderBy(desc(billingRecords.createdAt));
  }

  async updateBillingRecord(id: string, updates: Partial<InsertBillingRecord>): Promise<BillingRecord> {
    const [billing] = await db
      .update(billingRecords)
      .set(updates)
      .where(eq(billingRecords.id, id))
      .returning();
    return billing;
  }

  // Dashboard reports
  async getSystemOverview() {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    const [
      totalTenantsResult,
      activeTenantsResult,
      totalDriversResult,
      activeDriversResult,
      totalTransportsResult,
      totalMessagesResult,
      monthlyRevenueResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(tenants),
      db.select({ count: count() }).from(tenants).where(eq(tenants.isActive, true)),
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(users).where(eq(users.isActive, true)),
      db.select({ count: count() }).from(transports),
      db.select({ count: count() }).from(whatsappMessages),
      db.select({ 
        total: sql<number>`COALESCE(SUM(${billingRecords.totalAmount}), 0)` 
      }).from(billingRecords).where(eq(billingRecords.billingPeriod, currentMonth)),
    ]);

    return {
      totalTenants: totalTenantsResult[0]?.count || 0,
      activeTenants: activeTenantsResult[0]?.count || 0,
      totalDrivers: totalDriversResult[0]?.count || 0,
      activeDrivers: activeDriversResult[0]?.count || 0,
      totalTransports: totalTransportsResult[0]?.count || 0,
      totalMessages: totalMessagesResult[0]?.count || 0,
      monthlyRevenue: monthlyRevenueResult[0]?.total || 0,
    };
  }

  async getTenantStats() {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    return await db
      .select({
        tenantId: tenants.id,
        companyName: tenants.companyName,
        serviceTier: tenants.serviceTier,
        activeDrivers: sql<number>`COALESCE((
          SELECT COUNT(*) 
          FROM ${users} 
          WHERE ${users.tenantId} = ${tenants.id} 
          AND ${users.isActive} = true
        ), 0)`,
        totalTransports: sql<number>`COALESCE((
          SELECT COUNT(*) 
          FROM ${transports} 
          WHERE ${transports.tenantId} = ${tenants.id}
        ), 0)`,
        totalMessages: sql<number>`COALESCE((
          SELECT COUNT(*) 
          FROM ${whatsappMessages} 
          WHERE ${whatsappMessages.tenantId} = ${tenants.id}
        ), 0)`,
        monthlyBilling: sql<number>`COALESCE((
          SELECT ${billingRecords.totalAmount}
          FROM ${billingRecords}
          WHERE ${billingRecords.tenantId} = ${tenants.id}
          AND ${billingRecords.billingPeriod} = ${currentMonth}
          LIMIT 1
        ), 0)`,
      })
      .from(tenants)
      .where(eq(tenants.isActive, true))
      .orderBy(desc(sql`active_drivers`));
  }
}

export const adminStorage = new AdminStorage();