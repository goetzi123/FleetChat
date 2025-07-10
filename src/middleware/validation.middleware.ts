import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../shared/errors';
import { validateSchema } from '../shared/utils';

type ValidationType = 'body' | 'query' | 'params';

export function validateRequest<T extends z.ZodSchema>(
  schema: T,
  type: ValidationType = 'body'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[type];
      const validatedData = validateSchema(schema, data);
      
      // Replace the original data with validated data
      (req as any)[type] = validatedData;
      
      next();
    } catch (error) {
      const validationError = new ValidationError(
        error instanceof Error ? error.message : 'Validation failed'
      );
      next(validationError);
    }
  };
}

// Common validation schemas
export const paginationQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

export const tenantParamSchema = z.object({
  tenantId: z.string().uuid('Invalid tenant ID format'),
});

// Middleware factories for common validations
export const validatePagination = () => validateRequest(paginationQuerySchema, 'query');
export const validateUuidParam = () => validateRequest(uuidParamSchema, 'params');
export const validateTenantParam = () => validateRequest(tenantParamSchema, 'params');