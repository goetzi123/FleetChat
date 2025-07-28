import express from "express";
import { z } from "zod";
import { storage } from "./storage";
import { encrypt, decrypt, type EncryptedData } from "./encryption";
import { validateSamsaraToken, hasRequiredScopes, getRequiredScopes } from "./samsara-token-validator";
import { createTenantWebhook, deleteTenantWebhook } from "./webhook-manager";

const router = express.Router();

// Validation schemas
const samsaraConfigSchema = z.object({
  apiToken: z.string().min(1, "API token is required"),
  orgId: z.string().optional()
});

const tenantIdSchema = z.object({
  tenantId: z.string().uuid("Invalid tenant ID")
});

/**
 * Configure Samsara integration for a tenant
 */
router.post("/api/tenant/:tenantId/samsara/configure", async (req, res) => {
  try {
    const { tenantId } = tenantIdSchema.parse(req.params);
    const { apiToken, orgId } = samsaraConfigSchema.parse(req.body);

    // Validate the API token
    console.log(`Validating Samsara token for tenant ${tenantId}`);
    const validation = await validateSamsaraToken(apiToken);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: "Invalid Samsara API token",
        details: validation.error
      });
    }

    // Check if token has required scopes
    const requiredScopes = getRequiredScopes();
    const hasRequired = hasRequiredScopes(validation.scopes);
    
    if (!hasRequired) {
      return res.status(400).json({
        success: false,
        error: "API token missing required permissions",
        required: requiredScopes,
        available: validation.scopes,
        missing: requiredScopes.filter(scope => !validation.scopes.includes(scope))
      });
    }

    // Encrypt the API token
    const encryptedToken = encrypt(apiToken);
    
    // Get base URL for webhook creation
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    
    // Create webhook for this tenant
    let webhookId: string | undefined;
    let webhookSecret: EncryptedData | undefined;
    
    try {
      const webhook = await createTenantWebhook(apiToken, tenantId, baseUrl);
      webhookId = webhook.webhookId;
      webhookSecret = encrypt(webhook.secret);
      console.log(`Created webhook ${webhookId} for tenant ${tenantId}`);
    } catch (webhookError) {
      console.warn(`Failed to create webhook for tenant ${tenantId}:`, webhookError);
      // Continue without webhook - can be set up manually
    }

    // Update tenant configuration
    await storage.updateTenant(tenantId, {
      samsaraApiToken: encryptedToken,
      samsaraOrgId: validation.orgId || orgId,
      samsaraWebhookId: webhookId,
      samsaraWebhookSecret: webhookSecret,
      samsaraWebhookUrl: webhookId ? `${baseUrl}/api/webhooks/samsara/${tenantId}` : null,
      samsaraScopes: validation.scopes,
      samsaraValidated: true,
      samsaraValidatedAt: new Date(),
      updatedAt: new Date()
    });

    res.json({
      success: true,
      validation: {
        orgId: validation.orgId,
        scopes: validation.scopes,
        drivers: validation.drivers,
        vehicles: validation.vehicles,
        webhookCreated: !!webhookId
      }
    });

  } catch (error) {
    console.error("Samsara configuration error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to configure Samsara integration",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Test Samsara API token without saving
 */
router.post("/api/tenant/samsara/validate", async (req, res) => {
  try {
    const { apiToken } = samsaraConfigSchema.parse(req.body);
    
    const validation = await validateSamsaraToken(apiToken);
    const requiredScopes = getRequiredScopes();
    
    res.json({
      valid: validation.valid,
      error: validation.error,
      scopes: validation.scopes,
      requiredScopes,
      hasRequiredScopes: hasRequiredScopes(validation.scopes),
      orgId: validation.orgId,
      drivers: validation.drivers,
      vehicles: validation.vehicles
    });

  } catch (error) {
    console.error("Token validation error:", error);
    res.status(400).json({
      valid: false,
      error: error instanceof Error ? error.message : "Invalid request"
    });
  }
});

/**
 * Get Samsara configuration status for a tenant
 */
router.get("/api/tenant/:tenantId/samsara/status", async (req, res) => {
  try {
    const { tenantId } = tenantIdSchema.parse(req.params);
    
    const tenant = await storage.getTenantById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: "Tenant not found"
      });
    }

    const hasToken = !!tenant.samsaraApiToken;
    let tokenValid = false;
    let scopes: string[] = [];
    
    // Test current token if it exists
    if (hasToken && tenant.samsaraApiToken) {
      try {
        const decryptedToken = decrypt(tenant.samsaraApiToken as EncryptedData);
        const validation = await validateSamsaraToken(decryptedToken);
        tokenValid = validation.valid;
        scopes = validation.scopes;
      } catch (error) {
        console.error("Error validating stored token:", error);
      }
    }

    res.json({
      configured: hasToken,
      validated: tokenValid,
      scopes,
      hasRequiredScopes: hasRequiredScopes(scopes),
      webhookConfigured: !!tenant.samsaraWebhookId,
      orgId: tenant.samsaraOrgId,
      lastValidated: tenant.samsaraValidatedAt
    });

  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check Samsara status"
    });
  }
});

/**
 * Remove Samsara configuration for a tenant
 */
router.delete("/api/tenant/:tenantId/samsara", async (req, res) => {
  try {
    const { tenantId } = tenantIdSchema.parse(req.params);
    
    const tenant = await storage.getTenantById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: "Tenant not found"
      });
    }

    // Delete webhook if it exists
    if (tenant.samsaraWebhookId && tenant.samsaraApiToken) {
      try {
        const decryptedToken = decrypt(tenant.samsaraApiToken as EncryptedData);
        await deleteTenantWebhook(decryptedToken, tenant.samsaraWebhookId);
        console.log(`Deleted webhook ${tenant.samsaraWebhookId} for tenant ${tenantId}`);
      } catch (error) {
        console.warn(`Failed to delete webhook for tenant ${tenantId}:`, error);
      }
    }

    // Clear Samsara configuration
    await storage.updateTenant(tenantId, {
      samsaraApiToken: null,
      samsaraOrgId: null,
      samsaraWebhookId: null,
      samsaraWebhookSecret: null,
      samsaraWebhookUrl: null,
      samsaraScopes: [],
      samsaraValidated: false,
      samsaraValidatedAt: null,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: "Samsara configuration removed"
    });

  } catch (error) {
    console.error("Configuration removal error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove Samsara configuration"
    });
  }
});

/**
 * Get drivers from Samsara for a specific tenant
 */
router.get("/api/tenant/:tenantId/samsara/drivers", async (req, res) => {
  try {
    const { tenantId } = tenantIdSchema.parse(req.params);
    
    const tenant = await storage.getTenantById(tenantId);
    if (!tenant || !tenant.samsaraApiToken) {
      return res.status(400).json({
        success: false,
        error: "Samsara not configured for this tenant"
      });
    }

    const decryptedToken = decrypt(tenant.samsaraApiToken as EncryptedData);
    
    // Fetch drivers from Samsara
    const response = await fetch(`https://api.samsara.com/fleet/drivers`, {
      headers: {
        'Authorization': `Bearer ${decryptedToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Samsara API error: ${response.status}`);
    }

    const driversData = await response.json();
    
    res.json({
      success: true,
      drivers: driversData.data || [],
      pagination: driversData.pagination
    });

  } catch (error) {
    console.error("Driver fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch drivers from Samsara"
    });
  }
});

export default router;