# FleetChat Samsara Events and APIs Reference
*Date: July 18, 2025*
*Status: Production Integration Specification*

## Overview

This document lists all Samsara webhook events that FleetChat extracts for driver communication and the corresponding API methods for writing back driver responses. FleetChat operates as pure bidirectional communication middleware between Samsara and drivers via WhatsApp.

## Webhook Events (Samsara → FleetChat)

### 1. Route Management Events
- **`route.created`** - New route assigned to driver
- **`route.updated`** - Route details or status modified
- **`route.completed`** - Route marked as completed
- **`route.cancelled`** - Route cancelled by dispatcher

### 2. Vehicle Location Events
- **`vehicle.location`** - Real-time vehicle position updates
- **`vehicle.gps.harsh_event`** - Harsh driving event detected
- **`vehicle.engine.on`** - Vehicle engine started
- **`vehicle.engine.off`** - Vehicle engine stopped

### 3. Geofencing Events
- **`geofence.entry`** - Vehicle enters defined geofence
- **`geofence.exit`** - Vehicle exits defined geofence
- **`geofence.dwelling`** - Vehicle dwelling in geofence area

### 4. Driver Status Events
- **`driver.duty_status_changed`** - HOS duty status update
- **`driver.login`** - Driver logs into vehicle
- **`driver.logout`** - Driver logs out of vehicle
- **`driver.violation`** - HOS violation detected

### 5. Vehicle Maintenance Events
- **`vehicle.maintenance.due`** - Scheduled maintenance due
- **`vehicle.fault.active`** - Vehicle fault code active
- **`vehicle.fault.cleared`** - Vehicle fault code cleared
- **`vehicle.inspection.due`** - Vehicle inspection required

### 6. Safety Events
- **`safety.collision`** - Collision detected
- **`safety.distraction`** - Driver distraction event
- **`safety.fatigue`** - Driver fatigue detected
- **`safety.speeding`** - Speeding violation

### 7. Document Events
- **`document.uploaded`** - Document uploaded to route
- **`document.required`** - Document required for route
- **`document.approved`** - Document approved by dispatcher
- **`document.rejected`** - Document rejected by dispatcher

### 8. Trip Events
- **`trip.started`** - Trip started
- **`trip.ended`** - Trip completed
- **`trip.summary`** - Trip summary available

## API Write-Back Methods (FleetChat → Samsara)

### 1. Route Status Updates
```typescript
// Update route status based on driver responses
updateRouteStatus(routeId: string, status: string)
```
**Driver Response Triggers:**
- "Arrived at pickup" → `in_progress`
- "Loading complete" → `loaded`
- "Departed for delivery" → `en_route`
- "Arrived at delivery" → `at_delivery`
- "Delivery complete" → `completed`
- "Emergency" → `emergency`

### 2. Driver Location Updates
```typescript
// Update driver location from WhatsApp sharing
updateDriverLocation(driverId: string, location: {
  lat: number,
  lng: number,
  timestamp: Date
})
```
**Driver Response Triggers:**
- Manual location sharing via WhatsApp
- Location confirmation requests
- Emergency location updates

### 3. Document Management
```typescript
// Upload driver documents from WhatsApp
uploadRouteDocument(routeId: string, documentData: {
  filename: string,
  fileUrl: string,
  mimeType: string,
  uploadedBy: string,
  type: string
})
```
**Driver Response Triggers:**
- POD (Proof of Delivery) uploads
- Bill of lading photos
- Damage report images
- Inspection photos

### 4. Waypoint Status Updates
```typescript
// Update specific waypoint status
updateRouteWaypoint(routeId: string, waypointId: string, status: string)
```
**Driver Response Triggers:**
- "Arrived at pickup location" → `arrived`
- "Departure confirmed" → `departed`
- "Completed stop" → `completed`

### 5. Driver Status Updates
```typescript
// Update driver duty status
updateDriverDutyStatus(driverId: string, status: string, timestamp: Date)
```
**Driver Response Triggers:**
- "Going on duty" → `on_duty`
- "Going off duty" → `off_duty`
- "Taking break" → `sleeper_berth`

### 6. Emergency Notifications
```typescript
// Create emergency alert
createEmergencyAlert(driverId: string, routeId: string, details: {
  type: string,
  location: { lat: number, lng: number },
  timestamp: Date,
  message: string
})
```
**Driver Response Triggers:**
- Emergency button responses
- "Call 911" requests
- Safety incident reports

## Event-to-Message Mapping

### Route Assignment Communication
- **Webhook**: `route.created`
- **WhatsApp Message**: "New route assigned: [pickup] → [delivery]"
- **Driver Responses**: "Accept Route", "Need Details", "Call Dispatch"
- **API Write-Back**: `updateRouteStatus(routeId, "accepted")`

### Geofence Communication
- **Webhook**: `geofence.entry`
- **WhatsApp Message**: "You've arrived at [location]. Please confirm status."
- **Driver Responses**: "Arrived", "Still Driving", "Issue"
- **API Write-Back**: `updateRouteWaypoint(routeId, waypointId, "arrived")`

### Maintenance Communication
- **Webhook**: `vehicle.maintenance.due`
- **WhatsApp Message**: "Vehicle maintenance due. Please schedule inspection."
- **Driver Responses**: "Scheduled", "Need Help", "Call Maintenance"
- **API Write-Back**: `updateVehicleMaintenanceStatus(vehicleId, "scheduled")`

### Safety Communication
- **Webhook**: `safety.speeding`
- **WhatsApp Message**: "Speeding detected. Please reduce speed for safety."
- **Driver Responses**: "Acknowledged", "Speed Reduced", "Emergency"
- **API Write-Back**: `acknowledgeViolation(driverId, violationId)`

## Bidirectional Communication Flow

### Standard Flow Pattern
```
1. Samsara Event → FleetChat Webhook Processing
2. Template Application → WhatsApp Message to Driver
3. Driver Response → FleetChat Response Processing
4. API Write-Back → Samsara System Update
5. Confirmation → Driver WhatsApp Notification
```

### Emergency Flow Pattern
```
1. Driver Emergency Request → FleetChat Processing
2. Emergency Status → Samsara Alert Creation
3. Dispatcher Notification → Immediate Response
4. Emergency Tracking → Real-time Location Updates
5. Resolution Update → Driver and Dispatch Notification
```

## Message Template Categories

### 1. Route Management Templates
- Route assignment notifications
- Pickup/delivery confirmations
- ETA update requests
- Status confirmation messages

### 2. Safety Templates
- Violation notifications
- Safety reminders
- Emergency procedures
- Incident reporting

### 3. Maintenance Templates
- Maintenance due notifications
- Inspection reminders
- Fault code alerts
- Service scheduling

### 4. Document Templates
- Document upload requests
- POD submission reminders
- Document approval notifications
- Missing document alerts

## API Authentication and Security

### Webhook Verification
- **Signature Verification**: HMAC-SHA256 signature validation
- **Timestamp Validation**: Webhook freshness checking
- **Token Validation**: Bearer token authentication

### API Write-Back Security
- **OAuth 2.0**: Secure API authentication
- **Rate Limiting**: Prevent API abuse
- **Data Validation**: Input sanitization and validation
- **Audit Logging**: Complete operation logging

## Error Handling and Retry Logic

### Webhook Processing Errors
- **Malformed Payloads**: Validation and error logging
- **Processing Failures**: Retry with exponential backoff
- **Template Errors**: Fallback to default messages

### API Write-Back Errors
- **Network Failures**: Automatic retry with backoff
- **Authentication Errors**: Token refresh and retry
- **Rate Limiting**: Respect rate limits and queue requests
- **Data Validation**: Error messages to driver

## Monitoring and Logging

### Event Processing Metrics
- Webhook event counts by type
- Processing latency measurements
- Error rates and failure types
- Driver response rates

### API Write-Back Metrics
- API call success/failure rates
- Response time monitoring
- Rate limiting hit rates
- Data synchronization delays

## Compliance and Data Handling

### Data Boundaries
- **Event Data**: Processed for message relay only
- **Driver Responses**: Written back to Samsara immediately
- **No Long-term Storage**: Communication logs only
- **Multi-tenant Isolation**: Separate processing per fleet

### Privacy and Security
- **Data Minimization**: Only communication-essential data
- **Secure Transmission**: HTTPS and encryption
- **Access Controls**: Role-based API access
- **Data Retention**: Minimal retention periods

## Summary

FleetChat processes **8 categories of Samsara webhook events** and provides **6 types of API write-back methods** for complete bidirectional communication. The system maintains strict boundaries as a communication protocol service while ensuring all driver responses are properly synchronized with Samsara fleet management systems.

This bidirectional architecture enables seamless driver communication without duplicating any fleet management functionality, providing pure communication middleware that enhances existing Samsara workflows.