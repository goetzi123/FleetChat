// WhatsApp Message Templates for FleetChat Driver Communications
import { Transport, User, LocationTracking } from "@shared/schema";

export interface WhatsAppTemplate {
  type: string;
  message: string;
  buttons?: string[];
  quickReplies?: string[];
}

export class WhatsAppTemplateService {
  
  // Location & Route Event Templates
  static getLocationUpdateTemplate(transport: Transport, location: LocationTracking): WhatsAppTemplate {
    return {
      type: 'location_update',
      message: `📍 Location Update for Transport #${transport.id.slice(-6)}\n\n` +
               `Route: ${transport.pickupLocation} → ${transport.deliveryLocation}\n` +
               `Current Status: ${this.formatStatus(transport.status)}\n` +
               `Location confirmed at ${new Date().toLocaleTimeString()}`,
      quickReplies: ['✅ Confirmed', '📞 Call Dispatcher']
    };
  }

  static getGeofenceEnterTemplate(transport: Transport, geofenceType: 'pickup' | 'delivery' | 'yard'): WhatsAppTemplate {
    const location = geofenceType === 'pickup' ? transport.pickupLocation : transport.deliveryLocation;
    const action = geofenceType === 'pickup' ? 'loading' : 'unloading';
    
    return {
      type: 'geofence_enter',
      message: `🎯 Arrived at ${this.formatGeofenceType(geofenceType)}\n\n` +
               `Location: ${location}\n` +
               `Time: ${new Date().toLocaleTimeString()}\n\n` +
               `Please confirm arrival and begin ${action} process.`,
      buttons: [`✅ Confirm Arrival`, `🚛 Start ${action.charAt(0).toUpperCase() + action.slice(1)}`, `❓ Need Help`]
    };
  }

  static getGeofenceExitTemplate(transport: Transport, geofenceType: 'pickup' | 'delivery'): WhatsAppTemplate {
    const location = geofenceType === 'pickup' ? transport.pickupLocation : transport.deliveryLocation;
    const nextStep = geofenceType === 'pickup' ? 'delivery location' : 'route completion';
    
    return {
      type: 'geofence_exit',
      message: `🚛 Departed from ${this.formatGeofenceType(geofenceType)}\n\n` +
               `Location: ${location}\n` +
               `Departure: ${new Date().toLocaleTimeString()}\n\n` +
               `En route to ${nextStep}. Drive safely!`,
      quickReplies: ['✅ Confirmed', '⏰ ETA Update', '🆘 Emergency']
    };
  }

  static getRouteDeviationTemplate(transport: Transport, deviationDistance: number): WhatsAppTemplate {
    return {
      type: 'route_deviation',
      message: `⚠️ Route Deviation Alert\n\n` +
               `Transport: #${transport.id.slice(-6)}\n` +
               `Deviation: ${deviationDistance}m from planned route\n` +
               `Time: ${new Date().toLocaleTimeString()}\n\n` +
               `Please return to planned route or confirm if intentional.`,
      buttons: ['🔄 Return to Route', '✅ Deviation Approved', '📞 Call Dispatch']
    };
  }

  static getRouteStartedTemplate(transport: Transport): WhatsAppTemplate {
    const eta = transport.deliveryEta ? new Date(transport.deliveryEta).toLocaleTimeString() : 'TBD';
    
    return {
      type: 'route_started',
      message: `🚀 Transport Started\n\n` +
               `ID: #${transport.id.slice(-6)}\n` +
               `From: ${transport.pickupLocation}\n` +
               `To: ${transport.deliveryLocation}\n` +
               `Expected Delivery: ${eta}\n\n` +
               `Safe travels! Confirm pickup when loading is complete.`,
      buttons: ['✅ Pickup Confirmed', '📋 View Details', '📞 Contact Dispatch']
    };
  }

  static getRouteCompletedTemplate(transport: Transport): WhatsAppTemplate {
    return {
      type: 'route_completed',
      message: `🎉 Transport Completed!\n\n` +
               `ID: #${transport.id.slice(-6)}\n` +
               `Route: ${transport.pickupLocation} → ${transport.deliveryLocation}\n` +
               `Completed: ${new Date().toLocaleTimeString()}\n\n` +
               `Great job! Please upload delivery documents.`,
      buttons: ['📄 Upload POD', '📷 Take Photo', '✅ All Complete']
    };
  }

  static getETAUpdateRequestTemplate(transport: Transport): WhatsAppTemplate {
    const currentETA = transport.deliveryEta ? new Date(transport.deliveryEta).toLocaleTimeString() : 'Not set';
    
    return {
      type: 'eta_update_request',
      message: `⏰ ETA Update Request\n\n` +
               `Transport: #${transport.id.slice(-6)}\n` +
               `Destination: ${transport.deliveryLocation}\n` +
               `Current ETA: ${currentETA}\n\n` +
               `Please provide updated arrival time.`,
      quickReplies: ['⏰ On Time', '⏰ +15 min', '⏰ +30 min', '⏰ +1 hour', '📞 Call Me']
    };
  }

  static getLocationTrackingStartTemplate(transport: Transport): WhatsAppTemplate {
    return {
      type: 'tracking_start',
      message: `📍 Location Tracking Active\n\n` +
               `Transport: #${transport.id.slice(-6)}\n` +
               `Route: ${transport.pickupLocation} → ${transport.deliveryLocation}\n\n` +
               `Your location will be shared for this transport. ` +
               `This helps us provide accurate ETAs and ensure safety.`,
      quickReplies: ['✅ Understood', '❓ Privacy Info']
    };
  }

  // Trip Management Event Templates
  static getTripStartedTemplate(transport: Transport): WhatsAppTemplate {
    return {
      type: 'trip_started',
      message: `🚛 Trip Started\n\n` +
               `Transport: #${transport.id.slice(-6)}\n` +
               `Starting Point: ${transport.pickupLocation}\n` +
               `Destination: ${transport.deliveryLocation}\n` +
               `Start Time: ${new Date().toLocaleTimeString()}\n\n` +
               `Confirm when you've completed loading and are ready to depart.`,
      buttons: ['✅ Loading Complete', '📋 View Manifest', '🆘 Issue Report']
    };
  }

  static getTripCompletedTemplate(transport: Transport): WhatsAppTemplate {
    return {
      type: 'trip_completed',
      message: `🏁 Trip Completed Successfully\n\n` +
               `Transport: #${transport.id.slice(-6)}\n` +
               `Final Destination: ${transport.deliveryLocation}\n` +
               `Completion Time: ${new Date().toLocaleTimeString()}\n\n` +
               `Please complete delivery documentation and confirm final status.`,
      buttons: ['📄 Upload Documents', '✅ Delivery Confirmed', '📞 Report Issue']
    };
  }

  // Utility Methods
  private static formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': '⏳ Pending',
      'dispatched': '📋 Dispatched',
      'en_route': '🚛 En Route',
      'arrived_pickup': '📍 At Pickup',
      'loading': '📦 Loading',
      'loaded': '✅ Loaded',
      'departed_pickup': '🚛 Departed Pickup',
      'arrived_delivery': '📍 At Delivery',
      'unloading': '📦 Unloading',
      'delivered': '✅ Delivered',
      'completed': '🎉 Completed',
      'cancelled': '❌ Cancelled'
    };
    return statusMap[status] || status;
  }

  private static formatGeofenceType(type: string): string {
    const typeMap: Record<string, string> = {
      'pickup': 'Pickup Location',
      'delivery': 'Delivery Location',
      'yard': 'Yard Location'
    };
    return typeMap[type] || type;
  }

  // Template Selection Helper
  static getTemplateForEvent(eventType: string, transport: Transport, additionalData?: any): WhatsAppTemplate {
    switch (eventType) {
      case 'geofence_enter':
        return this.getGeofenceEnterTemplate(transport, additionalData.geofenceType);
      case 'geofence_exit':
        return this.getGeofenceExitTemplate(transport, additionalData.geofenceType);
      case 'route_deviation':
        return this.getRouteDeviationTemplate(transport, additionalData.deviationDistance);
      case 'route_started':
        return this.getRouteStartedTemplate(transport);
      case 'route_completed':
        return this.getRouteCompletedTemplate(transport);
      case 'trip_started':
        return this.getTripStartedTemplate(transport);
      case 'trip_completed':
        return this.getTripCompletedTemplate(transport);
      case 'eta_update_request':
        return this.getETAUpdateRequestTemplate(transport);
      case 'tracking_start':
        return this.getLocationTrackingStartTemplate(transport);
      case 'location_update':
        return this.getLocationUpdateTemplate(transport, additionalData.location);
      default:
        return {
          type: 'generic',
          message: `📱 Transport Update\n\nTransport #${transport.id.slice(-6)} status: ${this.formatStatus(transport.status)}`,
          quickReplies: ['✅ Acknowledged']
        };
    }
  }
}