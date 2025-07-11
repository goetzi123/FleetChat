import { IFleetProvider, FleetProviderConfig } from '../integrations/fleet-provider.interface';
import { SamsaraFleetProvider } from '../integrations/samsara.provider';
import { GeotabFleetProvider } from '../integrations/geotab.provider';
import { SamsaraConfig } from '../integrations/samsara.integration';
import { GeotabConfig } from '../integrations/geotab.integration';
import { FleetProviderError } from '../shared/errors';
import { logger } from '../shared/logger';

/**
 * Factory for creating fleet provider instances
 * Handles the abstraction between Samsara and Geotab platforms
 */
export class FleetProviderFactory {
  private static instances = new Map<string, IFleetProvider>();

  /**
   * Create a fleet provider instance for a tenant
   */
  static async createProvider(config: FleetProviderConfig): Promise<IFleetProvider> {
    const cacheKey = `${config.tenantId}_${config.platform}`;
    
    // Return existing instance if available
    if (this.instances.has(cacheKey)) {
      const existingProvider = this.instances.get(cacheKey)!;
      if (existingProvider.isAuthenticated()) {
        return existingProvider;
      }
      // Remove stale instance
      this.instances.delete(cacheKey);
    }

    let provider: IFleetProvider;

    try {
      switch (config.platform) {
        case 'samsara':
          provider = new SamsaraFleetProvider(
            config.credentials as SamsaraConfig,
            config.tenantId
          );
          break;

        case 'geotab':
          provider = new GeotabFleetProvider(
            config.credentials as GeotabConfig,
            config.tenantId
          );
          break;

        default:
          throw new FleetProviderError(`Unsupported fleet platform: ${config.platform}`);
      }

      // Authenticate the provider
      await provider.authenticate();

      // Cache the authenticated instance
      this.instances.set(cacheKey, provider);

      logger.info('Fleet provider created and authenticated', {
        platform: config.platform,
        tenantId: config.tenantId,
      });

      return provider;
    } catch (error) {
      logger.error('Failed to create fleet provider', error instanceof Error ? error : new Error(String(error)), {
        platform: config.platform,
        tenantId: config.tenantId,
      });
      throw error;
    }
  }

  /**
   * Get existing provider instance for a tenant
   */
  static getProvider(tenantId: string, platform: 'samsara' | 'geotab'): IFleetProvider | null {
    const cacheKey = `${tenantId}_${platform}`;
    return this.instances.get(cacheKey) || null;
  }

  /**
   * Remove provider instance (e.g., when tenant is deactivated)
   */
  static async removeProvider(tenantId: string, platform: 'samsara' | 'geotab'): Promise<void> {
    const cacheKey = `${tenantId}_${platform}`;
    const provider = this.instances.get(cacheKey);
    
    if (provider) {
      try {
        await provider.disconnect();
      } catch (error) {
        logger.warn('Error disconnecting provider', error instanceof Error ? error : new Error(String(error)));
      }
      this.instances.delete(cacheKey);
      
      logger.info('Fleet provider removed', { tenantId, platform });
    }
  }

  /**
   * Get all active provider instances
   */
  static getActiveProviders(): Array<{ tenantId: string; platform: string; provider: IFleetProvider }> {
    const activeProviders: Array<{ tenantId: string; platform: string; provider: IFleetProvider }> = [];
    
    for (const [key, provider] of this.instances) {
      const [tenantId, platform] = key.split('_');
      if (provider.isAuthenticated()) {
        activeProviders.push({ tenantId, platform, provider });
      }
    }
    
    return activeProviders;
  }

  /**
   * Refresh authentication for all providers
   */
  static async refreshAllProviders(): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const [key, provider] of this.instances) {
      promises.push(
        provider.authenticate().catch(error => {
          logger.error('Failed to refresh provider authentication', error instanceof Error ? error : new Error(String(error)), { key });
          // Remove failed provider
          this.instances.delete(key);
        })
      );
    }
    
    await Promise.all(promises);
    logger.info('Provider authentication refresh completed', {
      totalProviders: this.instances.size,
    });
  }

  /**
   * Health check for all active providers
   */
  static async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [key, provider] of this.instances) {
      try {
        const healthStatus = await provider.getHealthStatus();
        results[key] = healthStatus.isHealthy;
      } catch (error) {
        results[key] = false;
        logger.error('Provider health check failed', error instanceof Error ? error : new Error(String(error)), { key });
      }
    }
    
    return results;
  }

  /**
   * Create provider configuration from tenant data
   */
  static createConfigFromTenant(tenant: {
    id: string;
    fleetPlatform: 'samsara' | 'geotab';
    samsaraApiToken?: string;
    samsaraGroupId?: string;
    geotabUsername?: string;
    geotabPassword?: string;
    geotabDatabase?: string;
    geotabServer?: string;
  }): FleetProviderConfig {
    const config: FleetProviderConfig = {
      platform: tenant.fleetPlatform,
      tenantId: tenant.id,
      credentials: {} as any,
    };

    switch (tenant.fleetPlatform) {
      case 'samsara':
        if (!tenant.samsaraApiToken) {
          throw new FleetProviderError('Samsara API token is required');
        }
        config.credentials = {
          apiToken: tenant.samsaraApiToken,
          groupId: tenant.samsaraGroupId,
        } as SamsaraConfig;
        break;

      case 'geotab':
        if (!tenant.geotabUsername || !tenant.geotabPassword || !tenant.geotabDatabase) {
          throw new FleetProviderError('Geotab username, password, and database are required');
        }
        config.credentials = {
          username: tenant.geotabUsername,
          password: tenant.geotabPassword,
          database: tenant.geotabDatabase,
          server: tenant.geotabServer,
        } as GeotabConfig;
        break;

      default:
        throw new FleetProviderError(`Unsupported fleet platform: ${tenant.fleetPlatform}`);
    }

    return config;
  }

  /**
   * Validate platform-specific configuration
   */
  static validateConfig(config: FleetProviderConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.tenantId) {
      errors.push('Tenant ID is required');
    }

    if (!config.platform) {
      errors.push('Platform is required');
    }

    switch (config.platform) {
      case 'samsara':
        const samsaraConfig = config.credentials as SamsaraConfig;
        if (!samsaraConfig.apiToken) {
          errors.push('Samsara API token is required');
        }
        break;

      case 'geotab':
        const geotabConfig = config.credentials as GeotabConfig;
        if (!geotabConfig.username) {
          errors.push('Geotab username is required');
        }
        if (!geotabConfig.password) {
          errors.push('Geotab password is required');
        }
        if (!geotabConfig.database) {
          errors.push('Geotab database is required');
        }
        break;

      default:
        errors.push(`Unsupported platform: ${config.platform}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get platform capabilities
   */
  static getPlatformCapabilities(platform: 'samsara' | 'geotab') {
    switch (platform) {
      case 'samsara':
        return {
          realTimeEvents: true,
          webhooks: true,
          locationTracking: true,
          diagnostics: true,
          driverManagement: true,
          routeManagement: true,
          apiStyle: 'REST',
          authentication: 'Token-based',
        };

      case 'geotab':
        return {
          realTimeEvents: false, // Uses polling
          webhooks: false,
          locationTracking: true,
          diagnostics: true,
          driverManagement: true,
          routeManagement: false,
          apiStyle: 'RPC',
          authentication: 'Session-based',
        };

      default:
        return {};
    }
  }
}