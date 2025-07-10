import { db } from '../config/database';
import { logger } from '../shared/logger';
import { DatabaseError, NotFoundError, ValidationError } from '../shared/errors';
import { PaginatedRequest, PaginationMeta } from '../shared/types';
import { createPaginationMeta, getPaginationOffset } from '../shared/utils';
import { eq, and, desc, asc, count } from 'drizzle-orm';

export abstract class BaseService {
  protected db = db;
  protected logger = logger;

  protected async paginate<T>(
    query: any,
    table: any,
    options: PaginatedRequest & { tenantId?: string }
  ): Promise<{ data: T[]; meta: PaginationMeta }> {
    try {
      const { page, limit, sortBy, sortOrder, tenantId } = options;
      const offset = getPaginationOffset(page, limit);

      // Apply tenant filtering if provided
      if (tenantId && 'tenantId' in table) {
        query = query.where(eq(table.tenantId, tenantId));
      }

      // Apply sorting
      if (sortBy && sortBy in table) {
        const sortColumn = table[sortBy];
        query = query.orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn));
      }

      // Get total count
      const totalQuery = this.db
        .select({ count: count() })
        .from(table);

      if (tenantId && 'tenantId' in table) {
        totalQuery.where(eq(table.tenantId, tenantId));
      }

      const [{ count: total }] = await totalQuery;

      // Get paginated data
      const data = await query.limit(limit).offset(offset);

      const meta = createPaginationMeta(page, limit, total);

      return { data, meta };
    } catch (error) {
      this.logger.error('Pagination failed', error instanceof Error ? error : new Error(String(error)));
      throw new DatabaseError('Failed to paginate results');
    }
  }

  protected async findById<T>(
    table: any,
    id: string,
    tenantId?: string
  ): Promise<T | null> {
    try {
      const query = this.db.select().from(table).where(eq(table.id, id));

      if (tenantId && 'tenantId' in table) {
        query.where(and(eq(table.id, id), eq(table.tenantId, tenantId)));
      }

      const [result] = await query.limit(1);
      return result || null;
    } catch (error) {
      this.logger.error(`Failed to find record by ID: ${id}`, error instanceof Error ? error : new Error(String(error)));
      throw new DatabaseError('Failed to find record');
    }
  }

  protected async findByIdOrThrow<T>(
    table: any,
    id: string,
    tenantId?: string,
    resourceName: string = 'Record'
  ): Promise<T> {
    const result = await this.findById<T>(table, id, tenantId);
    if (!result) {
      throw new NotFoundError(resourceName);
    }
    return result;
  }

  protected async create<T>(
    table: any,
    data: any
  ): Promise<T> {
    try {
      const [result] = await this.db.insert(table).values(data).returning();
      return result;
    } catch (error) {
      this.logger.error('Failed to create record', error instanceof Error ? error : new Error(String(error)));
      throw new DatabaseError('Failed to create record');
    }
  }

  protected async update<T>(
    table: any,
    id: string,
    data: any,
    tenantId?: string
  ): Promise<T> {
    try {
      const whereClause = tenantId && 'tenantId' in table
        ? and(eq(table.id, id), eq(table.tenantId, tenantId))
        : eq(table.id, id);

      const [result] = await this.db
        .update(table)
        .set({ ...data, updatedAt: new Date() })
        .where(whereClause)
        .returning();

      if (!result) {
        throw new NotFoundError('Record');
      }

      return result;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      this.logger.error(`Failed to update record: ${id}`, error instanceof Error ? error : new Error(String(error)));
      throw new DatabaseError('Failed to update record');
    }
  }

  protected async delete(
    table: any,
    id: string,
    tenantId?: string
  ): Promise<void> {
    try {
      const whereClause = tenantId && 'tenantId' in table
        ? and(eq(table.id, id), eq(table.tenantId, tenantId))
        : eq(table.id, id);

      const result = await this.db
        .delete(table)
        .where(whereClause)
        .returning({ id: table.id });

      if (result.length === 0) {
        throw new NotFoundError('Record');
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      this.logger.error(`Failed to delete record: ${id}`, error instanceof Error ? error : new Error(String(error)));
      throw new DatabaseError('Failed to delete record');
    }
  }

  protected async softDelete(
    table: any,
    id: string,
    tenantId?: string
  ): Promise<void> {
    try {
      await this.update(table, id, { isActive: false }, tenantId);
    } catch (error) {
      this.logger.error(`Failed to soft delete record: ${id}`, error instanceof Error ? error : new Error(String(error)));
      throw new DatabaseError('Failed to soft delete record');
    }
  }

  protected validateTenantAccess(tenantId: string, resourceTenantId: string): void {
    if (tenantId !== resourceTenantId) {
      throw new ValidationError('Access denied to resource from different tenant');
    }
  }

  protected async exists(
    table: any,
    whereClause: any
  ): Promise<boolean> {
    try {
      const [result] = await this.db
        .select({ count: count() })
        .from(table)
        .where(whereClause);

      return result.count > 0;
    } catch (error) {
      this.logger.error('Failed to check record existence', error instanceof Error ? error : new Error(String(error)));
      throw new DatabaseError('Failed to check record existence');
    }
  }
}