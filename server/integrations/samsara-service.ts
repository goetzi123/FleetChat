import { SamsaraAPIClient, SamsaraIntegrationConfig, mapSamsaraEventToFleetChat, mapFleetChatToSamsaraRoute, SamsaraEventTypes } from "./samsara";
import { storage } from "../storage";

export class SamsaraIntegrationService {
  private apiClient: SamsaraAPIClient | null = null;
  private config: SamsaraIntegrationConfig | null = null;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeFromEnvironment();
  }

  private initializeFromEnvironment() {
    const apiToken = process.env.SAMSARA_API_TOKEN;
    const orgId = process.env.SAMSARA_ORG_ID;
    const webhookUrl = process.env.SAMSARA_WEBHOOK_URL;

    if (apiToken && orgId) {
      this.config = {
        apiToken,
        orgId,
        webhookUrl,
        enabledEvents: [
          SamsaraEventTypes.VEHICLE_LOCATION,
          SamsaraEventTypes.TRIP_STARTED,
          SamsaraEventTypes.TRIP_COMPLETED,
          SamsaraEventTypes.GEOFENCE_ENTER,
          SamsaraEventTypes.GEOFENCE_EXIT,
          SamsaraEventTypes.DOCUMENT_UPLOADED,
          SamsaraEventTypes.DRIVER_DUTY_STATUS
        ],
        syncInterval: 5 // minutes
      };

      this.apiClient = new SamsaraAPIClient(this.config);
      this.startPeriodicSync();
    }
  }

  public isConfigured(): boolean {
    return this.apiClient !== null && this.config !== null;
  }

  public getConfiguration(): SamsaraIntegrationConfig | null {
    return this.config;
  }

  // Event Processing
  public async processWebhookEvent(samsaraEvent: any): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error("Samsara integration not configured");
    }

    const fleetChatEvent = mapSamsaraEventToFleetChat(samsaraEvent);

    switch (fleetChatEvent.type) {
      case 'location_update':
        return await this.handleLocationUpdate(fleetChatEvent);
      
      case 'transport_started':
        return await this.handleTransportStarted(fleetChatEvent);
      
      case 'transport_completed':
        return await this.handleTransportCompleted(fleetChatEvent);
      
      case 'geofence_enter':
        return await this.handleGeofenceEvent(fleetChatEvent);
      
      case 'document_uploaded':
        return await this.handleDocumentUploaded(fleetChatEvent);
      
      default:
        console.log(`Unhandled Samsara event type: ${fleetChatEvent.type}`);
        return { processed: false, reason: "Unknown event type" };
    }
  }

  private async handleLocationUpdate(event: any) {
    if (!event.transportId || !event.driverId) return { processed: false };

    await storage.createLocationTracking({
      transportId: event.transportId,
      driverId: event.driverId,
      lat: event.location.lat,
      lng: event.location.lng,
      accuracy: event.location.accuracy,
      speed: event.location.speed,
      heading: event.location.heading
    });

    return { processed: true, type: 'location_update' };
  }

  private async handleTransportStarted(event: any) {
    if (!event.transportId) return { processed: false };

    await storage.updateTransport(event.transportId, {
      status: 'en_route'
    });

    await storage.createStatusUpdate({
      transportId: event.transportId,
      status: 'en_route',
      notes: "Transport started (Samsara)"
    });

    return { processed: true, type: 'transport_started' };
  }

  private async handleTransportCompleted(event: any) {
    if (!event.transportId) return { processed: false };

    await storage.updateTransport(event.transportId, {
      status: 'completed',
      isActive: false,
      deliveryActual: new Date()
    });

    await storage.createStatusUpdate({
      transportId: event.transportId,
      status: 'completed',
      notes: "Transport completed (Samsara)"
    });

    return { processed: true, type: 'transport_completed' };
  }

  private async handleGeofenceEvent(event: any) {
    if (!event.transportId) return { processed: false };

    await storage.createLocationTracking({
      transportId: event.transportId,
      driverId: event.driverId || "samsara-driver",
      lat: event.location.lat,
      lng: event.location.lng,
      isGeofenced: true,
      geofenceType: event.geofenceType
    });

    // Update transport status based on geofence type
    let status = '';
    if (event.geofenceType?.includes('pickup')) {
      status = 'arrived_pickup';
    } else if (event.geofenceType?.includes('delivery')) {
      status = 'arrived_delivery';
    }

    if (status) {
      await storage.createStatusUpdate({
        transportId: event.transportId,
        status,
        location: event.geofenceType,
        lat: event.location.lat,
        lng: event.location.lng,
        notes: `Geofence entered: ${event.geofenceType}`
      });
    }

    return { processed: true, type: 'geofence_event' };
  }

  private async handleDocumentUploaded(event: any) {
    console.log("Document uploaded via Samsara:", event);
    return { processed: true, type: 'document_uploaded' };
  }

  // API Integration Methods
  public async createSamsaraRoute(transportId: string, vehicleId: string, driverId?: string) {
    if (!this.apiClient) {
      throw new Error("Samsara API client not configured");
    }

    const transport = await storage.getTransportById(transportId);
    if (!transport) {
      throw new Error("Transport not found");
    }

    const routeData = mapFleetChatToSamsaraRoute({
      ...transport,
      samsaraVehicleId: vehicleId,
      samsaraDriverId: driverId
    });

    try {
      const samsaraRoute = await this.apiClient.createRoute(routeData);
      
      // Update transport with Samsara route ID
      await storage.updateTransport(transportId, {
        samsaraRouteId: samsaraRoute.id,
        samsaraVehicleId: vehicleId,
        samsaraDriverId: driverId
      });

      // Log successful integration
      await storage.createTmsIntegration({
        transportId,
        platform: "samsara",
        operation: "create_route",
        payload: JSON.stringify(routeData),
        response: JSON.stringify(samsaraRoute),
        success: true
      });

      return samsaraRoute;
    } catch (error) {
      await storage.createTmsIntegration({
        transportId,
        platform: "samsara",
        operation: "create_route",
        payload: JSON.stringify(routeData),
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }

  public async syncTransportWithSamsara(transportId: string) {
    if (!this.apiClient) {
      throw new Error("Samsara API client not configured");
    }

    const transport = await storage.getTransportById(transportId);
    if (!transport || !transport.samsaraRouteId) {
      throw new Error("Transport not found or not linked to Samsara");
    }

    try {
      const samsaraRoute = await this.apiClient.getRoute(transport.samsaraRouteId);
      
      // Update transport status based on Samsara route status
      const statusMapping: Record<string, string> = {
        'planned': 'pending',
        'in_progress': 'en_route',
        'completed': 'completed',
        'cancelled': 'cancelled'
      };

      const newStatus = statusMapping[samsaraRoute.status] || transport.status;
      
      if (newStatus !== transport.status) {
        await storage.updateTransport(transportId, {
          status: newStatus,
          isActive: newStatus !== 'completed' && newStatus !== 'cancelled'
        });

        await storage.createStatusUpdate({
          transportId,
          status: newStatus,
          notes: `Status synced from Samsara: ${samsaraRoute.status}`
        });
      }

      await storage.createTmsIntegration({
        transportId,
        platform: "samsara",
        operation: "sync",
        payload: JSON.stringify({ action: "status_sync" }),
        response: JSON.stringify(samsaraRoute),
        success: true
      });

      return { synced: true, status: newStatus, samsaraStatus: samsaraRoute.status };
    } catch (error) {
      await storage.createTmsIntegration({
        transportId,
        platform: "samsara",
        operation: "sync",
        success: false,
        errorMessage: error instanceof Error ? error.message : "Sync failed"
      });
      throw error;
    }
  }

  public async getVehicles() {
    if (!this.apiClient) {
      throw new Error("Samsara API client not configured");
    }
    return await this.apiClient.getVehicles();
  }

  public async getDrivers() {
    if (!this.apiClient) {
      throw new Error("Samsara API client not configured");
    }
    return await this.apiClient.getDrivers();
  }

  public async getVehicleLocation(vehicleId: string) {
    if (!this.apiClient) {
      throw new Error("Samsara API client not configured");
    }
    return await this.apiClient.getVehicleLocation(vehicleId);
  }

  // Periodic Sync
  private startPeriodicSync() {
    if (!this.config) return;

    this.syncInterval = setInterval(async () => {
      await this.performPeriodicSync();
    }, this.config.syncInterval * 60 * 1000); // Convert minutes to milliseconds
  }

  private async performPeriodicSync() {
    try {
      const activeTransports = await storage.getActiveTransports();
      const samsaraTransports = activeTransports.filter(t => t.samsaraRouteId);

      for (const transport of samsaraTransports) {
        try {
          await this.syncTransportWithSamsara(transport.id);
        } catch (error) {
          console.error(`Failed to sync transport ${transport.id}:`, error);
        }
      }

      console.log(`Synced ${samsaraTransports.length} Samsara transports`);
    } catch (error) {
      console.error("Periodic sync error:", error);
    }
  }

  public stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Webhook Management
  public async setupWebhooks() {
    if (!this.apiClient || !this.config?.webhookUrl) {
      throw new Error("Samsara API client or webhook URL not configured");
    }

    try {
      const webhook = await this.apiClient.createWebhook(
        this.config.webhookUrl,
        this.config.enabledEvents
      );

      console.log("Samsara webhook created:", webhook);
      return webhook;
    } catch (error) {
      console.error("Failed to create Samsara webhook:", error);
      throw error;
    }
  }
}

// Singleton instance
export const samsaraService = new SamsaraIntegrationService();