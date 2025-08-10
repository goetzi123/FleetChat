import { 
  MotiveCommunicationProvider, 
  MotiveWebhookEvent, 
  MotiveDriverResponse,
  MotiveEventTypes 
} from "./motive-integration";
// MessageTemplateService interface for dependency injection

/**
 * Motive Webhook Handler - Compliant Communication Protocol Service
 * 
 * Processes Motive webhook events for message relay ONLY.
 * Does NOT implement any fleet management functionality.
 */
export class MotiveWebhookHandler {
  private provider: MotiveCommunicationProvider;
  private messageTemplateService: any;

  constructor(provider: MotiveCommunicationProvider, messageTemplateService: any) {
    this.provider = provider;
    this.messageTemplateService = messageTemplateService;
  }

  /**
   * Handle Vehicle Location Event
   * Compliant: Uses location data only for message triggers, no tracking
   */
  async handleVehicleLocation(event: MotiveWebhookEvent): Promise<void> {
    try {
      const processedEvent = await this.provider.processWebhookEvent(event);
      
      if (!processedEvent.driverId) {
        console.log('No driver ID in location event, skipping message');
        return;
      }

      // Generate location-based message (compliant: template application only)
      await this.messageTemplateService.generateMessage(
        'vehicle.location',
        {
          driverId: processedEvent.driverId,
          location: processedEvent.templateData.location,
          speed: processedEvent.templateData.speed,
          timestamp: new Date().toISOString()
        },
        'ENG'
      );

      console.log(`Location message sent to driver ${processedEvent.driverId}`);
    } catch (error) {
      console.error('Failed to handle Motive location event:', error);
    }
  }

  /**
   * Handle Geofence Event
   * Compliant: Triggers messages for geofence entry/exit, no geofence management
   */
  async handleGeofenceEvent(event: MotiveWebhookEvent): Promise<void> {
    try {
      const processedEvent = await this.provider.processWebhookEvent(event);
      
      if (!processedEvent.driverId) {
        console.log('No driver ID in geofence event, skipping message');
        return;
      }

      const geofenceData = processedEvent.templateData.geofence || {};
      const eventType = geofenceData.event_type === 'entry' ? 'geofence.enter' : 'geofence.exit';

      // Generate geofence message (compliant: message relay only)
      await this.messageTemplateService.generateMessage(
        eventType,
        {
          driverId: processedEvent.driverId,
          geofenceName: geofenceData.name || 'Location',
          eventTime: processedEvent.templateData.timestamp,
          geofenceType: geofenceData.type || 'general'
        },
        'ENG'
      );

      console.log(`Geofence ${eventType} message sent to driver ${processedEvent.driverId}`);
    } catch (error) {
      console.error('Failed to handle Motive geofence event:', error);
    }
  }

  /**
   * Handle Driver Performance Event
   * Compliant: Triggers safety messages, no performance management
   */
  async handleDriverPerformanceEvent(event: MotiveWebhookEvent): Promise<void> {
    try {
      const processedEvent = await this.provider.processWebhookEvent(event);
      
      if (!processedEvent.driverId) {
        console.log('No driver ID in performance event, skipping message');
        return;
      }

      const performanceData = processedEvent.templateData;
      
      // Generate safety coaching message (compliant: notification only)
      await this.messageTemplateService.generateMessage(
        'safety.harsh_event',
        {
          driverId: processedEvent.driverId,
          eventType: performanceData.event_type || 'Safety Event',
          severity: performanceData.severity || 'Medium',
          location: performanceData.location || 'Unknown',
          timestamp: performanceData.timestamp
        },
        'ENG'
      );

      console.log(`Safety message sent to driver ${processedEvent.driverId} for ${performanceData.event_type}`);
    } catch (error) {
      console.error('Failed to handle Motive performance event:', error);
    }
  }

  /**
   * Handle HOS Violation Event
   * Compliant: Triggers compliance messages, no HOS management
   */
  async handleHOSViolation(event: MotiveWebhookEvent): Promise<void> {
    try {
      const processedEvent = await this.provider.processWebhookEvent(event);
      
      if (!processedEvent.driverId) {
        console.log('No driver ID in HOS event, skipping message');
        return;
      }

      const hosData = processedEvent.templateData;

      // Generate HOS warning message (compliant: notification only)
      await this.messageTemplateService.generateMessage(
        'driver.hos.warning',
        {
          driverId: processedEvent.driverId,
          violationType: hosData.violation_type || 'Hours of Service',
          timeRemaining: hosData.time_remaining || 'Unknown',
          nextRestLocation: hosData.next_rest_area || 'Check navigation',
          timestamp: hosData.timestamp
        },
        'ENG'
      );

      console.log(`HOS warning sent to driver ${processedEvent.driverId}`);
    } catch (error) {
      console.error('Failed to handle Motive HOS event:', error);
    }
  }

  /**
   * Handle Fault Code Event
   * Compliant: Triggers maintenance messages, no maintenance management
   */
  async handleFaultCodeEvent(event: MotiveWebhookEvent): Promise<void> {
    try {
      const processedEvent = await this.provider.processWebhookEvent(event);
      
      if (!processedEvent.driverId && !processedEvent.vehicleId) {
        console.log('No driver or vehicle ID in fault code event, skipping message');
        return;
      }

      const faultData = processedEvent.templateData;
      const isOpened = event.action === MotiveEventTypes.FAULT_CODE_OPENED;

      // Generate maintenance alert message (compliant: notification only)
      await this.messageTemplateService.generateMessage(
        isOpened ? 'maintenance.alert' : 'maintenance.resolved',
        {
          driverId: processedEvent.driverId,
          vehicleId: processedEvent.vehicleId,
          faultCode: faultData.fault_code || 'Unknown',
          description: faultData.description || 'Vehicle diagnostic alert',
          severity: faultData.severity || 'Medium',
          timestamp: faultData.timestamp
        },
        'ENG'
      );

      const action = isOpened ? 'opened' : 'resolved';
      console.log(`Maintenance ${action} message sent for fault ${faultData.fault_code}`);
    } catch (error) {
      console.error('Failed to handle Motive fault code event:', error);
    }
  }

  /**
   * Process Driver Response from WhatsApp
   * Compliant: Relays driver responses back to Motive, no interpretation
   */
  async processDriverResponse(
    driverId: string, 
    responseType: string, 
    responseData: any
  ): Promise<void> {
    try {
      // Map WhatsApp responses to Motive driver status updates
      const statusMapping: Record<string, any> = {
        'acknowledge_route': { status: 'acknowledged' },
        'pickup_confirmed': { status: 'arrived' },
        'loaded': { status: 'loaded' },
        'en_route': { status: 'departed' },
        'delivered': { status: 'delivered' },
        'report_issue': { status: 'issue', notes: responseData.message || 'Issue reported' },
        'share_location': { 
          status: 'location_shared',
          location: responseData.location 
        }
      };

      const motiveResponse = statusMapping[responseType];
      if (!motiveResponse) {
        console.log(`Unknown response type ${responseType}, skipping Motive update`);
        return;
      }

      // Create driver response object
      const driverResponse: MotiveDriverResponse = {
        driverId,
        status: motiveResponse.status,
        location: motiveResponse.location,
        notes: motiveResponse.notes
      };

      // Relay response back to Motive (compliant: no processing, just relay)
      await this.provider.updateDriverStatus(driverId, driverResponse);

      console.log(`Driver ${driverId} response '${responseType}' relayed to Motive`);
    } catch (error) {
      console.error(`Failed to process driver ${driverId} response:`, error);
    }
  }

  /**
   * Setup Express Routes for Motive Webhooks
   * Compliant: Webhook endpoints for message relay only
   */
  setupRoutes(app: Express, tenantId: string): void {
    const webhookPath = `/webhooks/motive/${tenantId}`;

    app.post(webhookPath, async (req, res) => {
      try {
        // Verify webhook signature for security
        const signature = req.headers['x-motive-webhook-signature'] as string;
        const payload = JSON.stringify(req.body);
        
        if (!signature || !MotiveCommunicationProvider.verifyWebhookSignature(
          payload, 
          signature, 
          process.env.MOTIVE_WEBHOOK_SECRET || ''
        )) {
          console.error('Invalid Motive webhook signature');
          return res.status(403).json({ error: 'Invalid signature' });
        }

        const event: MotiveWebhookEvent = req.body;
        console.log(`Received Motive webhook event: ${event.action}`);

        // Route event to appropriate handler (compliant: message relay only)
        switch (event.action) {
          case MotiveEventTypes.VEHICLE_LOCATION_UPDATED:
            await this.handleVehicleLocation(event);
            break;
          case MotiveEventTypes.VEHICLE_GEOFENCE_EVENT:
            await this.handleGeofenceEvent(event);
            break;
          case MotiveEventTypes.DRIVER_PERFORMANCE_EVENT:
            await this.handleDriverPerformanceEvent(event);
            break;
          case MotiveEventTypes.HOS_VIOLATION:
            await this.handleHOSViolation(event);
            break;
          case MotiveEventTypes.FAULT_CODE_OPENED:
          case MotiveEventTypes.FAULT_CODE_CLOSED:
            await this.handleFaultCodeEvent(event);
            break;
          default:
            console.log(`Unhandled Motive event type: ${event.action}`);
        }

        res.status(200).json({ status: 'processed' });
      } catch (error) {
        console.error('Motive webhook processing error:', error);
        res.status(500).json({ error: 'Processing failed' });
      }
    });

    console.log(`Motive webhook endpoint configured: ${webhookPath}`);
  }
}

export { MotiveWebhookHandler };