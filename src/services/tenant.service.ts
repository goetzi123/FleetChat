import { eq, and } from 'drizzle-orm';
import { BaseService } from './base.service';
import { 
  tenants, 
  type Tenant, 
  type InsertTenant,
  insertTenantSchema 
} from '../shared/schema';
import { 
  TenantCreateRequest, 
  PaginatedRequest, 
  ServiceResponse 
} from '../shared/types';
import { 
  ValidationError, 
  ConflictError, 
  NotFoundError 
} from '../shared/errors';
import { validateSchema } from '../shared/utils';

export class TenantService extends BaseService {
  
  async createTenant(data: TenantCreateRequest): Promise<ServiceResponse<Tenant>> {
    try {
      // Validate input data
      const validatedData = validateSchema(insertTenantSchema, data);

      // Check if tenant with same email already exists
      const existingTenant = await this.findByEmail(validatedData.contactEmail);
      if (existingTenant) {
        throw new ConflictError('Tenant with this email already exists');
      }

      // Create tenant
      const tenant = await this.create<Tenant>(tenants, validatedData);

      this.logger.info('Tenant created successfully', { tenantId: tenant.id, companyName: tenant.companyName });

      return {
        success: true,
        data: tenant,
      };
    } catch (error) {
      this.logger.error('Failed to create tenant', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async getTenant(id: string): Promise<ServiceResponse<Tenant>> {
    try {
      const tenant = await this.findByIdOrThrow<Tenant>(tenants, id, undefined, 'Tenant');

      return {
        success: true,
        data: tenant,
      };
    } catch (error) {
      this.logger.error('Failed to get tenant', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async updateTenant(id: string, data: Partial<InsertTenant>): Promise<ServiceResponse<Tenant>> {
    try {
      // Validate input data
      const validatedData = validateSchema(insertTenantSchema.partial(), data);

      // If email is being updated, check for conflicts
      if (validatedData.contactEmail) {
        const existingTenant = await this.findByEmail(validatedData.contactEmail);
        if (existingTenant && existingTenant.id !== id) {
          throw new ConflictError('Another tenant with this email already exists');
        }
      }

      const tenant = await this.update<Tenant>(tenants, id, validatedData);

      this.logger.info('Tenant updated successfully', { tenantId: tenant.id });

      return {
        success: true,
        data: tenant,
      };
    } catch (error) {
      this.logger.error('Failed to update tenant', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async deleteTenant(id: string): Promise<ServiceResponse<void>> {
    try {
      await this.delete(tenants, id);

      this.logger.info('Tenant deleted successfully', { tenantId: id });

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error('Failed to delete tenant', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async listTenants(options: PaginatedRequest): Promise<ServiceResponse<{ data: Tenant[]; meta: any }>> {
    try {
      const query = this.db.select().from(tenants);
      const result = await this.paginate<Tenant>(query, tenants, options);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error('Failed to list tenants', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async updateSamsaraConfig(
    id: string, 
    config: { 
      samsaraApiToken: string; 
      samsaraGroupId?: string; 
      samsaraWebhookSecret?: string; 
    }
  ): Promise<ServiceResponse<Tenant>> {
    try {
      const tenant = await this.update<Tenant>(tenants, id, {
        samsaraApiToken: config.samsaraApiToken,
        samsaraGroupId: config.samsaraGroupId,
        samsaraWebhookSecret: config.samsaraWebhookSecret,
      });

      this.logger.info('Samsara configuration updated', { tenantId: id });

      return {
        success: true,
        data: tenant,
      };
    } catch (error) {
      this.logger.error('Failed to update Samsara configuration', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async updateWhatsAppConfig(
    id: string,
    config: {
      whatsappPhoneNumber: string;
      whatsappPhoneNumberId: string;
      whatsappBusinessAccountId: string;
    }
  ): Promise<ServiceResponse<Tenant>> {
    try {
      const tenant = await this.update<Tenant>(tenants, id, {
        whatsappPhoneNumber: config.whatsappPhoneNumber,
        whatsappPhoneNumberId: config.whatsappPhoneNumberId,
        whatsappBusinessAccountId: config.whatsappBusinessAccountId,
      });

      this.logger.info('WhatsApp configuration updated', { tenantId: id });

      return {
        success: true,
        data: tenant,
      };
    } catch (error) {
      this.logger.error('Failed to update WhatsApp configuration', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async updateBillingConfig(
    id: string,
    config: {
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
      billingEmail?: string;
      autoPayment?: boolean;
    }
  ): Promise<ServiceResponse<Tenant>> {
    try {
      const tenant = await this.update<Tenant>(tenants, id, config);

      this.logger.info('Billing configuration updated', { tenantId: id });

      return {
        success: true,
        data: tenant,
      };
    } catch (error) {
      this.logger.error('Failed to update billing configuration', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async deactivateTenant(id: string): Promise<ServiceResponse<Tenant>> {
    try {
      const tenant = await this.update<Tenant>(tenants, id, { isActive: false });

      this.logger.info('Tenant deactivated', { tenantId: id });

      return {
        success: true,
        data: tenant,
      };
    } catch (error) {
      this.logger.error('Failed to deactivate tenant', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async reactivateTenant(id: string): Promise<ServiceResponse<Tenant>> {
    try {
      const tenant = await this.update<Tenant>(tenants, id, { isActive: true });

      this.logger.info('Tenant reactivated', { tenantId: id });

      return {
        success: true,
        data: tenant,
      };
    } catch (error) {
      this.logger.error('Failed to reactivate tenant', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private async findByEmail(email: string): Promise<Tenant | null> {
    const [tenant] = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.contactEmail, email))
      .limit(1);

    return tenant || null;
  }
}

export const tenantService = new TenantService();