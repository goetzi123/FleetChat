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
  GEOTAB_EVENT_MAPPINGS,
  UNIFIED_EVENT_TYPES
} from './fleet-provider.interface';
import { 
  GeotabIntegration, 
  GeotabConfig, 
  GeotabUser, 
  GeotabDevice,
  GeotabTrip,
  GeotabLogRecord,
  createGeotabIntegration 
} from './geotab.integration';
import { logger } from '../shared/logger';

export class GeotabFleetProvider implements IFleetProvider {
  readonly platform = 'geotab' as const;
  readonly tenantId: string;
  
  private integration: GeotabIntegration;
  private authenticated = false;
  private eventSubscriptions = new Map<string, EventSubscription>();
  private dataFeeds = new Map<string, { type: string; version: number }>();

  constructor(config: GeotabConfig, tenantId: string) {
    this.tenantId = tenantId;
    this.integration = createGeotabIntegration(config);
  }

  async authenticate(): Promise<void> {
    try {
      await this.integration.authenticate();
      this.authenticated = true;
      logger.info('Geotab authentication successful', { tenantId: this.tenantId });
    } catch (error) {
      this.authenticated = false;
      logger.error('Geotab authentication failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.authenticated = false;
    this.eventSubscriptions.clear();
    this.dataFeeds.clear();
    logger.info('Geotab provider disconnected', { tenantId: this.tenantId });
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }

  // Driver Management
  async getDrivers(): Promise<UnifiedDriver[]> {
    const geotabUsers = await this.integration.getDrivers();
    return geotabUsers.map(user => this.mapToUnifiedFormat(user, 'driver'));
  }

  async getDriver(driverId: string): Promise<UnifiedDriver> {
    const geotabUser = await this.integration.getUser(driverId);
    return this.mapToUnifiedFormat(geotabUser, 'driver');
  }

  async updateDriver(driverId: string, updates: Partial<UnifiedDriver>): Promise<UnifiedDriver> {
    // Geotab typically doesn't allow direct user updates via API
    // This would need to be implemented based on available Geotab endpoints
    const currentDriver = await this.getDriver(driverId);
    
    // For now, return the current driver since Geotab updates are limited
    logger.warn('Geotab driver updates not fully supported via API', { driverId, updates });
    return currentDriver;
  }

  async searchDrivers(query: { name?: string; phone?: string; active?: boolean }): Promise<UnifiedDriver[]> {
    const searchCriteria: any = {};
    
    if (query.name) {
      searchCriteria.name = `%${query.name}%`;
    }
    if (query.active !== undefined) {
      searchCriteria.isActive = query.active;
    }

    const geotabUsers = await this.integration.getUsers(searchCriteria);
    const drivers = geotabUsers.filter(user => user.isDriver);
    
    let result = drivers.map(user => this.mapToUnifiedFormat(user, 'driver'));
    
    // Filter by phone if specified (Geotab search might not support phone search)
    if (query.phone) {
      result = result.filter(driver => driver.phone === query.phone);
    }
    
    return result;
  }

  // Vehicle Management
  async getVehicles(): Promise<UnifiedVehicle[]> {
    const geotabDevices = await this.integration.getDevices();
    return geotabDevices.map(device => this.mapToUnifiedFormat(device, 'vehicle'));
  }

  async getVehicle(vehicleId: string): Promise<UnifiedVehicle> {
    const geotabDevice = await this.integration.getDevice(vehicleId);
    return this.mapToUnifiedFormat(geotabDevice, 'vehicle');
  }

  async updateVehicle(vehicleId: string, updates: Partial<UnifiedVehicle>): Promise<UnifiedVehicle> {
    // Geotab device updates are typically limited
    const currentVehicle = await this.getVehicle(vehicleId);
    
    logger.warn('Geotab vehicle updates limited via API', { vehicleId, updates });
    return currentVehicle;
  }

  async searchVehicles(query: { name?: string; vin?: string; licensePlate?: string }): Promise<UnifiedVehicle[]> {
    const searchCriteria: any = {};
    
    if (query.name) {
      searchCriteria.name = `%${query.name}%`;
    }
    if (query.vin) {
      searchCriteria.vehicleIdentificationNumber = query.vin;
    }
    if (query.licensePlate) {
      searchCriteria.licensePlate = query.licensePlate;
    }

    const geotabDevices = await this.integration.getDevices(searchCriteria);
    return geotabDevices.map(device => this.mapToUnifiedFormat(device, 'vehicle'));
  }

  // Trip Management
  async getTrips(query: {
    vehicleId?: string;
    driverId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<UnifiedTrip[]> {
    const tripSearch: any = {};
    
    if (query.vehicleId) {
      tripSearch.deviceSearch = { id: query.vehicleId };
    }
    if (query.driverId) {
      tripSearch.userSearch = { id: query.driverId };
    }
    if (query.startDate) {
      tripSearch.fromDate = query.startDate;
    }
    if (query.endDate) {
      tripSearch.toDate = query.endDate;
    }

    const geotabTrips = await this.integration.getTrips(tripSearch);
    return geotabTrips.map(trip => this.mapToUnifiedFormat(trip, 'trip'));
  }

  async getActiveTrips(): Promise<UnifiedTrip[]> {
    // Geotab trips are typically completed, so we'll get recent trips
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    return this.getTrips({ 
      startDate: yesterday, 
      endDate: today 
    });
  }

  // Location Services
  async getCurrentLocation(vehicleId: string): Promise<UnifiedLocation> {
    // Get most recent location record for the vehicle
    const locationRecords = await this.integration.getLogRecords({
      deviceSearch: { id: vehicleId },
      fromDate: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // Last hour
    });

    if (locationRecords.length === 0) {
      throw new Error(`No recent location data for vehicle ${vehicleId}`);
    }

    const latest = locationRecords[locationRecords.length - 1];
    return {
      vehicleId,
      latitude: latest.latitude,
      longitude: latest.longitude,
      speed: latest.speed,
      timestamp: latest.dateTime,
      platform: 'geotab',
    };
  }

  async getLocationHistory(vehicleId: string, startDate: string, endDate: string): Promise<UnifiedLocation[]> {
    const locationRecords = await this.integration.getLogRecords({
      deviceSearch: { id: vehicleId },
      fromDate: startDate,
      toDate: endDate,
    });

    return locationRecords.map(record => ({
      vehicleId,
      latitude: record.latitude,
      longitude: record.longitude,
      speed: record.speed,
      timestamp: record.dateTime,
      platform: 'geotab' as const,
    }));
  }

  async trackVehicleLocation(vehicleId: string, callback: (location: UnifiedLocation) => void): Promise<() => void> {
    // Implement Geotab data feed for real-time location tracking
    const feedKey = `location_${vehicleId}`;
    this.dataFeeds.set(feedKey, { type: 'LogRecord', version: 0 });

    const pollInterval = setInterval(async () => {
      try {
        const feedData = this.dataFeeds.get(feedKey);
        if (!feedData) return;

        const feed = await this.integration.getLocationsFeed({
          deviceSearch: { id: vehicleId }
        }, feedData.version);

        if (feed.data.length > 0) {
          feedData.version = feed.toVersion;
          
          // Process new location data
          for (const record of feed.data) {
            callback({
              vehicleId,
              latitude: record.latitude,
              longitude: record.longitude,
              speed: record.speed,
              timestamp: record.dateTime,
              platform: 'geotab',
            });
          }
        }
      } catch (error) {
        logger.error('Error polling Geotab location feed', error instanceof Error ? error : new Error(String(error)));
      }
    }, 30000); // Poll every 30 seconds

    return () => {
      clearInterval(pollInterval);
      this.dataFeeds.delete(feedKey);
    };
  }

  // Event Management
  async subscribeToEvents(subscription: EventSubscription): Promise<string> {
    const subscriptionId = `geotab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.eventSubscriptions.set(subscriptionId, subscription);
    
    // Start data feeds for event monitoring
    this.startEventMonitoring(subscriptionId, subscription);
    
    logger.info('Subscribed to Geotab events', {
      subscriptionId,
      eventTypes: subscription.eventTypes,
      tenantId: this.tenantId,
    });

    return subscriptionId;
  }

  async unsubscribeFromEvents(subscriptionId: string): Promise<void> {
    this.eventSubscriptions.delete(subscriptionId);
    // Stop related data feeds
    const feedKey = `events_${subscriptionId}`;
    this.dataFeeds.delete(feedKey);
    
    logger.info('Unsubscribed from Geotab events', { subscriptionId, tenantId: this.tenantId });
  }

  async getEventHistory(query: {
    vehicleId?: string;
    driverId?: string;
    eventTypes?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<UnifiedEvent[]> {
    // Geotab events come from various sources (StatusData, FaultData, ExceptionEvents)
    const events: UnifiedEvent[] = [];

    // Get fault data as events
    if (query.vehicleId) {
      const faultData = await this.integration.getFaultData({
        deviceSearch: { id: query.vehicleId },
        fromDate: query.startDate,
        toDate: query.endDate,
      });

      events.push(...faultData.map(fault => this.mapToUnifiedFormat(fault, 'event')));
    }

    return events;
  }

  // Diagnostics & Health
  async getVehicleDiagnostics(vehicleId: string): Promise<UnifiedDiagnostic[]> {
    const statusData = await this.integration.getStatusData({
      deviceSearch: { id: vehicleId },
      fromDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
    });

    return statusData.map(status => ({
      vehicleId,
      diagnosticType: status.diagnostic.name,
      description: `${status.diagnostic.name}: ${status.data}`,
      severity: 'info' as const,
      timestamp: status.dateTime,
      value: status.data,
      platform: 'geotab' as const,
    }));
  }

  async getHealthStatus(): Promise<FleetProviderHealthStatus> {
    const start = Date.now();
    try {
      const isHealthy = await this.integration.healthCheck();
      const responseTime = Date.now() - start;
      
      return {
        isHealthy,
        platform: 'geotab',
        lastCheck: new Date().toISOString(),
        responseTime,
        capabilities: {
          realTimeEvents: false, // Geotab uses polling, not true real-time
          locationTracking: true,
          diagnostics: true,
          webhooks: false, // Geotab doesn't support webhooks
          driverManagement: true,
        },
      };
    } catch (error) {
      return {
        isHealthy: false,
        platform: 'geotab',
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - start,
        errors: [error instanceof Error ? error.message : String(error)],
        capabilities: {
          realTimeEvents: false,
          locationTracking: true,
          diagnostics: true,
          webhooks: false,
          driverManagement: true,
        },
      };
    }
  }

  // Utility Methods
  normalizeEventType(platformEventType: string): string {
    return GEOTAB_EVENT_MAPPINGS[platformEventType] || platformEventType;
  }

  mapToUnifiedFormat<T>(platformData: any, type: 'driver' | 'vehicle' | 'trip' | 'event'): T {
    switch (type) {
      case 'driver':
        const geotabUser = platformData as GeotabUser;
        return {
          id: geotabUser.id,
          name: geotabUser.name,
          firstName: geotabUser.firstName,
          lastName: geotabUser.lastName,
          phone: geotabUser.phoneNumber,
          employeeNumber: geotabUser.employeeNo,
          vehicleIds: [], // Would need to be resolved from device assignments
          isActive: geotabUser.isActive,
          platform: 'geotab',
          platformData: geotabUser,
        } as T;

      case 'vehicle':
        const geotabDevice = platformData as GeotabDevice;
        return {
          id: geotabDevice.id,
          name: geotabDevice.name,
          vin: geotabDevice.vehicleIdentificationNumber,
          licensePlate: geotabDevice.licensePlate,
          deviceType: geotabDevice.deviceType,
          currentDriverId: geotabDevice.workTime?.driverKeyId,
          isActive: geotabDevice.isActive,
          platform: 'geotab',
          platformData: geotabDevice,
        } as T;

      case 'trip':
        const geotabTrip = platformData as GeotabTrip;
        return {
          id: geotabTrip.id,
          vehicleId: geotabTrip.device.id,
          driverId: geotabTrip.driver.id,
          startTime: geotabTrip.start,
          endTime: geotabTrip.stop,
          distance: geotabTrip.distance,
          duration: geotabTrip.drivingDuration,
          status: 'completed' as const,
          platform: 'geotab',
          platformData: geotabTrip,
        } as T;

      case 'event':
        return {
          id: platformData.id || `geotab_${Date.now()}`,
          eventType: this.normalizeEventType(platformData.diagnostic?.name || 'unknown'),
          timestamp: platformData.dateTime || new Date().toISOString(),
          vehicleId: platformData.device?.id,
          severity: this.mapSeverity(platformData),
          description: this.generateEventDescription(platformData),
          metadata: { originalData: platformData },
          platform: 'geotab',
          originalEvent: platformData,
        } as T;

      default:
        return platformData as T;
    }
  }

  private startEventMonitoring(subscriptionId: string, subscription: EventSubscription): void {
    const feedKey = `events_${subscriptionId}`;
    this.dataFeeds.set(feedKey, { type: 'StatusData', version: 0 });

    // Poll for events using Geotab data feeds
    const pollInterval = setInterval(async () => {
      try {
        const feedData = this.dataFeeds.get(feedKey);
        if (!feedData) return;

        const feed = await this.integration.getStatusDataFeed({}, feedData.version);
        
        if (feed.data.length > 0) {
          feedData.version = feed.toVersion;
          
          // Process new status data as events
          for (const statusData of feed.data) {
            const unifiedEvent = this.mapToUnifiedFormat(statusData, 'event');
            
            if (subscription.eventTypes.includes(unifiedEvent.eventType)) {
              try {
                await subscription.callback(unifiedEvent);
              } catch (error) {
                logger.error('Error processing Geotab event callback', error instanceof Error ? error : new Error(String(error)));
              }
            }
          }
        }
      } catch (error) {
        logger.error('Error polling Geotab status feed', error instanceof Error ? error : new Error(String(error)));
      }
    }, 60000); // Poll every minute

    // Store the interval for cleanup
    (this.dataFeeds.get(feedKey) as any).pollInterval = pollInterval;
  }

  private mapSeverity(eventData: any): 'info' | 'warning' | 'critical' {
    if (eventData.faultState === 'active' || eventData.diagnostic?.name?.includes('fault')) {
      return 'critical';
    }
    if (eventData.diagnostic?.name?.includes('warning')) {
      return 'warning';
    }
    return 'info';
  }

  private generateEventDescription(eventData: any): string {
    if (eventData.diagnostic?.name) {
      return `Diagnostic event: ${eventData.diagnostic.name}`;
    }
    if (eventData.faultState) {
      return `Fault ${eventData.faultState}: ${eventData.diagnostic?.name || 'Unknown'}`;
    }
    return 'Geotab system event';
  }
}