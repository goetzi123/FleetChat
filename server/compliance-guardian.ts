/**
 * FleetChat Compliance Guardian
 * Automated system to ensure Universal Fleet System Boundaries compliance
 * during development without requiring explicit boundary mentions
 */

export class ComplianceGuardian {
  
  // Prohibited database table patterns
  private static PROHIBITED_TABLES = [
    /vehicles?/i, /trucks?/i, /assets?/i,
    /routes?/i, /trips?/i, /transports?/i, /shipments?/i,
    /locations?/i, /tracking/i, /gps/i, /telematics/i,
    /documents?(?!.*template)/i, // Allow message templates, prohibit document storage
    /analytics/i, /reports?/i, /dashboards?/i,
    /compliance/i, /safety/i, /violations?/i,
    /fleet_ops/i, /operations?/i, /maintenance/i,
    /driver_profiles?/i, /performance/i, /behaviors?/i
  ];

  // Prohibited API endpoint patterns  
  private static PROHIBITED_ENDPOINTS = [
    /\/vehicles?/i, /\/trucks?/i, /\/assets?/i,
    /\/routes?/i, /\/trips?/i, /\/transports?/i,
    /\/locations?/i, /\/tracking/i, /\/gps/i,
    /\/documents?\/(?!templates?)/i, // Allow template endpoints only
    /\/analytics/i, /\/reports?/i, /\/dashboard/i,
    /\/fleet/i, /\/operations?/i, /\/maintenance/i,
    /\/drivers?\/(?!phone|mapping)/i // Only allow driver phone/mapping endpoints
  ];

  // Prohibited function/service patterns
  private static PROHIBITED_FUNCTIONS = [
    /create.*route/i, /update.*route/i, /optimize.*route/i,
    /track.*vehicle/i, /monitor.*fleet/i, /analyze.*performance/i,
    /manage.*driver/i, /assign.*vehicle/i, /schedule.*maintenance/i,
    /calculate.*eta/i, /predict.*arrival/i, /generate.*report/i,
    /store.*document/i, /process.*telematics/i, /validate.*compliance/i
  ];

  // Permitted operations (communication protocol only)
  private static PERMITTED_OPERATIONS = [
    /message.*relay/i, /webhook.*handler/i, /template.*engine/i,
    /driver.*phone/i, /phone.*mapping/i, /whatsapp.*integration/i,
    /communication.*log/i, /delivery.*status/i, /tenant.*management/i,
    /api.*token/i, /credential.*storage/i, /billing.*integration/i
  ];

  /**
   * Validates database schema changes for compliance
   */
  static validateDatabaseSchema(schemaContent: string): ComplianceResult {
    const violations: string[] = [];
    
    // Check for prohibited table names
    this.PROHIBITED_TABLES.forEach(pattern => {
      const matches = schemaContent.match(new RegExp(`export const (\\w*${pattern.source}\\w*)`, 'gi'));
      if (matches) {
        matches.forEach(match => {
          violations.push(`Prohibited table: ${match} - violates Universal Fleet System Boundaries`);
        });
      }
    });

    // Check for permitted operations only
    const tableDefinitions = schemaContent.match(/export const (\w+) = pgTable/gi) || [];
    tableDefinitions.forEach(tableDef => {
      const tableName = tableDef.match(/export const (\w+)/)?.[1];
      if (tableName && !this.isPermittedTable(tableName)) {
        violations.push(`Potentially non-compliant table: ${tableName} - verify it serves communication protocol only`);
      }
    });

    return {
      isCompliant: violations.length === 0,
      violations,
      recommendation: violations.length > 0 
        ? "Remove prohibited tables and limit to driver phone mappings, tenant credentials, and communication logs only"
        : "Schema compliant with Universal Fleet System Boundaries"
    };
  }

  /**
   * Validates API routes for compliance
   */
  static validateAPIRoutes(routeContent: string): ComplianceResult {
    const violations: string[] = [];
    
    // Check for prohibited endpoint patterns
    this.PROHIBITED_ENDPOINTS.forEach(pattern => {
      const matches = routeContent.match(new RegExp(`["']/api${pattern.source}`, 'gi'));
      if (matches) {
        matches.forEach(match => {
          violations.push(`Prohibited API endpoint: ${match} - violates Universal Fleet System Boundaries`);
        });
      }
    });

    // Check for CRUD operations on prohibited resources
    const crudPatterns = [/\.post\(.*\/vehicles/i, /\.get\(.*\/routes/i, /\.put\(.*\/fleet/i];
    crudPatterns.forEach(pattern => {
      if (pattern.test(routeContent)) {
        violations.push(`Prohibited CRUD operation detected - violates communication protocol boundaries`);
      }
    });

    return {
      isCompliant: violations.length === 0,
      violations,
      recommendation: violations.length > 0 
        ? "Limit API endpoints to webhook handlers (/api/webhook/*) and driver phone mapping only"
        : "API routes compliant with Universal Fleet System Boundaries"
    };
  }

  /**
   * Validates service functions for compliance
   */
  static validateServiceFunctions(serviceContent: string): ComplianceResult {
    const violations: string[] = [];
    
    // Check for prohibited function patterns
    this.PROHIBITED_FUNCTIONS.forEach(pattern => {
      const matches = serviceContent.match(new RegExp(`(?:function|async|const)\\s+(\\w*${pattern.source}\\w*)`, 'gi'));
      if (matches) {
        matches.forEach(match => {
          violations.push(`Prohibited function: ${match} - violates Universal Fleet System Boundaries`);
        });
      }
    });

    // Verify permitted operations are present
    const hasPermittedOps = this.PERMITTED_OPERATIONS.some(pattern => pattern.test(serviceContent));
    if (!hasPermittedOps && serviceContent.length > 100) {
      violations.push("Service may not contain communication protocol operations - verify compliance");
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      recommendation: violations.length > 0 
        ? "Limit services to message relay, template processing, and phone number mapping only"
        : "Service functions compliant with Universal Fleet System Boundaries"
    };
  }

  /**
   * Comprehensive compliance check for any code change
   */
  static validateCodeChange(filePath: string, content: string): ComplianceResult {
    const allViolations: string[] = [];
    
    // Schema validation
    if (filePath.includes('schema')) {
      const schemaResult = this.validateDatabaseSchema(content);
      allViolations.push(...schemaResult.violations);
    }

    // Route validation
    if (filePath.includes('route')) {
      const routeResult = this.validateAPIRoutes(content);
      allViolations.push(...routeResult.violations);
    }

    // Service validation  
    if (filePath.includes('service') || filePath.includes('storage')) {
      const serviceResult = this.validateServiceFunctions(content);
      allViolations.push(...serviceResult.violations);
    }

    // General compliance keywords
    const prohibitedKeywords = [
      'createRoute', 'trackVehicle', 'manageFleet', 'analyzePerformance',
      'storeDocument', 'generateReport', 'optimizeRoute', 'monitorCompliance'
    ];
    
    prohibitedKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        allViolations.push(`Prohibited functionality keyword: ${keyword} - violates communication protocol boundaries`);
      }
    });

    return {
      isCompliant: allViolations.length === 0,
      violations: allViolations,
      recommendation: allViolations.length > 0 
        ? "Refactor to communication protocol service only - message relay, driver phone mapping, template processing"
        : "Code compliant with Universal Fleet System Boundaries"
    };
  }

  /**
   * Auto-redirect to compliant implementations
   */
  static getCompliantAlternative(violationType: string): string {
    const alternatives: Record<string, string> = {
      'vehicle_tracking': 'Use fleet system APIs for tracking data - relay status updates only',
      'route_creation': 'Use fleet system route APIs - relay route assignments to drivers only', 
      'document_storage': 'Forward documents to fleet system storage - relay document requests only',
      'driver_management': 'Use fleet system driver APIs - maintain phone number mapping only',
      'analytics': 'Use fleet system reporting - track communication delivery status only',
      'fleet_operations': 'Use fleet system operations - relay operational messages only'
    };
    
    return alternatives[violationType] || 'Implement as message relay service only';
  }

  /**
   * Generate compliant code template
   */
  static generateCompliantTemplate(requestedFeature: string): string {
    return `
/**
 * COMPLIANT IMPLEMENTATION: ${requestedFeature}
 * Adheres to Universal Fleet System Boundaries
 * Communication protocol service only
 */

// ✅ PERMITTED: Message relay to fleet system
async function relay${requestedFeature}ToFleetSystem(driverResponse: any) {
  // Process driver WhatsApp response
  // Update fleet system via API
  // Log communication delivery status
}

// ✅ PERMITTED: Message relay from fleet system  
async function relay${requestedFeature}ToDriver(fleetEvent: any) {
  // Process fleet system event
  // Apply message template
  // Send WhatsApp message to driver
}

// ❌ PROHIBITED: Do not implement fleet management logic
// ❌ PROHIBITED: Do not store fleet operational data
// ❌ PROHIBITED: Do not duplicate fleet system functionality
`;
  }

  private static isPermittedTable(tableName: string): boolean {
    const permittedTables = [
      /driver.*phone.*mapping/i, /phone.*mapping/i,
      /tenant/i, /credential/i, /api.*token/i,
      /communication.*log/i, /message.*log/i, /delivery.*status/i,
      /template/i, /pricing/i, /billing/i, /admin/i,
      /session/i, /user/i // Auth tables
    ];
    
    return permittedTables.some(pattern => pattern.test(tableName));
  }
}

export interface ComplianceResult {
  isCompliant: boolean;
  violations: string[];
  recommendation: string;
}

/**
 * Auto-compliance wrapper for schema operations
 */
export function withComplianceGuard<T>(
  operation: () => T,
  context: { filePath: string; content?: string }
): T {
  // Validate before operation
  if (context.content) {
    const result = ComplianceGuardian.validateCodeChange(context.filePath, context.content);
    if (!result.isCompliant) {
      console.warn('⚠️  Compliance violations detected:', result.violations);
      console.info('💡 Recommendation:', result.recommendation);
    }
  }
  
  return operation();
}

/**
 * Pre-commit hook for compliance validation
 */
export function validateCompliance(changedFiles: Array<{path: string; content: string}>): boolean {
  let overallCompliant = true;
  
  changedFiles.forEach(file => {
    const result = ComplianceGuardian.validateCodeChange(file.path, file.content);
    if (!result.isCompliant) {
      console.error(`❌ Compliance violations in ${file.path}:`, result.violations);
      console.info(`💡 ${result.recommendation}`);
      overallCompliant = false;
    }
  });
  
  return overallCompliant;
}