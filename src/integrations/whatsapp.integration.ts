import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { env } from '../config/environment';
import { WhatsAppApiError } from '../shared/errors';
import { logger } from '../shared/logger';
import { retry } from '../shared/utils';
import { WhatsAppMessage, WhatsAppOutboundMessage } from '../shared/types';

export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId?: string;
  baseUrl?: string;
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  status: string;
  category: string;
  components: Array<{
    type: string;
    text?: string;
    parameters?: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

export class WhatsAppIntegration {
  private client: AxiosInstance;
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl || env.WHATSAPP_API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
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
        logger.debug('WhatsApp API request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          dataSize: config.data ? JSON.stringify(config.data).length : 0,
        });
        return config;
      },
      (error) => {
        logger.error('WhatsApp API request error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('WhatsApp API response', {
          status: response.status,
          url: response.config.url,
          dataSize: JSON.stringify(response.data).length,
        });
        return response;
      },
      (error) => {
        const errorMessage = error.response?.data?.error?.message || error.message;
        logger.error('WhatsApp API error', error, {
          status: error.response?.status,
          url: error.config?.url,
          message: errorMessage,
          errorData: error.response?.data,
        });

        throw new WhatsAppApiError(errorMessage, {
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

  // Message Sending
  async sendMessage(message: WhatsAppOutboundMessage): Promise<{ messageId: string }> {
    const data = await this.makeRequest<{ messages: Array<{ id: string }> }>({
      method: 'POST',
      url: `/${this.config.phoneNumberId}/messages`,
      data: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        ...message,
      },
    });

    return { messageId: data.messages[0].id };
  }

  async sendTextMessage(to: string, text: string): Promise<{ messageId: string }> {
    return this.sendMessage({
      to,
      type: 'text',
      text: { body: text },
    });
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string,
    parameters?: Array<{ type: string; text: string }>
  ): Promise<{ messageId: string }> {
    const template: WhatsAppOutboundMessage['template'] = {
      name: templateName,
      language: { code: languageCode },
    };

    if (parameters && parameters.length > 0) {
      template.components = [{
        type: 'body',
        parameters,
      }];
    }

    return this.sendMessage({
      to,
      type: 'template',
      template,
    });
  }

  async sendInteractiveMessage(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>,
    headerText?: string,
    footerText?: string
  ): Promise<{ messageId: string }> {
    const interactive: WhatsAppOutboundMessage['interactive'] = {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.map(button => ({
          type: 'reply',
          reply: {
            id: button.id,
            title: button.title,
          },
        })),
      },
    };

    if (headerText) {
      interactive.header = {
        type: 'text',
        text: headerText,
      };
    }

    if (footerText) {
      interactive.footer = { text: footerText };
    }

    return this.sendMessage({
      to,
      type: 'interactive',
      interactive,
    });
  }

  // Message Status
  async getMessageStatus(messageId: string): Promise<{
    id: string;
    status: string;
    timestamp: string;
    recipientId?: string;
  }> {
    const data = await this.makeRequest<any>({
      method: 'GET',
      url: `/${messageId}`,
    });

    return data;
  }

  // Media Handling
  async uploadMedia(
    mediaType: 'image' | 'document' | 'audio' | 'video',
    mediaBuffer: Buffer,
    filename?: string
  ): Promise<{ mediaId: string }> {
    const formData = new FormData();
    formData.append('file', new Blob([mediaBuffer]), filename);
    formData.append('type', mediaType);
    formData.append('messaging_product', 'whatsapp');

    const data = await this.makeRequest<{ id: string }>({
      method: 'POST',
      url: '/media',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return { mediaId: data.id };
  }

  async downloadMedia(mediaId: string): Promise<{
    buffer: Buffer;
    mimeType: string;
    filename?: string;
  }> {
    // First get media URL
    const mediaInfo = await this.makeRequest<{
      url: string;
      mime_type: string;
      sha256: string;
      file_size: number;
    }>({
      method: 'GET',
      url: `/${mediaId}`,
    });

    // Download the actual media
    const response = await axios.get(mediaInfo.url, {
      responseType: 'arraybuffer',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
      },
    });

    return {
      buffer: Buffer.from(response.data),
      mimeType: mediaInfo.mime_type,
      filename: `media_${mediaId}`,
    };
  }

  // Phone Number Management
  async getPhoneNumberInfo(): Promise<{
    id: string;
    displayPhoneNumber: string;
    verifiedName: string;
    codeVerificationStatus: string;
    qualityRating: string;
  }> {
    const data = await this.makeRequest<any>({
      method: 'GET',
      url: `/${this.config.phoneNumberId}`,
      params: {
        fields: 'id,display_phone_number,verified_name,code_verification_status,quality_rating',
      },
    });

    return data;
  }

  // Template Management
  async getTemplates(): Promise<WhatsAppTemplate[]> {
    if (!this.config.businessAccountId) {
      throw new WhatsAppApiError('Business Account ID required for template management');
    }

    const data = await this.makeRequest<{ data: WhatsAppTemplate[] }>({
      method: 'GET',
      url: `/${this.config.businessAccountId}/message_templates`,
    });

    return data.data;
  }

  async createTemplate(template: {
    name: string;
    language: string;
    category: string;
    components: Array<{
      type: string;
      text?: string;
      parameters?: Array<{ type: string; text: string }>;
    }>;
  }): Promise<{ id: string; status: string }> {
    if (!this.config.businessAccountId) {
      throw new WhatsAppApiError('Business Account ID required for template management');
    }

    const data = await this.makeRequest<{ id: string; status: string }>({
      method: 'POST',
      url: `/${this.config.businessAccountId}/message_templates`,
      data: template,
    });

    return data;
  }

  // Webhook Verification
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    
    if (!verifyToken) {
      logger.warn('WhatsApp webhook verify token not configured');
      return null;
    }

    if (mode === 'subscribe' && token === verifyToken) {
      logger.info('WhatsApp webhook verified successfully');
      return challenge;
    }

    logger.warn('WhatsApp webhook verification failed', { mode, token });
    return null;
  }

  // Event Processing
  processWebhookEvent(body: any): WhatsAppMessage[] {
    const messages: WhatsAppMessage[] = [];

    if (!body.entry || !Array.isArray(body.entry)) {
      return messages;
    }

    for (const entry of body.entry) {
      if (!entry.changes || !Array.isArray(entry.changes)) {
        continue;
      }

      for (const change of entry.changes) {
        if (change.field !== 'messages' || !change.value?.messages) {
          continue;
        }

        for (const message of change.value.messages) {
          messages.push({
            from: message.from,
            type: message.type,
            text: message.text,
            button: message.button,
            location: message.location,
            document: message.document,
            image: message.image,
            timestamp: message.timestamp,
          });
        }
      }
    }

    return messages;
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      await this.getPhoneNumberInfo();
      return true;
    } catch {
      return false;
    }
  }
}

// Factory function for creating WhatsApp integration instances
export function createWhatsAppIntegration(config: WhatsAppConfig): WhatsAppIntegration {
  return new WhatsAppIntegration(config);
}