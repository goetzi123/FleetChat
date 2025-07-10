import { z } from 'zod';
import { 
  TransportStatus, 
  DocumentType, 
  WorkflowType, 
  UserRole, 
  LanguageCode,
  MessageTemplateType 
} from './schema';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
    requestId?: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Request/Response Schemas
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const tenantCreateSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactEmail: z.string().email('Valid email is required'),
  serviceTier: z.enum(['basic', 'professional', 'enterprise']).default('professional'),
  samsaraApiToken: z.string().min(1, 'Samsara API token is required'),
  samsaraGroupId: z.string().optional(),
  billingEmail: z.string().email('Valid billing email is required'),
  autoPayment: z.boolean().default(true),
});

export const userCreateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole),
  isAnonymous: z.boolean().default(false),
  pseudoId: z.string().optional(),
  whatsappNumber: z.string().optional(),
});

export const transportCreateSchema = z.object({
  externalId: z.string().optional(),
  driverId: z.string().optional(),
  dispatcherId: z.string().optional(),
  status: z.nativeEnum(TransportStatus).default(TransportStatus.PENDING),
  workflowType: z.nativeEnum(WorkflowType).default(WorkflowType.FTL),
  
  // Pickup details
  pickupLocation: z.string().min(1, 'Pickup location is required'),
  pickupAddress: z.string().optional(),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  pickupEta: z.string().datetime().optional(),
  
  // Delivery details
  deliveryLocation: z.string().min(1, 'Delivery location is required'),
  deliveryAddress: z.string().optional(),
  deliveryLat: z.number().optional(),
  deliveryLng: z.number().optional(),
  deliveryEta: z.string().datetime().optional(),
  
  // Load details
  loadReference: z.string().optional(),
  loadDescription: z.string().optional(),
  loadWeight: z.number().optional(),
  loadValue: z.number().optional(),
  
  // Metadata
  instructions: z.string().optional(),
  priority: z.number().default(0),
});

export const messageTemplateCreateSchema = z.object({
  eventType: z.string().min(1, 'Event type is required'),
  languageCode: z.nativeEnum(LanguageCode).default(LanguageCode.ENGLISH),
  templateType: z.nativeEnum(MessageTemplateType),
  header: z.string().optional(),
  body: z.string().min(1, 'Message body is required'),
  footer: z.string().optional(),
  category: z.string().optional(),
  priority: z.number().min(1).max(5).default(1),
});

export const responseOptionCreateSchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
  buttonText: z.string().min(1, 'Button text is required'),
  buttonPayload: z.string().min(1, 'Button payload is required'),
  buttonType: z.enum(['reply', 'call', 'url']).default('reply'),
  sortOrder: z.number().default(1),
  displayConditions: z.record(z.any()).optional(),
});

// Samsara API Types
export interface SamsaraEvent {
  eventType: string;
  timestamp: string;
  data: {
    vehicle?: {
      id: string;
      name: string;
      vin?: string;
    };
    driver?: {
      id: string;
      name: string;
      username?: string;
    };
    route?: {
      id: string;
      name: string;
      stops: Array<{
        type: 'pickup' | 'delivery';
        location: string;
        address?: string;
        scheduledTime?: string;
        actualTime?: string;
      }>;
    };
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
      speed?: number;
    };
    geofence?: {
      id: string;
      name: string;
      type: string;
    };
    violation?: {
      type: string;
      timeRemaining?: number;
      nextRestLocation?: string;
    };
  };
}

// WhatsApp API Types
export interface WhatsAppMessage {
  from: string;
  to?: string;
  type: string;
  text?: {
    body: string;
  };
  button?: {
    text: string;
    payload: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  document?: {
    id: string;
    mime_type: string;
    filename?: string;
  };
  image?: {
    id: string;
    mime_type: string;
  };
  timestamp: string;
}

export interface WhatsAppOutboundMessage {
  to: string;
  type: 'text' | 'template' | 'interactive';
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: string;
      parameters?: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
  interactive?: {
    type: 'button' | 'list';
    header?: {
      type: string;
      text: string;
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      buttons?: Array<{
        type: 'reply';
        reply: {
          id: string;
          title: string;
        };
      }>;
    };
  };
}

// Generated Message Types
export interface GeneratedMessage {
  type: string;
  header?: string;
  body: string;
  footer?: string;
  buttons?: Array<{
    text: string;
    payload: string;
    type: string;
  }>;
}

// Service Response Types
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Utility Types
export type PaginatedRequest = z.infer<typeof paginationSchema>;
export type TenantCreateRequest = z.infer<typeof tenantCreateSchema>;
export type UserCreateRequest = z.infer<typeof userCreateSchema>;
export type TransportCreateRequest = z.infer<typeof transportCreateSchema>;
export type MessageTemplateCreateRequest = z.infer<typeof messageTemplateCreateSchema>;
export type ResponseOptionCreateRequest = z.infer<typeof responseOptionCreateSchema>;