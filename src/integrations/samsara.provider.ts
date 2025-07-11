import { 
  IFleetProvider, 
  UnifiedDriver, 
  UnifiedVehicle, 
  UnifiedTrip, 
  UnifiedLocation, 
  UnifiedEvent,
  UnifiedDiagnostic,
  EventSubscription,
  FleetProviderHealthStatus,
  SAMSARA_EVENT_MAPPINGS,
  UNIFIED_EVENT_TYPES
} from './fleet-provider.interface';
import { 
  SamsaraIntegration, 
  SamsaraConfig, 
  SamsaraDriver, 
  SamsaraVehicle,
  createSamsaraIntegration 
} from './samsara.integration';
import { logger } from '../shared/logger';

export class SamsaraFleetProvider implements IFleetProvider {
  readonly platform = 'samsara' as const;
  readonly tenantId: string;
  
  private integration: SamsaraIntegration;
  private authenticated = false;
  private eventSubscriptions = new Map<string, EventSubscription>();

  constructor(config: SamsaraConfig, tenantId: string) {
    this.tenantId = tenantId;
    this.integration = createSamsaraIntegration(config);
  }

  async authenticate(): Promise<void> {
    try {
      // Samsara uses token-based auth, so we test with a simple API call
      await this.integration.getDrivers();
      this.authenticated = true;
      logger.info('Samsara authentication successful', { tenantId: this.tenantId });
    } catch (error) {
      this.authenticated = false;
      logger.error('Samsara authentication failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.authenticated = false;
    this.eventSubscriptions.clear();
    logger.info('Samsara provider disconnected', { tenantId: this.tenantId });
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }

  // Driver Management
  async getDrivers(): Promise<UnifiedDriver[]> {
    const samsaraDrivers = await this.integration.getDrivers();
    return samsaraDrivers.map(driver => this.mapToUnifiedFormat(driver, 'driver'));
  }

  async getDriver(driverId: string): Promise<UnifiedDriver> {
    const samsaraDriver = await this.integration.getDriver(driverId);
    return this.mapToUnifiedFormat(samsaraDriver, 'driver');
  }

  async updateDriver(driverId: string, updates: Partial<UnifiedDriver>): Promise<UnifiedDriver> {
    // Convert unified updates to Samsara format
    const samsaraUpdates = this.mapFromUnifiedFormat(updates, 'driver');
    const updatedDriver = await this.integration.updateDriver(driverId, samsaraUpdates);
    return this.mapToUnifiedFormat(updatedDriver, 'driver');
  }

  async searchDrivers(query: { name?: string; phone?: string; active?: boolean }): Promise<UnifiedDriver[]> {
    // Samsara doesn't have built-in search, so we'll get all drivers and filter
    const allDrivers = await this.getDrivers();
    return allDrivers.filter(driver => {
      if (query.name && !driver.name.toLowerCase().includes(query.name.toLowerCase())) return false;
      if (query.phone && driver.phone !== query.phone) return false;
      if (query.active !== undefined && driver.isActive !== query.active) return false;
      return true;
    });
  }

  // Vehicle Management
  async getVehicles(): Promise<UnifiedVehicle[]> {
    const samsaraVehicles = await this.integration.getVehicles();
    return samsaraVehicles.map(vehicle => this.mapToUnifiedFormat(vehicle, 'vehicle'));
  }

  async getVehicle(vehicleId: string): Promise<UnifiedVehicle> {
    const samsaraVehicle = await this.integration.getVehicle(vehicleId);
    return this.mapToUnifiedFormat(samsaraVehicle, 'vehicle');
  }

  async updateVehicle(vehicleId: string, updates: Partial<UnifiedVehicle>): Promise<UnifiedVehicle> {
    // Convert unified updates to Samsara format
    const samsaraUpdates = this.mapFromUnifiedFormat(updates, 'vehicle');
    const updatedVehicle = await this.integration.updateVehicle?.(vehicleId, samsaraUpdates);
    return this.mapToUnifiedFormat(updatedVehicle, 'vehicle');
  }

  async searchVehicles(query: { name?: string; vin?: string; licensePlate?: string }): Promise<UnifiedVehicle[]> {
    const allVehicles = await this.getVehicles();
    return allVehicles.filter(vehicle => {
      if (query.name && !vehicle.name.toLowerCase().includes(query.name.toLowerCase())) return false;
      if (query.vin && vehicle.vin !== query.vin) return false;
      if (query.licensePlate && vehicle.licensePlate !== query.licensePlate) return false;
      return true;
    });
  }

  // Trip Management
  async getTrips(query: {
    vehicleId?: string;
    driverId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<UnifiedTrip[]> {
    // Samsara routes are similar to trips
    if (query.vehicleId) {
      const routes = await this.integration.getRoute(query.vehicleId);
      return [this.mapToUnifiedFormat(routes, 'trip')];
    }
    // For now, return empty array - would need specific Samsara trip API
    return [];
  }

  async getActiveTrips(): Promise<UnifiedTrip[]> {
    return this.getTrips({ status: 'active' });
  }

  async createTrip(tripData: Omit<UnifiedTrip, 'id' | 'platform' | 'platformData'>): Promise<UnifiedTrip> {
    // Convert to Samsara route format
    const routeData = {
      name: `Trip ${Date.now()}`,
      vehicleId: tripData.vehicleId,
      driverId: tripData.driverId,
      stops: [], // Would need to be populated based on trip data
      status: 'active',
    };
    
    const createdRoute = await this.integration.createRoute(routeData);
    return this.mapToUnifiedFormat(createdRoute, 'trip');
  }

  // Location Services
  async getCurrentLocation(vehicleId: string): Promise<UnifiedLocation> {
    const location = await this.integration.getVehicleLocation(vehicleId);
    return {
      vehicleId,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
      speed: location.speed,
      timestamp: location.timestamp,
      platform: 'samsara',
    };
  }

  async getLocationHistory(vehicleId: string, startDate: string, endDate: string): Promise<UnifiedLocation[]> {
    // Samsara would need specific location history API call
    // For now, return current location as single point
    const currentLocation = await this.getCurrentLocation(vehicleId);
    return [currentLocation];
  }

  async trackVehicleLocation(vehicleId: string, callback: (location: UnifiedLocation) => void): Promise<() => void> {
    // Implement real-time location tracking via Samsara webhooks
    // This would subscribe to location update events for the specific vehicle
    const subscriptionId = await this.subscribeToEvents({
      eventTypes: ['vehicle.location.update'],
      callback: async (event) => {
        if (event.vehicleId === vehicleId && event.location) {
          callback({
            vehicleId,
            latitude: event.location.latitude,
            longitude: event.location.longitude,
            timestamp: event.timestamp,
            platform: 'samsara',
          });
        }
      },
      tenantId: this.tenantId,
    });

    return () => this.unsubscribeFromEvents(subscriptionId);
  }

  // Event Management
  async subscribeToEvents(subscription: EventSubscription): Promise<string> {
    const subscriptionId = `samsara_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.eventSubscriptions.set(subscriptionId, subscription);
    
    logger.info('Subscribed to Samsara events', {
      subscriptionId,
      eventTypes: subscription.eventTypes,
      tenantId: this.tenantId,
    });

    return subscriptionId;
  }

  async unsubscribeFromEvents(subscriptionId: string): Promise<void> {
    this.eventSubscriptions.delete(subscriptionId);
    logger.info('Unsubscribed from Samsara events', { subscriptionId, tenantId: this.tenantId });
  }

  async getEventHistory(query: {
    vehicleId?: string;
    driverId?: string;
    eventTypes?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<UnifiedEvent[]> {
    // Would implement Samsara event history API
    return [];
  }

  // Diagnostics & Health
  async getVehicleDiagnostics(vehicleId: string): Promise<UnifiedDiagnostic[]> {
    // Samsara diagnostic data would be retrieved here
    return [];
  }

  async getHealthStatus(): Promise<FleetProviderHealthStatus> {
    const start = Date.now();
    try {
      const isHealthy = await this.integration.healthCheck();
      const responseTime = Date.now() - start;
      
      return {
        isHealthy,
        platform: 'samsara',
        lastCheck: new Date().toISOString(),
        responseTime,
        capabilities: {
          realTimeEvents: true,
          locationTracking: true,
          diagnostics: true,
          webhooks: true,
          driverManagement: true,
        },
      };
    } catch (error) {
      return {
        isHealthy: false,
        platform: 'samsara',
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - start,
        errors: [error instanceof Error ? error.message : String(error)],
        capabilities: {
          realTimeEvents: true,
          locationTracking: true,
          diagnostics: true,
          webhooks: true,
          driverManagement: true,
        },
      };
    }
  }

  // Webhook Management
  async setupWebhook(webhookUrl: string, eventTypes: string[]): Promise<{ webhookId: string; secret?: string }> {
    const webhook = await this.integration.createWebhook(webhookUrl, eventTypes);
    return {
      webhookId: webhook.id,
      secret: webhook.secret,
    };
  }

  async removeWebhook(webhookId: string): Promise<void> {
    await this.integration.deleteWebhook(webhookId);
  }

  validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    return this.integration.validateWebhookSignature(payload, signature, secret);
  }

  // Process webhook events and notify subscribers
  async processWebhookEvent(event: any): Promise<void> {
    const processedEvent = this.integration.processWebhookEvent(event);
    const unifiedEvent = this.mapToUnifiedFormat(processedEvent, 'event');

    // Notify all relevant subscribers
    for (const [subscriptionId, subscription] of this.eventSubscriptions) {
      if (subscription.eventTypes.includes(unifiedEvent.eventType)) {
        try {
          await subscription.callback(unifiedEvent);
        } catch (error) {
          logger.error('Error processing event callback', error instanceof Error ? error : new Error(String(error)), {
            subscriptionId,
            eventType: unifiedEvent.eventType,
          });
        }
      }
    }
  }

  // Utility Methods
  normalizeEventType(platformEventType: string): string {
    return SAMSARA_EVENT_MAPPINGS[platformEventType] || platformEventType;
  }

  mapToUnifiedFormat<T>(platformData: any, type: 'driver' | 'vehicle' | 'trip' | 'event'): T {
    switch (type) {
      case 'driver':
        const samsaraDriver = platformData as SamsaraDriver;
        return {
          id: samsaraDriver.id,
          name: samsaraDriver.name,
          phone: samsaraDriver.phone,
          email: samsaraDriver.email,
          vehicleIds: samsaraDriver.vehicleIds || [],
          isActive: samsaraDriver.isActive,
          platform: 'samsara',
          platformData: samsaraDriver,
        } as T;

      case 'vehicle':
        const samsaraVehicle = platformData as SamsaraVehicle;
        return {
          id: samsaraVehicle.id,
          name: samsaraVehicle.name,
          vin: samsaraVehicle.vin,
          licensePlate: samsaraVehicle.license,
          make: samsaraVehicle.make,
          model: samsaraVehicle.model,
          year: samsaraVehicle.year,
          currentDriverId: samsaraVehicle.currentDriverId,
          isActive: true, // Samsara doesn't have explicit isActive for vehicles
          platform: 'samsara',
          platformData: samsaraVehicle,
        } as T;

      case 'event':
        return {
          id: platformData.id || `samsara_${Date.now()}`,
          eventType: this.normalizeEventType(platformData.eventType),
          timestamp: platformData.timestamp || new Date().toISOString(),
          vehicleId: platformData.vehicleId,
          driverId: platformData.driverId,
          location: platformData.location,
          severity: this.mapSeverity(platformData.eventType),
          description: this.generateEventDescription(platformData),
          metadata: platformData.metadata || {},
          platform: 'samsara',
          originalEvent: platformData,
        } as T;

      default:
        return platformData as T;
    }
  }

  private mapFromUnifiedFormat(unifiedData: any, type: 'driver' | 'vehicle'): any {
    switch (type) {
      case 'driver':
        return {
          name: unifiedData.name,
          phone: unifiedData.phone,
          email: unifiedData.email,
          vehicleIds: unifiedData.vehicleIds,
          isActive: unifiedData.isActive,
        };
      case 'vehicle':
        return {
          name: unifiedData.name,
          vin: unifiedData.vin,
          license: unifiedData.licensePlate,
          make: unifiedData.make,
          model: unifiedData.model,
          year: unifiedData.year,
        };
      default:
        return unifiedData;
    }
  }

  private mapSeverity(eventType: string): 'info' | 'warning' | 'critical' {
    if (eventType.includes('fault') || eventType.includes('emergency')) return 'critical';
    if (eventType.includes('warning') || eventType.includes('harsh')) return 'warning';
    return 'info';
  }

  private generateEventDescription(eventData: any): string {
    const eventType = eventData.eventType;
    if (eventType === 'driver.vehicle.assignment.changed') {
      return `Driver ${eventData.driverId} assigned to vehicle ${eventData.vehicleId}`;
    }
    if (eventType === 'vehicle.engine.on') {
      return `Vehicle ${eventData.vehicleId} engine started`;
    }
    return `${eventType} event occurred`;
  }
}