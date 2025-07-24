import { messageTemplateService } from "./message-template-service";
import type { GeneratedMessage } from "./message-template-service";
import { LanguageCode } from "@shared/schema";

/**
 * Enhanced message broker that uses database-based templates
 * while maintaining compatibility with the existing demo system
 */
export class EnhancedMessageBroker {
  
  /**
   * Generate driver message using database templates with fallback to hardcoded templates
   */
  async generateDriverMessage(event: any, languageCode: string = LanguageCode.ENGLISH): Promise<GeneratedMessage> {
    const eventType = event.eventType || event.type;
    
    // Try to get message from database templates first
    const dbMessage = await messageTemplateService.generateMessage(eventType, event, languageCode);
    
    if (dbMessage) {
      return dbMessage;
    }

    // Fallback to hardcoded templates for demo compatibility
    return this.generateFallbackMessage(event);
  }

  /**
   * Fallback message generation using the original hardcoded logic
   * This preserves the working demo system functionality
   */
  private generateFallbackMessage(event: any): GeneratedMessage {
    const eventType = event.eventType || event.type;
    
    switch (eventType) {
      case 'route.assigned':
        const route = event.data?.route;
        const pickup = route?.stops?.find((s: any) => s.type === 'pickup');
        const delivery = route?.stops?.find((s: any) => s.type === 'delivery');
        
        return {
          type: 'template',
          header: '🚛 New Route Assigned',
          body: `You have been assigned a new delivery route:

📍 Pickup: ${pickup?.location || 'Unknown location'}
🚩 Delivery: ${delivery?.location || 'Unknown location'}
⏰ Pickup window: ${pickup?.scheduledTime ? new Date(pickup.scheduledTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'TBD'}
📊 Route: ${route?.name || 'Transport route'}`,
          buttons: [
            { text: 'Acknowledge Route', payload: 'acknowledge_route', type: 'reply' },
            { text: 'View Details', payload: 'view_details', type: 'reply' }
          ]
        };
        
      case 'route.pickup_reminder':
        const stop = event.data?.stop;
        return {
          type: 'template',
          header: '⏰ Pickup Reminder',
          body: `Reminder: Your pickup window starts soon.

📍 ${stop?.location || 'Pickup location'}
📍 ${stop?.address || 'Address not specified'}
⏰ Window: ${stop?.timeWindow || 'ASAP'}
📞 Contact: ${stop?.customerContact || 'N/A'}

Please confirm your arrival time.`,
          buttons: [
            { text: 'On My Way', payload: 'en_route', type: 'reply' },
            { text: 'Share Location', payload: 'share_location', type: 'reply' }
          ]
        };
        
      case 'vehicle.location':
        const location = event.data?.location;
        return {
          type: 'text',
          body: `📍 Location update received: ${location?.address || 'Current position'}
Speed: ${location?.speed || 0} km/h`
        };
        
      case 'vehicle.geofence.enter':
        const geofence = event.data?.geofence;
        return {
          type: 'template',
          header: '🎯 Arrival Confirmed',
          body: `You have arrived at ${geofence?.name || 'destination'}.

Please confirm when ${geofence?.type === 'pickup_location' ? 'pickup' : 'delivery'} is complete.`,
          buttons: geofence?.type === 'pickup_location' ? [
            { text: 'Pickup Confirmed', payload: 'pickup_confirmed', type: 'reply' },
            { text: 'Cargo Loaded', payload: 'loaded', type: 'reply' }
          ] : [
            { text: 'Delivered', payload: 'delivered', type: 'reply' },
            { text: 'Issue/Delay', payload: 'report_issue', type: 'reply' }
          ]
        };
        
      case 'route.delivery_due':
        const deliveryStop = event.data?.stop;
        return {
          type: 'template',
          header: '🚚 Delivery Due',
          body: `Your delivery is approaching:

🏭 ${deliveryStop?.location || 'Delivery location'}
📍 ${deliveryStop?.address || 'Address not specified'}
👤 Contact: ${deliveryStop?.customerName || 'Customer'}
📝 Special: ${deliveryStop?.specialInstructions || 'Standard delivery'}`,
          buttons: [
            { text: 'Delivered', payload: 'delivered', type: 'reply' },
            { text: 'Issue/Delay', payload: 'report_issue', type: 'reply' }
          ]
        };
        
      case 'driver.hos.warning':
        const violation = event.data?.violation;
        return {
          type: 'template',
          header: '⚠️ Hours of Service Warning',
          body: `Drive time limit approaching!

⏰ Time remaining: ${violation?.timeRemaining || 'Unknown'} minutes
🛑 Mandatory break required
📍 Next rest area: ${violation?.nextRestLocation || 'Check navigation'}

Please plan your break accordingly.`,
          buttons: [
            { text: 'Taking Break', payload: 'need_break', type: 'reply' },
            { text: 'Continue to Delivery', payload: 'continue_delivery', type: 'reply' }
          ]
        };
        
      default:
        return {
          type: 'text',
          body: event.data?.message || event.message || 'Transport update available'
        };
    }
  }

  /**
   * Initialize database templates (should be called on system startup)
   */
  async initializeTemplates(): Promise<void> {
    try {
      await messageTemplateService.initializeDefaultTemplates();
      console.log('Database message templates initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database templates:', error);
      console.log('Falling back to hardcoded templates for demo compatibility');
    }
  }

  /**
   * Get available languages for templates
   */
  async getAvailableLanguages(): Promise<string[]> {
    // For now, return English as the primary language
    // This can be expanded to query the database for available languages
    return [LanguageCode.ENGLISH];
  }

  /**
   * Test template generation for all available event types
   */
  async testTemplateGeneration(): Promise<void> {
    const testEvents = [
      {
        eventType: 'route.assigned',
        data: {
          route: {
            name: 'Test Route Hamburg-Munich',
            stops: [
              { type: 'pickup', location: 'Hamburg Port Terminal', scheduledTime: new Date().toISOString() },
              { type: 'delivery', location: 'BMW Plant Munich' }
            ]
          }
        }
      },
      {
        eventType: 'vehicle.geofence.enter',
        data: {
          geofence: { name: 'Hamburg Terminal', type: 'pickup_location' }
        }
      },
      {
        eventType: 'vehicle.location',
        data: {
          location: { address: 'A7 Highway, Hamburg', speed: 85 }
        }
      }
    ];

    console.log('Testing template generation...');
    for (const event of testEvents) {
      const message = await this.generateDriverMessage(event);
      console.log(`Event: ${event.eventType}`, message);
    }
  }
}

export const enhancedMessageBroker = new EnhancedMessageBroker();