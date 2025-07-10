import { Router } from 'express';
import { tenantService } from '../services/tenant.service';
import { asyncHandler } from '../middleware/error.middleware';
import { 
  validateRequest, 
  validatePagination, 
  validateUuidParam,
} from '../middleware/validation.middleware';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { tenantCreateSchema } from '../shared/types';
import { createSuccessResponse } from '../shared/errors';
import { z } from 'zod';

const router = Router();

// Admin-only routes for tenant management
router.use(authenticateAdmin);

// Create tenant
router.post('/',
  validateRequest(tenantCreateSchema),
  asyncHandler(async (req, res) => {
    const result = await tenantService.createTenant(req.body);
    const response = createSuccessResponse(result.data);
    res.status(201).json(response);
  })
);

// List tenants with pagination
router.get('/',
  validatePagination(),
  asyncHandler(async (req, res) => {
    const result = await tenantService.listTenants(req.query);
    const response = createSuccessResponse(result.data?.data, { pagination: result.data?.meta });
    res.json(response);
  })
);

// Get tenant by ID
router.get('/:id',
  validateUuidParam(),
  asyncHandler(async (req, res) => {
    const result = await tenantService.getTenant(req.params.id);
    const response = createSuccessResponse(result.data);
    res.json(response);
  })
);

// Update tenant
router.patch('/:id',
  validateUuidParam(),
  validateRequest(tenantCreateSchema.partial()),
  asyncHandler(async (req, res) => {
    const result = await tenantService.updateTenant(req.params.id, req.body);
    const response = createSuccessResponse(result.data);
    res.json(response);
  })
);

// Delete tenant
router.delete('/:id',
  validateUuidParam(),
  asyncHandler(async (req, res) => {
    await tenantService.deleteTenant(req.params.id);
    const response = createSuccessResponse(null);
    res.json(response);
  })
);

// Update Samsara configuration
router.patch('/:id/samsara',
  validateUuidParam(),
  validateRequest(z.object({
    samsaraApiToken: z.string().min(1),
    samsaraGroupId: z.string().optional(),
    samsaraWebhookSecret: z.string().optional(),
  })),
  asyncHandler(async (req, res) => {
    const result = await tenantService.updateSamsaraConfig(req.params.id, req.body);
    const response = createSuccessResponse(result.data);
    res.json(response);
  })
);

// Update WhatsApp configuration
router.patch('/:id/whatsapp',
  validateUuidParam(),
  validateRequest(z.object({
    whatsappPhoneNumber: z.string().min(1),
    whatsappPhoneNumberId: z.string().min(1),
    whatsappBusinessAccountId: z.string().min(1),
  })),
  asyncHandler(async (req, res) => {
    const result = await tenantService.updateWhatsAppConfig(req.params.id, req.body);
    const response = createSuccessResponse(result.data);
    res.json(response);
  })
);

// Update billing configuration
router.patch('/:id/billing',
  validateUuidParam(),
  validateRequest(z.object({
    stripeCustomerId: z.string().optional(),
    stripeSubscriptionId: z.string().optional(),
    billingEmail: z.string().email().optional(),
    autoPayment: z.boolean().optional(),
  })),
  asyncHandler(async (req, res) => {
    const result = await tenantService.updateBillingConfig(req.params.id, req.body);
    const response = createSuccessResponse(result.data);
    res.json(response);
  })
);

// Deactivate tenant
router.patch('/:id/deactivate',
  validateUuidParam(),
  asyncHandler(async (req, res) => {
    const result = await tenantService.deactivateTenant(req.params.id);
    const response = createSuccessResponse(result.data);
    res.json(response);
  })
);

// Reactivate tenant
router.patch('/:id/reactivate',
  validateUuidParam(),
  asyncHandler(async (req, res) => {
    const result = await tenantService.reactivateTenant(req.params.id);
    const response = createSuccessResponse(result.data);
    res.json(response);
  })
);

export { router as tenantRoutes };