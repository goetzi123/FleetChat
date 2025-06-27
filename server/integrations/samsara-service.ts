import { SamsaraAPIClient, SamsaraIntegrationConfig, mapSamsaraEventToFleetChat, mapFleetChatToSamsaraRoute, SamsaraEventTypes } from "./samsara";
import { WhatsAppTemplateService } from "./whatsapp-templates";
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
        syncInterval: 5, // minutes
        requiredScopes: [
          'fleet:drivers:read',
          'fleet:drivers:appSettings:read'
        ]
      };

      this.apiClient = new SamsaraAPIClient(this.config);
      this.initializeDriverPhoneAccess();
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

    // Send WhatsApp notification for location updates
    const transport = await storage.getTransportById(event.transportId);
    if (transport) {
      const template = WhatsAppTemplateService.getLocationUpdateTemplate(transport, {
        id: '',
        transportId: event.transportId,
        driverId: event.driverId,
        lat: event.location.lat,
        lng: event.location.lng,
        accuracy: event.location.accuracy,
        speed: event.location.speed,
        heading: event.location.heading,
        timestamp: new Date()
      });
      await this.sendWhatsAppNotification(event.driverId, template);
    }

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

    // Send WhatsApp notification to driver
    if (event.driverId) {
      const transport = await storage.getTransportById(event.transportId);
      if (transport) {
        const template = WhatsAppTemplateService.getRouteStartedTemplate(transport);
        await this.sendWhatsAppNotification(event.driverId, template);
      }
    }

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

  // Enhanced driver phone number management
  public async getDriverWithPhone(driverId: string) {
    if (!this.apiClient) {
      throw new Error("Samsara API client not configured");
    }
    return await this.apiClient.getDriverWithPhone(driverId);
  }

  public async validateDriverPhoneAccess() {
    if (!this.apiClient) {
      throw new Error("Samsara API client not configured");
    }
    return await this.apiClient.validateDriverPhoneAccess();
  }

  // WhatsApp integration for Samsara drivers
  public async linkDriverToWhatsApp(samsaraDriverId: string, whatsappNumber: string) {
    try {
      // Get driver details from Samsara with phone verification
      const samsaraDriver = await this.getDriverWithPhone(samsaraDriverId);
      
      if (!samsaraDriver.hasPhoneNumber) {
        throw new Error(`Driver ${samsaraDriverId} does not have a phone number in Samsara. Please add phone number in Samsara Dashboard.`);
      }

      // Create or update FleetChat user with Samsara driver mapping
      let user = await storage.getUserByEmail(`samsara_${samsaraDriverId}@driver.local`);
      
      if (!user) {
        user = await storage.createUser({
          email: `samsara_${samsaraDriverId}@driver.local`,
          name: samsaraDriver.name,
          phone: samsaraDriver.phoneNumber,
          role: 'driver',
          isAnonymous: true,
          pseudoId: `DRV_${samsaraDriverId.slice(-6)}`,
          whatsappNumber: whatsappNumber
        });
      } else {
        user = await storage.updateUser(user.id, {
          phone: samsaraDriver.phoneNumber,
          whatsappNumber: whatsappNumber
        });
      }

      console.log(`Successfully linked Samsara driver ${samsaraDriverId} to WhatsApp ${whatsappNumber}`);
      return {
        success: true,
        fleetChatUserId: user.id,
        samsaraDriverId,
        whatsappNumber,
        samsaraPhone: samsaraDriver.phoneNumber
      };

    } catch (error) {
      console.error(`Failed to link driver ${samsaraDriverId} to WhatsApp:`, error);
      throw error;
    }
  }

  public async syncDriverPhoneNumbers() {
    try {
      const phoneAccessValidation = await this.validateDriverPhoneAccess();
      console.log('Driver phone access validation:', phoneAccessValidation);

      if (!phoneAccessValidation.phoneAccessEnabled) {
        console.warn('No drivers have phone numbers accessible. Check API scopes and dashboard configuration.');
        return {
          success: false,
          error: 'Phone access not enabled',
          validation: phoneAccessValidation
        };
      }

      const drivers = await this.getDrivers();
      const syncResults: Array<{
        samsaraDriverId: string;
        fleetChatUserId?: string;
        phoneNumber: string | null;
        synced: boolean;
        reason?: string;
        error?: string;
      }> = [];

      for (const driver of drivers.data || []) {
        try {
          const driverWithPhone = await this.getDriverWithPhone(driver.id);
          
          if (driverWithPhone.hasPhoneNumber) {
            // Update existing FleetChat user or create mapping
            let user = await storage.getUserByEmail(`samsara_${driver.id}@driver.local`);
            
            if (!user) {
              user = await storage.createUser({
                email: `samsara_${driver.id}@driver.local`,
                name: driverWithPhone.name,
                phone: driverWithPhone.phoneNumber,
                role: 'driver',
                isAnonymous: true,
                pseudoId: `DRV_${driver.id.slice(-6)}`
              });
            } else {
              user = await storage.updateUser(user.id, {
                phone: driverWithPhone.phoneNumber
              });
            }

            syncResults.push({
              samsaraDriverId: driver.id,
              fleetChatUserId: user.id,
              phoneNumber: driverWithPhone.phoneNumber,
              synced: true
            });
          } else {
            syncResults.push({
              samsaraDriverId: driver.id,
              phoneNumber: null,
              synced: false,
              reason: 'No phone number in Samsara'
            });
          }
        } catch (error) {
          syncResults.push({
            samsaraDriverId: driver.id,
            phoneNumber: null,
            synced: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return {
        success: true,
        validation: phoneAccessValidation,
        syncResults,
        syncedCount: syncResults.filter(r => r.synced).length
      };

    } catch (error) {
      console.error('Failed to sync driver phone numbers:', error);
      throw error;
    }
  }

  private async initializeDriverPhoneAccess() {
    try {
      const validation = await this.validateDriverPhoneAccess();
      console.log('Samsara driver phone access initialized:', validation);
      
      if (!validation.phoneAccessEnabled) {
        console.warn(`
=== Samsara Driver Phone Access Setup Required ===
Phone numbers are not accessible for drivers. To enable WhatsApp integration:

1. Ensure driver phone numbers are entered in Samsara Dashboard:
   - Go to Drivers → Select Driver → Settings → Phone Number
   
2. Verify API token includes required scopes:
   - 'fleet:drivers:read'
   - 'fleet:drivers:appSettings:read'
   
3. Check organization privacy settings:
   - Contact Samsara Support if privacy flags prevent phone number exposure
   
Current status: ${validation.driversWithPhone}/${validation.totalDrivers} drivers have accessible phone numbers
=================================================
        `);
      } else {
        console.log(`✓ Driver phone access enabled: ${validation.driversWithPhone}/${validation.totalDrivers} drivers have phone numbers`);
      }
    } catch (error) {
      console.error('Failed to initialize driver phone access:', error);
    }
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

  // WhatsApp notification method for driver communication
  private async sendWhatsAppNotification(driverId: string, template: {
    type: string;
    message: string;
    buttons?: string[];
    quickReplies?: string[];
  }) {
    try {
      const driver = await storage.getUserById(driverId);
      if (!driver || !driver.whatsappNumber) {
        console.log(`Driver ${driverId} not found or no WhatsApp number configured`);
        return;
      }

      // Log WhatsApp notification for now - in production this would integrate with WhatsApp Business API
      console.log(`WhatsApp notification to ${driver.whatsappNumber}:`, {
        driver: driver.name || driver.pseudoId,
        type: template.type,
        message: template.message,
        buttons: template.buttons || [],
        quickReplies: template.quickReplies || []
      });

      // In production, this would call WhatsApp Business API:
      // await whatsappAPI.sendMessage(driver.whatsappNumber, notification.message);
      
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error);
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