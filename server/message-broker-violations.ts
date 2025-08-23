import express from "express";
import { z } from "zod";
import { samsaraService } from "./integrations/samsara-service";
import { enhancedMessageBroker } from "./enhanced-message-broker";

const app = express();
app.use(express.json());

// Initialize database templates on startup
enhancedMessageBroker.initializeTemplates().catch(console.error);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const samsaraHealth = samsaraService.isConfigured();
    const whatsappHealth = process.env.WHATSAPP_BUSINESS_TOKEN ? true : false;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        samsara: samsaraHealth ? 'connected' : 'disconnected',
        whatsapp: whatsappHealth ? 'configured' : 'not_configured'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Samsara webhook handler - receives fleet events and routes to WhatsApp
app.post('/webhook/samsara', async (req, res) => {
  try {
    console.log('Samsara webhook received:', req.body);
    
    const samsaraEvent = req.body;
    const processedEvent = await samsaraService.processWebhookEvent(samsaraEvent);
    
    if (processedEvent) {
      // Translate Samsara event to WhatsApp message
      const whatsappMessage = await translateSamsaraEventToWhatsApp(processedEvent);
      
      if (whatsappMessage) {
        await sendWhatsAppMessage(whatsappMessage);
        console.log('WhatsApp message sent:', whatsappMessage.to);
      }
    }
    
    res.status(200).json({ 
      status: 'processed',
      eventType: samsaraEvent.eventType || 'unknown',
      messagesSent: processedEvent ? 1 : 0
    });
  } catch (error) {
    console.error('Samsara webhook error:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Processing failed' 
    });
  }
});

// WhatsApp webhook handler - receives driver messages and routes to Samsara
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    console.log('WhatsApp webhook received:', req.body);
    
    const whatsappMessage = req.body;
    const driverResponse = await processWhatsAppMessage(whatsappMessage);
    
    if (driverResponse) {
      // Update Samsara with driver response
      await updateSamsaraFromDriverResponse(driverResponse);
      console.log('Samsara updated from driver response:', driverResponse.driverId);
    }
    
    res.status(200).json({ 
      status: 'processed',
      messageType: whatsappMessage.type || 'unknown',
      updatesApplied: driverResponse ? 1 : 0
    });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Processing failed' 
    });
  }
});

// Message translation: Samsara events → WhatsApp messages
async function translateSamsaraEventToWhatsApp(event: any) {
  try {
    // Get driver phone number from Samsara
    if (!event.driverId) {
      console.log('No driver ID in event, skipping WhatsApp message');
      return null;
    }
    
    const driverWithPhone = await samsaraService.getDriverWithPhone(event.driverId);
    
    if (!driverWithPhone.hasPhoneNumber) {
      console.log(`Driver ${event.driverId} has no phone number, skipping WhatsApp message`);
      return null;
    }
    
    // Generate contextual message using enhanced message broker
    const message = await enhancedMessageBroker.generateDriverMessage(event);
    
    return {
      to: driverWithPhone.phoneNumber,
      messageType: message.type,
      header: message.header,
      body: message.body,
      buttons: message.buttons,
      context: {
        transportId: event.transportId,
        eventType: event.type
      }
    };
  } catch (error) {
    console.error('Failed to translate Samsara event to WhatsApp:', error);
    return null;
  }
}

// Generate driver-friendly messages from Samsara events
function generateDriverMessage(event: any) {
  const eventType = event.eventType || event.type;
  
  switch (eventType) {
    case 'route.assigned':
      const route = event.data?.route;
      const pickup = route?.stops?.find(s => s.type === 'pickup');
      const delivery = route?.stops?.find(s => s.type === 'delivery');
      
      return {
        type: 'template',
        header: '🚛 New Route Assigned',
        body: `You have been assigned a new delivery route:

📍 Pickup: ${pickup?.location || 'Unknown location'}
🚩 Delivery: ${delivery?.location || 'Unknown location'}
⏰ Pickup window: ${pickup?.scheduledTime ? new Date(pickup.scheduledTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'TBD'}
📊 Route: ${route?.name || 'Transport route'}`,
        buttons: [
          { text: 'Acknowledge Route', payload: 'acknowledge_route' },
          { text: 'View Details', payload: 'view_details' }
        ]
      };
      
    case 'route.pickup_reminder':
      const stop = event.data?.stop;
      return {
        type: 'template',
        header: '⏰ Pickup Reminder',
        body: `Reminder: Your pickup window starts soon.

📍 ${stop?.location || 'Pickup location'}
📍 ${stop?.address || 'Address not specified'}
⏰ Window: ${stop?.timeWindow || 'ASAP'}
📞 Contact: ${stop?.customerContact || 'N/A'}

Please confirm your arrival time.`,
        buttons: [
          { text: 'On My Way', payload: 'en_route' },
          { text: 'Share Location', payload: 'share_location' }
        ]
      };
      
    case 'vehicle.location':
      const location = event.data?.location;
      return {
        type: 'text',
        body: `📍 Location update received: ${location?.address || 'Current position'}
Speed: ${location?.speed || 0} km/h`
      };
      
    case 'vehicle.geofence.enter':
      const geofence = event.data?.geofence;
      return {
        type: 'template',
        header: '🎯 Arrival Confirmed',
        body: `You have arrived at ${geofence?.name || 'destination'}.

Please confirm when ${geofence?.type === 'pickup_location' ? 'pickup' : 'delivery'} is complete.`,
        buttons: geofence?.type === 'pickup_location' ? [
          { text: 'Pickup Confirmed', payload: 'pickup_confirmed' },
          { text: 'Cargo Loaded', payload: 'loaded' }
        ] : [
          { text: 'Delivered', payload: 'delivered' },
          { text: 'Issue/Delay', payload: 'report_issue' }
        ]
      };
      
    case 'route.delivery_due':
      const deliveryStop = event.data?.stop;
      return {
        type: 'template',
        header: '🚚 Delivery Due',
        body: `Your delivery is approaching:

🏭 ${deliveryStop?.location || 'Delivery location'}
📍 ${deliveryStop?.address || 'Address not specified'}
👤 Contact: ${deliveryStop?.customerName || 'Customer'}
📝 Special: ${deliveryStop?.specialInstructions || 'Standard delivery'}`,
        buttons: [
          { text: 'Delivered', payload: 'delivered' },
          { text: 'Issue/Delay', payload: 'report_issue' }
        ]
      };
      
    case 'driver.hos.warning':
      const violation = event.data?.violation;
      return {
        type: 'template',
        header: '⚠️ Hours of Service Warning',
        body: `Drive time limit approaching!

⏰ Time remaining: ${violation?.timeRemaining || 'Unknown'} minutes
🛑 Mandatory break required
📍 Next rest area: ${violation?.nextRestLocation || 'Check navigation'}

Please plan your break accordingly.`,
        buttons: [
          { text: 'Taking Break', payload: 'need_break' },
          { text: 'Continue to Delivery', payload: 'continue_delivery' }
        ]
      };
      
    default:
      return {
        type: 'text',
        body: event.data?.message || event.message || 'Transport update available'
      };
  }
}

// Process WhatsApp messages from drivers
async function processWhatsAppMessage(message: any) {
  try {
    // Identify driver from phone number
    const driverPhone = message.from;
    const driver = await identifyDriverByPhone(driverPhone);
    
    if (!driver) {
      console.log(`Unknown driver phone number: ${driverPhone}`);
      return null;
    }
    
    // Parse driver response
    const response = parseDriverResponse(message);
    
    return {
      driverId: driver.samsaraId,
      transportId: response.transportId,
      responseType: response.type,
      status: response.status,
      location: response.location,
      documents: response.documents,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Failed to process WhatsApp message:', error);
    return null;
  }
}

// Identify driver by phone number
async function identifyDriverByPhone(phoneNumber: string) {
  try {
    // Search through Samsara drivers to find matching phone
    const drivers = await samsaraService.getDrivers();
    
    for (const driver of drivers.data || []) {
      const driverWithPhone = await samsaraService.getDriverWithPhone(driver.id);
      
      if (driverWithPhone.phoneNumber === phoneNumber) {
        return {
          samsaraId: driver.id,
          name: driverWithPhone.name,
          phoneNumber: driverWithPhone.phoneNumber
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to identify driver by phone:', error);
    return null;
  }
}

// Parse driver responses from WhatsApp
function parseDriverResponse(message: any) {
  const content = message.text?.body?.toLowerCase() || '';
  const messageType = message.type;
  
  // Handle different message types
  if (messageType === 'button') {
    return {
      type: 'button_response',
      status: message.button.payload,
      transportId: extractTransportId(message)
    };
  }
  
  if (messageType === 'location') {
    return {
      type: 'location_update',
      location: {
        lat: message.location.latitude,
        lng: message.location.longitude
      },
      transportId: extractTransportId(message)
    };
  }
  
  if (messageType === 'image' || messageType === 'document') {
    return {
      type: 'document_upload',
      documents: [{
        type: 'pod',
        mediaId: message.image?.id || message.document?.id,
        filename: message.document?.filename || 'delivery_photo.jpg'
      }],
      transportId: extractTransportId(message)
    };
  }
  
  // Parse text responses
  let status = 'unknown';
  if (content.includes('arrived') || content.includes('here')) {
    status = 'arrived';
  } else if (content.includes('loaded') || content.includes('picked up')) {
    status = 'loaded';
  } else if (content.includes('delivered') || content.includes('completed')) {
    status = 'delivered';
  } else if (content.includes('problem') || content.includes('delay')) {
    status = 'issue';
  }
  
  return {
    type: 'text_response',
    status: status,
    message: content,
    transportId: extractTransportId(message)
  };
}

// Extract transport ID from message context
function extractTransportId(message: any): string | null {
  // Try to get from message context or conversation history
  return message.context?.referred_product?.product_retailer_id || null;
}

// Update Samsara based on driver response
async function updateSamsaraFromDriverResponse(response: any) {
  try {
    console.log('Updating Samsara with driver response:', response);
    
    // Update transport status in Samsara
    if (response.status && response.transportId) {
      // This would call Samsara API to update transport/route status
      console.log(`Updating transport ${response.transportId} status to ${response.status}`);
    }
    
    // Update location if provided
    if (response.location && response.driverId) {
      console.log(`Updating driver ${response.driverId} location:`, response.location);
    }
    
    // Handle document uploads
    if (response.documents && response.transportId) {
      for (const doc of response.documents) {
        console.log(`Processing document upload for transport ${response.transportId}:`, doc);
        // Download from WhatsApp and upload to Samsara
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to update Samsara from driver response:', error);
    return false;
  }
}

// Send WhatsApp message
async function sendWhatsAppMessage(message: any) {
  try {
    const whatsappToken = process.env.WHATSAPP_BUSINESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    if (!whatsappToken || !phoneNumberId) {
      throw new Error('WhatsApp Business API not configured');
    }
    
    console.log('Sending WhatsApp message:', message);
    
    // In a real implementation, this would call WhatsApp Business API
    // For now, just log the message
    console.log(`WhatsApp API call would be made to send message to ${message.to}`);
    
    return true;
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return false;
  }
}

// Start the message broker service
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`FleetChat Message Broker running on port ${PORT}`);
  console.log('Webhook endpoints:');
  console.log(`  POST /webhook/samsara   - Receive fleet events`);
  console.log(`  POST /webhook/whatsapp  - Receive driver messages`);
  console.log(`  GET  /health           - Health check`);
  
  // Log configuration status
  console.log('\nService Configuration:');
  console.log(`  Samsara: ${samsaraService.isConfigured() ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`  WhatsApp: ${process.env.WHATSAPP_BUSINESS_TOKEN ? '✓ Configured' : '✗ Not configured'}`);
});

export default app;