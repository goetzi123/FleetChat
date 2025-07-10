import { HTTP_STATUS, ERROR_CODES } from './constants';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: string = ERROR_CODES.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.INVALID_CREDENTIALS);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.INSUFFICIENT_PERMISSIONS);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.DUPLICATE_ENTRY);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, ERROR_CODES.RATE_LIMIT_EXCEEDED);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.DATABASE_ERROR, true, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super(
      `${service} service error: ${message}`,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      true,
      details
    );
  }
}

export class SamsaraApiError extends ExternalServiceError {
  constructor(message: string, details?: any) {
    super('Samsara API', message, details);
    this.code = ERROR_CODES.SAMSARA_API_ERROR;
  }
}

export class WhatsAppApiError extends ExternalServiceError {
  constructor(message: string, details?: any) {
    super('WhatsApp API', message, details);
    this.code = ERROR_CODES.WHATSAPP_API_ERROR;
  }
}

export class StripeApiError extends ExternalServiceError {
  constructor(message: string, details?: any) {
    super('Stripe API', message, details);
    this.code = ERROR_CODES.STRIPE_API_ERROR;
  }
}

// Error response helper
export function createErrorResponse(error: AppError | Error) {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Fallback for unknown errors
  return {
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}

// Success response helper
export function createSuccessResponse<T>(data: T, meta?: any) {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}