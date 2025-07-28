import { generateSecureToken } from './encryption';

const SAMSARA_API_BASE = "https://api.samsara.com";

export interface WebhookConfig {
  url: string;
  eventTypes: string[];
  name: string;
  description?: string;
}

export interface SamsaraWebhook {
  id: string;
  name: string;
  url: string;
  eventTypes: string[];
  isActive: boolean;
  secret?: string;
}

/**
 * Create a webhook for a specific tenant in Samsara
 */
export async function createTenantWebhook(
  apiToken: string, 
  tenantId: string,
  baseUrl: string
): Promise<{ webhookId: string; secret: string }> {
  const webhookSecret = generateSecureToken(32);
  const webhookUrl = `${baseUrl}/api/webhooks/samsara/${tenantId}`;
  
  const webhookConfig: WebhookConfig = {
    url: webhookUrl,
    name: `FleetChat-${tenantId}`,
    description: `FleetChat communication webhook for tenant ${tenantId}`,
    eventTypes: [
      'vehicle.location',
      'route.started',
      'route.completed', 
      'driver.dutyStatus',
      'geofence.enter',
      'geofence.exit',
      'vehicle.diagnostic',
      'document.uploaded'
    ]
  };

  try {
    const response = await fetch(`${SAMSARA_API_BASE}/fleet/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        ...webhookConfig,
        secret: webhookSecret
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create webhook: ${response.status} ${error}`);
    }

    const webhook = await response.json();
    
    return {
      webhookId: webhook.id,
      secret: webhookSecret
    };
  } catch (error) {
    console.error('Webhook creation error:', error);
    throw error;
  }
}

/**
 * Update webhook configuration
 */
export async function updateTenantWebhook(
  apiToken: string,
  webhookId: string,
  config: Partial<WebhookConfig>
): Promise<void> {
  try {
    const response = await fetch(`${SAMSARA_API_BASE}/fleet/webhooks/${webhookId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update webhook: ${response.status} ${error}`);
    }
  } catch (error) {
    console.error('Webhook update error:', error);
    throw error;
  }
}

/**
 * Delete webhook for a tenant
 */
export async function deleteTenantWebhook(
  apiToken: string,
  webhookId: string
): Promise<void> {
  try {
    const response = await fetch(`${SAMSARA_API_BASE}/fleet/webhooks/${webhookId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok && response.status !== 404) {
      const error = await response.text();
      throw new Error(`Failed to delete webhook: ${response.status} ${error}`);
    }
  } catch (error) {
    console.error('Webhook deletion error:', error);
    throw error;
  }
}

/**
 * List all webhooks for validation
 */
export async function listWebhooks(apiToken: string): Promise<SamsaraWebhook[]> {
  try {
    const response = await fetch(`${SAMSARA_API_BASE}/fleet/webhooks`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to list webhooks: ${response.status}`);
    }

    const data = await response.json();
    return data.webhooks || [];
  } catch (error) {
    console.error('Webhook listing error:', error);
    throw error;
  }
}

/**
 * Verify webhook signature for security
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  const receivedSignature = signature.replace('sha256=', '');
  
  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(receivedSignature, 'hex')
  );
}