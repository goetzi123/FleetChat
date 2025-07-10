import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { webhookRateLimit } from '../middleware/rate-limit.middleware';
import { createSuccessResponse } from '../shared/errors';
import { createSamsaraIntegration } from '../integrations/samsara.integration';
import { createWhatsAppIntegration } from '../integrations/whatsapp.integration';
import { logger } from '../shared/logger';

const router = Router();

// Apply webhook-specific rate limiting
router.use(webhookRateLimit);

// Samsara webhook endpoint
router.post('/samsara',
  asyncHandler(async (req, res) => {
    const { body, headers } = req;
    
    req.logger.info('Samsara webhook received', {
      eventType: body.eventType,
      timestamp: body.timestamp,
      dataKeys: Object.keys(body.data || {}),
    });

    // TODO: Implement webhook signature verification
    // const signature = headers['x-samsara-signature'];
    // if (!samsaraIntegration.validateWebhookSignature(JSON.stringify(body), signature, webhookSecret)) {
    //   return res.status(401).json({ error: 'Invalid webhook signature' });
    // }

    try {
      // Process the Samsara event
      // This would typically:
      // 1. Validate the event
      // 2. Extract relevant data
      // 3. Find associated tenant and driver
      // 4. Generate WhatsApp message using template system
      // 5. Send message via WhatsApp integration
      
      const eventType = body.eventType;
      const driverId = body.data?.driver?.id;
      const vehicleId = body.data?.vehicle?.id;

      req.logger.info('Processing Samsara event', {
        eventType,
        driverId,
        vehicleId,
      });

      // Simulate event processing
      const processedEvent = {
        eventType,
        driverId,
        vehicleId,
        processed: true,
        timestamp: new Date().toISOString(),
      };

      const response = createSuccessResponse({
        status: 'processed',
        event: processedEvent,
        messagesSent: driverId ? 1 : 0,
      });

      res.json(response);
    } catch (error) {
      req.logger.error('Failed to process Samsara webhook', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  })
);

// WhatsApp webhook endpoint
router.post('/whatsapp',
  asyncHandler(async (req, res) => {
    const { body } = req;

    req.logger.info('WhatsApp webhook received', {
      entries: body.entry?.length || 0,
      object: body.object,
    });

    try {
      // Process WhatsApp webhook
      // This would typically:
      // 1. Extract messages from webhook payload
      // 2. Identify sender and associated tenant/transport
      // 3. Process driver responses (button clicks, text, location, documents)
      // 4. Update transport status in database
      // 5. Send confirmation back to driver
      // 6. Update Samsara with status changes

      const messages = [];
      
      if (body.entry && Array.isArray(body.entry)) {
        for (const entry of body.entry) {
          if (entry.changes && Array.isArray(entry.changes)) {
            for (const change of entry.changes) {
              if (change.field === 'messages' && change.value?.messages) {
                messages.push(...change.value.messages);
              }
            }
          }
        }
      }

      req.logger.info('Processing WhatsApp messages', {
        messageCount: messages.length,
        messageTypes: messages.map(m => m.type),
      });

      // Simulate message processing
      const processedMessages = messages.map(message => ({
        messageId: message.id,
        from: message.from,
        type: message.type,
        processed: true,
        timestamp: new Date().toISOString(),
      }));

      const response = createSuccessResponse({
        status: 'processed',
        messages: processedMessages,
        updatesPerformed: messages.length,
      });

      res.json(response);
    } catch (error) {
      req.logger.error('Failed to process WhatsApp webhook', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  })
);

// WhatsApp webhook verification (for initial setup)
router.get('/whatsapp',
  asyncHandler(async (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    req.logger.info('WhatsApp webhook verification request', {
      mode,
      token: token ? '***PROVIDED***' : 'MISSING',
      challenge: challenge ? '***PROVIDED***' : 'MISSING',
    });

    // TODO: Implement proper webhook verification
    // const whatsappIntegration = createWhatsAppIntegration(config);
    // const verificationResult = whatsappIntegration.verifyWebhook(mode, token, challenge);
    
    // For now, return the challenge for development
    if (mode === 'subscribe' && challenge) {
      req.logger.info('WhatsApp webhook verification successful');
      res.send(challenge);
    } else {
      req.logger.warn('WhatsApp webhook verification failed');
      res.status(403).send('Verification failed');
    }
  })
);

// Health check for webhook endpoints
router.get('/health',
  asyncHandler(async (req, res) => {
    const response = createSuccessResponse({
      status: 'healthy',
      endpoints: {
        samsara: '/webhook/samsara',
        whatsapp: '/webhook/whatsapp',
      },
      timestamp: new Date().toISOString(),
    });

    res.json(response);
  })
);

export { router as webhookRoutes };