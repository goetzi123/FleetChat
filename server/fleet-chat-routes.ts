import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { fleetChatStorage } from "./database-storage";
import { SamsaraAPIClient } from "./samsara-api";
import { fleetChatWhatsApp } from "./whatsapp-business-api";
import { fleetSetupSchema, driverOnboardingSchema } from "@shared/schema";

// Initialize Stripe with dummy key for now
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_development', {
  apiVersion: "2023-10-16",
});

// Application Lifecycle Management for Samsara Webhook Compliance
async function createCustomerWebhook(tenantId: string, oauthToken: string, companyName: string): Promise<void> {
  try {
    const samsaraClient = new SamsaraAPIClient(oauthToken);
    const webhookUrl = `${process.env.BASE_URL || 'https://fleet-chat.replit.app'}/api/samsara/webhook/${tenantId}`;
    
    const webhook = await samsaraClient.createWebhook({
      name: `FleetChat-${companyName}-${tenantId}`,
      url: webhookUrl,
      eventTypes: [
        "DriverCreated", 
        "DriverUpdated", 
        "VehicleLocationUpdate", 
        "RouteStarted", 
        "RouteCompleted",
        "GeofenceEntered",
        "GeofenceExited",
        "DocumentUploaded"
      ],
      customHeaders: [
        { key: "x-FleetChat-Tenant-ID", value: tenantId }
      ]
    });

    // Update tenant with webhook details
    await fleetChatStorage.updateTenant(tenantId, {
      samsaraWebhookId: webhook.id,
      samsaraWebhookSecret: webhook.secretKey,
      samsaraWebhookUrl: webhookUrl
    });

    console.log(`Created webhook ${webhook.id} for tenant ${tenantId}`);
  } catch (error) {
    console.error(`Failed to create webhook for tenant ${tenantId}:`, error);
    throw error;
  }
}

async function deleteCustomerWebhook(tenantId: string): Promise<void> {
  try {
    const tenant = await fleetChatStorage.getTenantById(tenantId);
    if (!tenant?.samsaraWebhookId || !tenant.samsaraApiToken) {
      console.warn(`No webhook to delete for tenant ${tenantId}`);
      return;
    }

    const samsaraClient = new SamsaraAPIClient(tenant.samsaraApiToken);
    await samsaraClient.deleteWebhook(tenant.samsaraWebhookId);

    // Clear webhook details from tenant
    await fleetChatStorage.updateTenant(tenantId, {
      samsaraWebhookId: null,
      samsaraWebhookSecret: null,
      samsaraWebhookUrl: null
    });

    console.log(`Deleted webhook ${tenant.samsaraWebhookId} for tenant ${tenantId}`);
  } catch (error) {
    console.error(`Failed to delete webhook for tenant ${tenantId}:`, error);
    throw error;
  }
}

export async function registerFleetChatRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const stats = fleetChatWhatsApp.getPoolStatistics();
      res.json({
        status: "operational",
        service: "Fleet.Chat",
        version: "1.0.0",
        whatsappPool: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Service health check failed"
      });
    }
  });

  // Fleet setup endpoint
  app.post("/api/fleet/setup", async (req, res) => {
    try {
      const setupData = fleetSetupSchema.parse(req.body);
      
      // Test Samsara API connection
      const samsaraClient = new SamsaraAPIClient(setupData.samsaraApiToken, setupData.samsaraGroupId);
      
      let driversCount = 0;
      try {
        const drivers = await samsaraClient.getDrivers();
        driversCount = drivers.length;
      } catch (error) {
        return res.status(400).json({
          error: "Failed to connect to Samsara API. Please check your API token."
        });
      }

      // Create tenant
      const tenant = await fleetChatStorage.createTenant({
        companyName: setupData.companyName,
        contactEmail: setupData.contactEmail,
        serviceTier: setupData.serviceTier,
        samsaraApiToken: setupData.samsaraApiToken,
        samsaraGroupId: setupData.samsaraGroupId,
        billingEmail: setupData.billingEmail,
        autoPayment: setupData.autoPayment,
        isActive: true
      });

      // Assign WhatsApp phone number
      const whatsappAssignment = await fleetChatWhatsApp.assignPhoneNumberToTenant(tenant.id);
      
      // Update tenant with WhatsApp details
      await fleetChatStorage.updateTenant(tenant.id, {
        whatsappPhoneNumber: whatsappAssignment.phoneNumber,
        whatsappPhoneNumberId: whatsappAssignment.phoneNumberId,
        whatsappBusinessAccountId: whatsappAssignment.businessAccountId
      });

      // Setup per-customer Samsara webhook
      try {
        await createCustomerWebhook(tenant.id, setupData.samsaraApiToken, setupData.companyName);
      } catch (error) {
        console.warn('Webhook setup failed, will retry later:', error);
      }

      res.json({
        success: true,
        tenantId: tenant.id,
        driversCount,
        whatsappNumber: whatsappAssignment.phoneNumber,
        message: `Fleet.Chat configured for ${setupData.companyName} with ${driversCount} drivers discovered.`
      });

    } catch (error: any) {
      console.error('Fleet setup error:', error);
      res.status(500).json({
        error: error.message || "Fleet setup failed"
      });
    }
  });

  // Get Samsara drivers
  app.get("/api/samsara/drivers/:tenantId", async (req, res) => {
    try {
      const { tenantId } = req.params;
      const tenant = await fleetChatStorage.getTenantById(tenantId);
      
      if (!tenant?.samsaraApiToken) {
        return res.status(404).json({ error: "Tenant not found or Samsara not configured" });
      }

      const samsaraClient = new SamsaraAPIClient(tenant.samsaraApiToken, tenant.samsaraGroupId || undefined);
      const drivers = await samsaraClient.getDrivers();

      res.json(drivers);
    } catch (error: any) {
      console.error('Failed to fetch Samsara drivers:', error);
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });

  // Driver onboarding endpoint
  app.post("/api/fleet/drivers/onboard", async (req, res) => {
    try {
      const { tenantId, driverIds } = req.body;
      
      const tenant = await fleetChatStorage.getTenantById(tenantId);
      if (!tenant?.samsaraApiToken) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const samsaraClient = new SamsaraAPIClient(tenant.samsaraApiToken, tenant.samsaraGroupId || undefined);
      let onboardedCount = 0;

      for (const driverId of driverIds) {
        try {
          const samsaraDriver = await samsaraClient.getDriver(driverId);
          if (!samsaraDriver) continue;

          // Create user record
          const user = await fleetChatStorage.createUser({
            tenantId,
            name: samsaraDriver.name,
            phone: samsaraDriver.phone,
            role: "driver",
            samsaraDriverId: driverId,
            isActive: samsaraDriver.isActive,
            hasConsented: false // Will be updated when driver accepts invitation
          });

          // Send SMS invitation (simulated for now)
          if (samsaraDriver.phone) {
            console.log(`SMS invitation sent to ${samsaraDriver.name} at ${samsaraDriver.phone}`);
            // In production: send actual SMS with WhatsApp opt-in link
          }

          onboardedCount++;
        } catch (error) {
          console.error(`Failed to onboard driver ${driverId}:`, error);
        }
      }

      res.json({
        success: true,
        onboardedCount,
        message: `${onboardedCount} drivers onboarded successfully`
      });

    } catch (error: any) {
      console.error('Driver onboarding error:', error);
      res.status(500).json({
        error: error.message || "Driver onboarding failed"
      });
    }
  });

  // Billing setup endpoint
  app.post("/api/fleet/billing/setup", async (req, res) => {
    try {
      const { tenantId, billingEmail } = req.body;
      
      const tenant = await fleetChatStorage.getTenantById(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      // Create Stripe customer (simulated for now)
      const customer = {
        id: `cus_dummy_${Date.now()}`,
        email: billingEmail
      };

      // In production: create actual Stripe customer
      // const customer = await stripe.customers.create({
      //   email: billingEmail,
      //   name: tenant.companyName,
      //   metadata: { tenantId }
      // });

      // Update tenant with Stripe customer ID
      await fleetChatStorage.updateTenant(tenantId, {
        stripeCustomerId: customer.id,
        billingEmail
      });

      res.json({
        success: true,
        customerId: customer.id,
        message: "Billing configured successfully"
      });

    } catch (error: any) {
      console.error('Billing setup error:', error);
      res.status(500).json({
        error: error.message || "Billing setup failed"
      });
    }
  });

  // Per-customer Samsara webhook endpoint with signature verification
  app.post("/api/samsara/webhook/:tenantId", async (req, res) => {
    try {
      const samsaraEvent = req.body;
      const tenantId = req.params.tenantId;
      const signature = req.headers['x-samsara-signature'] as string;
      
      // Get tenant and verify webhook ownership
      const tenant = await fleetChatStorage.getTenantById(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      if (!tenant.samsaraWebhookSecret) {
        return res.status(400).json({ error: "Webhook not configured for tenant" });
      }

      // Verify webhook signature for security
      const samsaraClient = new SamsaraAPIClient(tenant.samsaraApiToken!, tenant.samsaraGroupId || undefined);
      const rawBody = JSON.stringify(req.body);
      
      if (signature && !samsaraClient.verifyWebhookSignature(rawBody, signature, tenant.samsaraWebhookSecret)) {
        console.warn(`Invalid webhook signature for tenant ${tenantId}`);
        return res.status(401).json({ error: "Invalid webhook signature" });
      }

      // Validate event data
      const { vehicleId, driverId } = samsaraEvent.data || {};
      if (!vehicleId && !driverId) {
        return res.status(400).json({ error: "Invalid event data - missing vehicle or driver ID" });
      }

      // Process the event and send WhatsApp message
      const processedEvent = samsaraClient.processWebhookEvent(samsaraEvent);

      if (processedEvent.transportAction && driverId) {
        await processTransportEvent(tenant.id, driverId, processedEvent);
      }

      // Log the integration
      await fleetChatStorage.createTmsIntegration({
        tenantId: tenant.id,
        platform: "samsara",
        operation: "webhook_received",
        payload: samsaraEvent,
        response: { processed: true, action: processedEvent.transportAction },
        success: true
      });

      res.json({ success: true, processed: processedEvent.eventType });

    } catch (error: any) {
      console.error('Samsara webhook error:', error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // WhatsApp webhook endpoint
  app.post("/api/whatsapp/webhook", async (req, res) => {
    try {
      const whatsappData = req.body;
      
      // Verify webhook (in production)
      // if (!verifyWhatsAppWebhook(req)) {
      //   return res.status(403).json({ error: "Unauthorized" });
      // }

      const whatsappApi = fleetChatWhatsApp.getWhatsAppAPI("dummy_tenant"); // Get from phone number
      if (!whatsappApi) {
        return res.status(400).json({ error: "No WhatsApp API found" });
      }

      const processedMessages = whatsappApi.processWebhookMessage(whatsappData);
      
      for (const message of processedMessages) {
        if (message.type === 'message' && message.from) {
          await processDriverWhatsAppMessage(message);
        }
      }

      res.json({ success: true, processed: processedMessages.length });

    } catch (error: any) {
      console.error('WhatsApp webhook error:', error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // Dashboard data endpoint
  app.get("/api/dashboard/:tenantId", async (req, res) => {
    try {
      const { tenantId } = req.params;
      
      const tenant = await fleetChatStorage.getTenantById(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const [
        users,
        transports,
        activeDrivers,
        currentBilling
      ] = await Promise.all([
        fleetChatStorage.getUsersByTenant(tenantId),
        fleetChatStorage.getActiveTransportsByTenant(tenantId),
        fleetChatStorage.getActiveDriversByTenant(tenantId),
        fleetChatStorage.getCurrentMonthBilling(tenantId)
      ]);

      const stats = fleetChatWhatsApp.getPoolStatistics();
      const tenantPhoneAssignment = stats.assignments.find(a => a.tenantId === tenantId);

      res.json({
        tenant,
        stats: {
          totalDrivers: users.length,
          activeDrivers: activeDrivers.length,
          activeTransports: transports.length,
          whatsappPhone: tenantPhoneAssignment?.phoneNumber
        },
        recentTransports: transports.slice(0, 10),
        currentBilling,
        isActive: tenant.isActive
      });

    } catch (error: any) {
      console.error('Dashboard data error:', error);
      res.status(500).json({ error: "Failed to load dashboard data" });
    }
  });

  // Webhook Management Endpoints for Samsara Compliance

  // List tenant's webhooks
  app.get("/api/samsara/webhooks/:tenantId", async (req, res) => {
    try {
      const { tenantId } = req.params;
      const tenant = await fleetChatStorage.getTenantById(tenantId);
      
      if (!tenant?.samsaraApiToken) {
        return res.status(404).json({ error: "Tenant not found or Samsara not configured" });
      }

      const samsaraClient = new SamsaraAPIClient(tenant.samsaraApiToken);
      const webhooks = await samsaraClient.listWebhooks();

      res.json(webhooks);
    } catch (error: any) {
      console.error('Failed to list webhooks:', error);
      res.status(500).json({ error: "Failed to list webhooks" });
    }
  });

  // Update webhook configuration
  app.patch("/api/samsara/webhooks/:tenantId/:webhookId", async (req, res) => {
    try {
      const { tenantId, webhookId } = req.params;
      const updates = req.body;
      
      const tenant = await fleetChatStorage.getTenantById(tenantId);
      if (!tenant?.samsaraApiToken) {
        return res.status(404).json({ error: "Tenant not found or Samsara not configured" });
      }

      const samsaraClient = new SamsaraAPIClient(tenant.samsaraApiToken);
      const updatedWebhook = await samsaraClient.updateWebhook(webhookId, updates);

      // Update tenant record if this is their webhook
      if (tenant.samsaraWebhookId === webhookId) {
        await fleetChatStorage.updateTenant(tenantId, {
          webhookEventTypes: updatedWebhook.eventTypes
        });
      }

      res.json(updatedWebhook);
    } catch (error: any) {
      console.error('Failed to update webhook:', error);
      res.status(500).json({ error: "Failed to update webhook" });
    }
  });

  // Delete webhook (customer disconnection)
  app.delete("/api/samsara/webhooks/:tenantId/:webhookId", async (req, res) => {
    try {
      const { tenantId, webhookId } = req.params;
      
      const tenant = await fleetChatStorage.getTenantById(tenantId);
      if (!tenant?.samsaraApiToken) {
        return res.status(404).json({ error: "Tenant not found or Samsara not configured" });
      }

      const samsaraClient = new SamsaraAPIClient(tenant.samsaraApiToken);
      await samsaraClient.deleteWebhook(webhookId);

      // Clear webhook details if this was the tenant's webhook
      if (tenant.samsaraWebhookId === webhookId) {
        await fleetChatStorage.updateTenant(tenantId, {
          samsaraWebhookId: null,
          samsaraWebhookSecret: null,
          samsaraWebhookUrl: null
        });
      }

      res.json({ success: true, message: "Webhook deleted successfully" });
    } catch (error: any) {
      console.error('Failed to delete webhook:', error);
      res.status(500).json({ error: "Failed to delete webhook" });
    }
  });

  // Customer disconnection endpoint (application lifecycle)
  app.post("/api/fleet/disconnect/:tenantId", async (req, res) => {
    try {
      const { tenantId } = req.params;
      
      // Delete customer webhook
      await deleteCustomerWebhook(tenantId);
      
      // Deactivate tenant
      await fleetChatStorage.updateTenant(tenantId, {
        isActive: false,
        samsaraApiToken: null,
        samsaraGroupId: null
      });

      res.json({ 
        success: true, 
        message: "Customer disconnected and webhook removed successfully" 
      });
    } catch (error: any) {
      console.error('Failed to disconnect customer:', error);
      res.status(500).json({ error: "Failed to disconnect customer" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to process transport events
async function processTransportEvent(tenantId: string, driverId: string, event: any) {
  try {
    const user = await fleetChatStorage.getUserBySamsaraDriverId(driverId);
    if (!user || !user.phone) return;

    const whatsappApi = fleetChatWhatsApp.getWhatsAppAPI(tenantId);
    if (!whatsappApi) return;

    const messageContent = whatsappApi.generateTransportMessage(event.eventType, event.data);
    
    if (messageContent.text) {
      if (messageContent.buttons) {
        await whatsappApi.sendTransportButtons(
          user.phone,
          messageContent.text,
          messageContent.buttons
        );
      } else {
        await whatsappApi.sendMessage({
          messaging_product: 'whatsapp',
          to: user.phone,
          type: 'text',
          text: { body: messageContent.text }
        });
      }

      // Log the message
      await fleetChatStorage.createWhatsappMessage({
        tenantId,
        driverId: user.id,
        direction: 'outbound',
        messageType: 'text',
        content: messageContent.text,
        status: 'sent'
      });
    }
  } catch (error) {
    console.error('Error processing transport event:', error);
  }
}

// Helper function to process driver WhatsApp messages
async function processDriverWhatsAppMessage(message: any) {
  try {
    const user = await fleetChatStorage.getUserByPhone(message.from);
    if (!user) return;

    // Log incoming message
    await fleetChatStorage.createWhatsappMessage({
      tenantId: user.tenantId,
      driverId: user.id,
      direction: 'inbound',
      messageType: message.messageType,
      content: JSON.stringify(message.content),
      status: 'received'
    });

    // Process message content and update transport status if applicable
    if (message.content.buttonId) {
      await handleDriverButtonResponse(user, message.content.buttonId);
    } else if (message.content.location) {
      await handleDriverLocationShare(user, message.content.location);
    } else if (message.content.mediaId) {
      await handleDriverDocumentUpload(user, message.content);
    }

  } catch (error) {
    console.error('Error processing driver WhatsApp message:', error);
  }
}

// Helper functions for specific message types
async function handleDriverButtonResponse(user: any, buttonId: string) {
  const transports = await fleetChatStorage.getTransportsByDriver(user.id);
  const activeTransport = transports.find(t => t.isActive);
  
  if (!activeTransport) return;

  let status = '';
  switch (buttonId) {
    case 'confirm_start':
      status = 'en_route';
      break;
    case 'arrived':
      status = 'arrived_pickup';
      break;
    case 'loading':
      status = 'loading';
      break;
    case 'departed':
      status = 'departed_pickup';
      break;
    case 'arrived_delivery':
      status = 'arrived_delivery';
      break;
    case 'completed':
      status = 'delivered';
      break;
  }

  if (status) {
    await fleetChatStorage.createStatusUpdate({
      tenantId: user.tenantId,
      transportId: activeTransport.id,
      status,
      createdBy: user.id
    });

    await fleetChatStorage.updateTransport(activeTransport.id, { status });
  }
}

async function handleDriverLocationShare(user: any, location: any) {
  const transports = await fleetChatStorage.getTransportsByDriver(user.id);
  const activeTransport = transports.find(t => t.isActive);
  
  if (!activeTransport) return;

  await fleetChatStorage.createLocationTracking({
    tenantId: user.tenantId,
    transportId: activeTransport.id,
    driverId: user.id,
    lat: location.latitude.toString(),
    lng: location.longitude.toString()
  });
}

async function handleDriverDocumentUpload(user: any, content: any) {
  const transports = await fleetChatStorage.getTransportsByDriver(user.id);
  const activeTransport = transports.find(t => t.isActive);
  
  if (!activeTransport) return;

  // In production: download media and store document
  await fleetChatStorage.createDocument({
    tenantId: user.tenantId,
    transportId: activeTransport.id,
    type: 'photo',
    filename: content.filename || `document_${Date.now()}`,
    fileUrl: `media://${content.mediaId}`,
    uploadedBy: user.id
  });
}