import { z } from "zod";

// Samsara API Configuration
const SAMSARA_API_BASE = "https://api.samsara.com";
const SAMSARA_API_VERSION = "2024-10-15";

// Samsara Event Types based on their API documentation
export const SamsaraEventTypes = {
  // Vehicle Events
  VEHICLE_LOCATION: "vehicle.location",
  VEHICLE_ENGINE_STATE: "vehicle.engineState",
  VEHICLE_HARSH_ACCEL: "vehicle.harshAcceleration",
  VEHICLE_HARSH_BRAKE: "vehicle.harshBraking",
  VEHICLE_HARSH_TURN: "vehicle.harshTurning",
  VEHICLE_SPEEDING: "vehicle.speeding",
  VEHICLE_PANIC_BUTTON: "vehicle.panicButton",
  VEHICLE_DIAGNOSTIC: "vehicle.diagnostic",
  
  // Driver Events
  DRIVER_LOGIN: "driver.login",
  DRIVER_LOGOUT: "driver.logout",
  DRIVER_DUTY_STATUS: "driver.dutyStatus",
  DRIVER_VIOLATION: "driver.violation",
  
  // Route & Trip Events
  TRIP_STARTED: "trip.started",
  TRIP_COMPLETED: "trip.completed",
  ROUTE_STARTED: "route.started",
  ROUTE_COMPLETED: "route.completed",
  ROUTE_DEVIATION: "route.deviation",
  
  // Geofence Events
  GEOFENCE_ENTER: "geofence.enter",
  GEOFENCE_EXIT: "geofence.exit",
  
  // Maintenance Events
  MAINTENANCE_DUE: "maintenance.due",
  FAULT_CODE: "vehicle.faultCode",
  
  // Document Events
  DOCUMENT_UPLOADED: "document.uploaded",
  DOCUMENT_SIGNED: "document.signed"
} as const;

// Samsara Vehicle Schema
export const samsaraVehicleSchema = z.object({
  id: z.string(),
  name: z.string(),
  vin: z.string().optional(),
  licensePlate: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional(),
  engineHours: z.number().optional(),
  odometer: z.number().optional(),
  fuelLevel: z.number().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    timestamp: z.string(),
    address: z.string().optional(),
    speed: z.number().optional(),
    heading: z.number().optional()
  }).optional()
});

// Samsara Driver Schema
export const samsaraDriverSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseState: z.string().optional(),
  dutyStatus: z.enum(["on_duty", "off_duty", "sleeper_berth", "driving"]).optional(),
  currentVehicleId: z.string().optional(),
  isActive: z.boolean().default(true)
});

// Samsara Route Schema
export const samsaraRouteSchema = z.object({
  id: z.string(),
  name: z.string(),
  vehicleId: z.string(),
  driverId: z.string().optional(),
  startLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional()
  }),
  endLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional()
  }),
  waypoints: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
    arrivalTime: z.string().optional()
  })).optional(),
  estimatedDuration: z.number().optional(),
  estimatedDistance: z.number().optional(),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]),
  startedAt: z.string().optional(),
  completedAt: z.string().optional()
});

// Samsara Event Schema
export const samsaraEventSchema = z.object({
  eventId: z.string(),
  eventType: z.string(),
  timestamp: z.string(),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional()
  }).optional(),
  data: z.record(z.any()).optional()
});

// Samsara Document Schema
export const samsaraDocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  uploadedAt: z.string(),
  signedAt: z.string().optional(),
  url: z.string(),
  metadata: z.record(z.any()).optional()
});

// FleetChat to Samsara Mapping Types
export interface SamsaraIntegrationConfig {
  apiToken: string;
  orgId: string;
  webhookUrl?: string;
  enabledEvents: string[];
  syncInterval: number; // minutes
}

export interface SamsaraTransportMapping {
  fleetChatTransportId: string;
  samsaraRouteId: string;
  samsaraVehicleId: string;
  samsaraDriverId?: string;
  status: "active" | "completed" | "cancelled";
  lastSyncAt: Date;
}

// Samsara API Client Class
export class SamsaraAPIClient {
  private apiToken: string;
  private orgId: string;
  private baseUrl: string;

  constructor(config: SamsaraIntegrationConfig) {
    this.apiToken = config.apiToken;
    this.orgId = config.orgId;
    this.baseUrl = SAMSARA_API_BASE;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        'X-Samsara-API-Version': SAMSARA_API_VERSION,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`Samsara API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Vehicle Operations
  async getVehicles() {
    return this.makeRequest('/fleet/vehicles');
  }

  async getVehicle(vehicleId: string) {
    return this.makeRequest(`/fleet/vehicles/${vehicleId}`);
  }

  async getVehicleLocation(vehicleId: string) {
    return this.makeRequest(`/fleet/vehicles/${vehicleId}/location`);
  }

  async getVehicleStats(vehicleId: string, startTime: string, endTime: string) {
    const params = new URLSearchParams({ startTime, endTime });
    return this.makeRequest(`/fleet/vehicles/${vehicleId}/stats?${params}`);
  }

  // Driver Operations
  async getDrivers() {
    return this.makeRequest('/fleet/drivers');
  }

  async getDriver(driverId: string) {
    return this.makeRequest(`/fleet/drivers/${driverId}`);
  }

  async getDriverDutyStatus(driverId: string) {
    return this.makeRequest(`/fleet/drivers/${driverId}/duty-status`);
  }

  // Route Operations
  async createRoute(routeData: any) {
    return this.makeRequest('/fleet/routes', {
      method: 'POST',
      body: JSON.stringify(routeData)
    });
  }

  async getRoute(routeId: string) {
    return this.makeRequest(`/fleet/routes/${routeId}`);
  }

  async updateRoute(routeId: string, updates: any) {
    return this.makeRequest(`/fleet/routes/${routeId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  async startRoute(routeId: string) {
    return this.makeRequest(`/fleet/routes/${routeId}/start`, {
      method: 'POST'
    });
  }

  async completeRoute(routeId: string) {
    return this.makeRequest(`/fleet/routes/${routeId}/complete`, {
      method: 'POST'
    });
  }

  // Event Operations
  async getEvents(startTime: string, endTime: string, eventTypes?: string[]) {
    const params = new URLSearchParams({ startTime, endTime });
    if (eventTypes) {
      params.append('eventTypes', eventTypes.join(','));
    }
    return this.makeRequest(`/fleet/events?${params}`);
  }

  // Document Operations
  async uploadDocument(file: Blob, metadata: any) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));
    
    return this.makeRequest('/documents', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'X-Samsara-API-Version': SAMSARA_API_VERSION
      }
    });
  }

  async getDocuments(vehicleId?: string, driverId?: string) {
    const params = new URLSearchParams();
    if (vehicleId) params.append('vehicleId', vehicleId);
    if (driverId) params.append('driverId', driverId);
    return this.makeRequest(`/documents?${params}`);
  }

  // Webhook Management
  async createWebhook(callbackUrl: string, eventTypes: string[]) {
    return this.makeRequest('/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        callbackUrl,
        eventTypes,
        isActive: true
      })
    });
  }

  async deleteWebhook(webhookId: string) {
    return this.makeRequest(`/webhooks/${webhookId}`, {
      method: 'DELETE'
    });
  }
}

// Event Processing Functions
export function mapSamsaraEventToFleetChat(samsaraEvent: any) {
  const eventType = samsaraEvent.eventType;
  
  switch (eventType) {
    case SamsaraEventTypes.VEHICLE_LOCATION:
      return {
        type: 'location_update',
        transportId: samsaraEvent.routeId,
        driverId: samsaraEvent.driverId,
        location: {
          lat: samsaraEvent.location.latitude,
          lng: samsaraEvent.location.longitude,
          accuracy: samsaraEvent.location.accuracy,
          speed: samsaraEvent.location.speed,
          heading: samsaraEvent.location.heading,
          timestamp: new Date(samsaraEvent.timestamp)
        }
      };
      
    case SamsaraEventTypes.TRIP_STARTED:
      return {
        type: 'transport_started',
        transportId: samsaraEvent.routeId,
        status: 'en_route',
        timestamp: new Date(samsaraEvent.timestamp)
      };
      
    case SamsaraEventTypes.TRIP_COMPLETED:
      return {
        type: 'transport_completed',
        transportId: samsaraEvent.routeId,
        status: 'completed',
        timestamp: new Date(samsaraEvent.timestamp)
      };
      
    case SamsaraEventTypes.GEOFENCE_ENTER:
      return {
        type: 'geofence_enter',
        transportId: samsaraEvent.routeId,
        geofenceType: samsaraEvent.data.geofenceName,
        location: {
          lat: samsaraEvent.location.latitude,
          lng: samsaraEvent.location.longitude
        },
        timestamp: new Date(samsaraEvent.timestamp)
      };
      
    case SamsaraEventTypes.DOCUMENT_UPLOADED:
      return {
        type: 'document_uploaded',
        transportId: samsaraEvent.routeId,
        documentId: samsaraEvent.data.documentId,
        documentType: samsaraEvent.data.documentType,
        timestamp: new Date(samsaraEvent.timestamp)
      };
      
    default:
      return {
        type: 'unknown_event',
        eventType,
        data: samsaraEvent,
        timestamp: new Date(samsaraEvent.timestamp)
      };
  }
}

export function mapFleetChatToSamsaraRoute(transport: any) {
  return {
    name: `FleetChat Transport ${transport.id}`,
    startLocation: {
      latitude: transport.pickupLat,
      longitude: transport.pickupLng,
      address: transport.pickupAddress || transport.pickupLocation
    },
    endLocation: {
      latitude: transport.deliveryLat,
      longitude: transport.deliveryLng,
      address: transport.deliveryAddress || transport.deliveryLocation
    },
    vehicleId: transport.samsaraVehicleId,
    driverId: transport.samsaraDriverId,
    metadata: {
      fleetChatTransportId: transport.id,
      workflowType: transport.workflowType,
      loadReference: transport.loadReference
    }
  };
}