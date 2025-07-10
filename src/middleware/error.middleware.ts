import { Request, Response, NextFunction } from 'express';
import { AppError, createErrorResponse } from '../shared/errors';
import { HTTP_STATUS } from '../shared/constants';
import { logger } from '../shared/logger';
import { env, isProduction } from '../config/environment';

export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  const requestLogger = req.logger || logger;
  requestLogger.error('Request error', error, {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });

  // Handle known application errors
  if (error instanceof AppError) {
    const errorResponse = createErrorResponse(error);
    res.status(error.statusCode).json(errorResponse);
    return;
  }

  // Handle validation errors from external libraries
  if (error.name === 'ValidationError') {
    res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(
      new AppError('Validation failed', HTTP_STATUS.BAD_REQUEST, 'VALIDATION_ERROR', true, error.message)
    ));
    return;
  }

  // Handle database constraint errors
  if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
    res.status(HTTP_STATUS.CONFLICT).json(createErrorResponse(
      new AppError('Resource already exists', HTTP_STATUS.CONFLICT, 'DUPLICATE_ENTRY')
    ));
    return;
  }

  // Handle foreign key constraint errors
  if (error.message.includes('foreign key constraint')) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(
      new AppError('Invalid reference to related resource', HTTP_STATUS.BAD_REQUEST, 'INVALID_REFERENCE')
    ));
    return;
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(
      new AppError('Invalid JSON format', HTTP_STATUS.BAD_REQUEST, 'INVALID_JSON')
    ));
    return;
  }

  // Default to internal server error
  const statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = isProduction ? 'Internal server error' : error.message;
  
  const errorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message,
      ...(isProduction ? {} : { stack: error.stack }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    },
  };

  res.status(statusCode).json(errorResponse);
}

// Handle 404 errors
export function notFoundHandler(req: Request, res: Response): void {
  const requestLogger = req.logger || logger;
  requestLogger.warn('Route not found', {
    method: req.method,
    url: req.url,
  });

  res.status(HTTP_STATUS.NOT_FOUND).json(createErrorResponse(
    new AppError('Route not found', HTTP_STATUS.NOT_FOUND, 'ROUTE_NOT_FOUND')
  ));
}

// Async error wrapper
export function asyncHandler<T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: T, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}