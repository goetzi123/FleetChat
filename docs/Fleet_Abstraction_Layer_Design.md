# Fleet Abstraction Layer Design for FleetChat

## Overview

This document outlines the comprehensive abstraction layer design that enables FleetChat to seamlessly operate with both Samsara and Geotab fleet management platforms. The design follows a single-platform-per-tenant approach, where each enterprise user connects to either Samsara OR Geotab, but not both simultaneously.

## Architecture Principles

### 1. Platform Abstraction
- **Unified Interface**: Single `IFleetProvider` interface for all fleet operations
- **Platform-Specific Implementations**: Separate providers for Samsara and Geotab
- **Seamless Switching**: Tenants can switch platforms without FleetChat code changes
- **Consistent Data Models**: Unified data structures across all platforms

### 2. Single Platform Per Tenant
- Each tenant connects to exactly one fleet management platform
- No cross-platform data mixing or synchronization required
- Simplified authentication and data management
- Clear ownership and security boundaries

### 3. Event-Driven Communication
- Real-time event processing for supported platforms (Samsara)
- Polling-based updates for platforms without webhook support (Geotab)
- Unified event format for consistent message generation
- Asynchronous processing for optimal performance

## Core Components

### 1. Fleet Provider Interface (`IFleetProvider`)

```typescript
interface IFleetProvider {
  // Core identification
  readonly platform: 'samsara' | 'geotab';
  readonly tenantId: string;

  // Authentication & lifecycle
  authenticate(): Promise<void>;
  disconnect(): Promise<void>;
  isAuthenticated(): boolean;

  // Driver management
  getDrivers(): Promise<UnifiedDriver[]>;
  getDriver(driverId: string): Promise<UnifiedDriver>;
  updateDriver(driverId: string, updates: Partial<UnifiedDriver>): Promise<UnifiedDriver>;
  searchDrivers(query: DriverSearchQuery): Promise<UnifiedDriver[]>;

  // Vehicle management
  getVehicles(): Promise<UnifiedVehicle[]>;
  getVehicle(vehicleId: string): Promise<UnifiedVehicle>;
  updateVehicle(vehicleId: string, updates: Partial<UnifiedVehicle>): Promise<UnifiedVehicle>;
  searchVehicles(query: VehicleSearchQuery): Promise<UnifiedVehicle[]>;

  // Location services
  getCurrentLocation(vehicleId: string): Promise<UnifiedLocation>;
  getLocationHistory(vehicleId: string, startDate: string, endDate: string): Promise<UnifiedLocation[]>;
  trackVehicleLocation(vehicleId: string, callback: LocationCallback): Promise<UnsubscribeFunction>;

  // Event management
  subscribeToEvents(subscription: EventSubscription): Promise<string>;
  unsubscribeFromEvents(subscriptionId: string): Promise<void>;
  getEventHistory(query: EventHistoryQuery): Promise<UnifiedEvent[]>;

  // Health & diagnostics
  getVehicleDiagnostics(vehicleId: string): Promise<UnifiedDiagnostic[]>;
  getHealthStatus(): Promise<FleetProviderHealthStatus>;
}
```

### 2. Unified Data Models

#### UnifiedDriver
```typescript
interface UnifiedDriver {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;            // Critical for WhatsApp communication
  email?: string;
  employeeNumber?: string;
  vehicleIds: string[];
  isActive: boolean;
  platform: 'samsara' | 'geotab';
  platformData: any;         // Original platform-specific data
}
```

#### UnifiedVehicle
```typescript
interface UnifiedVehicle {
  id: string;
  name: string;
  vin?: string;
  licensePlate?: string;
  make?: string;
  model?: string;
  year?: number;
  currentDriverId?: string;
  deviceType?: string;       // Geotab-specific
  isActive: boolean;
  platform: 'samsara' | 'geotab';
  platformData: any;
}
```

#### UnifiedEvent
```typescript
interface UnifiedEvent {
  id: string;
  eventType: string;         // Normalized event type
  timestamp: string;
  vehicleId?: string;
  driverId?: string;
  location?: { latitude: number; longitude: number };
  severity: 'info' | 'warning' | 'critical';
  description: string;
  metadata: Record<string, any>;
  platform: 'samsara' | 'geotab';
  originalEvent: any;        // Original platform event
}
```

### 3. Platform-Specific Providers

#### SamsaraFleetProvider
- **Real-time Events**: Webhook-based event processing
- **REST API**: Standard HTTP endpoints with Bearer token authentication
- **Strengths**: Modern API design, real-time capabilities, comprehensive event types
- **Implementation**: Direct API calls with retry logic and error handling

#### GeotabFleetProvider
- **Polling-based Events**: Data feeds with versioned updates
- **RPC API**: Method-based requests with session authentication
- **Strengths**: Comprehensive diagnostics, enterprise features, mature platform
- **Implementation**: Session management with automatic re-authentication

### 4. FleetProviderFactory

Central factory for creating and managing provider instances:

```typescript
class FleetProviderFactory {
  // Create authenticated provider instance
  static async createProvider(config: FleetProviderConfig): Promise<IFleetProvider>;
  
  // Get existing provider for tenant
  static getProvider(tenantId: string, platform: 'samsara' | 'geotab'): IFleetProvider | null;
  
  // Remove provider instance
  static async removeProvider(tenantId: string, platform: 'samsara' | 'geotab'): Promise<void>;
  
  // Health check all providers
  static async healthCheckAll(): Promise<Record<string, boolean>>;
  
  // Create config from tenant data
  static createConfigFromTenant(tenant: TenantData): FleetProviderConfig;
  
  // Validate platform configuration
  static validateConfig(config: FleetProviderConfig): ValidationResult;
}
```

## Event Processing Architecture

### 1. Event Type Normalization

```typescript
const UNIFIED_EVENT_TYPES = {
  // Driver Events
  DRIVER_LOGIN: 'driver.login',
  DRIVER_LOGOUT: 'driver.logout',
  DRIVER_VEHICLE_ASSIGNED: 'driver.vehicle.assigned',
  
  // Vehicle Events
  VEHICLE_STARTED: 'vehicle.started',
  VEHICLE_STOPPED: 'vehicle.stopped',
  VEHICLE_MOVING: 'vehicle.moving',
  
  // Location Events
  GEOFENCE_ENTERED: 'location.geofence.entered',
  GEOFENCE_EXITED: 'location.geofence.exited',
  ROUTE_STARTED: 'location.route.started',
  ROUTE_COMPLETED: 'location.route.completed',
  
  // Safety Events
  HARSH_BRAKING: 'safety.harsh_braking',
  HARSH_ACCELERATION: 'safety.harsh_acceleration',
  SPEEDING: 'safety.speeding',
  
  // Maintenance Events
  MAINTENANCE_DUE: 'maintenance.due',
  FAULT_CODE: 'maintenance.fault_code',
  ENGINE_ISSUE: 'maintenance.engine_issue',
} as const;
```

### 2. Platform Event Mappings

**Samsara Event Mappings:**
```typescript
const SAMSARA_EVENT_MAPPINGS = {
  'driver.vehicle.assignment.changed': UNIFIED_EVENT_TYPES.DRIVER_VEHICLE_ASSIGNED,
  'vehicle.engine.on': UNIFIED_EVENT_TYPES.VEHICLE_STARTED,
  'vehicle.engine.off': UNIFIED_EVENT_TYPES.VEHICLE_STOPPED,
  'geofence.entry': UNIFIED_EVENT_TYPES.GEOFENCE_ENTERED,
  'geofence.exit': UNIFIED_EVENT_TYPES.GEOFENCE_EXITED,
  // ... additional mappings
};
```

**Geotab Event Mappings:**
```typescript
const GEOTAB_EVENT_MAPPINGS = {
  'DeviceStatusInfo': UNIFIED_EVENT_TYPES.VEHICLE_STARTED,
  'Trip': UNIFIED_EVENT_TYPES.TRIP_COMPLETED,
  'ExceptionEvent': UNIFIED_EVENT_TYPES.HARSH_BRAKING,
  'FaultData': UNIFIED_EVENT_TYPES.FAULT_CODE,
  // ... additional mappings
};
```

## Communication Flow

### 1. Fleet Event to WhatsApp Message

```
Fleet Platform Event → Unified Event → Message Template → WhatsApp Message → Driver
```

**Process:**
1. Platform generates event (webhook/polling)
2. Provider normalizes to UnifiedEvent
3. FleetCommunicationService processes event
4. Enhanced Message Broker generates appropriate message
5. WhatsApp integration delivers message to driver

### 2. Driver Response Processing

```
Driver WhatsApp Response → Response Classification → Fleet Update → Status Confirmation
```

**Process:**
1. WhatsApp webhook receives driver response
2. FleetCommunicationService identifies driver and context
3. Response processed based on type (button, text, location, document)
4. Fleet platform updated with new status/information
5. Confirmation sent to driver

## Configuration Management

### 1. Tenant Configuration

```typescript
interface TenantFleetConfig {
  tenantId: string;
  fleetPlatform: 'samsara' | 'geotab';
  
  // Samsara Configuration
  samsaraApiToken?: string;
  samsaraGroupId?: string;
  samsaraWebhookSecret?: string;
  
  // Geotab Configuration
  geotabUsername?: string;
  geotabPassword?: string;
  geotabDatabase?: string;
  geotabServer?: string;
  
  // Common Settings
  isActive: boolean;
  lastSync?: string;
  webhookUrl?: string;
}
```

### 2. Platform Validation

Each platform has specific validation requirements:

**Samsara:**
- API Token (required)
- Group ID (optional)
- Webhook Secret (for webhook verification)

**Geotab:**
- Username (required)
- Password (required)
- Database (required)
- Server (optional, defaults to my.geotab.com)

## Integration Benefits

### 1. For FleetChat
- **Single Codebase**: Same communication logic for both platforms
- **Simplified Maintenance**: Changes in one place affect both integrations
- **Consistent Experience**: Uniform message templates and driver interactions
- **Easy Platform Addition**: New platforms follow same interface pattern

### 2. For Enterprise Users
- **Platform Choice**: Use existing fleet management investment
- **No Vendor Lock-in**: Can switch platforms without losing FleetChat functionality
- **Consistent Features**: Same communication capabilities regardless of platform
- **Smooth Onboarding**: Platform-specific setup handled transparently

### 3. For Scalability
- **Independent Scaling**: Each platform integration scales independently
- **Resource Optimization**: Different polling/webhook strategies per platform
- **Error Isolation**: Platform issues don't affect other tenants
- **Performance Monitoring**: Platform-specific health monitoring

## Implementation Considerations

### 1. Authentication Patterns
- **Samsara**: Stateless token-based authentication
- **Geotab**: Session-based with automatic re-authentication
- **Factory Pattern**: Handles authentication complexity transparently

### 2. Real-time vs Polling
- **Samsara**: Webhook-based real-time events
- **Geotab**: Data feeds with optimized polling intervals
- **Unified Processing**: Same event handling regardless of delivery method

### 3. Error Handling
- **Platform-Specific Errors**: Mapped to common error types
- **Retry Logic**: Automatic retries with exponential backoff
- **Fallback Strategies**: Graceful degradation when platforms unavailable

### 4. Data Consistency
- **Source of Truth**: Fleet platform is authoritative for all data
- **Caching Strategy**: Minimal caching to ensure data freshness
- **Conflict Resolution**: Platform data always takes precedence

## Future Extensibility

### 1. Additional Platforms
The abstraction layer is designed to easily accommodate new fleet management platforms:
- Implement `IFleetProvider` interface
- Add platform-specific event mappings
- Update factory and configuration validation
- No changes required to core FleetChat logic

### 2. Enhanced Features
- **Multi-language Support**: Platform-agnostic message templating
- **Advanced Analytics**: Unified reporting across platforms
- **Custom Workflows**: Platform-independent automation rules
- **Integration Monitoring**: Real-time platform health dashboards

## Conclusion

The fleet abstraction layer provides FleetChat with a robust, scalable foundation for supporting multiple fleet management platforms while maintaining simplicity and consistency. The single-platform-per-tenant approach eliminates complexity while the unified interface ensures consistent functionality regardless of the underlying platform choice.

This design enables FleetChat to serve a broader market by supporting the two major fleet management platforms while providing a pathway for future platform additions without architectural changes.