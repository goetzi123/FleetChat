import express from "express";
import { z } from "zod";
import { storage } from "../storage";
import { MotiveCommunicationProvider, MotiveEventTypes } from "./motive-integration";
import { MotiveWebhookHandler } from "./motive-webhook-handler";
import { encrypt, decrypt, type EncryptedData } from "../encryption";

const router = express.Router();

// Motive Configuration Schema - Compliant with Universal Boundaries
const motiveConfigSchema = z.object({
  apiToken: z.string().min(10),
  companyId: z.string().optional(),
  webhookEvents: z.array(z.string()).default([
    MotiveEventTypes.VEHICLE_LOCATION_UPDATED,
    MotiveEventTypes.VEHICLE_GEOFENCE_EVENT,
    MotiveEventTypes.DRIVER_PERFORMANCE_EVENT,
    MotiveEventTypes.HOS_VIOLATION,
    MotiveEventTypes.FAULT_CODE_OPENED,
    MotiveEventTypes.FAULT_CODE_CLOSED
  ])
});

// Validate Motive API Token - Compliant: Authentication check only
async function validateMotiveToken(apiToken: string): Promise<{
  valid: boolean;
  companyId?: string;
  error?: string;
}> {
  try {
    const provider = new MotiveCommunicationProvider(apiToken);
    const isAuthenticated = await provider.authenticate();
    
    if (!isAuthenticated) {
      return { valid: false, error: "Invalid API token" };
    }

    // Get company info for webhook configuration
    const response = await fetch("https://api.gomotive.com/v3/company", {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const company = await response.json();
      return { 
        valid: true, 
        companyId: company.id?.toString() 
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('Motive token validation error:', error);
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Validation failed' 
    };
  }
}

/**
 * Configure Motive Integration - Compliant with Universal Boundaries
 * POST /api/tenant/:tenantId/motive/configure
 */
router.post("/api/tenant/:tenantId/motive/configure", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { apiToken, companyId, webhookEvents } = motiveConfigSchema.parse(req.body);

    // Validate Motive API token
    const validation = await validateMotiveToken(apiToken);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error || "Invalid Motive API token"
      });
    }

    // Get base URL for webhook configuration
    const baseUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : req.protocol + '://' + req.get('host');

    // Create Motive provider and setup webhook
    const provider = new MotiveCommunicationProvider(apiToken);
    const webhookUrl = `${baseUrl}/webhooks/motive/${tenantId}`;
    
    let webhookId: string | undefined;
    try {
      webhookId = await provider.subscribeToEvents(webhookUrl, webhookEvents);
    } catch (webhookError) {
      console.error('Webhook setup failed:', webhookError);
      // Continue with configuration even if webhook setup fails
    }

    // Encrypt and store Motive configuration
    const encryptedToken = encrypt(apiToken);
    const webhookSecret = Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const encryptedWebhookSecret = encrypt(webhookSecret);

    await storage.updateTenant(tenantId, {
      platform: "motive",
      motiveApiToken: encryptedToken as any,
      motiveCompanyId: validation.companyId || companyId || null,
      motiveWebhookId: webhookId || null,
      motiveWebhookSecret: encryptedWebhookSecret as any,
      motiveWebhookUrl: webhookUrl,
      motiveValidated: true,
      motiveValidatedAt: new Date()
    });

    console.log(`Motive integration configured for tenant ${tenantId}`);

    res.json({
      success: true,
      message: "Motive integration configured successfully",
      webhook: {
        id: webhookId,
        url: webhookUrl,
        events: webhookEvents
      },
      validation: {
        companyId: validation.companyId,
        authenticated: true
      }
    });
  } catch (error) {
    console.error("Motive configuration error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Configuration failed"
    });
  }
});

/**
 * Test Motive Connection - Compliant: Connection test only
 * POST /api/tenant/:tenantId/motive/test
 */
router.post("/api/tenant/:tenantId/motive/test", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await storage.getTenant(tenantId);
    
    if (!tenant?.motiveApiToken) {
      return res.status(400).json({
        success: false,
        error: "Motive not configured for this tenant"
      });
    }

    // Decrypt API token
    const decryptedToken = decrypt(tenant.motiveApiToken as EncryptedData);
    const provider = new MotiveCommunicationProvider(decryptedToken);

    // Test authentication
    const authenticated = await provider.authenticate();
    if (!authenticated) {
      return res.status(400).json({
        success: false,
        error: "Motive authentication failed"
      });
    }

    // Test driver data access (compliant: communication data only)
    try {
      const drivers = await provider.getDrivers();
      res.json({
        success: true,
        connection: "active",
        driverCount: drivers.length,
        sampleDriver: drivers[0] ? {
          id: drivers[0].id,
          name: drivers[0].name,
          hasPhone: !!drivers[0].phoneNumber
        } : null
      });
    } catch (driversError) {
      res.json({
        success: true,
        connection: "authenticated",
        warning: "Could not fetch drivers - may need additional permissions"
      });
    }
  } catch (error) {
    console.error("Motive test error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Test failed"
    });
  }
});

/**
 * Get Motive Drivers - Compliant: Phone number mapping only
 * GET /api/tenant/:tenantId/motive/drivers
 */
router.get("/api/tenant/:tenantId/motive/drivers", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await storage.getTenant(tenantId);
    
    if (!tenant?.motiveApiToken) {
      return res.status(400).json({
        success: false,
        error: "Motive not configured for this tenant"
      });
    }

    // Decrypt API token
    const decryptedToken = decrypt(tenant.motiveApiToken as EncryptedData);
    const provider = new MotiveCommunicationProvider(decryptedToken);

    // Get drivers for phone number mapping (compliant)
    const drivers = await provider.getDrivers();
    
    res.json({
      success: true,
      drivers: drivers.map(driver => ({
        id: driver.id,
        name: driver.name,
        phoneNumber: driver.phoneNumber,
        hasWhatsApp: !!driver.phoneNumber
      }))
    });
  } catch (error) {
    console.error("Motive drivers fetch error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch drivers"
    });
  }
});

/**
 * Map Motive Driver Phone Number - Compliant: Communication setup only
 * POST /api/tenant/:tenantId/motive/driver/:driverId/phone
 */
router.post("/api/tenant/:tenantId/motive/driver/:driverId/phone", async (req, res) => {
  try {
    const { tenantId, driverId } = req.params;
    const { phoneNumber } = z.object({ phoneNumber: z.string() }).parse(req.body);
    
    const tenant = await storage.getTenant(tenantId);
    if (!tenant?.motiveApiToken) {
      return res.status(400).json({
        success: false,
        error: "Motive not configured for this tenant"
      });
    }

    // Decrypt API token
    const decryptedToken = decrypt(tenant.motiveApiToken as EncryptedData);
    const provider = new MotiveCommunicationProvider(decryptedToken);

    // Verify driver exists
    const driver = await provider.getDriver(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: "Driver not found in Motive"
      });
    }

    // Store phone number mapping (compliant: communication data only)
    await storage.mapDriverPhone(tenantId, {
      fleetDriverId: driverId,
      phoneNumber,
      platform: "motive",
      driverName: driver.name,
      source: "manual"
    });

    console.log(`Phone mapping created: Motive driver ${driverId} -> ${phoneNumber}`);

    res.json({
      success: true,
      message: "Phone number mapped successfully",
      mapping: {
        driverId,
        driverName: driver.name,
        phoneNumber,
        platform: "motive"
      }
    });
  } catch (error) {
    console.error("Motive phone mapping error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Phone mapping failed"
    });
  }
});

/**
 * Get Motive Integration Status - Compliant: Status check only
 * GET /api/tenant/:tenantId/motive/status
 */
router.get("/api/tenant/:tenantId/motive/status", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await storage.getTenant(tenantId);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: "Tenant not found"
      });
    }

    const hasMotiveConfig = !!tenant.motiveApiToken;
    const status = {
      configured: hasMotiveConfig,
      validated: tenant.motiveValidated || false,
      validatedAt: tenant.motiveValidatedAt || null,
      webhookId: tenant.motiveWebhookId || null,
      webhookUrl: tenant.motiveWebhookUrl || null,
      companyId: tenant.motiveCompanyId || null
    };

    res.json({
      success: true,
      motive: status
    });
  } catch (error) {
    console.error("Motive status error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Status check failed"
    });
  }
});

export default router;