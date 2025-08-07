import { z } from "zod";
import { createHmac } from "crypto";

// Motive API Configuration - Compliant with Universal Boundaries
const MOTIVE_API_BASE = "https://api.gomotive.com";
const MOTIVE_API_VERSION = "v3";

// Motive Event Types for Communication Protocol Service
const MotiveEventTypes = {
  // Vehicle Events for Message Triggers
  VEHICLE_LOCATION_UPDATED: "vehicle_location_updated",
  VEHICLE_GEOFENCE_EVENT: "vehicle_geofence_event",
  
  // Driver Events for Safety Messages
  DRIVER_PERFORMANCE_EVENT: "driver_performance_event_updated",
  HOS_VIOLATION: "hos_violation_upserted",
  
  // Maintenance Events for Service Messages
  FAULT_CODE_OPENED: "fault_code_opened",
  FAULT_CODE_CLOSED: "fault_code_closed",
  
  // Document Events for Upload Requests
  INSPECTION_COMPLETED: "inspection_completed",
  DOCUMENT_UPLOADED: "document_uploaded"
} as const;

// Compliant Driver Schema - Communication Data Only
export const motiveCommunicationDriverSchema = z.object({
  id: z.string(),
  name: z.string(),
  phoneNumber: z.string().optional(),
  // NO vehicle, route, or operational data - compliance boundary
});

// Compliant Webhook Event Schema
export const motiveWebhookEventSchema = z.object({
  action: z.string(),
  id: z.number(),
  vehicle_id: z.number().optional(),
  driver_id: z.number().optional(),
  timestamp: z.string(),
  // Event-specific data for message template variables only
  data: z.record(z.any()).optional()
});

// Compliant Driver Response Schema
export const motiveDriverResponseSchema = z.object({
  driverId: z.string(),
  status: z.enum(['arrived', 'loaded', 'departed', 'delivered', 'issue']),
  location: z.object({
    latitude: z.number(),
    longitude: z.number()
  }).optional(),
  documents: z.array(z.object({
    type: z.string(),
    url: z.string()
  })).optional(),
  notes: z.string().optional()
});

export type CommunicationDriver = z.infer<typeof motiveCommunicationDriverSchema>;
export type MotiveWebhookEvent = z.infer<typeof motiveWebhookEventSchema>;
export type MotiveDriverResponse = z.infer<typeof motiveDriverResponseSchema>;

/**
 * Motive Communication Provider - Compliant with Universal Boundaries
 * 
 * This service operates EXCLUSIVELY as a communication protocol relay.
 * It does NOT replicate any Motive fleet management functionality.
 */
export class MotiveCommunicationProvider {
  private apiToken: string;
  private baseUrl: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
    this.baseUrl = `${MOTIVE_API_BASE}/${MOTIVE_API_VERSION}`;
  }

  /**
   * Authentication - For API access only
   */
  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/users/me`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Motive authentication failed:', error);
      return false;
    }
  }

  /**
   * Get Drivers - For phone number mapping ONLY
   * Compliant: Only retrieves communication data, no fleet management data
   */
  async getDrivers(): Promise<CommunicationDriver[]> {
    try {
      const response = await fetch(`${this.baseUrl}/users?user_type=driver`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Motive API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract communication data only - compliance boundary
      return data.users?.map((user: any) => ({
        id: user.id.toString(),
        name: user.name,
        phoneNumber: user.phone_number || user.mobile_phone
      })) || [];
    } catch (error) {
      console.error('Failed to fetch Motive drivers:', error);
      throw error;
    }
  }

  /**
   * Get Single Driver - For phone number mapping ONLY
   */
  async getDriver(driverId: string): Promise<CommunicationDriver | null> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${driverId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Motive API error: ${response.status}`);
      }

      const user = await response.json();
      
      return {
        id: user.id.toString(),
        name: user.name,
        phoneNumber: user.phone_number || user.mobile_phone
      };
    } catch (error) {
      console.error(`Failed to fetch Motive driver ${driverId}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to Events - For message relay ONLY
   * Compliant: Sets up webhooks for communication triggers only
   */
  async subscribeToEvents(webhookUrl: string, events: string[]): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/company_webhooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: webhookUrl,
          events: events,
          secret: this.generateWebhookSecret()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create Motive webhook: ${response.status}`);
      }

      const webhook = await response.json();
      return webhook.id.toString();
    } catch (error) {
      console.error('Failed to subscribe to Motive events:', error);
      throw error;
    }
  }

  /**
   * Update Driver Status - For response relay back to Motive
   * Compliant: Writes driver responses back to Motive without fleet management logic
   */
  async updateDriverStatus(driverId: string, response: MotiveDriverResponse): Promise<void> {
    try {
      // Send driver status update back to Motive
      const motiveResponse = await fetch(`${this.baseUrl}/drivers/${driverId}/status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: response.status,
          location: response.location,
          timestamp: new Date().toISOString(),
          notes: response.notes
        })
      });

      if (!motiveResponse.ok) {
        throw new Error(`Failed to update Motive driver status: ${motiveResponse.status}`);
      }
    } catch (error) {
      console.error(`Failed to update Motive driver ${driverId} status:`, error);
      throw error;
    }
  }

  /**
   * Upload Driver Document - For document relay from WhatsApp
   * Compliant: Forwards documents without processing or management
   */
  async uploadDriverDocument(driverId: string, document: {
    type: string;
    url: string;
    name: string;
  }): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/drivers/${driverId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          document_type: document.type,
          document_url: document.url,
          document_name: document.name,
          uploaded_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to upload document to Motive: ${response.status}`);
      }
    } catch (error) {
      console.error(`Failed to upload document for driver ${driverId}:`, error);
      throw error;
    }
  }

  /**
   * Process Webhook Event - For message relay ONLY
   * Compliant: Processes events for message triggers without fleet management logic
   */
  async processWebhookEvent(event: MotiveWebhookEvent): Promise<{
    eventType: string;
    driverId?: string;
    vehicleId?: string;
    templateData: Record<string, any>;
  }> {
    const { action, driver_id, vehicle_id, data } = event;

    // Map Motive events to FleetChat message templates
    const eventMapping: Record<string, string> = {
      [MotiveEventTypes.VEHICLE_LOCATION_UPDATED]: 'vehicle.location',
      [MotiveEventTypes.VEHICLE_GEOFENCE_EVENT]: 'geofence.enter',
      [MotiveEventTypes.DRIVER_PERFORMANCE_EVENT]: 'safety.harsh_event',
      [MotiveEventTypes.HOS_VIOLATION]: 'driver.hos.warning',
      [MotiveEventTypes.FAULT_CODE_OPENED]: 'maintenance.alert',
      [MotiveEventTypes.INSPECTION_COMPLETED]: 'inspection.required'
    };

    const fleetChatEventType = eventMapping[action] || 'generic.notification';

    return {
      eventType: fleetChatEventType,
      driverId: driver_id?.toString(),
      vehicleId: vehicle_id?.toString(),
      templateData: data || {}
    };
  }

  /**
   * Generate Webhook Secret for HMAC verification
   */
  private generateWebhookSecret(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Verify Webhook Signature for security
   */
  static verifyWebhookSignature(
    payload: string, 
    signature: string, 
    secret: string
  ): boolean {
    try {
      const expectedSignature = createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      return signature === `sha256=${expectedSignature}`;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }
}

// Export event types for webhook configuration
export { MotiveEventTypes };