import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { env } from '../config/environment';
import { GeotabApiError } from '../shared/errors';
import { logger } from '../shared/logger';
import { retry } from '../shared/utils';

export interface GeotabConfig {
  username: string;
  password: string;
  database: string;
  sessionId?: string;
  server?: string;
  baseUrl?: string;
}

export interface GeotabCredentials {
  userName: string;
  password: string;
  database: string;
}

export interface GeotabDevice {
  id: string;
  name: string;
  serialNumber: string;
  vehicleIdentificationNumber?: string;
  licensePlate?: string;
  deviceType: string;
  groups: Array<{ id: string; name: string }>;
  workTime?: { driverKeyId: string };
  comment?: string;
  isActive: boolean;
}

export interface GeotabUser {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  employeeNo?: string;
  keys: Array<{
    driverKey: { id: string };
    serialNumber: string;
  }>;
  phoneNumber?: string;
  phoneNumberExtension?: string;
  isDriver: boolean;
  isActive: boolean;
}

export interface GeotabTrip {
  id: string;
  device: { id: string };
  driver: { id: string };
  start: string;
  stop: string;
  distance: number;
  drivingDuration: string;
  idlingDuration: string;
  speedRange: {
    from: number;
    to: number;
  };
  maximumSpeed: number;
  averageSpeed: number;
}

export interface GeotabStatusData {
  id: string;
  device: { id: string };
  diagnostic: { id: string; name: string };
  dateTime: string;
  data: number;
}

export interface GeotabFaultData {
  id: string;
  device: { id: string };
  diagnostic: { id: string; name: string };
  dateTime: string;
  count: number;
  faultState: string;
}

export interface GeotabLogRecord {
  id: string;
  device: { id: string };
  dateTime: string;
  latitude: number;
  longitude: number;
  speed: number;
}

export interface GeotabZone {
  id: string;
  name: string;
  comment?: string;
  groups: Array<{ id: string }>;
  points: Array<{
    x: number;
    y: number;
  }>;
  zoneTypes: Array<{ id: string }>;
  isActive: boolean;
}

export interface GeotabRule {
  id: string;
  name: string;
  comment?: string;
  groups: Array<{ id: string }>;
  condition: {
    device?: { id: string };
    diagnostic?: { id: string };
    rule?: { id: string };
    value?: number;
  };
  isActive: boolean;
}

export class GeotabIntegration {
  private client: AxiosInstance;
  private config: GeotabConfig;
  private sessionId?: string;

  constructor(config: GeotabConfig) {
    this.config = config;
    this.sessionId = config.sessionId;
    
    const baseUrl = config.baseUrl || config.server || 'https://my.geotab.com';
    
    this.client = axios.create({
      baseURL: `${baseUrl}/apiv1`,
      headers: {
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
        logger.debug('Geotab API request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          dataSize: config.data ? JSON.stringify(config.data).length : 0,
        });
        return config;
      },
      (error) => {
        logger.error('Geotab API request error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and session management
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Geotab API response', {
          status: response.status,
          url: response.config.url,
          dataSize: JSON.stringify(response.data).length,
        });
        return response;
      },
      async (error) => {
        const errorMessage = error.response?.data?.error?.message || error.message;
        
        // Handle session expiration
        if (errorMessage.includes('InvalidUserException') || errorMessage.includes('DbUnavailableException')) {
          logger.warn('Geotab session expired, attempting re-authentication');
          try {
            await this.authenticate();
            // Retry the original request
            return this.client.request(error.config);
          } catch (authError) {
            logger.error('Geotab re-authentication failed', authError instanceof Error ? authError : new Error(String(authError)));
          }
        }

        logger.error('Geotab API error', error, {
          status: error.response?.status,
          url: error.config?.url,
          message: errorMessage,
        });

        throw new GeotabApiError(errorMessage, {
          status: error.response?.status,
          data: error.response?.data,
        });
      }
    );
  }

  private async makeRequest<T>(method: string, params?: any): Promise<T> {
    return retry(async () => {
      const requestData = {
        method,
        params: {
          ...params,
          ...(this.sessionId && { credentials: { sessionId: this.sessionId, database: this.config.database } }),
        },
      };

      const response = await this.client.post('', requestData);
      
      if (response.data.error) {
        throw new GeotabApiError(response.data.error.message || 'Geotab API error');
      }
      
      return response.data.result;
    }, 3, 1000);
  }

  // Authentication
  async authenticate(): Promise<{ sessionId: string; server: string }> {
    try {
      const credentials: GeotabCredentials = {
        userName: this.config.username,
        password: this.config.password,
        database: this.config.database,
      };

      const result = await this.makeRequest<{
        credentials: { sessionId: string; server: string; database: string };
        path: string;
      }>('Authenticate', { credentials });

      this.sessionId = result.credentials.sessionId;
      
      // Update base URL if server is provided
      if (result.credentials.server && result.credentials.server !== 'my.geotab.com') {
        this.client.defaults.baseURL = `https://${result.credentials.server}/apiv1`;
      }

      logger.info('Geotab authentication successful', {
        database: this.config.database,
        server: result.credentials.server,
      });

      return {
        sessionId: result.credentials.sessionId,
        server: result.credentials.server,
      };
    } catch (error) {
      logger.error('Geotab authentication failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  // Device Management
  async getDevices(search?: Partial<GeotabDevice>): Promise<GeotabDevice[]> {
    return this.makeRequest<GeotabDevice[]>('Get', {
      typeName: 'Device',
      search,
    });
  }

  async getDevice(deviceId: string): Promise<GeotabDevice> {
    const devices = await this.makeRequest<GeotabDevice[]>('Get', {
      typeName: 'Device',
      search: { id: deviceId },
    });

    if (devices.length === 0) {
      throw new GeotabApiError(`Device not found: ${deviceId}`);
    }

    return devices[0];
  }

  // User/Driver Management
  async getUsers(search?: Partial<GeotabUser>): Promise<GeotabUser[]> {
    return this.makeRequest<GeotabUser[]>('Get', {
      typeName: 'User',
      search,
    });
  }

  async getDrivers(): Promise<GeotabUser[]> {
    return this.makeRequest<GeotabUser[]>('Get', {
      typeName: 'User',
      search: { isDriver: true },
    });
  }

  async getUser(userId: string): Promise<GeotabUser> {
    const users = await this.makeRequest<GeotabUser[]>('Get', {
      typeName: 'User',
      search: { id: userId },
    });

    if (users.length === 0) {
      throw new GeotabApiError(`User not found: ${userId}`);
    }

    return users[0];
  }

  // Trip Management
  async getTrips(search: {
    deviceSearch?: { id: string };
    userSearch?: { id: string };
    fromDate?: string;
    toDate?: string;
  }): Promise<GeotabTrip[]> {
    return this.makeRequest<GeotabTrip[]>('Get', {
      typeName: 'Trip',
      search,
    });
  }

  // Location/GPS Data
  async getLogRecords(search: {
    deviceSearch?: { id: string };
    fromDate?: string;
    toDate?: string;
  }): Promise<GeotabLogRecord[]> {
    return this.makeRequest<GeotabLogRecord[]>('Get', {
      typeName: 'LogRecord',
      search,
    });
  }

  // Status Data (Engine diagnostics, etc.)
  async getStatusData(search: {
    deviceSearch?: { id: string };
    diagnosticSearch?: { id: string };
    fromDate?: string;
    toDate?: string;
  }): Promise<GeotabStatusData[]> {
    return this.makeRequest<GeotabStatusData[]>('Get', {
      typeName: 'StatusData',
      search,
    });
  }

  // Fault Data
  async getFaultData(search: {
    deviceSearch?: { id: string };
    fromDate?: string;
    toDate?: string;
  }): Promise<GeotabFaultData[]> {
    return this.makeRequest<GeotabFaultData[]>('Get', {
      typeName: 'FaultData',
      search,
    });
  }

  // Zone Management
  async getZones(search?: Partial<GeotabZone>): Promise<GeotabZone[]> {
    return this.makeRequest<GeotabZone[]>('Get', {
      typeName: 'Zone',
      search,
    });
  }

  async createZone(zone: Omit<GeotabZone, 'id'>): Promise<GeotabZone> {
    const result = await this.makeRequest<string>('Add', {
      typeName: 'Zone',
      entity: zone,
    });

    return { ...zone, id: result } as GeotabZone;
  }

  // Rule Management
  async getRules(search?: Partial<GeotabRule>): Promise<GeotabRule[]> {
    return this.makeRequest<GeotabRule[]>('Get', {
      typeName: 'Rule',
      search,
    });
  }

  async createRule(rule: Omit<GeotabRule, 'id'>): Promise<GeotabRule> {
    const result = await this.makeRequest<string>('Add', {
      typeName: 'Rule',
      entity: rule,
    });

    return { ...rule, id: result } as GeotabRule;
  }

  // Data Feeds (Real-time streaming)
  async getFeed<T>(typeName: string, search?: any, fromVersion?: number): Promise<{
    data: T[];
    toVersion: number;
  }> {
    return this.makeRequest<{ data: T[]; toVersion: number }>('GetFeed', {
      typeName,
      search,
      fromVersion,
    });
  }

  async getLocationsFeed(search?: {
    deviceSearch?: { id: string };
  }, fromVersion?: number): Promise<{
    data: GeotabLogRecord[];
    toVersion: number;
  }> {
    return this.getFeed<GeotabLogRecord>('LogRecord', search, fromVersion);
  }

  async getStatusDataFeed(search?: {
    deviceSearch?: { id: string };
    diagnosticSearch?: { id: string };
  }, fromVersion?: number): Promise<{
    data: GeotabStatusData[];
    toVersion: number;
  }> {
    return this.getFeed<GeotabStatusData>('StatusData', search, fromVersion);
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      // Try to get a small amount of data to verify connection
      await this.makeRequest('Get', {
        typeName: 'Device',
        search: {},
        resultsLimit: 1,
      });
      return true;
    } catch {
      return false;
    }
  }

  // Utility Methods
  async getVersion(): Promise<string> {
    return this.makeRequest<string>('GetVersion');
  }

  async getTimeZoneInfo(coordinates?: { latitude: number; longitude: number }): Promise<{
    id: string;
    displayName: string;
    standardName: string;
  }> {
    return this.makeRequest('GetTimeZoneInfo', { coordinates });
  }
}

// Factory function for creating Geotab integration instances
export function createGeotabIntegration(config: GeotabConfig): GeotabIntegration {
  return new GeotabIntegration(config);
}