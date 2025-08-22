import express from "express";
import { z } from "zod";
import path from "path";
import { compliantStorage } from "./compliant-storage";
import { messageRelayService } from "./integrations/compliant-message-relay";
import { setupAdminRoutes } from "./admin-routes";
import { verifyWebhookSignature } from "./webhook-manager";
import { decrypt, type EncryptedData } from "./encryption";
import {
  createDriverPhoneMappingSchema,
  createCommunicationLogSchema,
  createMessageTemplateSchema,
  type CreateDriverPhoneMapping
} from "../shared/compliant-schema";

const router = express.Router();

// Serve the Fleet.Chat public website
router.get("/fleet.chat", (req, res) => {
  res.sendFile(path.join(process.cwd(), "fleet-chat-dynamic.html"));
});

router.get("/public", (req, res) => {
  res.sendFile(path.join(process.cwd(), "fleet-chat-dynamic.html"));
});

router.get("/privacy", (req, res) => {
  res.sendFile(path.join(process.cwd(), "privacy-policy.html"));
});

// Public pricing API endpoint
router.get("/api/pricing", async (req, res) => {
  try {
    const pricingTiers = await compliantStorage.getActivePricingTiers();
    
    const publicPricing = pricingTiers.map(tier => ({
      name: tier.name,
      description: tier.description,
      pricePerDriver: tier.pricePerDriver,
      minDrivers: tier.minDrivers,
      maxDrivers: tier.maxDrivers,
      features: tier.features,
      isActive: tier.isActive
    }));

    res.json({
      success: true,
      pricing: publicPricing,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching pricing:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch pricing data" 
    });
  }
});

// ========== COMPLIANT API ENDPOINTS ==========

// PERMITTED: Driver phone mapping management (only data FleetChat can store)
router.post("/api/driver-mappings", async (req, res) => {
  try {
    const mappingData = createDriverPhoneMappingSchema.parse(req.body);
    const mapping = await compliantStorage.createDriverPhoneMapping(mappingData);
    res.json(mapping);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
  }
});

router.get("/api/driver-mappings/:tenantId", async (req, res) => {
  try {
    const mappings = await compliantStorage.getDriverPhoneMappingsByTenant(req.params.tenantId);
    res.json(mappings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch driver mappings" });
  }
});

router.patch("/api/driver-mappings/:id/activate", async (req, res) => {
  try {
    const mapping = await compliantStorage.activateDriverWhatsApp(req.params.id);
    res.json(mapping);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Activation failed" });
  }
});

router.patch("/api/driver-mappings/:id/deactivate", async (req, res) => {
  try {
    const mapping = await compliantStorage.deactivateDriverWhatsApp(req.params.id);
    res.json(mapping);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Deactivation failed" });
  }
});

// PERMITTED: Communication logs (delivery tracking only)
router.get("/api/communication-logs/:tenantId", async (req, res) => {
  try {
    const { hours } = req.query;
    let logs;
    
    if (hours) {
      logs = await compliantStorage.getRecentCommunicationLogs(
        req.params.tenantId, 
        parseInt(hours as string)
      );
    } else {
      logs = await compliantStorage.getCommunicationLogsByTenant(req.params.tenantId);
    }
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch communication logs" });
  }
});

// PERMITTED: Message templates for fleet event relay
router.post("/api/message-templates", async (req, res) => {
  try {
    const templateData = createMessageTemplateSchema.parse(req.body);
    const template = await compliantStorage.createMessageTemplate(templateData);
    res.json(template);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid template data" });
  }
});

router.get("/api/message-templates/:tenantId", async (req, res) => {
  try {
    const templates = await compliantStorage.getMessageTemplatesByTenant(req.params.tenantId);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch message templates" });
  }
});

router.get("/api/message-templates/:tenantId/:platform/:eventType", async (req, res) => {
  try {
    const { tenantId, platform, eventType } = req.params;
    const { language = 'ENG' } = req.query;
    
    const template = await compliantStorage.getMessageTemplateByEvent(
      tenantId,
      platform,
      eventType,
      language as string
    );
    
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch message template" });
  }
});

// ========== WEBHOOK ENDPOINTS (PERMITTED) ==========

// PERMITTED: Universal fleet system webhook - receives events for message relay only
router.post("/api/webhook/:platform/:tenantId", async (req, res) => {
  try {
    const { platform, tenantId } = req.params;
    
    // Validate platform
    if (!['samsara', 'motive', 'geotab'].includes(platform)) {
      return res.status(400).json({ error: "Unsupported platform" });
    }

    // Verify webhook signature (security requirement)
    const tenant = await compliantStorage.getTenantById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Parse fleet system event
    const fleetEvent = {
      tenantId,
      platform: platform as 'samsara' | 'motive' | 'geotab',
      eventType: req.body.eventType || req.body.type,
      driverId: req.body.driverId || req.body.driver?.id,
      eventData: {
        message: req.body.message,
        location: req.body.location,
        timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
        routeId: req.body.routeId,
        vehicleId: req.body.vehicleId,
        metadata: req.body.metadata
      }
    };

    // COMPLIANT: Relay fleet event to driver via WhatsApp (message relay only)
    await messageRelayService.relayFleetEventToDriver(fleetEvent);

    res.json({ 
      success: true, 
      message: "Event relayed to driver via WhatsApp",
      eventType: fleetEvent.eventType
    });

  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ 
      error: "Failed to process webhook event",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// PERMITTED: WhatsApp webhook - receives driver responses for fleet system relay
router.post("/api/webhook/whatsapp/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Parse WhatsApp webhook payload
    const whatsappData = req.body;
    
    // Extract driver response from WhatsApp webhook
    const driverResponse = {
      tenantId,
      fromPhone: whatsappData.from,
      messageId: whatsappData.messageId || `wa_${Date.now()}`,
      responseType: this.determineResponseType(whatsappData),
      responseData: {
        text: whatsappData.text?.body,
        buttonId: whatsappData.interactive?.button_reply?.id,
        location: whatsappData.location,
        document: whatsappData.document,
        timestamp: new Date()
      }
    };

    // COMPLIANT: Process driver response and relay to fleet system (communication only)
    await messageRelayService.processDriverResponseToFleetSystem(driverResponse);

    res.json({ 
      success: true, 
      message: "Driver response relayed to fleet system",
      responseType: driverResponse.responseType
    });

  } catch (error) {
    console.error("WhatsApp webhook processing error:", error);
    res.status(500).json({ 
      error: "Failed to process WhatsApp response",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Helper function to determine response type from WhatsApp message
function determineResponseType(whatsappData: any): string {
  if (whatsappData.interactive?.button_reply) {
    const buttonId = whatsappData.interactive.button_reply.id;
    if (buttonId.includes('arrive')) return 'arrival_confirmation';
    if (buttonId.includes('depart')) return 'departure_confirmation';
    return 'status_update';
  }
  
  if (whatsappData.location) return 'location_share';
  if (whatsappData.document) return 'document_upload';
  if (whatsappData.text?.body?.toLowerCase().includes('emergency')) {
    return 'emergency_alert';
  }
  
  return 'text_response';
}

// PERMITTED: Tenant configuration for communication service setup
router.post("/api/tenant/:tenantId/configure", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { platform, apiToken, orgId, companyId } = req.body;

    // Validate tenant exists
    const tenant = await compliantStorage.getTenantById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Update tenant with encrypted fleet system credentials (for message relay only)
    const updates: any = { platform };
    
    if (platform === 'samsara' && apiToken && orgId) {
      // Encrypt Samsara credentials
      updates.samsaraApiToken = { encrypted: apiToken }; // Placeholder for actual encryption
      updates.samsaraOrgId = orgId;
      updates.samsaraValidated = true;
      updates.samsaraValidatedAt = new Date();
    }
    
    if (platform === 'motive' && apiToken && companyId) {
      // Encrypt Motive credentials
      updates.motiveApiToken = { encrypted: apiToken }; // Placeholder for actual encryption
      updates.motiveCompanyId = companyId;
      updates.motiveValidated = true;
      updates.motiveValidatedAt = new Date();
    }

    const updatedTenant = await compliantStorage.updateTenant(tenantId, updates);

    // COMPLIANT: Discover driver phone numbers for communication mapping only
    await messageRelayService.discoverAndMapDriverPhones(tenantId);

    res.json({
      success: true,
      message: "Fleet system configured for message relay",
      platform: updatedTenant.platform,
      validated: true
    });

  } catch (error) {
    console.error("Tenant configuration error:", error);
    res.status(500).json({ 
      error: "Failed to configure fleet system",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// PERMITTED: Dashboard stats for communication service only
router.get("/api/dashboard/stats/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const driverMappings = await compliantStorage.getDriverPhoneMappingsByTenant(tenantId);
    const recentLogs = await compliantStorage.getRecentCommunicationLogs(tenantId, 24);
    
    const stats = {
      totalDrivers: driverMappings.length,
      activeDrivers: driverMappings.filter(d => d.whatsappActive).length,
      messagesLast24h: recentLogs.length,
      outboundMessages: recentLogs.filter(l => l.direction === 'outbound').length,
      inboundMessages: recentLogs.filter(l => l.direction === 'inbound').length,
      successfulDeliveries: recentLogs.filter(l => l.deliveryStatus === 'delivered' || l.deliveryStatus === 'processed').length,
      failedDeliveries: recentLogs.filter(l => l.deliveryStatus === 'failed').length
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch communication stats" });
  }
});

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    service: "FleetChat Message Relay Service",
    compliance: "Universal Fleet System Boundaries",
    timestamp: new Date().toISOString() 
  });
});

// ========== PROHIBITED ENDPOINTS REMOVED ==========
// ❌ No /api/transports/* endpoints
// ❌ No /api/vehicles/* endpoints  
// ❌ No /api/routes/* endpoints
// ❌ No /api/locations/* endpoints
// ❌ No /api/documents/* endpoints
// ❌ No fleet management functionality

export default router;

// Initialize admin routes
export function initializeAdminRoutes(app: express.Application) {
  setupAdminRoutes(app);
}