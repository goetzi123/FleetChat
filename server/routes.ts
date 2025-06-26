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
        platform: "uber_freight", // Default platform
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
      status: statusData.status,
      updatedAt: new Date()
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
    let isGeofenced = false;
    let geofenceType = undefined;
    
    if (transport.pickupLat && transport.pickupLng) {
      const pickupDistance = Math.sqrt(
        Math.pow(locationData.lat - transport.pickupLat, 2) + 
        Math.pow(locationData.lng - transport.pickupLng, 2)
      );
      if (pickupDistance < 0.01) { // ~1km radius
        isGeofenced = true;
        geofenceType = "pickup";
      }
    }
    
    if (transport.deliveryLat && transport.deliveryLng) {
      const deliveryDistance = Math.sqrt(
        Math.pow(locationData.lat - transport.deliveryLat, 2) + 
        Math.pow(locationData.lng - transport.deliveryLng, 2)
      );
      if (deliveryDistance < 0.01) { // ~1km radius
        isGeofenced = true;
        geofenceType = "delivery";
      }
    }
    
    // Update location with geofence info
    if (isGeofenced) {
      await storage.createLocationTracking({
        transportId,
        driverId: transport.driverId!,
        ...locationData,
        isGeofenced,
        geofenceType
      });
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

export default router;