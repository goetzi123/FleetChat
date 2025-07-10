import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, AuthorizationError } from '../shared/errors';
import { createRequestLogger } from '../shared/logger';
import { generateRequestId } from '../shared/utils';

// Extend Express Request to include user and tenant info
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      tenantId?: string;
      userId?: string;
      userRole?: string;
      logger: ReturnType<typeof createRequestLogger>;
    }
  }
}

// Add request ID and logger to all requests
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  req.requestId = generateRequestId();
  req.logger = createRequestLogger(req.requestId);
  
  // Add request ID to response headers for debugging
  res.setHeader('X-Request-ID', req.requestId);
  
  next();
}

// Mock authentication middleware (replace with actual implementation)
export function authenticateUser(req: Request, res: Response, next: NextFunction): void {
  try {
    // TODO: Implement actual authentication logic
    // For now, this is a placeholder that sets mock user data
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or invalid authorization header');
    }

    // Mock user data - replace with actual JWT verification
    req.tenantId = 'tenant-123';
    req.userId = 'user-456';
    req.userRole = 'driver';

    req.logger.info('User authenticated', {
      tenantId: req.tenantId,
      userId: req.userId,
      userRole: req.userRole,
    });

    next();
  } catch (error) {
    req.logger.error('Authentication failed', error instanceof Error ? error : new Error(String(error)));
    next(error);
  }
}

// Require specific user roles
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.userRole) {
        throw new AuthenticationError('User role not found');
      }

      if (!allowedRoles.includes(req.userRole)) {
        throw new AuthorizationError(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
      }

      next();
    } catch (error) {
      req.logger.error('Role authorization failed', error instanceof Error ? error : new Error(String(error)));
      next(error);
    }
  };
}

// Admin authentication middleware
export function authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
  try {
    // TODO: Implement actual admin authentication
    // For now, this is a placeholder
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Admin authentication required');
    }

    // Mock admin data
    req.userId = 'admin-123';
    req.userRole = 'admin';

    req.logger.info('Admin authenticated', {
      adminId: req.userId,
    });

    next();
  } catch (error) {
    req.logger.error('Admin authentication failed', error instanceof Error ? error : new Error(String(error)));
    next(error);
  }
}

// Tenant isolation middleware
export function requireTenantAccess(req: Request, res: Response, next: NextFunction): void {
  try {
    const { tenantId } = req.params;
    
    if (!tenantId) {
      throw new AuthenticationError('Tenant ID required');
    }

    if (req.tenantId && req.tenantId !== tenantId) {
      throw new AuthorizationError('Access denied to this tenant');
    }

    next();
  } catch (error) {
    req.logger.error('Tenant access validation failed', error instanceof Error ? error : new Error(String(error)));
    next(error);
  }
}