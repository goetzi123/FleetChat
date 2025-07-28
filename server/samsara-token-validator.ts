import { z } from 'zod';

const SAMSARA_API_BASE = "https://api.samsara.com";

export interface SamsaraTokenValidationResult {
  valid: boolean;
  scopes: string[];
  orgId?: string;
  error?: string;
  drivers?: number;
  vehicles?: number;
}

export interface SamsaraOrganization {
  id: string;
  name: string;
}

/**
 * Validate Samsara API token and check available scopes
 */
export async function validateSamsaraToken(apiToken: string): Promise<SamsaraTokenValidationResult> {
  try {
    // Test token with organization info endpoint
    const orgResponse = await fetch(`${SAMSARA_API_BASE}/fleet/organization`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
      }
    });

    if (!orgResponse.ok) {
      if (orgResponse.status === 401) {
        return { valid: false, scopes: [], error: 'Invalid API token or insufficient permissions' };
      }
      if (orgResponse.status === 403) {
        return { valid: false, scopes: [], error: 'API token lacks required permissions' };
      }
      return { valid: false, scopes: [], error: `API error: ${orgResponse.status}` };
    }

    const orgData = await orgResponse.json();
    
    // Test different API endpoints to determine available scopes
    const scopeTests = await Promise.allSettled([
      testDriversAccess(apiToken),
      testVehiclesAccess(apiToken),
      testRoutesAccess(apiToken),
      testWebhooksAccess(apiToken),
      testDocumentsAccess(apiToken)
    ]);

    const scopes: string[] = [];
    let driversCount = 0;
    let vehiclesCount = 0;

    // Analyze scope test results
    if (scopeTests[0].status === 'fulfilled' && scopeTests[0].value.hasAccess) {
      scopes.push('fleet:drivers:read');
      driversCount = scopeTests[0].value.count || 0;
    }
    
    if (scopeTests[1].status === 'fulfilled' && scopeTests[1].value.hasAccess) {
      scopes.push('fleet:vehicles:read');
      vehiclesCount = scopeTests[1].value.count || 0;
    }
    
    if (scopeTests[2].status === 'fulfilled' && scopeTests[2].value.hasAccess) {
      scopes.push('fleet:routes:read');
    }
    
    if (scopeTests[3].status === 'fulfilled' && scopeTests[3].value.hasAccess) {
      scopes.push('fleet:webhooks:write');
    }
    
    if (scopeTests[4].status === 'fulfilled' && scopeTests[4].value.hasAccess) {
      scopes.push('fleet:documents:read');
    }

    return {
      valid: true,
      scopes,
      orgId: orgData.id,
      drivers: driversCount,
      vehicles: vehiclesCount
    };

  } catch (error) {
    console.error('Samsara token validation error:', error);
    return { 
      valid: false, 
      scopes: [], 
      error: error instanceof Error ? error.message : 'Unknown validation error' 
    };
  }
}

async function testDriversAccess(apiToken: string): Promise<{ hasAccess: boolean; count?: number }> {
  try {
    const response = await fetch(`${SAMSARA_API_BASE}/fleet/drivers?limit=1`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return { hasAccess: true, count: data.pagination?.total || 0 };
    }
    return { hasAccess: false };
  } catch {
    return { hasAccess: false };
  }
}

async function testVehiclesAccess(apiToken: string): Promise<{ hasAccess: boolean; count?: number }> {
  try {
    const response = await fetch(`${SAMSARA_API_BASE}/fleet/vehicles?limit=1`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return { hasAccess: true, count: data.pagination?.total || 0 };
    }
    return { hasAccess: false };
  } catch {
    return { hasAccess: false };
  }
}

async function testRoutesAccess(apiToken: string): Promise<{ hasAccess: boolean }> {
  try {
    const response = await fetch(`${SAMSARA_API_BASE}/fleet/routes?limit=1`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
      }
    });
    
    return { hasAccess: response.ok };
  } catch {
    return { hasAccess: false };
  }
}

async function testWebhooksAccess(apiToken: string): Promise<{ hasAccess: boolean }> {
  try {
    const response = await fetch(`${SAMSARA_API_BASE}/fleet/webhooks`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
      }
    });
    
    return { hasAccess: response.ok };
  } catch {
    return { hasAccess: false };
  }
}

async function testDocumentsAccess(apiToken: string): Promise<{ hasAccess: boolean }> {
  try {
    const response = await fetch(`${SAMSARA_API_BASE}/fleet/documents?limit=1`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
      }
    });
    
    return { hasAccess: response.ok };
  } catch {
    return { hasAccess: false };
  }
}

/**
 * Get required scopes for FleetChat operation
 */
export function getRequiredScopes(): string[] {
  return [
    'fleet:drivers:read',
    'fleet:vehicles:read', 
    'fleet:routes:read',
    'fleet:webhooks:write'
  ];
}

/**
 * Check if token has all required scopes
 */
export function hasRequiredScopes(availableScopes: string[]): boolean {
  const required = getRequiredScopes();
  return required.every(scope => availableScopes.includes(scope));
}