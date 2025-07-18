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

// Samsara Driver Schema - Enhanced with proper phone number access
export const samsaraDriverSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(), // Available with proper API scopes
  phoneNumber: z.string().optional(), // Alternative field name in some responses
  mobilePhone: z.string().optional(), // Additional phone field variant
  licenseNumber: z.string().optional(),
  licenseState: z.string().optional(),
  licenseExpiration: z.string().optional(),
  dutyStatus: z.enum(["on_duty", "off_duty", "sleeper_berth", "driving"]).optional(),
  currentVehicleId: z.string().optional(),
  isActive: z.boolean().default(true),
  // Additional driver app settings fields
  appSettings: z.object({
    canEditDutyStatus: z.boolean().optional(),
    canReceiveAlerts: z.boolean().optional(),
    phoneNumberVerified: z.boolean().optional()
  }).optional()
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
  // Required API scopes for phone number access
  requiredScopes: string[];
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

  // Driver Operations - Enhanced for phone number access
  async getDrivers() {
    // Request drivers with expanded fields including phone numbers
    return this.makeRequest('/fleet/drivers?expand=appSettings');
  }

  async getDriver(driverId: string) {
    // Request specific driver with app settings to access phone number
    return this.makeRequest(`/fleet/drivers/${driverId}?expand=appSettings`);
  }

  async getDriverWithPhone(driverId: string) {
    try {
      const driver = await this.makeRequest(`/fleet/drivers/${driverId}?expand=appSettings`);
      
      // Extract phone number from various possible field names
      const phoneNumber = driver.phone || driver.phoneNumber || driver.mobilePhone;
      
      if (!phoneNumber) {
        console.warn(`No phone number found for driver ${driverId}. Ensure:
          1. Phone number is entered in Samsara Dashboard (Drivers → Settings → Phone Number)
          2. API token includes 'Read Drivers' and 'Read Driver App Settings' scopes
          3. Organization doesn't have privacy flags preventing phone number exposure`);
      }
      
      return {
        ...driver,
        phoneNumber: phoneNumber,
        hasPhoneNumber: Boolean(phoneNumber)
      };
    } catch (error) {
      console.error(`Failed to fetch driver ${driverId} with phone:`, error);
      throw error;
    }
  }

  async validateDriverPhoneAccess() {
    try {
      const drivers = await this.getDrivers();
      const driversWithPhone = drivers.data?.filter((driver: any) => 
        driver.phone || driver.phoneNumber || driver.mobilePhone
      ) || [];
      
      return {
        totalDrivers: drivers.data?.length || 0,
        driversWithPhone: driversWithPhone.length,
        phoneAccessEnabled: driversWithPhone.length > 0,
        missingPhoneCount: (drivers.data?.length || 0) - driversWithPhone.length
      };
    } catch (error) {
      console.error('Failed to validate driver phone access:', error);
      throw error;
    }
  }

  async getDriverDutyStatus(driverId: string) {
    return this.makeRequest(`/fleet/drivers/${driverId}/duty-status`);
  }

  // Route Data Access (Read-Only)
  // FleetChat only reads route data from Samsara, does not create/modify routes
  async getRoute(routeId: string) {
    return this.makeRequest(`/fleet/dispatch/routes/${routeId}`);
  }

  async getRoutes() {
    return this.makeRequest('/fleet/dispatch/routes');
  }

  // Trip Operations
  async getTrips(vehicleId?: string, driverId?: string, startTime?: string, endTime?: string) {
    const params = new URLSearchParams();
    if (vehicleId) params.append('vehicleId', vehicleId);
    if (driverId) params.append('driverId', driverId);
    if (startTime) params.append('startTime', startTime);
    if (endTime) params.append('endTime', endTime);
    return this.makeRequest(`/fleet/trips?${params}`);
  }

  // Location & GPS Operations
  async getVehicleLocations(vehicleIds?: string[], startTime?: string, endTime?: string) {
    const params = new URLSearchParams();
    if (vehicleIds) params.append('vehicleIds', vehicleIds.join(','));
    if (startTime) params.append('startTime', startTime);
    if (endTime) params.append('endTime', endTime);
    return this.makeRequest(`/fleet/vehicles/locations?${params}`);
  }

  async getVehicleLocationHistory(vehicleId: string, startTime: string, endTime: string) {
    const params = new URLSearchParams({ startTime, endTime });
    return this.makeRequest(`/fleet/vehicles/${vehicleId}/locations?${params}`);
  }

  // Geofence Operations
  async getGeofences() {
    return this.makeRequest('/fleet/geofences');
  }

  // REMOVED: FleetChat should not create or modify geofences
  // Geofences are managed in Samsara by fleet managers

  // Safety & Dash Cam Operations
  async getVehicleSafetyScore(vehicleId: string, startTime?: string, endTime?: string) {
    const params = new URLSearchParams();
    if (startTime) params.append('startTime', startTime);
    if (endTime) params.append('endTime', endTime);
    return this.makeRequest(`/fleet/vehicles/${vehicleId}/safety?${params}`);
  }

  async getDrivingEvents(vehicleId?: string, driverId?: string, startTime?: string, endTime?: string) {
    const params = new URLSearchParams();
    if (vehicleId) params.append('vehicleId', vehicleId);
    if (driverId) params.append('driverId', driverId);
    if (startTime) params.append('startTime', startTime);
    if (endTime) params.append('endTime', endTime);
    return this.makeRequest(`/fleet/driving-events?${params}`);
  }

  async getCameraViews(vehicleId: string) {
    return this.makeRequest(`/fleet/camera-views?vehicleId=${vehicleId}`);
  }

  // HOS (Hours of Service) & Compliance Operations
  async getHosDailyLogs(driverId: string, startDate: string, endDate: string) {
    const params = new URLSearchParams({ startDate, endDate });
    return this.makeRequest(`/fleet/hos/daily-logs?driverId=${driverId}&${params}`);
  }

  async getHosViolations(driverId?: string, startTime?: string, endTime?: string) {
    const params = new URLSearchParams();
    if (driverId) params.append('driverId', driverId);
    if (startTime) params.append('startTime', startTime);
    if (endTime) params.append('endTime', endTime);
    return this.makeRequest(`/fleet/hos/violations?${params}`);
  }

  async getDvirs(vehicleId?: string, driverId?: string, startTime?: string, endTime?: string) {
    const params = new URLSearchParams();
    if (vehicleId) params.append('vehicleId', vehicleId);
    if (driverId) params.append('driverId', driverId);
    if (startTime) params.append('startTime', startTime);
    if (endTime) params.append('endTime', endTime);
    return this.makeRequest(`/fleet/dvirs?${params}`);
  }

  // Maintenance Operations
  async getMaintenanceSchedule(vehicleId: string) {
    return this.makeRequest(`/fleet/maintenance?vehicleId=${vehicleId}`);
  }

  async getVehicleFaultCodes(vehicleId: string, startTime?: string, endTime?: string) {
    const params = new URLSearchParams();
    if (startTime) params.append('startTime', startTime);
    if (endTime) params.append('endTime', endTime);
    return this.makeRequest(`/fleet/vehicles/${vehicleId}/fault-codes?${params}`);
  }

  // Assets Operations (for trailers, containers, etc.)
  async getAssets() {
    return this.makeRequest('/fleet/assets');
  }

  async getAsset(assetId: string) {
    return this.makeRequest(`/fleet/assets/${assetId}`);
  }

  async getAssetLocation(assetId: string) {
    return this.makeRequest(`/fleet/assets/${assetId}/location`);
  }

  // Tags & Groups Management
  async getTags() {
    return this.makeRequest('/tags');
  }

  async createTag(tagData: any) {
    return this.makeRequest('/tags', {
      method: 'POST',
      body: JSON.stringify(tagData)
    });
  }

  async getGroups() {
    return this.makeRequest('/groups');
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

  // Industrial IoT Operations (for temperature, gateway sensors)
  async getTemperatureData(assetId: string, startTime: string, endTime: string) {
    const params = new URLSearchParams({ startTime, endTime });
    return this.makeRequest(`/industrial/temperature?assetId=${assetId}&${params}`);
  }

  async getGatewayData(gatewayId: string, startTime?: string, endTime?: string) {
    const params = new URLSearchParams();
    if (startTime) params.append('startTime', startTime);
    if (endTime) params.append('endTime', endTime);
    return this.makeRequest(`/industrial/gateway/${gatewayId}?${params}`);
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

  // Bidirectional Write-Back Methods for Driver Responses
  async updateRouteStatus(routeId: string, status: string) {
    return this.makeRequest(`/fleet/dispatch/routes/${routeId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async updateDriverLocation(driverId: string, location: { lat: number; lng: number; timestamp: Date }) {
    return this.makeRequest(`/fleet/drivers/${driverId}/location`, {
      method: 'POST',
      body: JSON.stringify({
        latitude: location.lat,
        longitude: location.lng,
        timestamp: location.timestamp.toISOString()
      })
    });
  }

  async uploadRouteDocument(routeId: string, documentData: any) {
    return this.makeRequest(`/fleet/documents`, {
      method: 'POST',
      body: JSON.stringify({
        ...documentData,
        routeId: routeId
      })
    });
  }

  async updateRouteWaypoint(routeId: string, waypointId: string, status: string) {
    return this.makeRequest(`/fleet/dispatch/routes/${routeId}/waypoints/${waypointId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
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

// REMOVED: mapFleetChatToSamsaraRoute function
// FleetChat should not create or modify routes in Samsara
// FleetChat only processes incoming webhook events from Samsara routes