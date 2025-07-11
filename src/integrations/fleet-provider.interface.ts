/**
 * Unified Fleet Management Provider Interface
 * Abstracts differences between Samsara and Geotab platforms
 */

export interface FleetProviderConfig {
  platform: 'samsara' | 'geotab';
  credentials: SamsaraConfig | GeotabConfig;
  tenantId: string;
}

export interface UnifiedDriver {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  employeeNumber?: string;
  vehicleIds: string[];
  isActive: boolean;
  platform: 'samsara' | 'geotab';
  platformData: any; // Original platform-specific data
}

export interface UnifiedVehicle {
  id: string;
  name: string;
  vin?: string;
  licensePlate?: string;
  make?: string;
  model?: string;
  year?: number;
  currentDriverId?: string;
  deviceType?: string;
  isActive: boolean;
  platform: 'samsara' | 'geotab';
  platformData: any;
}

export interface UnifiedTrip {
  id: string;
  vehicleId: string;
  driverId: string;
  startTime: string;
  endTime?: string;
  distance?: number;
  duration?: string;
  startLocation?: { latitude: number; longitude: number };
  endLocation?: { latitude: number; longitude: number };
  status: 'active' | 'completed' | 'cancelled';
  platform: 'samsara' | 'geotab';
  platformData: any;
}

export interface UnifiedLocation {
  vehicleId: string;
  driverId?: string;
  latitude: number;
  longitude: number;
  address?: string;
  speed?: number;
  timestamp: string;
  accuracy?: number;
  heading?: number;
  platform: 'samsara' | 'geotab';
}

export interface UnifiedEvent {
  id: string;
  eventType: string;
  timestamp: string;
  vehicleId?: string;
  driverId?: string;
  location?: { latitude: number; longitude: number };
  severity: 'info' | 'warning' | 'critical';
  description: string;
  metadata: Record<string, any>;
  platform: 'samsara' | 'geotab';
  originalEvent: any;
}

export interface UnifiedDiagnostic {
  vehicleId: string;
  diagnosticType: string;
  code?: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  value?: number;
  unit?: string;
  platform: 'samsara' | 'geotab';
}

export interface EventSubscription {
  eventTypes: string[];
  callback: (event: UnifiedEvent) => Promise<void>;
  tenantId: string;
}

export interface FleetProviderHealthStatus {
  isHealthy: boolean;
  platform: 'samsara' | 'geotab';
  lastCheck: string;
  responseTime?: number;
  errors?: string[];
  capabilities: {
    realTimeEvents: boolean;
    locationTracking: boolean;
    diagnostics: boolean;
    webhooks: boolean;
    driverManagement: boolean;
  };
}

/**
 * Unified Fleet Management Provider Interface
 * All fleet management integrations must implement this interface
 */
export interface IFleetProvider {
  readonly platform: 'samsara' | 'geotab';
  readonly tenantId: string;

  // Authentication & Setup
  authenticate(): Promise<void>;
  disconnect(): Promise<void>;
  isAuthenticated(): boolean;

  // Driver Management
  getDrivers(): Promise<UnifiedDriver[]>;
  getDriver(driverId: string): Promise<UnifiedDriver>;
  updateDriver(driverId: string, updates: Partial<UnifiedDriver>): Promise<UnifiedDriver>;
  searchDrivers(query: { name?: string; phone?: string; active?: boolean }): Promise<UnifiedDriver[]>;

  // Vehicle Management
  getVehicles(): Promise<UnifiedVehicle[]>;
  getVehicle(vehicleId: string): Promise<UnifiedVehicle>;
  updateVehicle(vehicleId: string, updates: Partial<UnifiedVehicle>): Promise<UnifiedVehicle>;
  searchVehicles(query: { name?: string; vin?: string; licensePlate?: string }): Promise<UnifiedVehicle[]>;

  // Trip Management
  getTrips(query: {
    vehicleId?: string;
    driverId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<UnifiedTrip[]>;
  getActiveTrips(): Promise<UnifiedTrip[]>;
  createTrip?(tripData: Omit<UnifiedTrip, 'id' | 'platform' | 'platformData'>): Promise<UnifiedTrip>;

  // Location Services
  getCurrentLocation(vehicleId: string): Promise<UnifiedLocation>;
  getLocationHistory(vehicleId: string, startDate: string, endDate: string): Promise<UnifiedLocation[]>;
  trackVehicleLocation(vehicleId: string, callback: (location: UnifiedLocation) => void): Promise<() => void>; // Returns unsubscribe function

  // Event Management
  subscribeToEvents(subscription: EventSubscription): Promise<string>; // Returns subscription ID
  unsubscribeFromEvents(subscriptionId: string): Promise<void>;
  getEventHistory(query: {
    vehicleId?: string;
    driverId?: string;
    eventTypes?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<UnifiedEvent[]>;

  // Diagnostics & Health
  getVehicleDiagnostics(vehicleId: string): Promise<UnifiedDiagnostic[]>;
  getHealthStatus(): Promise<FleetProviderHealthStatus>;

  // Webhook Management (if supported)
  setupWebhook?(webhookUrl: string, eventTypes: string[]): Promise<{ webhookId: string; secret?: string }>;
  removeWebhook?(webhookId: string): Promise<void>;
  validateWebhookSignature?(payload: string, signature: string, secret: string): boolean;

  // Utility Methods
  normalizeEventType(platformEventType: string): string;
  mapToUnifiedFormat<T>(platformData: any, type: 'driver' | 'vehicle' | 'trip' | 'event'): T;
}

/**
 * Event type mappings between platforms
 */
export const UNIFIED_EVENT_TYPES = {
  // Driver Events
  DRIVER_LOGIN: 'driver.login',
  DRIVER_LOGOUT: 'driver.logout',
  DRIVER_VEHICLE_ASSIGNED: 'driver.vehicle.assigned',
  DRIVER_VEHICLE_UNASSIGNED: 'driver.vehicle.unassigned',

  // Vehicle Events
  VEHICLE_STARTED: 'vehicle.started',
  VEHICLE_STOPPED: 'vehicle.stopped',
  VEHICLE_MOVING: 'vehicle.moving',
  VEHICLE_IDLE: 'vehicle.idle',

  // Location Events
  GEOFENCE_ENTERED: 'location.geofence.entered',
  GEOFENCE_EXITED: 'location.geofence.exited',
  ROUTE_STARTED: 'location.route.started',
  ROUTE_COMPLETED: 'location.route.completed',
  LOCATION_UPDATE: 'location.update',

  // Safety Events
  HARSH_BRAKING: 'safety.harsh_braking',
  HARSH_ACCELERATION: 'safety.harsh_acceleration',
  HARSH_CORNERING: 'safety.harsh_cornering',
  SPEEDING: 'safety.speeding',

  // Maintenance Events
  MAINTENANCE_DUE: 'maintenance.due',
  FAULT_CODE: 'maintenance.fault_code',
  ENGINE_ISSUE: 'maintenance.engine_issue',

  // Trip Events
  TRIP_STARTED: 'trip.started',
  TRIP_COMPLETED: 'trip.completed',
  STOP_COMPLETED: 'trip.stop.completed',
} as const;

export type UnifiedEventType = typeof UNIFIED_EVENT_TYPES[keyof typeof UNIFIED_EVENT_TYPES];

/**
 * Platform-specific event type mappings
 */
export const SAMSARA_EVENT_MAPPINGS: Record<string, UnifiedEventType> = {
  'driver.vehicle.assignment.changed': UNIFIED_EVENT_TYPES.DRIVER_VEHICLE_ASSIGNED,
  'vehicle.engine.on': UNIFIED_EVENT_TYPES.VEHICLE_STARTED,
  'vehicle.engine.off': UNIFIED_EVENT_TYPES.VEHICLE_STOPPED,
  'geofence.entry': UNIFIED_EVENT_TYPES.GEOFENCE_ENTERED,
  'geofence.exit': UNIFIED_EVENT_TYPES.GEOFENCE_EXITED,
  'route.assignment': UNIFIED_EVENT_TYPES.ROUTE_STARTED,
  // Add more Samsara event mappings
};

export const GEOTAB_EVENT_MAPPINGS: Record<string, UnifiedEventType> = {
  'DeviceStatusInfo': UNIFIED_EVENT_TYPES.VEHICLE_STARTED,
  'Trip': UNIFIED_EVENT_TYPES.TRIP_COMPLETED,
  'ExceptionEvent': UNIFIED_EVENT_TYPES.HARSH_BRAKING, // Depends on rule type
  'FaultData': UNIFIED_EVENT_TYPES.FAULT_CODE,
  // Add more Geotab event mappings
};

import { SamsaraConfig } from './samsara.integration';
import { GeotabConfig } from './geotab.integration';