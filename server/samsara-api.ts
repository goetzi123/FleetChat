import axios, { AxiosInstance } from 'axios';

export interface SamsaraDriver {
  id: string;
  name: string;
  phone?: string;
  username: string;
  groupId: string;
  isActive: boolean;
  externalIds?: { [key: string]: string };
}

export interface SamsaraVehicle {
  id: string;
  name: string;
  vin: string;
  licensePlate: string;
  groupId: string;
  isActive: boolean;
}

export interface SamsaraRoute {
  id: string;
  name: string;
  vehicleId: string;
  driverId?: string;
  startTime: string;
  endTime?: string;
  waypoints: SamsaraWaypoint[];
}

export interface SamsaraWaypoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'pickup' | 'delivery' | 'waypoint';
  arrivalTime?: string;
  departureTime?: string;
}

export interface SamsaraEvent {
  eventType: string;
  timestamp: string;
  vehicleId?: string;
  driverId?: string;
  data: any;
}

export class SamsaraAPIClient {
  private client: AxiosInstance;
  private groupId?: string;

  constructor(apiToken: string, groupId?: string) {
    this.client = axios.create({
      baseURL: 'https://api.samsara.com',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    this.groupId = groupId;
  }

  // Driver Management
  async getDrivers(): Promise<SamsaraDriver[]> {
    const response = await this.client.get('/fleet/drivers', {
      params: this.groupId ? { groupId: this.groupId } : {}
    });
    return response.data.data || [];
  }

  async getDriver(driverId: string): Promise<SamsaraDriver | null> {
    try {
      const response = await this.client.get(`/fleet/drivers/${driverId}`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  async getDriverByPhone(phoneNumber: string): Promise<SamsaraDriver | null> {
    const drivers = await this.getDrivers();
    return drivers.find(driver => driver.phone === phoneNumber) || null;
  }

  // Vehicle Management
  async getVehicles(): Promise<SamsaraVehicle[]> {
    const response = await this.client.get('/fleet/vehicles', {
      params: this.groupId ? { groupId: this.groupId } : {}
    });
    return response.data.data || [];
  }

  async getVehicle(vehicleId: string): Promise<SamsaraVehicle | null> {
    try {
      const response = await this.client.get(`/fleet/vehicles/${vehicleId}`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  // Route Management
  async createRoute(routeData: {
    name: string;
    vehicleId: string;
    driverId?: string;
    waypoints: Omit<SamsaraWaypoint, 'id'>[];
  }): Promise<SamsaraRoute> {
    const response = await this.client.post('/fleet/routes', {
      name: routeData.name,
      vehicleId: routeData.vehicleId,
      driverId: routeData.driverId,
      waypoints: routeData.waypoints
    });
    return response.data.data;
  }

  async getRoute(routeId: string): Promise<SamsaraRoute | null> {
    try {
      const response = await this.client.get(`/fleet/routes/${routeId}`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  async updateRoute(routeId: string, updates: Partial<SamsaraRoute>): Promise<SamsaraRoute> {
    const response = await this.client.patch(`/fleet/routes/${routeId}`, updates);
    return response.data.data;
  }

  async completeRoute(routeId: string): Promise<void> {
    await this.client.patch(`/fleet/routes/${routeId}`, {
      status: 'completed',
      endTime: new Date().toISOString()
    });
  }

  // Location Tracking
  async getVehicleLocation(vehicleId: string): Promise<{
    lat: number;
    lng: number;
    timestamp: string;
    speed?: number;
    heading?: number;
  } | null> {
    try {
      const response = await this.client.get(`/fleet/vehicles/${vehicleId}/locations/latest`);
      const location = response.data.data;
      if (!location) return null;

      return {
        lat: location.latitude,
        lng: location.longitude,
        timestamp: location.timestamp,
        speed: location.speedMilesPerHour,
        heading: location.heading
      };
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  // Document Management
  async uploadDocument(routeId: string, document: {
    filename: string;
    fileContent: Buffer;
    mimeType: string;
    documentType: string;
  }): Promise<{ documentId: string; fileUrl: string }> {
    const formData = new FormData();
    formData.append('file', new Blob([document.fileContent], { type: document.mimeType }), document.filename);
    formData.append('documentType', document.documentType);
    formData.append('routeId', routeId);

    const response = await this.client.post('/fleet/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return {
      documentId: response.data.data.id,
      fileUrl: response.data.data.downloadUrl
    };
  }

  // Webhook Management
  async setupWebhook(webhookUrl: string, eventTypes: string[]): Promise<{ webhookId: string }> {
    const response = await this.client.post('/fleet/webhooks', {
      url: webhookUrl,
      eventTypes,
      isActive: true
    });
    return { webhookId: response.data.data.id };
  }

  async verifyWebhook(payload: any, signature: string, secret: string): boolean {
    // Implement webhook signature verification
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return `sha256=${expectedSignature}` === signature;
  }

  // Event Processing
  processWebhookEvent(event: SamsaraEvent): {
    eventType: string;
    transportAction?: string;
    data: any;
  } {
    const { eventType, data } = event;

    switch (eventType) {
      case 'vehicle.location.updated':
        return {
          eventType: 'location_update',
          transportAction: 'update_location',
          data: {
            vehicleId: data.vehicleId,
            lat: data.location.latitude,
            lng: data.location.longitude,
            timestamp: data.timestamp,
            speed: data.location.speedMilesPerHour,
            heading: data.location.heading
          }
        };

      case 'route.started':
        return {
          eventType: 'transport_started',
          transportAction: 'start_transport',
          data: {
            routeId: data.routeId,
            vehicleId: data.vehicleId,
            driverId: data.driverId,
            startTime: data.startTime
          }
        };

      case 'route.completed':
        return {
          eventType: 'transport_completed',
          transportAction: 'complete_transport',
          data: {
            routeId: data.routeId,
            vehicleId: data.vehicleId,
            driverId: data.driverId,
            endTime: data.endTime
          }
        };

      case 'geofence.entered':
        return {
          eventType: 'geofence_entry',
          transportAction: 'geofence_event',
          data: {
            vehicleId: data.vehicleId,
            driverId: data.driverId,
            geofenceName: data.geofence.name,
            geofenceType: data.geofence.type,
            timestamp: data.timestamp
          }
        };

      case 'document.uploaded':
        return {
          eventType: 'document_uploaded',
          transportAction: 'process_document',
          data: {
            documentId: data.documentId,
            routeId: data.routeId,
            documentType: data.documentType,
            filename: data.filename,
            fileUrl: data.downloadUrl
          }
        };

      default:
        return {
          eventType: 'unknown',
          data
        };
    }
  }

  // Status Sync
  async syncTransportStatus(routeId: string, status: string, location?: {
    lat: number;
    lng: number;
    notes?: string;
  }): Promise<void> {
    const updateData: any = { status };
    
    if (location) {
      updateData.currentLocation = {
        latitude: location.lat,
        longitude: location.lng
      };
      if (location.notes) {
        updateData.notes = location.notes;
      }
    }

    await this.client.patch(`/fleet/routes/${routeId}`, updateData);
  }
}