import { z } from "zod";

// Transport Status Enum
export const TransportStatus = {
  PENDING: "pending",
  DISPATCHED: "dispatched", 
  EN_ROUTE: "en_route",
  ARRIVED_PICKUP: "arrived_pickup",
  LOADING: "loading",
  LOADED: "loaded",
  DEPARTED_PICKUP: "departed_pickup",
  ARRIVED_DELIVERY: "arrived_delivery",
  UNLOADING: "unloading",
  DELIVERED: "delivered",
  COMPLETED: "completed",
  CANCELLED: "cancelled"
} as const;

// Document Types
export const DocumentType = {
  POD: "pod",
  LOAD_SLIP: "load_slip",
  DELIVERY_NOTE: "delivery_note",
  INVOICE: "invoice",
  SIGNATURE: "signature",
  PHOTO: "photo"
} as const;

// Workflow Types
export const WorkflowType = {
  FTL: "ftl", // Full Truck Load
  LTL: "ltl", // Less Than Truck Load
  YARD: "yard"
} as const;

// User Roles
export const UserRole = {
  DRIVER: "driver",
  DISPATCHER: "dispatcher",
  YARD_OPERATOR: "yard_operator",
  MANAGER: "manager"
} as const;

// Base types for in-memory storage
export interface User {
  id: string;
  email?: string;
  name: string;
  phone?: string;
  role: string;
  language?: string;
  isAnonymous?: boolean;
  pseudoId?: string; // For driver anonymity
  createdAt: Date;
  updatedAt: Date;
}

export interface Transport {
  id: string;
  externalId?: string; // TMS reference
  driverId?: string;
  dispatcherId?: string;
  status: string;
  workflowType: string;
  
  // Pickup details
  pickupLocation: string;
  pickupAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  pickupEta?: Date;
  pickupActual?: Date;
  
  // Delivery details
  deliveryLocation: string;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryEta?: Date;
  deliveryActual?: Date;
  
  // Load details
  loadReference?: string;
  loadDescription?: string;
  loadWeight?: number;
  loadValue?: number;
  
  // Metadata
  instructions?: string;
  priority?: number;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StatusUpdate {
  id: string;
  transportId: string;
  status: string;
  location?: string;
  lat?: number;
  lng?: number;
  notes?: string;
  timestamp: Date;
  createdBy?: string;
}

export interface Document {
  id: string;
  transportId: string;
  type: string;
  filename: string;
  originalName?: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  isApproved?: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
  metadata?: string; // JSON string for additional data
  uploadedBy?: string;
  createdAt: Date;
}

export interface LocationTracking {
  id: string;
  transportId: string;
  driverId: string;
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  isGeofenced?: boolean;
  geofenceType?: string; // pickup, delivery, yard
  timestamp: Date;
}

export interface YardOperation {
  id: string;
  transportId: string;
  yardLocation: string;
  operationType: string; // check_in, call_off, check_out
  operatorId?: string;
  driverId?: string;
  instructions?: string;
  qrCode?: string;
  completedAt?: Date;
  createdAt: Date;
}

export interface TmsIntegration {
  id: string;
  transportId: string;
  platform: string; // uber_freight, etc
  operation: string; // create, update, status_update
  payload?: string; // JSON string
  response?: string; // JSON string
  success?: boolean;
  errorMessage?: string;
  timestamp: Date;
}

// Insert types (without auto-generated fields)
export type InsertUser = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertTransport = Omit<Transport, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertStatusUpdate = Omit<StatusUpdate, 'id' | 'timestamp'>;
export type InsertDocument = Omit<Document, 'id' | 'createdAt'>;
export type InsertLocationTracking = Omit<LocationTracking, 'id' | 'timestamp'>;
export type InsertYardOperation = Omit<YardOperation, 'id' | 'createdAt'>;
export type InsertTmsIntegration = Omit<TmsIntegration, 'id' | 'timestamp'>;

// Validation schemas
export const createUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum([UserRole.DRIVER, UserRole.DISPATCHER, UserRole.YARD_OPERATOR, UserRole.MANAGER]),
  language: z.string().default("en"),
  isAnonymous: z.boolean().default(false),
  pseudoId: z.string().optional()
});

export const createTransportSchema = z.object({
  externalId: z.string().optional(),
  driverId: z.string().optional(),
  dispatcherId: z.string().optional(),
  status: z.string().default(TransportStatus.PENDING),
  workflowType: z.enum([WorkflowType.FTL, WorkflowType.LTL, WorkflowType.YARD]).default(WorkflowType.FTL),
  pickupLocation: z.string().min(1),
  pickupAddress: z.string().optional(),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  pickupEta: z.string().datetime().optional(),
  deliveryLocation: z.string().min(1),
  deliveryAddress: z.string().optional(),
  deliveryLat: z.number().optional(),
  deliveryLng: z.number().optional(),
  deliveryEta: z.string().datetime().optional(),
  loadReference: z.string().optional(),
  loadDescription: z.string().optional(),
  loadWeight: z.number().optional(),
  loadValue: z.number().optional(),
  instructions: z.string().optional(),
  priority: z.number().default(0),
  isActive: z.boolean().default(true)
});

export const transportStatusUpdateSchema = z.object({
  status: z.enum([
    TransportStatus.PENDING,
    TransportStatus.DISPATCHED,
    TransportStatus.EN_ROUTE,
    TransportStatus.ARRIVED_PICKUP,
    TransportStatus.LOADING,
    TransportStatus.LOADED,
    TransportStatus.DEPARTED_PICKUP,
    TransportStatus.ARRIVED_DELIVERY,
    TransportStatus.UNLOADING,
    TransportStatus.DELIVERED,
    TransportStatus.COMPLETED,
    TransportStatus.CANCELLED
  ] as const),
  location: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  notes: z.string().optional()
});

export const locationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional()
});

export const documentUploadSchema = z.object({
  type: z.enum([
    DocumentType.POD,
    DocumentType.LOAD_SLIP,
    DocumentType.DELIVERY_NOTE,
    DocumentType.INVOICE,
    DocumentType.SIGNATURE,
    DocumentType.PHOTO
  ] as const),
  filename: z.string(),
  originalName: z.string().optional(),
  fileUrl: z.string().url(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.string().optional()
});

export const yardOperationSchema = z.object({
  transportId: z.string(),
  yardLocation: z.string().min(1),
  operationType: z.enum(["check_in", "call_off", "check_out"]),
  operatorId: z.string().optional(),
  driverId: z.string().optional(),
  instructions: z.string().optional(),
  qrCode: z.string().optional()
});