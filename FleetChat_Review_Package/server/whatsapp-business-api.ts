import axios, { AxiosInstance } from 'axios';

export interface WhatsAppMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text' | 'template' | 'button' | 'list' | 'location' | 'document' | 'image';
  text?: { body: string };
  template?: {
    name: string;
    language: { code: string };
    components?: any[];
  };
  button?: {
    text: string;
    buttons: Array<{
      type: 'reply';
      reply: { id: string; title: string };
    }>;
  };
  document?: {
    link: string;
    filename: string;
    caption?: string;
  };
  image?: {
    link: string;
    caption?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
}

export interface WhatsAppWebhookMessage {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: 'text' | 'button' | 'location' | 'document' | 'image';
          text?: { body: string };
          button?: { text: string; payload: string };
          location?: {
            latitude: number;
            longitude: number;
            name?: string;
            address?: string;
          };
          document?: {
            filename: string;
            mime_type: string;
            sha256: string;
            id: string;
          };
          image?: {
            mime_type: string;
            sha256: string;
            id: string;
          };
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface PhoneNumberProvision {
  phoneNumber: string;
  phoneNumberId: string;
  businessAccountId: string;
  status: 'active' | 'pending' | 'suspended';
  country: string;
  capabilities: string[];
}

export class WhatsAppBusinessAPI {
  private client: AxiosInstance;
  private phoneNumberId: string;
  private businessAccountId: string;

  constructor(accessToken: string, phoneNumberId: string, businessAccountId: string) {
    this.client = axios.create({
      baseURL: 'https://graph.facebook.com/v18.0',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    this.phoneNumberId = phoneNumberId;
    this.businessAccountId = businessAccountId;
  }

  // Message Sending
  async sendMessage(message: WhatsAppMessage): Promise<{ messageId: string }> {
    try {
      const response = await this.client.post(`/${this.phoneNumberId}/messages`, message);
      return {
        messageId: response.data.messages[0].id
      };
    } catch (error: any) {
      console.error('WhatsApp send message error:', error.response?.data || error.message);
      throw new Error(`Failed to send WhatsApp message: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Template Messages for Transport Communications
  async sendTransportStatusUpdate(
    driverPhone: string,
    templateName: string,
    parameters: { [key: string]: string }
  ): Promise<{ messageId: string }> {
    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: driverPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en_US' },
        components: [
          {
            type: 'body',
            parameters: Object.entries(parameters).map(([key, value]) => ({
              type: 'text',
              text: value
            }))
          }
        ]
      }
    };

    return this.sendMessage(message);
  }

  // Interactive Button Messages
  async sendTransportButtons(
    driverPhone: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<{ messageId: string }> {
    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: driverPhone,
      type: 'button',
      button: {
        text: bodyText,
        buttons: buttons.map(btn => ({
          type: 'reply',
          reply: { id: btn.id, title: btn.title }
        }))
      }
    };

    return this.sendMessage(message);
  }

  // Document Requests
  async requestDocument(
    driverPhone: string,
    documentType: string,
    transportId: string
  ): Promise<{ messageId: string }> {
    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: driverPhone,
      type: 'text',
      text: {
        body: `Please upload your ${documentType} for transport #${transportId}. You can send the document as a photo or file attachment.`
      }
    };

    return this.sendMessage(message);
  }

  // Location Requests
  async requestLocation(
    driverPhone: string,
    reason: string
  ): Promise<{ messageId: string }> {
    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: driverPhone,
      type: 'text',
      text: {
        body: `Please share your current location for ${reason}. Use the location sharing feature in WhatsApp.`
      }
    };

    return this.sendMessage(message);
  }

  // Media Downloads
  async downloadMedia(mediaId: string): Promise<{ 
    buffer: Buffer; 
    mimeType: string; 
    filename?: string 
  }> {
    try {
      // Get media URL
      const mediaResponse = await this.client.get(`/${mediaId}`);
      const mediaUrl = mediaResponse.data.url;
      const mimeType = mediaResponse.data.mime_type;

      // Download media content
      const downloadResponse = await this.client.get(mediaUrl, {
        responseType: 'arraybuffer',
        headers: {
          'Authorization': `Bearer ${this.client.defaults.headers['Authorization']}`
        }
      });

      return {
        buffer: Buffer.from(downloadResponse.data),
        mimeType,
        filename: `media_${mediaId}.${this.getFileExtension(mimeType)}`
      };
    } catch (error: any) {
      console.error('WhatsApp media download error:', error.response?.data || error.message);
      throw new Error(`Failed to download WhatsApp media: ${error.message}`);
    }
  }

  // Webhook Processing
  processWebhookMessage(webhookData: WhatsAppWebhookMessage): Array<{
    type: 'message' | 'status';
    from?: string;
    messageId?: string;
    content?: any;
    status?: string;
  }> {
    const processedMessages: Array<any> = [];

    webhookData.entry.forEach(entry => {
      entry.changes.forEach(change => {
        const { messages, statuses } = change.value;

        // Process incoming messages
        if (messages) {
          messages.forEach(message => {
            processedMessages.push({
              type: 'message',
              from: message.from,
              messageId: message.id,
              timestamp: message.timestamp,
              messageType: message.type,
              content: this.extractMessageContent(message)
            });
          });
        }

        // Process message statuses
        if (statuses) {
          statuses.forEach(status => {
            processedMessages.push({
              type: 'status',
              messageId: status.id,
              status: status.status,
              timestamp: status.timestamp,
              recipientId: status.recipient_id
            });
          });
        }
      });
    });

    return processedMessages;
  }

  private extractMessageContent(message: any): any {
    switch (message.type) {
      case 'text':
        return { text: message.text.body };
      
      case 'button':
        return { 
          buttonText: message.button.text,
          buttonId: message.button.payload 
        };
      
      case 'location':
        return {
          latitude: message.location.latitude,
          longitude: message.location.longitude,
          name: message.location.name,
          address: message.location.address
        };
      
      case 'document':
        return {
          filename: message.document.filename,
          mimeType: message.document.mime_type,
          mediaId: message.document.id
        };
      
      case 'image':
        return {
          mimeType: message.image.mime_type,
          mediaId: message.image.id
        };
      
      default:
        return { raw: message };
    }
  }

  private getFileExtension(mimeType: string): string {
    const extensions: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'text/plain': 'txt'
    };
    return extensions[mimeType] || 'bin';
  }

  // Message Templates for Transport Workflows
  generateTransportMessage(eventType: string, data: any): {
    template?: string;
    text?: string;
    buttons?: Array<{ id: string; title: string }>;
  } {
    switch (eventType) {
      case 'route_assigned':
        return {
          text: `🚛 New route assigned!\n\nPickup: ${data.pickupLocation}\nDelivery: ${data.deliveryLocation}\nLoad: ${data.loadDescription || 'N/A'}\n\nPlease confirm when you're ready to start.`,
          buttons: [
            { id: 'confirm_start', title: '✅ Ready to Start' },
            { id: 'need_help', title: '❓ Need Help' }
          ]
        };

      case 'arrival_reminder':
        return {
          text: `📍 Approaching ${data.locationType}\n\nLocation: ${data.location}\n\nPlease confirm your arrival and current status.`,
          buttons: [
            { id: 'arrived', title: '✅ Arrived' },
            { id: 'delayed', title: '⏰ Delayed' },
            { id: 'lost', title: '❓ Need Directions' }
          ]
        };

      case 'document_request':
        return {
          text: `📄 Document required\n\nPlease upload: ${data.documentType}\nFor: ${data.location}\n\nSend as photo or file attachment.`
        };

      case 'status_update':
        return {
          text: `📋 Status Update\n\nTransport: ${data.transportId}\nCurrent status: ${data.status}\n\nWhat's your next action?`,
          buttons: [
            { id: 'loading', title: '📦 Loading' },
            { id: 'departed', title: '🚛 Departed' },
            { id: 'arrived_delivery', title: '📍 At Delivery' }
          ]
        };

      case 'completion_confirmation':
        return {
          text: `✅ Transport completed!\n\nDelivery: ${data.deliveryLocation}\nTime: ${new Date().toLocaleTimeString()}\n\nPlease confirm completion and upload POD.`,
          buttons: [
            { id: 'completed', title: '✅ Completed' },
            { id: 'issue', title: '⚠️ Issue' }
          ]
        };

      default:
        return {
          text: `Fleet.Chat notification: ${eventType}`
        };
    }
  }
}

// Fleet.Chat WhatsApp Management Service
export class FleetChatWhatsAppManager {
  private phoneNumberPool: Map<string, WhatsAppBusinessAPI> = new Map();
  private tenantPhoneMapping: Map<string, string> = new Map();

  constructor() {
    // Initialize with dummy WhatsApp Business API instances for development
    this.initializeDummyPhoneNumbers();
  }

  private initializeDummyPhoneNumbers() {
    // Dummy phone numbers for development (Fleet.Chat managed pool)
    const dummyPhoneNumbers = [
      { phone: '+1555001001', phoneNumberId: 'dummy_phone_1', businessAccountId: 'dummy_business_1' },
      { phone: '+1555001002', phoneNumberId: 'dummy_phone_2', businessAccountId: 'dummy_business_2' },
      { phone: '+1555001003', phoneNumberId: 'dummy_phone_3', businessAccountId: 'dummy_business_3' },
      { phone: '+1555001004', phoneNumberId: 'dummy_phone_4', businessAccountId: 'dummy_business_4' },
      { phone: '+1555001005', phoneNumberId: 'dummy_phone_5', businessAccountId: 'dummy_business_5' }
    ];

    dummyPhoneNumbers.forEach(({ phone, phoneNumberId, businessAccountId }) => {
      const api = new WhatsAppBusinessAPI(
        'dummy_access_token_for_development',
        phoneNumberId,
        businessAccountId
      );
      this.phoneNumberPool.set(phone, api);
    });

    console.log('Initialized Fleet.Chat WhatsApp phone number pool with', dummyPhoneNumbers.length, 'numbers');
  }

  // Assign phone number to tenant
  async assignPhoneNumberToTenant(tenantId: string): Promise<{
    phoneNumber: string;
    phoneNumberId: string;
    businessAccountId: string;
  }> {
    // Find available phone number
    const availablePhones = Array.from(this.phoneNumberPool.keys()).filter(
      phone => !Array.from(this.tenantPhoneMapping.values()).includes(phone)
    );

    if (availablePhones.length === 0) {
      throw new Error('No available WhatsApp Business phone numbers in pool');
    }

    const assignedPhone = availablePhones[0];
    this.tenantPhoneMapping.set(tenantId, assignedPhone);

    const api = this.phoneNumberPool.get(assignedPhone)!;
    
    console.log(`Assigned phone number ${assignedPhone} to tenant ${tenantId}`);
    
    return {
      phoneNumber: assignedPhone,
      phoneNumberId: api['phoneNumberId'],
      businessAccountId: api['businessAccountId']
    };
  }

  // Get WhatsApp API client for tenant
  getWhatsAppAPI(tenantId: string): WhatsAppBusinessAPI | null {
    const phoneNumber = this.tenantPhoneMapping.get(tenantId);
    if (!phoneNumber) return null;
    
    return this.phoneNumberPool.get(phoneNumber) || null;
  }

  // Send message via tenant's assigned phone number
  async sendMessage(tenantId: string, message: WhatsAppMessage): Promise<{ messageId: string }> {
    const api = this.getWhatsAppAPI(tenantId);
    if (!api) {
      throw new Error(`No WhatsApp phone number assigned to tenant ${tenantId}`);
    }

    return api.sendMessage(message);
  }

  // Bulk phone number provisioning
  async provisionBulkPhoneNumbers(count: number): Promise<PhoneNumberProvision[]> {
    // Simulate bulk provisioning from WhatsApp Business API
    const newPhoneNumbers: PhoneNumberProvision[] = [];
    
    for (let i = 0; i < count; i++) {
      const phoneNumber = `+1555${String(Date.now() + i).slice(-6)}`;
      const phoneNumberId = `bulk_phone_${Date.now()}_${i}`;
      const businessAccountId = `bulk_business_${Date.now()}_${i}`;
      
      const provision: PhoneNumberProvision = {
        phoneNumber,
        phoneNumberId,
        businessAccountId,
        status: 'active',
        country: 'US',
        capabilities: ['messaging', 'voice']
      };

      // Add to pool
      const api = new WhatsAppBusinessAPI(
        'bulk_access_token_for_production',
        phoneNumberId,
        businessAccountId
      );
      this.phoneNumberPool.set(phoneNumber, api);
      newPhoneNumbers.push(provision);
    }

    console.log(`Provisioned ${count} new WhatsApp Business phone numbers`);
    return newPhoneNumbers;
  }

  // Get pool statistics
  getPoolStatistics(): {
    totalNumbers: number;
    assignedNumbers: number;
    availableNumbers: number;
    assignments: Array<{ tenantId: string; phoneNumber: string }>;
  } {
    const totalNumbers = this.phoneNumberPool.size;
    const assignedNumbers = this.tenantPhoneMapping.size;
    const assignments = Array.from(this.tenantPhoneMapping.entries()).map(
      ([tenantId, phoneNumber]) => ({ tenantId, phoneNumber })
    );

    return {
      totalNumbers,
      assignedNumbers,
      availableNumbers: totalNumbers - assignedNumbers,
      assignments
    };
  }
}

// Global instance for Fleet.Chat
export const fleetChatWhatsApp = new FleetChatWhatsAppManager();