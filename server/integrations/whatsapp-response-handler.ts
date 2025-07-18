// WhatsApp Response Handler for Driver Interactions
import { storage } from "../storage";
import { WhatsAppTemplateService } from "./whatsapp-templates";
import { samsaraService } from "./samsara-service";

export interface WhatsAppIncomingMessage {
  from: string; // Driver's WhatsApp number
  to: string; // Business WhatsApp number
  messageId: string;
  timestamp: Date;
  type: 'text' | 'button' | 'quick_reply' | 'location' | 'document';
  content: {
    text?: string;
    buttonId?: string;
    quickReplyId?: string;
    location?: {
      lat: number;
      lng: number;
      address?: string;
    };
    document?: {
      filename: string;
      mimeType: string;
      fileUrl: string;
    };
  };
  contextMessageId?: string; // Reference to the original template message
}

export class WhatsAppResponseHandler {
  
  // Main entry point for all incoming WhatsApp messages
  public async processIncomingMessage(message: WhatsAppIncomingMessage): Promise<any> {
    try {
      // Find driver by WhatsApp number
      const driver = await this.findDriverByWhatsApp(message.from);
      if (!driver) {
        return this.handleUnknownDriver(message);
      }

      // Get driver's active transport
      const activeTransport = await this.getDriverActiveTransport(driver.id);
      if (!activeTransport) {
        return this.handleNoActiveTransport(message, driver);
      }

      // Process based on message type
      switch (message.type) {
        case 'button':
          return this.handleButtonResponse(message, driver, activeTransport);
        case 'quick_reply':
          return this.handleQuickReplyResponse(message, driver, activeTransport);
        case 'text':
          return this.handleTextResponse(message, driver, activeTransport);
        case 'location':
          return this.handleLocationResponse(message, driver, activeTransport);
        case 'document':
          return this.handleDocumentResponse(message, driver, activeTransport);
        default:
          return this.handleUnsupportedMessage(message, driver);
      }
    } catch (error) {
      console.error('Error processing WhatsApp message:', error);
      return this.sendErrorResponse(message.from);
    }
  }

  // Handle button press responses (e.g., "✅ Confirm Arrival", "🚛 Start Loading")
  private async handleButtonResponse(message: WhatsAppIncomingMessage, driver: any, transport: any) {
    const buttonId = message.content.buttonId;
    
    switch (buttonId) {
      case 'confirm_arrival':
        return this.processArrivalConfirmation(driver, transport, message);
      
      case 'start_loading':
        return this.processLoadingStart(driver, transport, message);
      
      case 'loading_complete':
        return this.processLoadingComplete(driver, transport, message);
      
      case 'start_unloading':
        return this.processUnloadingStart(driver, transport, message);
      
      case 'delivery_confirmed':
        return this.processDeliveryConfirmation(driver, transport, message);
      
      case 'upload_documents':
        return this.requestDocumentUpload(driver, transport, message);
      
      case 'deviation_approved':
        return this.processDeviationApproval(driver, transport, message);
      
      case 'return_to_route':
        return this.processReturnToRoute(driver, transport, message);
      
      case 'call_dispatch':
        return this.initiateDispatchCall(driver, transport, message);
      
      case 'emergency':
        return this.handleEmergencyRequest(driver, transport, message);
      
      default:
        return this.handleUnknownButton(message, driver, transport);
    }
  }

  // Handle quick reply responses (e.g., "⏰ On Time", "✅ Confirmed")
  private async handleQuickReplyResponse(message: WhatsAppIncomingMessage, driver: any, transport: any) {
    const replyId = message.content.quickReplyId;
    
    switch (replyId) {
      case 'on_time':
        return this.processETAConfirmation(driver, transport, 'on_time');
      
      case 'eta_15_min':
        return this.processETAUpdate(driver, transport, 15);
      
      case 'eta_30_min':
        return this.processETAUpdate(driver, transport, 30);
      
      case 'eta_1_hour':
        return this.processETAUpdate(driver, transport, 60);
      
      case 'confirmed':
        return this.processGeneralConfirmation(driver, transport, message);
      
      case 'call_me':
        return this.requestDispatchCall(driver, transport, message);
      
      case 'privacy_info':
        return this.sendPrivacyInformation(driver, transport);
      
      default:
        return this.handleUnknownQuickReply(message, driver, transport);
    }
  }

  // Handle free-text responses from drivers
  private async handleTextResponse(message: WhatsAppIncomingMessage, driver: any, transport: any) {
    const text = message.content.text?.toLowerCase() || '';
    
    // Check for common keywords and phrases
    if (text.includes('arrived') || text.includes('here')) {
      return this.processArrivalConfirmation(driver, transport, message);
    }
    
    if (text.includes('loaded') || text.includes('ready')) {
      return this.processLoadingComplete(driver, transport, message);
    }
    
    if (text.includes('delivered') || text.includes('done')) {
      return this.processDeliveryConfirmation(driver, transport, message);
    }
    
    if (text.includes('help') || text.includes('problem')) {
      return this.handleHelpRequest(driver, transport, message);
    }
    
    if (text.includes('eta') || text.includes('time')) {
      return this.handleETAQuery(driver, transport, message);
    }
    
    // Default: log as driver note and acknowledge
    return this.processDriverNote(driver, transport, message);
  }

  // Handle location sharing from drivers
  private async handleLocationResponse(message: WhatsAppIncomingMessage, driver: any, transport: any) {
    const location = message.content.location;
    if (!location) return;

    // Store location tracking
    await storage.createLocationTracking({
      transportId: transport.id,
      driverId: driver.id,
      lat: location.lat,
      lng: location.lng,
      accuracy: 10, // Approximate accuracy for manual sharing
      timestamp: message.timestamp
    });

    // Write back to TMS system
    if (transport.samsaraDriverId) {
      await samsaraService.updateSamsaraDriverLocation(transport.samsaraDriverId, {
        lat: location.lat,
        lng: location.lng,
        timestamp: message.timestamp
      });
    }

    // Update transport status if needed
    await this.updateTransportStatusFromLocation(transport, location);

    // Send confirmation back to driver
    return {
      type: 'text',
      message: `📍 Location received and updated for transport #${transport.id.slice(-6)}. Thank you!`,
      quickReplies: ['✅ Continue', '📞 Call Dispatch']
    };
  }

  // Handle document uploads (PODs, delivery receipts, etc.)
  private async handleDocumentResponse(message: WhatsAppIncomingMessage, driver: any, transport: any) {
    const document = message.content.document;
    if (!document) return;

    // Store document
    const uploadedDoc = await storage.createDocument({
      transportId: transport.id,
      type: this.determineDocumentType(document.filename),
      filename: document.filename,
      originalName: document.filename,
      fileUrl: document.fileUrl,
      mimeType: document.mimeType,
      uploadedBy: driver.id,
      notes: `Uploaded via WhatsApp by ${driver.name || driver.pseudoId}`
    });

    // Write back to TMS system
    if (transport.samsaraRouteId) {
      await samsaraService.submitDocumentToSamsara(transport.samsaraRouteId, {
        filename: document.filename,
        fileUrl: document.fileUrl,
        mimeType: document.mimeType,
        uploadedBy: driver.id,
        type: this.determineDocumentType(document.filename)
      });
    }

    // Notify dispatcher about document upload
    await this.notifyDispatcherOfDocument(transport, uploadedDoc, driver);

    return {
      type: 'text',
      message: `📄 Document "${document.filename}" uploaded successfully for transport #${transport.id.slice(-6)}.\n\nDocument is pending approval from dispatch.`,
      quickReplies: ['✅ Continue', '📄 Upload Another', '📞 Call Dispatch']
    };
  }

  // Process arrival confirmation
  private async processArrivalConfirmation(driver: any, transport: any, message: WhatsAppIncomingMessage) {
    const isPickup = transport.status === 'dispatched' || transport.status === 'en_route';
    const newStatus = isPickup ? 'arrived_pickup' : 'arrived_delivery';
    const location = isPickup ? transport.pickupLocation : transport.deliveryLocation;

    // Update transport status
    await storage.updateTransport(transport.id, { status: newStatus });

    // Create status update
    await storage.createStatusUpdate({
      transportId: transport.id,
      status: newStatus,
      location: location,
      notes: `Arrival confirmed via WhatsApp`,
      createdBy: driver.id
    });

    // Write back to TMS system if configured
    if (transport.samsaraRouteId) {
      await samsaraService.syncTransportWithSamsara(transport.id);
      await samsaraService.updateSamsaraRouteStatus(transport.samsaraRouteId, newStatus);
    }

    const nextAction = isPickup ? 'loading' : 'unloading';
    return {
      type: 'text',
      message: `✅ Arrival confirmed at ${location}\n\nTime: ${new Date().toLocaleTimeString()}\n\nPlease begin ${nextAction} when ready.`,
      buttons: [`🚛 Start ${nextAction.charAt(0).toUpperCase() + nextAction.slice(1)}`, '📞 Call Dispatch', '❓ Need Help']
    };
  }

  // Process ETA updates
  private async processETAUpdate(driver: any, transport: any, delayMinutes: number) {
    const currentETA = transport.deliveryEta ? new Date(transport.deliveryEta) : new Date();
    const newETA = new Date(currentETA.getTime() + (delayMinutes * 60000));

    // Update transport ETA
    await storage.updateTransport(transport.id, { 
      deliveryEta: newETA 
    });

    // Create status update
    await storage.createStatusUpdate({
      transportId: transport.id,
      status: transport.status,
      notes: `ETA updated: +${delayMinutes} minutes via WhatsApp`,
      createdBy: driver.id
    });

    // Write back to TMS system if configured
    if (transport.samsaraRouteId) {
      await samsaraService.updateSamsaraRouteStatus(transport.samsaraRouteId, transport.status);
    }

    // Notify dispatcher of ETA change
    await this.notifyDispatcherOfETAChange(transport, newETA, delayMinutes, driver);

    return {
      type: 'text',
      message: `⏰ ETA updated successfully\n\nNew estimated arrival: ${newETA.toLocaleTimeString()}\n\nDispatcher has been notified.`,
      quickReplies: ['✅ Continue', '📞 Call Dispatch']
    };
  }

  // Process loading start
  private async processLoadingStart(driver: any, transport: any, message: WhatsAppIncomingMessage) {
    const newStatus = 'loading';
    
    // Update transport status
    await storage.updateTransport(transport.id, { status: newStatus });
    
    // Create status update
    await storage.createStatusUpdate({
      transportId: transport.id,
      status: newStatus,
      notes: `Loading started via WhatsApp`,
      createdBy: driver.id
    });
    
    // Write back to TMS system
    if (transport.samsaraRouteId) {
      await samsaraService.updateSamsaraRouteStatus(transport.samsaraRouteId, newStatus);
    }
    
    return {
      type: 'text',
      message: `🚛 Loading started for transport #${transport.id.slice(-6)}\n\nPlease notify when loading is complete.`,
      buttons: ['✅ Loading Complete', '📞 Call Dispatch', '❓ Need Help']
    };
  }

  // Process loading complete
  private async processLoadingComplete(driver: any, transport: any, message: WhatsAppIncomingMessage) {
    const newStatus = 'loaded';
    
    // Update transport status
    await storage.updateTransport(transport.id, { status: newStatus });
    
    // Create status update
    await storage.createStatusUpdate({
      transportId: transport.id,
      status: newStatus,
      notes: `Loading completed via WhatsApp`,
      createdBy: driver.id
    });
    
    // Write back to TMS system
    if (transport.samsaraRouteId) {
      await samsaraService.updateSamsaraRouteStatus(transport.samsaraRouteId, newStatus);
    }
    
    return {
      type: 'text',
      message: `✅ Loading completed for transport #${transport.id.slice(-6)}\n\nYou can now depart for delivery.`,
      buttons: ['🚚 Depart for Delivery', '📞 Call Dispatch', '❓ Need Help']
    };
  }

  // Process delivery confirmation
  private async processDeliveryConfirmation(driver: any, transport: any, message: WhatsAppIncomingMessage) {
    const newStatus = 'delivered';
    
    // Update transport status
    await storage.updateTransport(transport.id, { 
      status: newStatus,
      isActive: false,
      deliveryActual: new Date()
    });
    
    // Create status update
    await storage.createStatusUpdate({
      transportId: transport.id,
      status: newStatus,
      notes: `Delivery confirmed via WhatsApp`,
      createdBy: driver.id
    });
    
    // Write back to TMS system
    if (transport.samsaraRouteId) {
      await samsaraService.updateSamsaraRouteStatus(transport.samsaraRouteId, newStatus);
    }
    
    return {
      type: 'text',
      message: `✅ Delivery confirmed for transport #${transport.id.slice(-6)}\n\nThank you for completing this delivery!`,
      buttons: ['📄 Upload POD', '📞 Call Dispatch', '🏠 Return to Base']
    };
  }

  // Process unloading start
  private async processUnloadingStart(driver: any, transport: any, message: WhatsAppIncomingMessage) {
    const newStatus = 'unloading';
    
    // Update transport status
    await storage.updateTransport(transport.id, { status: newStatus });
    
    // Create status update
    await storage.createStatusUpdate({
      transportId: transport.id,
      status: newStatus,
      notes: `Unloading started via WhatsApp`,
      createdBy: driver.id
    });
    
    // Write back to TMS system
    if (transport.samsaraRouteId) {
      await samsaraService.updateSamsaraRouteStatus(transport.samsaraRouteId, newStatus);
    }
    
    return {
      type: 'text',
      message: `🚛 Unloading started for transport #${transport.id.slice(-6)}\n\nPlease notify when unloading is complete.`,
      buttons: ['✅ Delivery Complete', '📞 Call Dispatch', '❓ Need Help']
    };
  }

  // Process general confirmation
  private async processGeneralConfirmation(driver: any, transport: any, message: WhatsAppIncomingMessage) {
    // Create status update
    await storage.createStatusUpdate({
      transportId: transport.id,
      status: transport.status,
      notes: `Driver confirmed via WhatsApp`,
      createdBy: driver.id
    });
    
    return {
      type: 'text',
      message: `✅ Confirmation received for transport #${transport.id.slice(-6)}\n\nThank you for the update!`,
      quickReplies: ['✅ Continue', '📞 Call Dispatch']
    };
  }

  // Request document upload
  private async requestDocumentUpload(driver: any, transport: any, message: WhatsAppIncomingMessage) {
    return {
      type: 'text',
      message: `📄 Please upload the required documents for transport #${transport.id.slice(-6)}\n\nAccepted formats: PDF, JPG, PNG`,
      quickReplies: ['📸 Take Photo', '📞 Call Dispatch', '❓ Need Help']
    };
  }

  // Handle emergency request
  private async handleEmergencyRequest(driver: any, transport: any, message: WhatsAppIncomingMessage) {
    // Create emergency status update
    await storage.createStatusUpdate({
      transportId: transport.id,
      status: 'emergency',
      notes: `Emergency request via WhatsApp`,
      createdBy: driver.id
    });
    
    // Write back to TMS system
    if (transport.samsaraRouteId) {
      await samsaraService.updateSamsaraRouteStatus(transport.samsaraRouteId, 'emergency');
    }
    
    return {
      type: 'text',
      message: `🚨 Emergency request received for transport #${transport.id.slice(-6)}\n\nDispatch has been notified immediately.`,
      buttons: ['📞 Call Dispatch', '🚑 Call 911', '❓ Need Help']
    };
  }

  // Handle unknown button
  private async handleUnknownButton(message: WhatsAppIncomingMessage, driver: any, transport: any) {
    return {
      type: 'text',
      message: `❓ Unknown button response received. How can I help you?`,
      buttons: ['✅ All Good', '📞 Call Dispatch', '❓ Need Help']
    };
  }

  // Handle unknown quick reply
  private async handleUnknownQuickReply(message: WhatsAppIncomingMessage, driver: any, transport: any) {
    return {
      type: 'text',
      message: `❓ Unknown quick reply received. How can I help you?`,
      quickReplies: ['✅ All Good', '📞 Call Dispatch', '❓ Need Help']
    };
  }

  // Handle ETA confirmation
  private async processETAConfirmation(driver: any, transport: any, type: string) {
    // Create status update
    await storage.createStatusUpdate({
      transportId: transport.id,
      status: transport.status,
      notes: `ETA confirmed as ${type} via WhatsApp`,
      createdBy: driver.id
    });
    
    return {
      type: 'text',
      message: `✅ ETA confirmed for transport #${transport.id.slice(-6)}\n\nThank you for the update!`,
      quickReplies: ['✅ Continue', '📞 Call Dispatch']
    };
  }

  // Handle help request
  private async handleHelpRequest(driver: any, transport: any, message: WhatsAppIncomingMessage) {
    return {
      type: 'text',
      message: `❓ How can I help you with transport #${transport.id.slice(-6)}?\n\nCommon actions:`,
      buttons: ['📞 Call Dispatch', '📄 Upload Document', '📍 Share Location']
    };
  }

  // Handle ETA query
  private async handleETAQuery(driver: any, transport: any, message: WhatsAppIncomingMessage) {
    const eta = transport.deliveryEta ? new Date(transport.deliveryEta).toLocaleTimeString() : 'Not set';
    
    return {
      type: 'text',
      message: `⏰ Current ETA for transport #${transport.id.slice(-6)}: ${eta}\n\nDo you need to update it?`,
      quickReplies: ['⏰ On Time', '⏰ +15 min', '⏰ +30 min', '⏰ +1 hour']
    };
  }

  // Handle no active transport
  private async handleNoActiveTransport(message: WhatsAppIncomingMessage, driver: any) {
    return {
      type: 'text',
      message: `You don't have any active transports right now. Please contact dispatch if you need assistance.`,
      quickReplies: ['📞 Call Dispatch']
    };
  }

  // Handle unsupported message
  private async handleUnsupportedMessage(message: WhatsAppIncomingMessage, driver: any) {
    return {
      type: 'text',
      message: `Sorry, I don't understand that type of message. Please use the buttons or text messages.`,
      quickReplies: ['📞 Call Dispatch', '❓ Need Help']
    };
  }

  // Request dispatch call
  private async requestDispatchCall(driver: any, transport: any, message: WhatsAppIncomingMessage) {
    return {
      type: 'text',
      message: `📞 Dispatch will call you shortly regarding transport #${transport.id.slice(-6)}.`,
      quickReplies: ['✅ Thank you', '❓ Need Help']
    };
  }

  // Send privacy information
  private async sendPrivacyInformation(driver: any, transport: any) {
    return {
      type: 'text',
      message: `🔒 Privacy Information:\n\nYour location and messages are only shared with dispatch for this transport. Data is not stored beyond completion of delivery.`,
      quickReplies: ['✅ Understood', '❓ More Info']
    };
  }

  // Utility methods
  private async findDriverByWhatsApp(whatsappNumber: string) {
    const users = await storage.getAllUsers();
    return users.find(user => user.whatsappNumber === whatsappNumber);
  }

  private async getDriverActiveTransport(driverId: string) {
    const transports = await storage.getTransportsByDriverId(driverId);
    return transports.find(t => t.isActive && ['dispatched', 'en_route', 'arrived_pickup', 'loading', 'loaded', 'arrived_delivery', 'unloading'].includes(t.status));
  }

  private determineDocumentType(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.includes('pod') || lower.includes('delivery')) return 'pod';
    if (lower.includes('receipt')) return 'receipt';
    if (lower.includes('signature')) return 'signature';
    if (lower.includes('photo') || lower.includes('image')) return 'photo';
    return 'other';
  }

  private async updateTransportStatusFromLocation(transport: any, location: any) {
    // Logic to determine if driver has reached pickup/delivery based on location
    // This would typically involve geofencing calculations
    console.log(`Location update for transport ${transport.id}:`, location);
  }

  private async notifyDispatcherOfDocument(transport: any, document: any, driver: any) {
    console.log(`Document uploaded by ${driver.name || driver.pseudoId} for transport ${transport.id}`);
    // In production, this would send notification to dispatcher
  }

  private async notifyDispatcherOfETAChange(transport: any, newETA: Date, delayMinutes: number, driver: any) {
    console.log(`ETA updated by ${driver.name || driver.pseudoId}: +${delayMinutes} minutes`);
    // In production, this would notify dispatcher of ETA change
  }

  private async sendErrorResponse(whatsappNumber: string) {
    return {
      type: 'text',
      message: '❌ Sorry, there was an error processing your message. Please try again or call dispatch for assistance.',
      quickReplies: ['📞 Call Dispatch', '🔄 Try Again']
    };
  }

  private async handleUnknownDriver(message: WhatsAppIncomingMessage) {
    return {
      type: 'text',
      message: '❓ We don\'t recognize this WhatsApp number. Please contact dispatch to register your number.',
      quickReplies: ['📞 Call Dispatch']
    };
  }

  private async processDriverNote(driver: any, transport: any, message: WhatsAppIncomingMessage) {
    // Store driver's text message as a note
    await storage.createStatusUpdate({
      transportId: transport.id,
      status: transport.status,
      notes: `Driver note: ${message.content.text}`,
      createdBy: driver.id
    });

    return {
      type: 'text',
      message: '📝 Your message has been recorded. Is there anything specific you need help with?',
      buttons: ['✅ All Good', '📞 Call Dispatch', '❓ Need Help']
    };
  }
}

export const whatsappResponseHandler = new WhatsAppResponseHandler();