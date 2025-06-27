import express from "express";
import { z } from "zod";
import { storage } from "./storage";
import {
  createUserSchema,
  createTransportSchema,
  transportStatusUpdateSchema,
  locationUpdateSchema,
  documentUploadSchema,
  yardOperationSchema,
  TransportStatus,
  UserRole,
  WorkflowType,
  DocumentType
} from "../shared/schema";
import { 
  SamsaraAPIClient, 
  mapSamsaraEventToFleetChat, 
  mapFleetChatToSamsaraRoute,
  samsaraEventSchema,
  SamsaraEventTypes
} from "./integrations/samsara";
import { samsaraService } from "./integrations/samsara-service";
import { whatsappResponseHandler } from "./integrations/whatsapp-response-handler";

const router = express.Router();

// Helper function to generate anonymized pseudo IDs for drivers
function generatePseudoId(): string {
  return `driver_${Math.random().toString(36).substring(2, 8)}`;
}

// Users routes
router.post("/api/users", async (req, res) => {
  try {
    const userData = createUserSchema.parse(req.body);
    
    // Generate pseudo ID for anonymous drivers
    if (userData.role === UserRole.DRIVER && userData.isAnonymous) {
      userData.pseudoId = generatePseudoId();
    }
    
    const user = await storage.createUser(userData);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
  }
});

router.get("/api/users", async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/api/users/:id", async (req, res) => {
  try {
    const user = await storage.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Transports routes
router.post("/api/transports", async (req, res) => {
  try {
    const transportData = createTransportSchema.parse(req.body);
    
    // Convert datetime strings to Date objects
    const processedData = {
      ...transportData,
      pickupEta: transportData.pickupEta ? new Date(transportData.pickupEta) : undefined,
      deliveryEta: transportData.deliveryEta ? new Date(transportData.deliveryEta) : undefined,
    };
    
    const transport = await storage.createTransport(processedData);
    
    // Log TMS integration for external transports
    if (transportData.externalId) {
      await storage.createTmsIntegration({
        transportId: transport.id,
        platform: "samsara", // Default platform
        operation: "create",
        payload: JSON.stringify(req.body),
        success: true
      });
    }
    
    res.json(transport);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
  }
});

router.get("/api/transports", async (req, res) => {
  try {
    const { driverId, dispatcherId, status, active } = req.query;
    
    let transports;
    if (driverId) {
      transports = await storage.getTransportsByDriverId(driverId as string);
    } else if (dispatcherId) {
      transports = await storage.getTransportsByDispatcherId(dispatcherId as string);
    } else if (active === "true") {
      transports = await storage.getActiveTransports();
    } else {
      transports = await storage.getAllTransports();
    }
    
    // Filter by status if provided
    if (status) {
      transports = transports.filter(t => t.status === status);
    }
    
    res.json(transports);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transports" });
  }
});

router.get("/api/transports/:id", async (req, res) => {
  try {
    const transport = await storage.getTransportById(req.params.id);
    if (!transport) {
      return res.status(404).json({ error: "Transport not found" });
    }
    res.json(transport);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transport" });
  }
});

router.patch("/api/transports/:id", async (req, res) => {
  try {
    const updates = req.body;
    const transport = await storage.updateTransport(req.params.id, updates);
    res.json(transport);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Update failed" });
  }
});

// Status updates routes
router.post("/api/transports/:id/status", async (req, res) => {
  try {
    const statusData = transportStatusUpdateSchema.parse(req.body);
    const transportId = req.params.id;
    
    // Verify transport exists
    const transport = await storage.getTransportById(transportId);
    if (!transport) {
      return res.status(404).json({ error: "Transport not found" });
    }
    
    // Create status update
    const statusUpdate = await storage.createStatusUpdate({
      transportId,
      ...statusData,
      createdBy: req.body.createdBy || transport.driverId
    });
    
    // Update transport status
    await storage.updateTransport(transportId, { 
      status: statusData.status
    });
    
    // Log TMS integration for status updates
    if (transport.externalId) {
      await storage.createTmsIntegration({
        transportId,
        platform: "uber_freight",
        operation: "status_update",
        payload: JSON.stringify(statusData),
        success: true
      });
    }
    
    res.json(statusUpdate);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid status update" });
  }
});

router.get("/api/transports/:id/status", async (req, res) => {
  try {
    const statusUpdates = await storage.getStatusUpdatesByTransportId(req.params.id);
    res.json(statusUpdates);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch status updates" });
  }
});

// Location tracking routes
router.post("/api/transports/:id/location", async (req, res) => {
  try {
    const locationData = locationUpdateSchema.parse(req.body);
    const transportId = req.params.id;
    
    // Verify transport exists
    const transport = await storage.getTransportById(transportId);
    if (!transport) {
      return res.status(404).json({ error: "Transport not found" });
    }
    
    // Create location tracking entry
    const location = await storage.createLocationTracking({
      transportId,
      driverId: transport.driverId!,
      ...locationData
    });
    
    // Calculate geofencing (simplified logic)
    let geofenceData: { isGeofenced?: boolean; geofenceType?: string } = {};
    
    if (transport.pickupLat && transport.pickupLng) {
      const pickupDistance = Math.sqrt(
        Math.pow(locationData.lat - transport.pickupLat, 2) + 
        Math.pow(locationData.lng - transport.pickupLng, 2)
      );
      if (pickupDistance < 0.01) { // ~1km radius
        geofenceData.isGeofenced = true;
        geofenceData.geofenceType = "pickup";
      }
    }
    
    if (transport.deliveryLat && transport.deliveryLng) {
      const deliveryDistance = Math.sqrt(
        Math.pow(locationData.lat - transport.deliveryLat, 2) + 
        Math.pow(locationData.lng - transport.deliveryLng, 2)
      );
      if (deliveryDistance < 0.01) { // ~1km radius
        geofenceData.isGeofenced = true;
        geofenceData.geofenceType = "delivery";
      }
    }
    
    // Update location with geofence info if detected
    if (geofenceData.isGeofenced) {
      const updatedLocation = await storage.createLocationTracking({
        transportId,
        driverId: transport.driverId!,
        ...locationData,
        isGeofenced: geofenceData.isGeofenced,
        geofenceType: geofenceData.geofenceType
      });
      return res.json(updatedLocation);
    }
    
    res.json(location);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid location data" });
  }
});

router.get("/api/transports/:id/location", async (req, res) => {
  try {
    const locations = await storage.getLocationTrackingByTransportId(req.params.id);
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch location data" });
  }
});

// Documents routes
router.post("/api/transports/:id/documents", async (req, res) => {
  try {
    const documentData = documentUploadSchema.parse(req.body);
    const transportId = req.params.id;
    
    // Verify transport exists
    const transport = await storage.getTransportById(transportId);
    if (!transport) {
      return res.status(404).json({ error: "Transport not found" });
    }
    
    const document = await storage.createDocument({
      transportId,
      ...documentData,
      uploadedBy: req.body.uploadedBy || transport.driverId
    });
    
    res.json(document);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid document data" });
  }
});

router.get("/api/transports/:id/documents", async (req, res) => {
  try {
    const documents = await storage.getDocumentsByTransportId(req.params.id);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

router.patch("/api/documents/:id", async (req, res) => {
  try {
    const { isApproved, approvedBy, notes } = req.body;
    const updates: any = {};
    
    if (typeof isApproved === "boolean") {
      updates.isApproved = isApproved;
      updates.approvedAt = isApproved ? new Date() : null;
    }
    
    if (approvedBy) updates.approvedBy = approvedBy;
    if (notes) updates.notes = notes;
    
    const document = await storage.updateDocument(req.params.id, updates);
    res.json(document);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Update failed" });
  }
});

router.get("/api/documents/pending", async (req, res) => {
  try {
    const documents = await storage.getPendingDocuments();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pending documents" });
  }
});

// Yard operations routes
router.post("/api/yard-operations", async (req, res) => {
  try {
    const yardData = yardOperationSchema.parse(req.body);
    
    // Generate QR code for check-in operations
    if (yardData.operationType === "check_in") {
      yardData.qrCode = `YARD_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
    
    const yardOperation = await storage.createYardOperation(yardData);
    res.json(yardOperation);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid yard operation data" });
  }
});

router.get("/api/yard-operations", async (req, res) => {
  try {
    const { transportId, yardLocation } = req.query;
    
    let operations;
    if (transportId) {
      operations = await storage.getYardOperationsByTransportId(transportId as string);
    } else if (yardLocation) {
      operations = await storage.getYardOperationsByYardLocation(yardLocation as string);
    } else {
      operations = [];
    }
    
    res.json(operations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch yard operations" });
  }
});

router.patch("/api/yard-operations/:id", async (req, res) => {
  try {
    const updates = req.body;
    if (updates.completed) {
      updates.completedAt = new Date();
    }
    
    const yardOperation = await storage.updateYardOperation(req.params.id, updates);
    res.json(yardOperation);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Update failed" });
  }
});

// TMS Integration routes
router.get("/api/tms-integrations", async (req, res) => {
  try {
    const { transportId, platform } = req.query;
    
    let integrations;
    if (transportId) {
      integrations = await storage.getTmsIntegrationsByTransportId(transportId as string);
    } else if (platform) {
      integrations = await storage.getTmsIntegrationsByPlatform(platform as string);
    } else {
      integrations = [];
    }
    
    res.json(integrations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch TMS integrations" });
  }
});

// Dashboard/Analytics routes
router.get("/api/dashboard/stats", async (req, res) => {
  try {
    const transports = await storage.getAllTransports();
    const users = await storage.getAllUsers();
    const documents = await storage.getPendingDocuments();
    
    const stats = {
      totalTransports: transports.length,
      activeTransports: transports.filter(t => t.isActive).length,
      completedTransports: transports.filter(t => t.status === TransportStatus.COMPLETED).length,
      totalDrivers: users.filter(u => u.role === UserRole.DRIVER).length,
      totalDispatchers: users.filter(u => u.role === UserRole.DISPATCHER).length,
      pendingDocuments: documents.length,
      transportsByStatus: {
        pending: transports.filter(t => t.status === TransportStatus.PENDING).length,
        enRoute: transports.filter(t => t.status === TransportStatus.EN_ROUTE).length,
        delivered: transports.filter(t => t.status === TransportStatus.DELIVERED).length,
        completed: transports.filter(t => t.status === TransportStatus.COMPLETED).length
      }
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

// Samsara Integration Routes

// Samsara Webhook endpoint - receives events from Samsara platform
router.post("/api/samsara/webhook", async (req, res) => {
  try {
    console.log("Received Samsara webhook:", req.body);
    
    // Validate Samsara event payload
    const samsaraEvent = samsaraEventSchema.parse(req.body);
    
    // Map Samsara event to FleetChat action
    const fleetChatEvent = mapSamsaraEventToFleetChat(samsaraEvent);
    
    // Process the event based on type
    switch (fleetChatEvent.type) {
      case 'location_update':
        if (fleetChatEvent.transportId) {
          await storage.createLocationTracking({
            transportId: fleetChatEvent.transportId,
            driverId: fleetChatEvent.driverId,
            lat: fleetChatEvent.location.lat,
            lng: fleetChatEvent.location.lng,
            accuracy: fleetChatEvent.location.accuracy,
            speed: fleetChatEvent.location.speed,
            heading: fleetChatEvent.location.heading
          });
        }
        break;
        
      case 'transport_started':
        if (fleetChatEvent.transportId) {
          await storage.updateTransport(fleetChatEvent.transportId, {
            status: fleetChatEvent.status
          });
          
          await storage.createStatusUpdate({
            transportId: fleetChatEvent.transportId,
            status: fleetChatEvent.status,
            notes: "Transport started from Samsara"
          });
        }
        break;
        
      case 'transport_completed':
        if (fleetChatEvent.transportId) {
          await storage.updateTransport(fleetChatEvent.transportId, {
            status: fleetChatEvent.status,
            isActive: false
          });
          
          await storage.createStatusUpdate({
            transportId: fleetChatEvent.transportId,
            status: fleetChatEvent.status,
            notes: "Transport completed from Samsara"
          });
        }
        break;
        
      case 'geofence_enter':
        if (fleetChatEvent.transportId) {
          await storage.createLocationTracking({
            transportId: fleetChatEvent.transportId,
            driverId: fleetChatEvent.driverId || "unknown",
            lat: fleetChatEvent.location.lat,
            lng: fleetChatEvent.location.lng,
            isGeofenced: true,
            geofenceType: fleetChatEvent.geofenceType
          });
        }
        break;
        
      case 'document_uploaded':
        // Handle document upload notification from Samsara
        console.log("Document uploaded via Samsara:", fleetChatEvent);
        break;
    }
    
    // Log the webhook event
    await storage.createTmsIntegration({
      transportId: fleetChatEvent.transportId || "unknown",
      platform: "samsara",
      operation: "webhook_received",
      payload: JSON.stringify(req.body),
      response: JSON.stringify(fleetChatEvent),
      success: true
    });
    
    res.status(200).json({ status: "processed", eventType: fleetChatEvent.type });
  } catch (error) {
    console.error("Samsara webhook error:", error);
    
    // Log failed webhook
    await storage.createTmsIntegration({
      transportId: "unknown",
      platform: "samsara",
      operation: "webhook_received",
      payload: JSON.stringify(req.body),
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error"
    });
    
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid webhook payload" });
  }
});

// Create route in Samsara when transport is created
router.post("/api/samsara/routes", async (req, res) => {
  try {
    const { transportId, vehicleId, driverId } = req.body;
    
    const transport = await storage.getTransportById(transportId);
    if (!transport) {
      return res.status(404).json({ error: "Transport not found" });
    }
    
    // Map FleetChat transport to Samsara route format
    const samsaraRouteData = mapFleetChatToSamsaraRoute({
      ...transport,
      samsaraVehicleId: vehicleId,
      samsaraDriverId: driverId
    });
    
    // Update transport with Samsara IDs
    await storage.updateTransport(transportId, {
      samsaraVehicleId: vehicleId,
      samsaraDriverId: driverId
    });
    
    // Log integration attempt
    await storage.createTmsIntegration({
      transportId,
      platform: "samsara",
      operation: "create_route",
      payload: JSON.stringify(samsaraRouteData),
      success: true
    });
    
    res.json({ 
      message: "Route mapped to Samsara",
      routeData: samsaraRouteData,
      transportId
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create Samsara route" });
  }
});

// Get Samsara vehicles
router.get("/api/samsara/vehicles", async (req, res) => {
  try {
    if (!samsaraService.isConfigured()) {
      return res.status(503).json({ 
        error: "Samsara integration not configured",
        message: "Please configure SAMSARA_API_TOKEN and SAMSARA_ORG_ID environment variables"
      });
    }

    const vehicles = await samsaraService.getVehicles();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to fetch Samsara vehicles",
      configured: samsaraService.isConfigured()
    });
  }
});

// Get Samsara drivers with enhanced phone number access
router.get("/api/samsara/drivers", async (req, res) => {
  try {
    if (!samsaraService.isConfigured()) {
      return res.status(503).json({ 
        error: "Samsara integration not configured",
        message: "Please configure SAMSARA_API_TOKEN and SAMSARA_ORG_ID environment variables"
      });
    }

    const drivers = await samsaraService.getDrivers();
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to fetch Samsara drivers",
      configured: samsaraService.isConfigured()
    });
  }
});

// Get specific driver with phone number access
router.get("/api/samsara/drivers/:driverId", async (req, res) => {
  try {
    if (!samsaraService.isConfigured()) {
      return res.status(503).json({ 
        error: "Samsara integration not configured"
      });
    }

    const driverWithPhone = await samsaraService.getDriverWithPhone(req.params.driverId);
    res.json(driverWithPhone);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to fetch driver details"
    });
  }
});

// Validate driver phone number access
router.get("/api/samsara/validate-phone-access", async (req, res) => {
  try {
    if (!samsaraService.isConfigured()) {
      return res.status(503).json({ 
        error: "Samsara integration not configured",
        phoneAccessEnabled: false,
        totalDrivers: 0,
        driversWithPhone: 0
      });
    }

    const validation = await samsaraService.validateDriverPhoneAccess();
    res.json(validation);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to validate phone access",
      phoneAccessEnabled: false
    });
  }
});

// Sync driver phone numbers from Samsara
router.post("/api/samsara/sync-drivers", async (req, res) => {
  try {
    if (!samsaraService.isConfigured()) {
      return res.status(503).json({ 
        error: "Samsara integration not configured"
      });
    }

    const syncResult = await samsaraService.syncDriverPhoneNumbers();
    res.json(syncResult);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to sync driver phone numbers"
    });
  }
});

// Link Samsara driver to WhatsApp
router.post("/api/samsara/link-whatsapp", async (req, res) => {
  try {
    if (!samsaraService.isConfigured()) {
      return res.status(503).json({ 
        error: "Samsara integration not configured"
      });
    }

    const { samsaraDriverId, whatsappNumber } = req.body;
    
    if (!samsaraDriverId || !whatsappNumber) {
      return res.status(400).json({ 
        error: "Missing required fields: samsaraDriverId and whatsappNumber" 
      });
    }

    const linkResult = await samsaraService.linkDriverToWhatsApp(samsaraDriverId, whatsappNumber);
    res.json(linkResult);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to link driver to WhatsApp"
    });
  }
});

// Get legacy mock vehicles for demo purposes
router.get("/api/samsara/demo-vehicles", async (req, res) => {
  try {
    const vehicles = [
      {
        id: "samsara_vehicle_001",
        name: "Truck 001",
        licensePlate: "ABC-123",
        make: "Volvo",
        model: "VNL",
        location: {
          latitude: 48.1351,
          longitude: 11.5820,
          address: "Munich, Germany"
        }
      }
    ];
    
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Samsara vehicles" });
  }
});

// Get Samsara drivers
router.get("/api/samsara/drivers", async (req, res) => {
  try {
    // This would integrate with actual Samsara API
    const drivers = [
      {
        id: "samsara_driver_001",
        name: "Hans Mueller",
        dutyStatus: "on_duty",
        currentVehicleId: "samsara_vehicle_001"
      },
      {
        id: "samsara_driver_002",
        name: "Stefan Weber", 
        dutyStatus: "driving",
        currentVehicleId: "samsara_vehicle_002"
      }
    ];
    
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Samsara drivers" });
  }
});

// Get Samsara events for a transport
router.get("/api/samsara/events/:transportId", async (req, res) => {
  try {
    const { transportId } = req.params;
    const { startTime, endTime } = req.query;
    
    // Get TMS integrations for this transport from Samsara
    const integrations = await storage.getTmsIntegrationsByTransportId(transportId);
    const samsaraIntegrations = integrations.filter(i => i.platform === "samsara");
    
    res.json({
      transportId,
      events: samsaraIntegrations,
      timeRange: { startTime, endTime }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Samsara events" });
  }
});

// Sync transport status with Samsara
router.post("/api/samsara/sync/:transportId", async (req, res) => {
  try {
    const { transportId } = req.params;
    
    const transport = await storage.getTransportById(transportId);
    if (!transport) {
      return res.status(404).json({ error: "Transport not found" });
    }
    
    // This would sync with actual Samsara API
    const syncResult = {
      transportId,
      samsaraRouteId: transport.samsaraRouteId,
      status: "synced",
      lastSync: new Date().toISOString()
    };
    
    // Log sync operation
    await storage.createTmsIntegration({
      transportId,
      platform: "samsara",
      operation: "sync",
      payload: JSON.stringify({ action: "manual_sync" }),
      response: JSON.stringify(syncResult),
      success: true
    });
    
    res.json(syncResult);
  } catch (error) {
    res.status(500).json({ error: "Failed to sync with Samsara" });
  }
});

// WhatsApp Webhook for incoming messages from drivers
router.post("/api/whatsapp/webhook", async (req, res) => {
  try {
    // Validate WhatsApp webhook signature (in production)
    // const signature = req.headers['x-whatsapp-signature'];
    // validateWebhookSignature(req.body, signature);

    const webhookData = req.body;
    
    // Process WhatsApp webhook data
    if (webhookData.entry && webhookData.entry[0]?.changes) {
      for (const change of webhookData.entry[0].changes) {
        if (change.value?.messages) {
          for (const message of change.value.messages) {
            const incomingMessage = {
              from: message.from,
              to: change.value.metadata.phone_number_id,
              messageId: message.id,
              timestamp: new Date(parseInt(message.timestamp) * 1000),
              type: message.type,
              content: extractMessageContent(message),
              contextMessageId: message.context?.id
            };

            // Process the incoming message
            const response = await whatsappResponseHandler.processIncomingMessage(incomingMessage);
            
            // Send response back to driver (in production, this would use WhatsApp Business API)
            if (response) {
              console.log(`WhatsApp response to ${incomingMessage.from}:`, response);
              // await sendWhatsAppMessage(incomingMessage.from, response);
            }
          }
        }
      }
    }

    res.status(200).json({ status: "processed" });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// WhatsApp webhook verification (required by WhatsApp)
router.get("/api/whatsapp/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // Verify webhook with WhatsApp
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send("Verification failed");
  }
});

// Helper function to extract message content from WhatsApp webhook
function extractMessageContent(message: any) {
  switch (message.type) {
    case 'text':
      return { text: message.text.body };
    case 'button':
      return { buttonId: message.button.payload };
    case 'interactive':
      if (message.interactive.type === 'button_reply') {
        return { buttonId: message.interactive.button_reply.id };
      } else if (message.interactive.type === 'list_reply') {
        return { quickReplyId: message.interactive.list_reply.id };
      }
      break;
    case 'location':
      return {
        location: {
          lat: message.location.latitude,
          lng: message.location.longitude,
          address: message.location.address
        }
      };
    case 'document':
      return {
        document: {
          filename: message.document.filename,
          mimeType: message.document.mime_type,
          fileUrl: message.document.id // In production, this would be resolved to actual URL
        }
      };
    case 'image':
      return {
        document: {
          filename: `image_${message.id}.jpg`,
          mimeType: 'image/jpeg',
          fileUrl: message.image.id
        }
      };
    default:
      return {};
  }
}

export default router;