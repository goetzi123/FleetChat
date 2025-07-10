import { Router } from 'express';
import { tenantRoutes } from './tenant.routes';
import { webhookRoutes } from './webhook.routes';
import { asyncHandler } from '../middleware/error.middleware';
import { createSuccessResponse } from '../shared/errors';
import { checkDatabaseConnection } from '../config/database';
import { env } from '../config/environment';

const router = Router();

// Health check endpoint
router.get('/health', 
  asyncHandler(async (req, res) => {
    const dbHealthy = await checkDatabaseConnection();
    
    const health = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: env.NODE_ENV,
      services: {
        database: dbHealthy ? 'connected' : 'disconnected',
        samsara: 'configured', // TODO: Add actual health checks
        whatsapp: 'configured', // TODO: Add actual health checks
      },
    };

    const statusCode = dbHealthy ? 200 : 503;
    const response = createSuccessResponse(health);
    
    res.status(statusCode).json(response);
  })
);

// API routes
router.use('/tenants', tenantRoutes);
router.use('/webhook', webhookRoutes);

// API info endpoint
router.get('/', 
  asyncHandler(async (req, res) => {
    const response = createSuccessResponse({
      name: 'FleetChat API',
      version: '1.0.0',
      description: 'Fleet management communication platform',
      endpoints: {
        health: '/api/health',
        tenants: '/api/tenants',
        webhooks: '/api/webhook',
      },
      documentation: 'https://docs.fleet.chat',
    });

    res.json(response);
  })
);

export { router as apiRoutes };