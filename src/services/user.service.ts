import { eq, and } from 'drizzle-orm';
import { BaseService } from './base.service';
import { 
  users, 
  type User, 
  type InsertUser,
  insertUserSchema,
  UserRole 
} from '../shared/schema';
import { 
  UserCreateRequest, 
  PaginatedRequest, 
  ServiceResponse 
} from '../shared/types';
import { 
  ValidationError, 
  ConflictError, 
  NotFoundError 
} from '../shared/errors';
import { validateSchema, formatPhoneNumber } from '../shared/utils';

export class UserService extends BaseService {
  
  async createUser(tenantId: string, data: UserCreateRequest): Promise<ServiceResponse<User>> {
    try {
      // Validate input data
      const validatedData = validateSchema(insertUserSchema, {
        ...data,
        tenantId,
        phone: data.phone ? formatPhoneNumber(data.phone) : undefined,
      });

      // Check for email conflicts within tenant
      if (validatedData.email) {
        const existingUser = await this.findByEmail(tenantId, validatedData.email);
        if (existingUser) {
          throw new ConflictError('User with this email already exists in tenant');
        }
      }

      // Check for phone conflicts within tenant
      if (validatedData.phone) {
        const existingUser = await this.findByPhone(tenantId, validatedData.phone);
        if (existingUser) {
          throw new ConflictError('User with this phone number already exists in tenant');
        }
      }

      const user = await this.create<User>(users, validatedData);

      this.logger.info('User created successfully', { 
        userId: user.id, 
        tenantId, 
        role: user.role,
        name: user.name 
      });

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      this.logger.error('Failed to create user', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async getUser(tenantId: string, id: string): Promise<ServiceResponse<User>> {
    try {
      const user = await this.findByIdOrThrow<User>(users, id, tenantId, 'User');

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      this.logger.error('Failed to get user', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async updateUser(tenantId: string, id: string, data: Partial<InsertUser>): Promise<ServiceResponse<User>> {
    try {
      // Validate input data
      const validatedData = validateSchema(insertUserSchema.partial(), {
        ...data,
        phone: data.phone ? formatPhoneNumber(data.phone) : undefined,
      });

      // Check for email conflicts
      if (validatedData.email) {
        const existingUser = await this.findByEmail(tenantId, validatedData.email);
        if (existingUser && existingUser.id !== id) {
          throw new ConflictError('Another user with this email already exists in tenant');
        }
      }

      // Check for phone conflicts
      if (validatedData.phone) {
        const existingUser = await this.findByPhone(tenantId, validatedData.phone);
        if (existingUser && existingUser.id !== id) {
          throw new ConflictError('Another user with this phone number already exists in tenant');
        }
      }

      const user = await this.update<User>(users, id, validatedData, tenantId);

      this.logger.info('User updated successfully', { userId: id, tenantId });

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      this.logger.error('Failed to update user', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async deleteUser(tenantId: string, id: string): Promise<ServiceResponse<void>> {
    try {
      await this.delete(users, id, tenantId);

      this.logger.info('User deleted successfully', { userId: id, tenantId });

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error('Failed to delete user', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async deactivateUser(tenantId: string, id: string): Promise<ServiceResponse<User>> {
    try {
      const user = await this.update<User>(users, id, { isActive: false }, tenantId);

      this.logger.info('User deactivated', { userId: id, tenantId });

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      this.logger.error('Failed to deactivate user', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async listUsers(tenantId: string, options: PaginatedRequest & { role?: string }): Promise<ServiceResponse<{ data: User[]; meta: any }>> {
    try {
      let query = this.db.select().from(users).where(eq(users.tenantId, tenantId));

      // Filter by role if specified
      if (options.role) {
        query = query.where(and(eq(users.tenantId, tenantId), eq(users.role, options.role)));
      }

      const result = await this.paginate<User>(query, users, { ...options, tenantId });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error('Failed to list users', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async getDrivers(tenantId: string, options: PaginatedRequest): Promise<ServiceResponse<{ data: User[]; meta: any }>> {
    try {
      return await this.listUsers(tenantId, { ...options, role: UserRole.DRIVER });
    } catch (error) {
      this.logger.error('Failed to get drivers', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async updateSamsaraMapping(
    tenantId: string,
    id: string,
    mapping: {
      samsaraDriverId?: string;
      samsaraVehicleId?: string;
    }
  ): Promise<ServiceResponse<User>> {
    try {
      const user = await this.update<User>(users, id, mapping, tenantId);

      this.logger.info('Samsara mapping updated', { userId: id, tenantId });

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      this.logger.error('Failed to update Samsara mapping', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async updateLastActive(tenantId: string, id: string): Promise<ServiceResponse<User>> {
    try {
      const user = await this.update<User>(users, id, { lastActiveAt: new Date() }, tenantId);

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      this.logger.error('Failed to update last active time', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async findByPhone(tenantId: string, phone: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.tenantId, tenantId), eq(users.phone, phone)))
      .limit(1);

    return user || null;
  }

  async findByWhatsAppNumber(tenantId: string, whatsappNumber: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.tenantId, tenantId), eq(users.whatsappNumber, whatsappNumber)))
      .limit(1);

    return user || null;
  }

  async findBySamsaraDriverId(tenantId: string, samsaraDriverId: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.tenantId, tenantId), eq(users.samsaraDriverId, samsaraDriverId)))
      .limit(1);

    return user || null;
  }

  private async findByEmail(tenantId: string, email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.tenantId, tenantId), eq(users.email, email)))
      .limit(1);

    return user || null;
  }
}

export const userService = new UserService();