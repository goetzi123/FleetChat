import { IFleetProvider, UnifiedEvent, UnifiedDriver, UnifiedVehicle } from '../integrations/fleet-provider.interface';
import { FleetProviderFactory } from './fleet-provider.factory';
import { enhancedMessageBroker } from '../../server/enhanced-message-broker';
import { fleetChatStorage } from '../../server/database-storage';
import { logger } from '../shared/logger';
import { AppError } from '../shared/errors';

/**
 * Fleet Communication Service
 * Orchestrates communication between fleet management platforms and WhatsApp
 */
export class FleetCommunicationService {
  private activeSubscriptions = new Map<string, string[]>(); // tenantId -> subscriptionIds

  /**
   * Initialize fleet communication for a tenant
   */
  async initializeTenantCommunication(tenantId: string): Promise<void> {
    try {
      // Get tenant configuration
      const tenant = await fleetChatStorage.getTenantById(tenantId);
      if (!tenant) {
        throw new AppError(`Tenant not found: ${tenantId}`, 404);
      }

      // Create fleet provider configuration
      const config = FleetProviderFactory.createConfigFromTenant({
        id: tenant.id,
        fleetPlatform: tenant.fleetPlatform as 'samsara' | 'geotab',
        samsaraApiToken: tenant.samsaraApiToken || undefined,
        samsaraGroupId: tenant.samsaraGroupId || undefined,
        geotabUsername: tenant.geotabUsername || undefined,
        geotabPassword: tenant.geotabPassword || undefined,
        geotabDatabase: tenant.geotabDatabase || undefined,
        geotabServer: tenant.geotabServer || undefined,
      });

      // Validate configuration
      const validation = FleetProviderFactory.validateConfig(config);
      if (!validation.isValid) {
        throw new AppError(`Invalid fleet configuration: ${validation.errors.join(', ')}`, 400);
      }

      // Create and authenticate provider
      const provider = await FleetProviderFactory.createProvider(config);

      // Subscribe to relevant events
      await this.setupEventSubscriptions(provider, tenantId);

      logger.info('Fleet communication initialized', {
        tenantId,
        platform: config.platform,
      });
    } catch (error) {
      logger.error('Failed to initialize fleet communication', error instanceof Error ? error : new Error(String(error)), {
        tenantId,
      });
      throw error;
    }
  }

  /**
   * Setup event subscriptions for a tenant
   */
  private async setupEventSubscriptions(provider: IFleetProvider, tenantId: string): Promise<void> {
    const eventTypes = [
      'driver.vehicle.assigned',
      'vehicle.started',
      'vehicle.stopped',
      'location.route.started',
      'location.route.completed',
      'location.geofence.entered',
      'location.geofence.exited',
      'safety.harsh_braking',
      'safety.speeding',
      'maintenance.fault_code',
    ];

    try {
      const subscriptionId = await provider.subscribeToEvents({
        eventTypes,
        tenantId,
        callback: (event) => this.handleFleetEvent(event, tenantId),
      });

      // Track subscription for cleanup
      if (!this.activeSubscriptions.has(tenantId)) {
        this.activeSubscriptions.set(tenantId, []);
      }
      this.activeSubscriptions.get(tenantId)!.push(subscriptionId);

      logger.info('Event subscriptions created', {
        tenantId,
        subscriptionId,
        eventTypes,
      });
    } catch (error) {
      logger.error('Failed to setup event subscriptions', error instanceof Error ? error : new Error(String(error)), {
        tenantId,
      });
      throw error;
    }
  }

  /**
   * Handle incoming fleet events and generate WhatsApp messages
   */
  private async handleFleetEvent(event: UnifiedEvent, tenantId: string): Promise<void> {
    try {
      logger.info('Processing fleet event', {
        tenantId,
        eventType: event.eventType,
        vehicleId: event.vehicleId,
        driverId: event.driverId,
      });

      // Get driver information if available
      let driver: UnifiedDriver | null = null;
      if (event.driverId) {
        const provider = FleetProviderFactory.getProvider(tenantId, event.platform);
        if (provider) {
          try {
            driver = await provider.getDriver(event.driverId);
          } catch (error) {
            logger.warn('Could not retrieve driver information', error instanceof Error ? error : new Error(String(error)), {
              driverId: event.driverId,
            });
          }
        }
      }

      // Generate WhatsApp message using enhanced message broker
      const message = await enhancedMessageBroker.generateDriverMessage(
        {
          eventType: event.eventType,
          timestamp: event.timestamp,
          data: {
            driver: driver ? {
              id: driver.id,
              name: driver.name,
              phone: driver.phone,
            } : undefined,
            vehicle: event.vehicleId ? {
              id: event.vehicleId,
            } : undefined,
            location: event.location,
            event: {
              severity: event.severity,
              description: event.description,
              metadata: event.metadata,
            },
          },
        },
        'ENG' // Default to English, could be made configurable per tenant
      );

      // Send message if driver has phone number
      if (driver?.phone && message.content) {
        await this.sendWhatsAppMessage(tenantId, driver.phone, message.content, message.buttons);
        
        // Store message record
        await fleetChatStorage.createWhatsappMessage({
          tenantId,
          driverId: driver.id,
          vehicleId: event.vehicleId,
          transportId: null, // Would need to map vehicle to transport
          messageType: 'outbound',
          content: message.content,
          buttons: message.buttons,
          timestamp: new Date(),
          eventType: event.eventType,
          status: 'sent',
        });

        logger.info('WhatsApp message sent', {
          tenantId,
          driverId: driver.id,
          vehicleId: event.vehicleId,
          eventType: event.eventType,
        });
      } else {
        logger.warn('Cannot send message - missing driver phone', {
          tenantId,
          driverId: event.driverId,
          hasDriver: !!driver,
          hasPhone: !!driver?.phone,
        });
      }
    } catch (error) {
      logger.error('Failed to process fleet event', error instanceof Error ? error : new Error(String(error)), {
        tenantId,
        eventType: event.eventType,
      });
    }
  }

  /**
   * Send WhatsApp message to driver
   */
  private async sendWhatsAppMessage(
    tenantId: string,
    phoneNumber: string,
    content: string,
    buttons?: Array<{ id: string; text: string }>
  ): Promise<void> {
    // This would integrate with the WhatsApp Business API
    // For now, we'll log the message that would be sent
    logger.info('WhatsApp message would be sent', {
      tenantId,
      phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'), // Mask phone number
      content,
      buttons: buttons?.map(b => b.text),
    });

    // TODO: Implement actual WhatsApp Business API integration
    // const whatsappProvider = WhatsAppProviderFactory.getProvider(tenantId);
    // if (buttons && buttons.length > 0) {
    //   await whatsappProvider.sendInteractiveMessage(phoneNumber, content, buttons);
    // } else {
    //   await whatsappProvider.sendTextMessage(phoneNumber, content);
    // }
  }

  /**
   * Handle driver response from WhatsApp
   */
  async handleDriverResponse(
    tenantId: string,
    phoneNumber: string,
    response: {
      type: 'text' | 'button' | 'location' | 'document';
      content: any;
    }
  ): Promise<void> {
    try {
      // Find driver by phone number
      const driver = await fleetChatStorage.getUserByPhone(phoneNumber);
      if (!driver || driver.tenantId !== tenantId) {
        logger.warn('Driver not found for phone number', { tenantId, phoneNumber });
        return;
      }

      // Get fleet provider
      const tenant = await fleetChatStorage.getTenantById(tenantId);
      if (!tenant) {
        throw new AppError(`Tenant not found: ${tenantId}`, 404);
      }

      const provider = FleetProviderFactory.getProvider(tenantId, tenant.fleetPlatform as 'samsara' | 'geotab');
      if (!provider) {
        logger.error('Fleet provider not available', { tenantId, platform: tenant.fleetPlatform });
        return;
      }

      // Process response based on type
      switch (response.type) {
        case 'button':
          await this.handleButtonResponse(provider, driver.id, response.content);
          break;
        case 'text':
          await this.handleTextResponse(provider, driver.id, response.content);
          break;
        case 'location':
          await this.handleLocationResponse(provider, driver.id, response.content);
          break;
        case 'document':
          await this.handleDocumentResponse(provider, driver.id, response.content);
          break;
      }

      // Store response record
      await fleetChatStorage.createWhatsappMessage({
        tenantId,
        driverId: driver.id,
        vehicleId: null, // Would need to get current vehicle
        transportId: null,
        messageType: 'inbound',
        content: JSON.stringify(response.content),
        timestamp: new Date(),
        status: 'received',
      });

      logger.info('Driver response processed', {
        tenantId,
        driverId: driver.id,
        responseType: response.type,
      });
    } catch (error) {
      logger.error('Failed to process driver response', error instanceof Error ? error : new Error(String(error)), {
        tenantId,
        phoneNumber,
      });
    }
  }

  private async handleButtonResponse(provider: IFleetProvider, driverId: string, buttonData: any): Promise<void> {
    // Handle button clicks (e.g., "Arrived", "Departed", "Issue")
    const buttonId = buttonData.id || buttonData.payload;
    
    // Map button responses to fleet actions
    switch (buttonId) {
      case 'arrived':
        // Update trip status, send location update
        break;
      case 'departed':
        // Update trip status, start tracking
        break;
      case 'issue':
        // Create incident report
        break;
    }
  }

  private async handleTextResponse(provider: IFleetProvider, driverId: string, text: string): Promise<void> {
    // Process free-text responses
    // Could implement NLP to understand driver intent
    logger.info('Processing text response', { driverId, text });
  }

  private async handleLocationResponse(provider: IFleetProvider, driverId: string, location: any): Promise<void> {
    // Handle shared location
    const { latitude, longitude } = location;
    
    // Update driver/vehicle location in fleet system
    // This would depend on the fleet platform's capabilities
    logger.info('Processing location response', { driverId, latitude, longitude });
  }

  private async handleDocumentResponse(provider: IFleetProvider, driverId: string, document: any): Promise<void> {
    // Handle document uploads (POD, photos, etc.)
    logger.info('Processing document response', { driverId, documentType: document.type });
  }

  /**
   * Cleanup tenant communication (when tenant is deactivated)
   */
  async cleanupTenantCommunication(tenantId: string): Promise<void> {
    try {
      // Get all subscription IDs for the tenant
      const subscriptionIds = this.activeSubscriptions.get(tenantId) || [];
      
      // Get the provider
      const tenant = await fleetChatStorage.getTenantById(tenantId);
      if (tenant) {
        const provider = FleetProviderFactory.getProvider(tenantId, tenant.fleetPlatform as 'samsara' | 'geotab');
        
        if (provider) {
          // Unsubscribe from all events
          for (const subscriptionId of subscriptionIds) {
            try {
              await provider.unsubscribeFromEvents(subscriptionId);
            } catch (error) {
              logger.warn('Failed to unsubscribe from events', error instanceof Error ? error : new Error(String(error)), {
                subscriptionId,
              });
            }
          }
        }
        
        // Remove provider
        await FleetProviderFactory.removeProvider(tenantId, tenant.fleetPlatform as 'samsara' | 'geotab');
      }
      
      // Clean up local tracking
      this.activeSubscriptions.delete(tenantId);
      
      logger.info('Tenant communication cleaned up', { tenantId });
    } catch (error) {
      logger.error('Failed to cleanup tenant communication', error instanceof Error ? error : new Error(String(error)), {
        tenantId,
      });
    }
  }

  /**
   * Get communication status for all tenants
   */
  async getCommunicationStatus(): Promise<Array<{
    tenantId: string;
    platform: string;
    isHealthy: boolean;
    activeSubscriptions: number;
    lastActivity?: string;
  }>> {
    const activeProviders = FleetProviderFactory.getActiveProviders();
    const status: Array<{
      tenantId: string;
      platform: string;
      isHealthy: boolean;
      activeSubscriptions: number;
      lastActivity?: string;
    }> = [];

    for (const { tenantId, platform, provider } of activeProviders) {
      try {
        const healthStatus = await provider.getHealthStatus();
        const subscriptionCount = this.activeSubscriptions.get(tenantId)?.length || 0;
        
        status.push({
          tenantId,
          platform,
          isHealthy: healthStatus.isHealthy,
          activeSubscriptions: subscriptionCount,
          lastActivity: healthStatus.lastCheck,
        });
      } catch (error) {
        status.push({
          tenantId,
          platform,
          isHealthy: false,
          activeSubscriptions: 0,
        });
      }
    }

    return status;
  }
}

export const fleetCommunicationService = new FleetCommunicationService();