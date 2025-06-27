import axios from 'axios';

// Simulate realistic Samsara fleet events
const FLEET_CHAT_BROKER_URL = 'http://localhost:3000';

// Sample driver data (would come from Samsara API in real scenario)
const mockDrivers = [
  {
    id: 'driver_12345',
    name: 'Hans Mueller',
    phoneNumber: '+491701234567',
    vehicleId: 'vehicle_001',
    currentRoute: null
  },
  {
    id: 'driver_67890',
    name: 'Anna Schmidt',
    phoneNumber: '+491709876543',
    vehicleId: 'vehicle_002', 
    currentRoute: 'route_abc123'
  }
];

// Sample transport/route data
const mockTransports = [
  {
    id: 'transport_001',
    routeId: 'route_abc123',
    driverId: 'driver_67890',
    vehicleId: 'vehicle_002',
    pickupLocation: 'Hamburg Port Terminal',
    pickupAddress: 'Waltershof, 20457 Hamburg',
    deliveryLocation: 'BMW Plant Munich',
    deliveryAddress: 'Petuelring 130, 80809 München',
    status: 'assigned',
    eta: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours from now
  }
];

// Simulate Samsara webhook events
export class SamsaraEventSimulator {
  
  // Simulate route assignment event
  async simulateRouteAssignment() {
    const transport = mockTransports[0];
    const samsaraEvent = {
      eventType: 'route.assigned',
      timestamp: new Date().toISOString(),
      data: {
        routeId: transport.routeId,
        driverId: transport.driverId,
        vehicleId: transport.vehicleId,
        route: {
          name: `${transport.pickupLocation} → ${transport.deliveryLocation}`,
          stops: [
            {
              type: 'pickup',
              location: transport.pickupLocation,
              address: transport.pickupAddress,
              scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
            },
            {
              type: 'delivery',
              location: transport.deliveryLocation,
              address: transport.deliveryAddress,
              scheduledTime: transport.eta.toISOString()
            }
          ]
        }
      }
    };

    console.log('Simulating Samsara Route Assignment Event:');
    console.log(JSON.stringify(samsaraEvent, null, 2));
    
    return this.sendToFleetChatBroker(samsaraEvent);
  }

  // Simulate vehicle location update
  async simulateLocationUpdate() {
    const driver = mockDrivers[1]; // Anna Schmidt
    const samsaraEvent = {
      eventType: 'vehicle.location',
      timestamp: new Date().toISOString(),
      data: {
        vehicleId: driver.vehicleId,
        driverId: driver.id,
        location: {
          latitude: 53.5511,
          longitude: 9.9937,
          address: 'A7 Autobahn, near Hamburg',
          speed: 85, // km/h
          heading: 180 // South
        },
        routeId: driver.currentRoute
      }
    };

    console.log('Simulating Samsara Location Update Event:');
    console.log(JSON.stringify(samsaraEvent, null, 2));
    
    return this.sendToFleetChatBroker(samsaraEvent);
  }

  // Simulate pickup reminder
  async simulatePickupReminder() {
    const transport = mockTransports[0];
    const samsaraEvent = {
      eventType: 'route.pickup_reminder',
      timestamp: new Date().toISOString(),
      data: {
        routeId: transport.routeId,
        driverId: transport.driverId,
        stop: {
          type: 'pickup',
          location: transport.pickupLocation,
          address: transport.pickupAddress,
          timeWindow: '14:00 - 16:00',
          customerContact: '+49407654321'
        }
      }
    };

    console.log('Simulating Samsara Pickup Reminder Event:');
    console.log(JSON.stringify(samsaraEvent, null, 2));
    
    return this.sendToFleetChatBroker(samsaraEvent);
  }

  // Simulate geofence entry (arrival at pickup)
  async simulateGeofenceEntry() {
    const transport = mockTransports[0];
    const samsaraEvent = {
      eventType: 'vehicle.geofence.enter',
      timestamp: new Date().toISOString(),
      data: {
        vehicleId: transport.vehicleId,
        driverId: transport.driverId,
        geofence: {
          id: 'geofence_hamburg_port',
          name: 'Hamburg Port Terminal',
          type: 'pickup_location'
        },
        location: {
          latitude: 53.5264,
          longitude: 9.8791,
          address: transport.pickupAddress
        },
        routeId: transport.routeId
      }
    };

    console.log('Simulating Samsara Geofence Entry Event:');
    console.log(JSON.stringify(samsaraEvent, null, 2));
    
    return this.sendToFleetChatBroker(samsaraEvent);
  }

  // Send event to FleetChat message broker
  private async sendToFleetChatBroker(event: any) {
    try {
      const response = await axios.post(`${FLEET_CHAT_BROKER_URL}/webhook/samsara`, event, {
        headers: {
          'Content-Type': 'application/json',
          'X-Samsara-Signature': 'demo-signature'
        }
      });
      
      console.log('FleetChat Broker Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to send event to FleetChat Broker:', error.message);
      return null;
    }
  }

  // Run a complete demo scenario
  async runDemoScenario() {
    console.log('\nStarting FleetChat Demo Scenario');
    console.log('=====================================\n');

    const wait = (seconds: number) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

    console.log('Step 1: Route Assignment');
    await this.simulateRouteAssignment();
    await wait(2);

    console.log('\nStep 2: Pickup Reminder');
    await this.simulatePickupReminder();
    await wait(2);

    console.log('\nStep 3: Location Update');
    await this.simulateLocationUpdate();
    await wait(2);

    console.log('\nStep 4: Arrival at Pickup Location');
    await this.simulateGeofenceEntry();

    console.log('\nDemo scenario completed!');
  }
}

// CLI interface
if (require.main === module) {
  const simulator = new SamsaraEventSimulator();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    simulator.runDemoScenario();
  } else {
    const eventType = args[0];
    switch (eventType) {
      case 'route-assignment':
        simulator.simulateRouteAssignment();
        break;
      case 'location-update':
        simulator.simulateLocationUpdate();
        break;
      case 'pickup-reminder':
        simulator.simulatePickupReminder();
        break;
      case 'geofence-entry':
        simulator.simulateGeofenceEntry();
        break;
      default:
        console.log(`Unknown event type: ${eventType}`);
    }
  }
}