// COMPLIANT Message Relay Service - Pure communication protocol only
import { compliantStorage } from "../compliant-storage";

// Fleet system event types that trigger message relay
export const FleetEventTypes = {
  // Samsara Events
  ROUTE_ASSIGNED: "route.assigned",
  ROUTE_STARTED: "route.started", 
  ROUTE_COMPLETED: "route.completed",
  GEOFENCE_ENTER: "geofence.enter",
  GEOFENCE_EXIT: "geofence.exit",
  DRIVER_DUTY_STATUS: "driver.dutyStatus",
  VEHICLE_LOCATION: "vehicle.location",
  SAFETY_ALERT: "safety.alert",
  
  // Motive Events
  MOTIVE_ROUTE_ASSIGNED: "motive.route.assigned",
  MOTIVE_DUTY_STATUS: "motive.driver.dutyStatus",
  MOTIVE_LOCATION_UPDATE: "motive.vehicle.location",
  MOTIVE_SAFETY_EVENT: "motive.safety.event",
  
  // Geotab Events
  GEOTAB_TRIP_START: "geotab.trip.start",
  GEOTAB_TRIP_END: "geotab.trip.end",
  GEOTAB_EXCEPTION: "geotab.exception",
  GEOTAB_LOCATION: "geotab.device.location"
} as const;

// Driver response types from WhatsApp
export const DriverResponseTypes = {
  STATUS_UPDATE: "status_update",
  ARRIVAL_CONFIRMATION: "arrival_confirmation", 
  DEPARTURE_CONFIRMATION: "departure_confirmation",
  DOCUMENT_UPLOAD: "document_upload",
  LOCATION_SHARE: "location_share",
  TEXT_RESPONSE: "text_response",
  EMERGENCY_ALERT: "emergency_alert"
} as const;

// Fleet system event structure
export interface FleetSystemEvent {
  tenantId: string;
  platform: 'samsara' | 'motive' | 'geotab';
  eventType: string;
  driverId: string;  // Fleet system driver ID
  eventData: {
    message?: string;
    location?: { lat: number; lng: number; address?: string };
    timestamp?: Date;
    routeId?: string;
    vehicleId?: string;
    metadata?: any;
  };
}

// Driver response structure from WhatsApp
export interface DriverWhatsAppResponse {
  tenantId: string;
  fromPhone: string;
  messageId: string;
  responseType: string;
  responseData: {
    text?: string;
    buttonId?: string;
    location?: { lat: number; lng: number; address?: string };
    document?: { filename: string; url: string; mimeType: string };
    timestamp: Date;
  };
}

// Fleet system API update structure
export interface FleetSystemAPIUpdate {
  platform: 'samsara' | 'motive' | 'geotab';
  driverId: string;
  updateType: string;
  updateData: {
    status?: string;
    location?: { lat: number; lng: number; timestamp: Date };
    document?: { filename: string; url: string; type: string };
    notes?: string;
    timestamp: Date;
  };
}

export class CompliantMessageRelayService {
  
  // CORE FUNCTION 1: Relay fleet system events to drivers via WhatsApp
  async relayFleetEventToDriver(event: FleetSystemEvent): Promise<void> {
    try {
      // Find driver phone mapping
      const driverMapping = await compliantStorage.getDriverPhoneMappingByFleetDriverId(
        event.tenantId,
        event.platform,
        event.driverId
      );
      
      if (!driverMapping || !driverMapping.whatsappActive) {
        console.log(`Driver ${event.driverId} not found or WhatsApp not active`);
        return;
      }

      // Get message template for this event type
      const template = await compliantStorage.getMessageTemplateByEvent(
        event.tenantId,
        event.platform,
        event.eventType,
        driverMapping.languageCode || 'ENG'
      );

      if (!template) {
        console.log(`No template found for event ${event.eventType} on ${event.platform}`);
        return;
      }

      // Get tenant's WhatsApp configuration
      const tenant = await compliantStorage.getTenantById(event.tenantId);
      if (!tenant || !tenant.whatsappPhoneNumberId) {
        console.log(`Tenant ${event.tenantId} WhatsApp not configured`);
        return;
      }

      // Apply template with event data
      const whatsappMessage = this.applyMessageTemplate(template, event.eventData);

      // Send WhatsApp message (placeholder for actual WhatsApp API integration)
      console.log(`Sending WhatsApp message to ${driverMapping.phoneNumber}:`, whatsappMessage);

      // Log communication for delivery tracking
      await compliantStorage.createCommunicationLog({
        tenantId: event.tenantId,
        driverMappingId: driverMapping.id,
        messageId: `fleet_${Date.now()}`,
        direction: 'outbound',
        messageType: event.eventType,
        deliveryStatus: 'sent',
        fleetSystemEventType: event.eventType,
        metadata: { platform: event.platform, eventData: event.eventData }
      });

      console.log(`Message relayed from ${event.platform} to driver ${driverMapping.driverName}`);
      
    } catch (error) {
      console.error('Error relaying fleet event to driver:', error);
      
      // Log failed communication
      await compliantStorage.createCommunicationLog({
        tenantId: event.tenantId,
        driverMappingId: null,
        messageId: `fleet_${Date.now()}`,
        direction: 'outbound',
        messageType: event.eventType,
        deliveryStatus: 'failed',
        fleetSystemEventType: event.eventType,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        metadata: { platform: event.platform, eventData: event.eventData }
      });
    }
  }

  // CORE FUNCTION 2: Process driver WhatsApp responses and relay to fleet system
  async processDriverResponseToFleetSystem(response: DriverWhatsAppResponse): Promise<void> {
    try {
      // Find driver by phone number
      const driverMapping = await compliantStorage.getDriverPhoneMappingByPhone(
        response.tenantId,
        response.fromPhone
      );

      if (!driverMapping) {
        console.log(`Driver not found for phone ${response.fromPhone}`);
        return;
      }

      // Get tenant configuration
      const tenant = await compliantStorage.getTenantById(response.tenantId);
      if (!tenant) {
        console.log(`Tenant ${response.tenantId} not found`);
        return;
      }

      // Convert driver response to fleet system API update
      const fleetUpdate = this.convertDriverResponseToFleetUpdate(
        driverMapping,
        tenant.platform || 'samsara',
        response
      );

      // Relay update to appropriate fleet system API
      await this.relayUpdateToFleetSystem(tenant, fleetUpdate);

      // Log successful response relay
      await compliantStorage.createCommunicationLog({
        tenantId: response.tenantId,
        driverMappingId: driverMapping.id,
        messageId: response.messageId,
        direction: 'inbound',
        messageType: response.responseType,
        deliveryStatus: 'processed',
        metadata: { responseData: response.responseData, fleetUpdate }
      });

      console.log(`Driver response relayed to ${tenant.platform} for ${driverMapping.driverName}`);

    } catch (error) {
      console.error('Error processing driver response:', error);
      
      // Log failed response processing
      await compliantStorage.createCommunicationLog({
        tenantId: response.tenantId,
        driverMappingId: null,
        messageId: response.messageId,
        direction: 'inbound',
        messageType: response.responseType,
        deliveryStatus: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        metadata: { responseData: response.responseData }
      });
    }
  }

  // Helper: Apply message template with fleet event data
  private applyMessageTemplate(template: any, eventData: any): { parameters: any[]; buttons?: any[] } {
    let messageBody = template.templateBody;
    
    // Replace template variables with event data
    if (eventData.message) {
      messageBody = messageBody.replace('{{message}}', eventData.message);
    }
    if (eventData.location?.address) {
      messageBody = messageBody.replace('{{location}}', eventData.location.address);
    }
    if (eventData.routeId) {
      messageBody = messageBody.replace('{{routeId}}', eventData.routeId);
    }
    if (eventData.timestamp) {
      messageBody = messageBody.replace('{{timestamp}}', eventData.timestamp.toLocaleString());
    }

    return {
      parameters: [messageBody],
      buttons: template.templateButtons || undefined
    };
  }

  // Helper: Convert driver response to fleet system update
  private convertDriverResponseToFleetUpdate(
    driverMapping: any,
    platform: string,
    response: DriverWhatsAppResponse
  ): FleetSystemAPIUpdate {
    const fleetDriverId = this.getFleetDriverId(driverMapping, platform);
    
    return {
      platform: platform as 'samsara' | 'motive' | 'geotab',
      driverId: fleetDriverId,
      updateType: response.responseType,
      updateData: {
        status: this.mapResponseToStatus(response.responseType),
        location: response.responseData.location,
        document: response.responseData.document,
        notes: response.responseData.text,
        timestamp: response.responseData.timestamp
      }
    };
  }

  // Helper: Get fleet system driver ID for the appropriate platform
  private getFleetDriverId(driverMapping: any, platform: string): string {
    switch (platform) {
      case 'samsara':
        return driverMapping.samsaraDriverId;
      case 'motive':
        return driverMapping.motiveDriverId;
      case 'geotab':
        return driverMapping.geotabDriverId;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  // Helper: Map driver response types to fleet system status values
  private mapResponseToStatus(responseType: string): string {
    switch (responseType) {
      case DriverResponseTypes.ARRIVAL_CONFIRMATION:
        return 'arrived';
      case DriverResponseTypes.DEPARTURE_CONFIRMATION:
        return 'departed';
      case DriverResponseTypes.STATUS_UPDATE:
        return 'in_progress';
      default:
        return 'active';
    }
  }

  // Helper: Relay update to fleet system API (simplified - actual implementation would use fleet system clients)
  private async relayUpdateToFleetSystem(tenant: any, update: FleetSystemAPIUpdate): Promise<void> {
    // This would use the actual fleet system API clients (Samsara, Motive, Geotab)
    // For compliance, this only makes API calls to update driver status/location/documents
    // NO route creation, vehicle management, or fleet operations
    
    console.log(`Relaying update to ${update.platform}:`, {
      driverId: update.driverId,
      updateType: update.updateType,
      status: update.updateData.status
    });

    // Placeholder for actual fleet system API calls
    // await samsaraAPI.updateDriverStatus(update.driverId, update.updateData.status);
    // await motiveAPI.submitDriverLocation(update.driverId, update.updateData.location);
    // await geotabAPI.uploadDriverDocument(update.driverId, update.updateData.document);
  }

  // CORE FUNCTION 3: Discover and map driver phone numbers from fleet systems
  async discoverAndMapDriverPhones(tenantId: string): Promise<void> {
    try {
      const tenant = await compliantStorage.getTenantById(tenantId);
      if (!tenant) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      // This function only reads driver data from fleet systems to extract phone numbers
      // NO fleet management operations, only communication mapping
      console.log(`Discovering driver phone numbers for tenant ${tenant.companyName}`);
      
      // Placeholder for fleet system driver discovery
      // const samsaraDrivers = await samsaraAPI.getDriversWithPhones();
      // const motiveDrivers = await motiveAPI.getDriversWithPhones();
      
      // Create driver phone mappings for communication routing only
      // for (const driver of samsaraDrivers) {
      //   await compliantStorage.createDriverPhoneMapping({
      //     tenantId,
      //     samsaraDriverId: driver.id,
      //     driverName: driver.name,
      //     phoneNumber: driver.phone,
      //     phoneSource: 'samsara'
      //   });
      // }

    } catch (error) {
      console.error('Error discovering driver phone numbers:', error);
      throw error;
    }
  }
}

export const messageRelayService = new CompliantMessageRelayService();