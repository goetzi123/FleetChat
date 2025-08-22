import type {
  Tenant, InsertTenant,
  DriverPhoneMapping, InsertDriverPhoneMapping,
  CommunicationLog, InsertCommunicationLog,
  MessageTemplate, InsertMessageTemplate,
  Admin, InsertAdmin,
  PricingTier, InsertPricingTier,
  SystemConfig, InsertSystemConfig
} from "../shared/compliant-schema";

// Backward compatibility exports
export type User = any;
export type InsertUser = any;
export type Transport = any;
export type InsertTransport = any;

// COMPLIANT Storage Interface - Message relay operations only
export interface ICompliantStorage {
  // Tenant Management (for billing and API configuration)
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  getTenantById(id: string): Promise<Tenant | null>;
  getTenantByEmail(email: string): Promise<Tenant | null>;
  updateTenant(id: string, updates: Partial<InsertTenant>): Promise<Tenant>;
  getAllTenants(): Promise<Tenant[]>;

  // Driver Phone Mapping (ONLY permitted data storage)
  createDriverPhoneMapping(mapping: InsertDriverPhoneMapping): Promise<DriverPhoneMapping>;
  getDriverPhoneMappingById(id: string): Promise<DriverPhoneMapping | null>;
  getDriverPhoneMappingByFleetDriverId(
    tenantId: string, 
    platform: 'samsara' | 'motive' | 'geotab',
    fleetDriverId: string
  ): Promise<DriverPhoneMapping | null>;
  getDriverPhoneMappingByPhone(tenantId: string, phoneNumber: string): Promise<DriverPhoneMapping | null>;
  updateDriverPhoneMapping(id: string, updates: Partial<InsertDriverPhoneMapping>): Promise<DriverPhoneMapping>;
  getDriverPhoneMappingsByTenant(tenantId: string): Promise<DriverPhoneMapping[]>;
  activateDriverWhatsApp(id: string): Promise<DriverPhoneMapping>;
  deactivateDriverWhatsApp(id: string): Promise<DriverPhoneMapping>;

  // Communication Logs (delivery tracking only)
  createCommunicationLog(log: InsertCommunicationLog): Promise<CommunicationLog>;
  getCommunicationLogsByTenant(tenantId: string): Promise<CommunicationLog[]>;
  getCommunicationLogsByDriver(driverMappingId: string): Promise<CommunicationLog[]>;
  getRecentCommunicationLogs(tenantId: string, hours: number): Promise<CommunicationLog[]>;

  // Message Templates (for fleet event relay)
  createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate>;
  getMessageTemplateById(id: string): Promise<MessageTemplate | null>;
  getMessageTemplatesByTenant(tenantId: string): Promise<MessageTemplate[]>;
  getMessageTemplateByEvent(
    tenantId: string | null, 
    platform: string, 
    eventType: string, 
    languageCode: string
  ): Promise<MessageTemplate | null>;
  updateMessageTemplate(id: string, updates: Partial<InsertMessageTemplate>): Promise<MessageTemplate>;

  // Admin Management
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  getAdminById(id: string): Promise<Admin | null>;
  getAdminByEmail(email: string): Promise<Admin | null>;
  updateAdmin(id: string, updates: Partial<InsertAdmin>): Promise<Admin>;
  getAllAdmins(): Promise<Admin[]>;

  // Pricing Configuration
  createPricingTier(tier: InsertPricingTier): Promise<PricingTier>;
  getPricingTierById(id: string): Promise<PricingTier | null>;
  getActivePricingTiers(): Promise<PricingTier[]>;
  updatePricingTier(id: string, updates: Partial<InsertPricingTier>): Promise<PricingTier>;

  // System Configuration
  getSystemConfig(key: string): Promise<SystemConfig | null>;
  setSystemConfig(config: InsertSystemConfig): Promise<SystemConfig>;
  getAllSystemConfigs(): Promise<SystemConfig[]>;
}

// In-memory implementation for development
class CompliantMemStorage implements ICompliantStorage {
  private tenants: Map<string, Tenant> = new Map();
  private driverPhoneMappings: Map<string, DriverPhoneMapping> = new Map();
  private communicationLogs: Map<string, CommunicationLog> = new Map();
  private messageTemplates: Map<string, MessageTemplate> = new Map();
  private admins: Map<string, Admin> = new Map();
  private pricingTiers: Map<string, PricingTier> = new Map();
  private systemConfigs: Map<string, SystemConfig> = new Map();

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Tenant Management
  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const id = this.generateId();
    const newTenant: Tenant = {
      ...tenant,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tenants.set(id, newTenant);
    return newTenant;
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    return this.tenants.get(id) || null;
  }

  async getTenantByEmail(email: string): Promise<Tenant | null> {
    for (const tenant of this.tenants.values()) {
      if (tenant.contactEmail === email) {
        return tenant;
      }
    }
    return null;
  }

  async updateTenant(id: string, updates: Partial<InsertTenant>): Promise<Tenant> {
    const tenant = this.tenants.get(id);
    if (!tenant) {
      throw new Error("Tenant not found");
    }
    const updatedTenant = { ...tenant, ...updates, updatedAt: new Date() };
    this.tenants.set(id, updatedTenant);
    return updatedTenant;
  }

  async getAllTenants(): Promise<Tenant[]> {
    return Array.from(this.tenants.values());
  }

  // Driver Phone Mapping
  async createDriverPhoneMapping(mapping: InsertDriverPhoneMapping): Promise<DriverPhoneMapping> {
    const id = this.generateId();
    const newMapping: DriverPhoneMapping = {
      ...mapping,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.driverPhoneMappings.set(id, newMapping);
    return newMapping;
  }

  async getDriverPhoneMappingById(id: string): Promise<DriverPhoneMapping | null> {
    return this.driverPhoneMappings.get(id) || null;
  }

  async getDriverPhoneMappingByFleetDriverId(
    tenantId: string, 
    platform: 'samsara' | 'motive' | 'geotab',
    fleetDriverId: string
  ): Promise<DriverPhoneMapping | null> {
    for (const mapping of this.driverPhoneMappings.values()) {
      if (mapping.tenantId === tenantId) {
        if (platform === 'samsara' && mapping.samsaraDriverId === fleetDriverId) return mapping;
        if (platform === 'motive' && mapping.motiveDriverId === fleetDriverId) return mapping;
        if (platform === 'geotab' && mapping.geotabDriverId === fleetDriverId) return mapping;
      }
    }
    return null;
  }

  async getDriverPhoneMappingByPhone(tenantId: string, phoneNumber: string): Promise<DriverPhoneMapping | null> {
    for (const mapping of this.driverPhoneMappings.values()) {
      if (mapping.tenantId === tenantId && mapping.phoneNumber === phoneNumber) {
        return mapping;
      }
    }
    return null;
  }

  async updateDriverPhoneMapping(id: string, updates: Partial<InsertDriverPhoneMapping>): Promise<DriverPhoneMapping> {
    const mapping = this.driverPhoneMappings.get(id);
    if (!mapping) {
      throw new Error("Driver phone mapping not found");
    }
    const updatedMapping = { ...mapping, ...updates, updatedAt: new Date() };
    this.driverPhoneMappings.set(id, updatedMapping);
    return updatedMapping;
  }

  async getDriverPhoneMappingsByTenant(tenantId: string): Promise<DriverPhoneMapping[]> {
    return Array.from(this.driverPhoneMappings.values()).filter(
      mapping => mapping.tenantId === tenantId
    );
  }

  async activateDriverWhatsApp(id: string): Promise<DriverPhoneMapping> {
    return this.updateDriverPhoneMapping(id, { 
      whatsappActive: true, 
      activatedAt: new Date() 
    });
  }

  async deactivateDriverWhatsApp(id: string): Promise<DriverPhoneMapping> {
    return this.updateDriverPhoneMapping(id, { 
      whatsappActive: false 
    });
  }

  // Communication Logs
  async createCommunicationLog(log: InsertCommunicationLog): Promise<CommunicationLog> {
    const id = this.generateId();
    const newLog: CommunicationLog = {
      ...log,
      id,
      timestamp: new Date(),
    };
    this.communicationLogs.set(id, newLog);
    return newLog;
  }

  async getCommunicationLogsByTenant(tenantId: string): Promise<CommunicationLog[]> {
    return Array.from(this.communicationLogs.values()).filter(
      log => log.tenantId === tenantId
    );
  }

  async getCommunicationLogsByDriver(driverMappingId: string): Promise<CommunicationLog[]> {
    return Array.from(this.communicationLogs.values()).filter(
      log => log.driverMappingId === driverMappingId
    );
  }

  async getRecentCommunicationLogs(tenantId: string, hours: number): Promise<CommunicationLog[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Array.from(this.communicationLogs.values()).filter(
      log => log.tenantId === tenantId && log.timestamp && log.timestamp > cutoff
    );
  }

  // Message Templates
  async createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate> {
    const id = this.generateId();
    const newTemplate: MessageTemplate = {
      ...template,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.messageTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async getMessageTemplateById(id: string): Promise<MessageTemplate | null> {
    return this.messageTemplates.get(id) || null;
  }

  async getMessageTemplatesByTenant(tenantId: string): Promise<MessageTemplate[]> {
    return Array.from(this.messageTemplates.values()).filter(
      template => template.tenantId === tenantId
    );
  }

  async getMessageTemplateByEvent(
    tenantId: string | null, 
    platform: string, 
    eventType: string, 
    languageCode: string
  ): Promise<MessageTemplate | null> {
    for (const template of this.messageTemplates.values()) {
      if (
        template.platform === platform &&
        template.eventType === eventType &&
        template.languageCode === languageCode &&
        template.isActive &&
        (tenantId === null || template.tenantId === tenantId || template.tenantId === null)
      ) {
        return template;
      }
    }
    return null;
  }

  async updateMessageTemplate(id: string, updates: Partial<InsertMessageTemplate>): Promise<MessageTemplate> {
    const template = this.messageTemplates.get(id);
    if (!template) {
      throw new Error("Message template not found");
    }
    const updatedTemplate = { ...template, ...updates, updatedAt: new Date() };
    this.messageTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  // Admin Management
  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const id = this.generateId();
    const newAdmin: Admin = {
      ...admin,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.admins.set(id, newAdmin);
    return newAdmin;
  }

  async getAdminById(id: string): Promise<Admin | null> {
    return this.admins.get(id) || null;
  }

  async getAdminByEmail(email: string): Promise<Admin | null> {
    for (const admin of this.admins.values()) {
      if (admin.email === email) {
        return admin;
      }
    }
    return null;
  }

  async updateAdmin(id: string, updates: Partial<InsertAdmin>): Promise<Admin> {
    const admin = this.admins.get(id);
    if (!admin) {
      throw new Error("Admin not found");
    }
    const updatedAdmin = { ...admin, ...updates, updatedAt: new Date() };
    this.admins.set(id, updatedAdmin);
    return updatedAdmin;
  }

  async getAllAdmins(): Promise<Admin[]> {
    return Array.from(this.admins.values());
  }

  // Pricing Configuration
  async createPricingTier(tier: InsertPricingTier): Promise<PricingTier> {
    const id = this.generateId();
    const newTier: PricingTier = {
      ...tier,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.pricingTiers.set(id, newTier);
    return newTier;
  }

  async getPricingTierById(id: string): Promise<PricingTier | null> {
    return this.pricingTiers.get(id) || null;
  }

  async getActivePricingTiers(): Promise<PricingTier[]> {
    return Array.from(this.pricingTiers.values()).filter(tier => tier.isActive);
  }

  async updatePricingTier(id: string, updates: Partial<InsertPricingTier>): Promise<PricingTier> {
    const tier = this.pricingTiers.get(id);
    if (!tier) {
      throw new Error("Pricing tier not found");
    }
    const updatedTier = { ...tier, ...updates, updatedAt: new Date() };
    this.pricingTiers.set(id, updatedTier);
    return updatedTier;
  }

  // System Configuration
  async getSystemConfig(key: string): Promise<SystemConfig | null> {
    return this.systemConfigs.get(key) || null;
  }

  async setSystemConfig(config: InsertSystemConfig): Promise<SystemConfig> {
    const existingConfig = this.systemConfigs.get(config.key);
    const newConfig: SystemConfig = {
      ...config,
      id: existingConfig?.id || this.generateId(),
      updatedAt: new Date(),
    };
    this.systemConfigs.set(config.key, newConfig);
    return newConfig;
  }

  async getAllSystemConfigs(): Promise<SystemConfig[]> {
    return Array.from(this.systemConfigs.values());
  }
}

export const compliantStorage = new CompliantMemStorage();