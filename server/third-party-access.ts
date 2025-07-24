import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { users, tenants } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

// Third-party access token interface
export interface ThirdPartyAccessToken {
  tenantId: string;
  userId: string;
  role: string;
  scope: string[];
  accessLevel: string;
  expiresAt?: Date;
  iat: number;
  exp: number;
}

// Access scope definitions
export const AccessScopes = {
  TRANSPORTS: 'transports',
  MESSAGES: 'messages', 
  ANALYTICS: 'analytics',
  DRIVERS: 'drivers',
  DOCUMENTS: 'documents',
  LOCATIONS: 'locations',
  STATUS_UPDATES: 'status_updates'
} as const;

// Access level definitions
export const AccessLevels = {
  READ_ONLY: 'read_only',
  LIMITED: 'limited', // Read-only with filtered data
  FULL: 'full' // All permissions (for regular users)
} as const;

/**
 * Generate a third-party access token
 */
export async function generateThirdPartyToken(
  tenantId: string,
  userEmail: string,
  name: string,
  scope: string[],
  expiresInDays: number = 30,
  invitedBy: string
): Promise<{ token: string; user: any }> {
  
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  // Create read-only user
  const [user] = await db.insert(users).values({
    tenantId,
    email: userEmail,
    name,
    role: 'read_only',
    accessScope: scope,
    accessLevel: 'read_only',
    expiresAt: new Date(Date.now() + (expiresInDays * 24 * 60 * 60 * 1000)),
    invitedBy,
    isActive: true
  }).returning();

  // Generate JWT token
  const tokenPayload: Partial<ThirdPartyAccessToken> = {
    tenantId,
    userId: user.id,
    role: 'read_only',
    scope,
    accessLevel: 'read_only',
    expiresAt: user.expiresAt
  };

  const token = jwt.sign(
    tokenPayload,
    process.env.JWT_SECRET,
    { 
      expiresIn: `${expiresInDays}d`,
      issuer: 'FleetChat',
      audience: 'third-party-api'
    }
  );

  return { token, user };
}

/**
 * Middleware to authenticate third-party access tokens
 */
export function authenticateThirdPartyAccess(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'UNAUTHORIZED',
      message: 'Bearer token required for third-party access' 
    });
  }

  const token = authHeader.substring(7);

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'FleetChat',
      audience: 'third-party-api'
    }) as ThirdPartyAccessToken;

    // Check if token has expired
    if (decoded.expiresAt && new Date() > new Date(decoded.expiresAt)) {
      return res.status(401).json({
        error: 'TOKEN_EXPIRED',
        message: 'Third-party access token has expired'
      });
    }

    // Add user context to request
    req.tenantId = decoded.tenantId;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    (req as any).accessScope = decoded.scope;
    (req as any).accessLevel = decoded.accessLevel;

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Invalid third-party access token'
    });
  }
}

/**
 * Middleware to check scope access
 */
export function requireScope(...requiredScopes: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userScope = (req as any).accessScope || [];
    
    const hasAccess = requiredScopes.every(scope => userScope.includes(scope));
    
    if (!hasAccess) {
      return res.status(403).json({
        error: 'INSUFFICIENT_SCOPE',
        message: `Access denied. Required scopes: ${requiredScopes.join(', ')}`,
        requiredScopes,
        userScope
      });
    }

    next();
  };
}

/**
 * Middleware to enforce read-only access
 */
export function enforceReadOnly(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  const accessLevel = (req as any).accessLevel;

  // Allow all GET requests for read-only users
  if (method === 'GET') {
    return next();
  }

  // Block any write operations for read-only users
  if (accessLevel === 'read_only' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return res.status(403).json({
      error: 'READ_ONLY_ACCESS',
      message: 'This account has read-only access. Write operations are not permitted.',
      allowedMethods: ['GET']
    });
  }

  next();
}

/**
 * Get third-party user details
 */
export async function getThirdPartyUser(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      accessScope: users.accessScope,
      accessLevel: users.accessLevel,
      expiresAt: users.expiresAt,
      isActive: users.isActive,
      createdAt: users.createdAt
    })
    .from(users)
    .where(and(
      eq(users.id, userId),
      eq(users.role, 'read_only')
    ));

  return user;
}

/**
 * Revoke third-party access
 */
export async function revokeThirdPartyAccess(userId: string, tenantId: string) {
  const [user] = await db
    .update(users)
    .set({ 
      isActive: false,
      updatedAt: new Date()
    })
    .where(and(
      eq(users.id, userId),
      eq(users.tenantId, tenantId),
      eq(users.role, 'read_only')
    ))
    .returning();

  return user;
}

/**
 * List all third-party users for a tenant
 */
export async function listThirdPartyUsers(tenantId: string) {
  const thirdPartyUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      accessScope: users.accessScope,
      accessLevel: users.accessLevel,
      expiresAt: users.expiresAt,
      isActive: users.isActive,
      createdAt: users.createdAt,
      invitedBy: users.invitedBy
    })
    .from(users)
    .where(and(
      eq(users.tenantId, tenantId),
      eq(users.role, 'read_only')
    ));

  return thirdPartyUsers;
}

/**
 * Update third-party access scope
 */
export async function updateThirdPartyAccess(
  userId: string, 
  tenantId: string, 
  updates: {
    scope?: string[];
    expiresAt?: Date;
    isActive?: boolean;
  }
) {
  const [user] = await db
    .update(users)
    .set({
      ...(updates.scope && { accessScope: updates.scope }),
      ...(updates.expiresAt && { expiresAt: updates.expiresAt }),
      ...(updates.isActive !== undefined && { isActive: updates.isActive }),
      updatedAt: new Date()
    })
    .where(and(
      eq(users.id, userId),
      eq(users.tenantId, tenantId),
      eq(users.role, 'read_only')
    ))
    .returning();

  return user;
}