import type {
  User, InsertUser,
  Transport, InsertTransport,
  StatusUpdate, InsertStatusUpdate,
  Document, InsertDocument,
  LocationTracking, InsertLocationTracking,
  YardOperation, InsertYardOperation,
  TmsIntegration, InsertTmsIntegration
} from "../shared/schema";

export interface IStorage {
  // Users
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByPseudoId(pseudoId: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Transports
  createTransport(transport: InsertTransport): Promise<Transport>;
  getTransportById(id: string): Promise<Transport | null>;
  getTransportsByDriverId(driverId: string): Promise<Transport[]>;
  getTransportsByDispatcherId(dispatcherId: string): Promise<Transport[]>;
  updateTransport(id: string, updates: Partial<InsertTransport>): Promise<Transport>;
  getAllTransports(): Promise<Transport[]>;
  getActiveTransports(): Promise<Transport[]>;

  // Status Updates
  createStatusUpdate(statusUpdate: InsertStatusUpdate): Promise<StatusUpdate>;
  getStatusUpdatesByTransportId(transportId: string): Promise<StatusUpdate[]>;
  getLatestStatusUpdate(transportId: string): Promise<StatusUpdate | null>;

  // Documents
  createDocument(document: InsertDocument): Promise<Document>;
  getDocumentById(id: string): Promise<Document | null>;
  getDocumentsByTransportId(transportId: string): Promise<Document[]>;
  updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document>;
  getPendingDocuments(): Promise<Document[]>;

  // Location Tracking
  createLocationTracking(location: InsertLocationTracking): Promise<LocationTracking>;
  getLocationTrackingByTransportId(transportId: string): Promise<LocationTracking[]>;
  getLatestLocationByTransportId(transportId: string): Promise<LocationTracking | null>;
  getLocationTrackingByDriverId(driverId: string): Promise<LocationTracking[]>;

  // Yard Operations
  createYardOperation(yardOp: InsertYardOperation): Promise<YardOperation>;
  getYardOperationsByTransportId(transportId: string): Promise<YardOperation[]>;
  getYardOperationsByYardLocation(yardLocation: string): Promise<YardOperation[]>;
  updateYardOperation(id: string, updates: Partial<InsertYardOperation>): Promise<YardOperation>;

  // TMS Integration
  createTmsIntegration(integration: InsertTmsIntegration): Promise<TmsIntegration>;
  getTmsIntegrationsByTransportId(transportId: string): Promise<TmsIntegration[]>;
  getTmsIntegrationsByPlatform(platform: string): Promise<TmsIntegration[]>;
}

class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private transports: Map<string, Transport> = new Map();
  private statusUpdates: Map<string, StatusUpdate> = new Map();
  private documents: Map<string, Document> = new Map();
  private locationTracking: Map<string, LocationTracking> = new Map();
  private yardOperations: Map<string, YardOperation> = new Map();
  private tmsIntegrations: Map<string, TmsIntegration> = new Map();

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Users
  async createUser(user: InsertUser): Promise<User> {
    const id = this.generateId();
    const now = new Date();
    const newUser: User = {
      id,
      ...user,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async getUserByPseudoId(pseudoId: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.pseudoId === pseudoId) return user;
    }
    return null;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    
    const updatedUser: User = {
      ...user,
      ...updates,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Transports
  async createTransport(transport: InsertTransport): Promise<Transport> {
    const id = this.generateId();
    const now = new Date();
    const newTransport: Transport = {
      id,
      ...transport,
      createdAt: now,
      updatedAt: now
    };
    this.transports.set(id, newTransport);
    return newTransport;
  }

  async getTransportById(id: string): Promise<Transport | null> {
    return this.transports.get(id) || null;
  }

  async getTransportsByDriverId(driverId: string): Promise<Transport[]> {
    return Array.from(this.transports.values()).filter(t => t.driverId === driverId);
  }

  async getTransportsByDispatcherId(dispatcherId: string): Promise<Transport[]> {
    return Array.from(this.transports.values()).filter(t => t.dispatcherId === dispatcherId);
  }

  async updateTransport(id: string, updates: Partial<InsertTransport>): Promise<Transport> {
    const transport = this.transports.get(id);
    if (!transport) throw new Error('Transport not found');
    
    const updatedTransport: Transport = {
      ...transport,
      ...updates,
      updatedAt: new Date()
    };
    this.transports.set(id, updatedTransport);
    return updatedTransport;
  }

  async getAllTransports(): Promise<Transport[]> {
    return Array.from(this.transports.values());
  }

  async getActiveTransports(): Promise<Transport[]> {
    return Array.from(this.transports.values()).filter(t => t.isActive);
  }

  // Status Updates
  async createStatusUpdate(statusUpdate: InsertStatusUpdate): Promise<StatusUpdate> {
    const id = this.generateId();
    const newStatusUpdate: StatusUpdate = {
      id,
      ...statusUpdate,
      timestamp: new Date()
    };
    this.statusUpdates.set(id, newStatusUpdate);
    return newStatusUpdate;
  }

  async getStatusUpdatesByTransportId(transportId: string): Promise<StatusUpdate[]> {
    return Array.from(this.statusUpdates.values())
      .filter(su => su.transportId === transportId)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime());
  }

  async getLatestStatusUpdate(transportId: string): Promise<StatusUpdate | null> {
    const updates = await this.getStatusUpdatesByTransportId(transportId);
    return updates[0] || null;
  }

  // Documents
  async createDocument(document: InsertDocument): Promise<Document> {
    const id = this.generateId();
    const newDocument: Document = {
      id,
      ...document,
      createdAt: new Date()
    };
    this.documents.set(id, newDocument);
    return newDocument;
  }

  async getDocumentById(id: string): Promise<Document | null> {
    return this.documents.get(id) || null;
  }

  async getDocumentsByTransportId(transportId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(d => d.transportId === transportId);
  }

  async updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document> {
    const document = this.documents.get(id);
    if (!document) throw new Error('Document not found');
    
    const updatedDocument: Document = {
      ...document,
      ...updates
    };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async getPendingDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(d => !d.isApproved);
  }

  // Location Tracking
  async createLocationTracking(location: InsertLocationTracking): Promise<LocationTracking> {
    const id = this.generateId();
    const newLocation: LocationTracking = {
      id,
      ...location,
      timestamp: new Date()
    };
    this.locationTracking.set(id, newLocation);
    return newLocation;
  }

  async getLocationTrackingByTransportId(transportId: string): Promise<LocationTracking[]> {
    return Array.from(this.locationTracking.values())
      .filter(lt => lt.transportId === transportId)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime());
  }

  async getLatestLocationByTransportId(transportId: string): Promise<LocationTracking | null> {
    const locations = await this.getLocationTrackingByTransportId(transportId);
    return locations[0] || null;
  }

  async getLocationTrackingByDriverId(driverId: string): Promise<LocationTracking[]> {
    return Array.from(this.locationTracking.values())
      .filter(lt => lt.driverId === driverId)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime());
  }

  // Yard Operations
  async createYardOperation(yardOp: InsertYardOperation): Promise<YardOperation> {
    const id = this.generateId();
    const newYardOp: YardOperation = {
      id,
      ...yardOp,
      createdAt: new Date()
    };
    this.yardOperations.set(id, newYardOp);
    return newYardOp;
  }

  async getYardOperationsByTransportId(transportId: string): Promise<YardOperation[]> {
    return Array.from(this.yardOperations.values()).filter(yo => yo.transportId === transportId);
  }

  async getYardOperationsByYardLocation(yardLocation: string): Promise<YardOperation[]> {
    return Array.from(this.yardOperations.values()).filter(yo => yo.yardLocation === yardLocation);
  }

  async updateYardOperation(id: string, updates: Partial<InsertYardOperation>): Promise<YardOperation> {
    const yardOp = this.yardOperations.get(id);
    if (!yardOp) throw new Error('Yard operation not found');
    
    const updatedYardOp: YardOperation = {
      ...yardOp,
      ...updates
    };
    this.yardOperations.set(id, updatedYardOp);
    return updatedYardOp;
  }

  // TMS Integration
  async createTmsIntegration(integration: InsertTmsIntegration): Promise<TmsIntegration> {
    const id = this.generateId();
    const newIntegration: TmsIntegration = {
      id,
      ...integration,
      timestamp: new Date()
    };
    this.tmsIntegrations.set(id, newIntegration);
    return newIntegration;
  }

  async getTmsIntegrationsByTransportId(transportId: string): Promise<TmsIntegration[]> {
    return Array.from(this.tmsIntegrations.values()).filter(ti => ti.transportId === transportId);
  }

  async getTmsIntegrationsByPlatform(platform: string): Promise<TmsIntegration[]> {
    return Array.from(this.tmsIntegrations.values()).filter(ti => ti.platform === platform);
  }
}

export const storage = new MemStorage();