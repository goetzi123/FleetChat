export const API_ROUTES = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    USER: '/api/auth/user',
    REFRESH: '/api/auth/refresh',
  },
  
  // Fleet Management
  FLEET: {
    BASE: '/api/fleet',
    SETUP: '/api/fleet/setup',
    DASHBOARD: '/api/fleet/dashboard',
    DRIVERS: '/api/fleet/drivers',
    TRANSPORTS: '/api/fleet/transports',
    BILLING: '/api/fleet/billing',
  },
  
  // Samsara Integration
  SAMSARA: {
    BASE: '/api/samsara',
    WEBHOOK: '/api/samsara/webhook',
    DRIVERS: '/api/samsara/drivers',
    VEHICLES: '/api/samsara/vehicles',
    ROUTES: '/api/samsara/routes',
    SYNC: '/api/samsara/sync',
  },
  
  // WhatsApp Integration
  WHATSAPP: {
    BASE: '/api/whatsapp',
    WEBHOOK: '/api/whatsapp/webhook',
    SEND: '/api/whatsapp/send',
    TEMPLATES: '/api/whatsapp/templates',
  },
  
  // Admin
  ADMIN: {
    BASE: '/api/admin',
    LOGIN: '/api/admin/login',
    DASHBOARD: '/api/admin/dashboard',
    TENANTS: '/api/admin/tenants',
    PRICING: '/api/admin/pricing',
    ANALYTICS: '/api/admin/analytics',
  },
  
  // System
  HEALTH: '/api/health',
  METRICS: '/api/metrics',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const ERROR_CODES = {
  // Authentication Errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Business Logic Errors
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  DRIVER_NOT_FOUND: 'DRIVER_NOT_FOUND',
  TRANSPORT_NOT_FOUND: 'TRANSPORT_NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // Integration Errors
  SAMSARA_API_ERROR: 'SAMSARA_API_ERROR',
  WHATSAPP_API_ERROR: 'WHATSAPP_API_ERROR',
  STRIPE_API_ERROR: 'STRIPE_API_ERROR',
  
  // System Errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const CACHE_KEYS = {
  TENANT: (id: string) => `tenant:${id}`,
  USER: (id: string) => `user:${id}`,
  DRIVER: (id: string) => `driver:${id}`,
  TRANSPORT: (id: string) => `transport:${id}`,
  TEMPLATE: (eventType: string, language: string) => `template:${eventType}:${language}`,
} as const;

export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

export const MESSAGE_TYPES = {
  TEXT: 'text',
  TEMPLATE: 'template',
  INTERACTIVE: 'interactive',
  LOCATION: 'location',
  DOCUMENT: 'document',
  IMAGE: 'image',
} as const;

export const WEBHOOK_EVENTS = {
  SAMSARA: {
    ROUTE_ASSIGNED: 'route.assigned',
    ROUTE_PICKUP_REMINDER: 'route.pickup_reminder',
    ROUTE_DELIVERY_DUE: 'route.delivery_due',
    VEHICLE_LOCATION: 'vehicle.location',
    VEHICLE_GEOFENCE_ENTER: 'vehicle.geofence.enter',
    VEHICLE_GEOFENCE_EXIT: 'vehicle.geofence.exit',
    DRIVER_HOS_WARNING: 'driver.hos.warning',
    VEHICLE_FAULT: 'vehicle.fault',
  },
  WHATSAPP: {
    MESSAGE_RECEIVED: 'messages',
    MESSAGE_STATUS: 'message_status',
    ACCOUNT_UPDATE: 'account_update',
  },
} as const;