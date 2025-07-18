import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { env } from '../config/environment';
import { SamsaraApiError } from '../shared/errors';
import { logger } from '../shared/logger';
import { retry } from '../shared/utils';
import { SamsaraEvent } from '../shared/types';

export interface SamsaraConfig {
  apiToken: string;
  groupId?: string;
  baseUrl?: string;
}

export interface SamsaraDriver {
  id: string;
  name: string;
  username?: string;
  phone?: string;
  email?: string;
  vehicleIds?: string[];
  isActive: boolean;
}

export interface SamsaraVehicle {
  id: string;
  name: string;
  vin?: string;
  license?: string;
  make?: string;
  model?: string;
  year?: number;
  currentDriverId?: string;
}

export interface SamsaraRoute {
  id: string;
  name: string;
  vehicleId: string;
  driverId: string;
  stops: Array<{
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    type: 'pickup' | 'delivery';
    scheduledTime?: string;
    actualTime?: string;
  }>;
  status: string;
}

export class SamsaraIntegration {
  private client: AxiosInstance;
  private config: SamsaraConfig;

  constructor(config: SamsaraConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl || env.SAMSARA_API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'FleetChat/1.0',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('Samsara API request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params,
        });
        return config;
      },
      (error) => {
        logger.error('Samsara API request error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Samsara API response', {
          status: response.status,
          url: response.config.url,
          dataSize: JSON.stringify(response.data).length,
        });
        return response;
      },
      (error) => {
        const errorMessage = error.response?.data?.message || error.message;
        logger.error('Samsara API error', error, {
          status: error.response?.status,
          url: error.config?.url,
          message: errorMessage,
        });

        throw new SamsaraApiError(errorMessage, {
          status: error.response?.status,
          data: error.response?.data,
        });
      }
    );
  }

  private async makeRequest<T>(config: AxiosRequestConfig): Promise<T> {
    return retry(async () => {
      const response = await this.client.request<T>(config);
      return response.data;
    }, 3, 1000);
  }

  // Driver Management
  async getDrivers(): Promise<SamsaraDriver[]> {
    const data = await this.makeRequest<{ data: SamsaraDriver[] }>({
      method: 'GET',
      url: '/fleet/drivers',
      params: {
        ...(this.config.groupId && { groupId: this.config.groupId }),
      },
    });

    return data.data;
  }

  async getDriver(driverId: string): Promise<SamsaraDriver> {
    const data = await this.makeRequest<SamsaraDriver>({
      method: 'GET',
      url: `/fleet/drivers/${driverId}`,
    });

    return data;
  }

  async updateDriver(driverId: string, updates: Partial<SamsaraDriver>): Promise<SamsaraDriver> {
    const data = await this.makeRequest<SamsaraDriver>({
      method: 'PATCH',
      url: `/fleet/drivers/${driverId}`,
      data: updates,
    });

    return data;
  }

  // Vehicle Management
  async getVehicles(): Promise<SamsaraVehicle[]> {
    const data = await this.makeRequest<{ data: SamsaraVehicle[] }>({
      method: 'GET',
      url: '/fleet/vehicles',
      params: {
        ...(this.config.groupId && { groupId: this.config.groupId }),
      },
    });

    return data.data;
  }

  async getVehicle(vehicleId: string): Promise<SamsaraVehicle> {
    const data = await this.makeRequest<SamsaraVehicle>({
      method: 'GET',
      url: `/fleet/vehicles/${vehicleId}`,
    });

    return data;
  }

  // Route Data Access (Read-Only)
  // FleetChat only reads route data from Samsara, does not create/modify routes
  async getRoute(routeId: string): Promise<SamsaraRoute> {
    const data = await this.makeRequest<SamsaraRoute>({
      method: 'GET',
      url: `/fleet/routes/${routeId}`,
    });

    return data;
  }

  async getRoutes(): Promise<SamsaraRoute[]> {
    const data = await this.makeRequest<{ data: SamsaraRoute[] }>({
      method: 'GET',
      url: '/fleet/routes',
    });

    return data.data || [];
  }

  // Location Services
  async getVehicleLocation(vehicleId: string): Promise<{
    latitude: number;
    longitude: number;
    address?: string;
    speed?: number;
    timestamp: string;
  }> {
    const data = await this.makeRequest<any>({
      method: 'GET',
      url: `/fleet/vehicles/${vehicleId}/locations`,
    });

    return data;
  }

  async getVehicleLocations(vehicleIds: string[]): Promise<Record<string, any>> {
    const data = await this.makeRequest<any>({
      method: 'GET',
      url: '/fleet/vehicles/locations',
      params: {
        vehicleIds: vehicleIds.join(','),
      },
    });

    return data;
  }

  // Webhook Management
  async createWebhook(webhookUrl: string, eventTypes: string[]): Promise<{
    id: string;
    url: string;
    eventTypes: string[];
    secret: string;
  }> {
    const data = await this.makeRequest<any>({
      method: 'POST',
      url: '/fleet/webhooks',
      data: {
        url: webhookUrl,
        eventTypes,
      },
    });

    return data;
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    await this.makeRequest<void>({
      method: 'DELETE',
      url: `/fleet/webhooks/${webhookId}`,
    });
  }

  // Event Processing
  validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // TODO: Implement webhook signature validation
    // This should use HMAC-SHA256 with the webhook secret
    return true;
  }

  processWebhookEvent(event: SamsaraEvent): {
    eventType: string;
    driverId?: string;
    vehicleId?: string;
    routeId?: string;
    location?: { latitude: number; longitude: number };
    metadata: Record<string, any>;
  } {
    return {
      eventType: event.eventType,
      driverId: event.data.driver?.id,
      vehicleId: event.data.vehicle?.id,
      routeId: event.data.route?.id,
      location: event.data.location ? {
        latitude: event.data.location.latitude,
        longitude: event.data.location.longitude,
      } : undefined,
      metadata: {
        timestamp: event.timestamp,
        originalEvent: event,
      },
    };
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest<any>({
        method: 'GET',
        url: '/fleet/drivers',
        params: { limit: 1 },
      });
      return true;
    } catch {
      return false;
    }
  }
}

// Factory function for creating Samsara integration instances
export function createSamsaraIntegration(config: SamsaraConfig): SamsaraIntegration {
  return new SamsaraIntegration(config);
}