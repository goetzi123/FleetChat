/**
 * FleetChat Compliance Middleware
 * Automatic enforcement of Universal Fleet System Boundaries
 * Intercepts and validates all operations to ensure compliance
 */

import { Request, Response, NextFunction } from 'express';
import { ComplianceGuardian, ComplianceResult } from './compliance-guardian';

/**
 * Express middleware for automatic compliance enforcement
 */
export function complianceMiddleware(req: Request, res: Response, next: NextFunction) {
  const path = req.path;
  const method = req.method;
  
  // Check for prohibited API endpoints
  const prohibitedPatterns = [
    /\/api\/vehicles?/i, /\/api\/trucks?/i, /\/api\/assets?/i,
    /\/api\/routes?/i, /\/api\/trips?/i, /\/api\/transports?/i,
    /\/api\/fleet/i, /\/api\/analytics/i, /\/api\/reports?/i,
    /\/api\/tracking/i, /\/api\/monitoring/i, /\/api\/compliance/i,
    /\/api\/drivers?\/(?!phone|mapping)/i // Block driver endpoints except phone/mapping
  ];

  const isProhibited = prohibitedPatterns.some(pattern => pattern.test(path));
  
  if (isProhibited) {
    return res.status(403).json({
      error: 'Endpoint violates Universal Fleet System Boundaries',
      message: 'FleetChat operates as communication protocol service only',
      allowedEndpoints: [
        '/api/webhook/{platform}/{tenantId}',
        '/api/webhook/whatsapp/{tenantId}',
        '/api/driver-mappings/{tenantId}',
        '/api/communication-logs/{tenantId}'
      ],
      compliance: 'https://docs.fleetchat.com/boundaries'
    });
  }

  // Allow permitted communication protocol endpoints
  const permittedPatterns = [
    /\/api\/webhook/i, /\/api\/driver.*mapping/i, /\/api\/phone.*mapping/i,
    /\/api\/communication.*log/i, /\/api\/message.*template/i,
    /\/api\/tenant/i, /\/api\/billing/i, /\/api\/auth/i,
    /\/health/i, /\/compliance/i, /\/demo/i
  ];

  const isPermitted = permittedPatterns.some(pattern => pattern.test(path));
  
  if (!isPermitted && !path.startsWith('/public') && !path.startsWith('/fleet')) {
    console.warn(`⚠️  Unusual endpoint accessed: ${method} ${path}`);
  }

  next();
}

/**
 * Database operation compliance guard
 */
export function guardDatabaseOperation(tableName: string, operation: 'read' | 'write' | 'create' | 'delete') {
  const prohibitedTables = [
    'vehicles', 'trucks', 'assets', 'routes', 'trips', 'transports',
    'locations', 'tracking', 'documents', 'analytics', 'reports',
    'fleet_operations', 'driver_profiles', 'performance', 'compliance'
  ];

  const isProhibited = prohibitedTables.some(table => 
    tableName.toLowerCase().includes(table)
  );

  if (isProhibited) {
    throw new Error(
      `Database operation blocked: ${operation} on ${tableName} violates Universal Fleet System Boundaries. ` +
      `Use compliant tables: driverPhoneMappings, tenants, communicationLogs only.`
    );
  }

  // Log permitted operations for audit trail
  if (['driverPhoneMappings', 'tenants', 'communicationLogs'].some(table => 
    tableName.toLowerCase().includes(table.toLowerCase())
  )) {
    console.log(`✅ Compliant database operation: ${operation} on ${tableName}`);
  }
}

/**
 * Service function compliance wrapper
 */
export function complianceGuard<T>(
  operation: () => T,
  context: {
    functionName: string;
    description: string;
  }
): T {
  const prohibitedKeywords = [
    'route', 'vehicle', 'fleet', 'tracking', 'analytics', 
    'performance', 'compliance', 'optimization'
  ];

  const containsProhibited = prohibitedKeywords.some(keyword =>
    context.functionName.toLowerCase().includes(keyword) ||
    context.description.toLowerCase().includes(keyword)
  );

  if (containsProhibited) {
    console.warn(
      `⚠️  Function may violate boundaries: ${context.functionName} - ${context.description}`
    );
    console.info('💡 Ensure function serves communication protocol only');
  }

  return operation();
}

/**
 * Auto-redirect to compliant alternatives
 */
export class ComplianceRedirect {
  private static redirections = new Map([
    ['vehicles', 'driver-phone-mappings'],
    ['routes', 'message-templates'],
    ['fleet-operations', 'communication-logs'],
    ['analytics', 'delivery-status'],
    ['tracking', 'location-sharing-relay'],
    ['documents', 'document-relay-service']
  ]);

  static getCompliantEndpoint(requestedEndpoint: string): string {
    for (const [prohibited, compliant] of this.redirections.entries()) {
      if (requestedEndpoint.includes(prohibited)) {
        return requestedEndpoint.replace(prohibited, compliant);
      }
    }
    return '/api/webhook/message-relay'; // Default to message relay
  }

  static suggestCompliantImplementation(violatedConcept: string): string {
    const suggestions: Record<string, string> = {
      'vehicle-tracking': 'Implement location sharing relay: Driver shares location via WhatsApp → FleetChat forwards to fleet system',
      'route-management': 'Implement route assignment relay: Fleet system sends route → FleetChat templates → WhatsApp notification',
      'document-storage': 'Implement document relay: Driver sends document via WhatsApp → FleetChat forwards to fleet system storage',
      'driver-profiles': 'Use driver phone mapping only: Store fleet system driver ID ↔ WhatsApp number mapping',
      'fleet-analytics': 'Implement communication logs only: Track message delivery status, not fleet operations',
      'compliance-monitoring': 'Relay compliance events only: Fleet system compliance alerts → WhatsApp notifications'
    };

    return suggestions[violatedConcept] || 
           'Implement as bidirectional message relay: Fleet system event → WhatsApp message ↔ Driver response → Fleet system update';
  }
}

/**
 * Development-time compliance checker
 */
export function validateDevelopmentChange(change: {
  type: 'schema' | 'route' | 'service' | 'component';
  filePath: string;
  content: string;
  description?: string;
}) {
  console.log(`🔍 Validating ${change.type} change: ${change.filePath}`);
  
  const result = ComplianceGuardian.validateCodeChange(change.filePath, change.content);
  
  if (!result.isCompliant) {
    console.error('❌ Universal Fleet System Boundaries violation detected:');
    result.violations.forEach(violation => console.error(`   • ${violation}`));
    console.info(`💡 Recommendation: ${result.recommendation}`);
    
    // Suggest compliant alternatives
    if (change.description) {
      const suggestion = ComplianceRedirect.suggestCompliantImplementation(
        change.description.toLowerCase().replace(/\s+/g, '-')
      );
      console.info(`🔄 Compliant alternative: ${suggestion}`);
    }
    
    return false;
  }
  
  console.log('✅ Change complies with Universal Fleet System Boundaries');
  return true;
}

/**
 * Runtime compliance monitor
 */
export class ComplianceMonitor {
  private static violations: Array<{
    timestamp: Date;
    type: string;
    description: string;
    resolved: boolean;
  }> = [];

  static recordViolation(type: string, description: string) {
    this.violations.push({
      timestamp: new Date(),
      type,
      description,
      resolved: false
    });
    
    console.warn(`⚠️  Compliance violation recorded: ${type} - ${description}`);
  }

  static resolveViolation(index: number) {
    if (this.violations[index]) {
      this.violations[index].resolved = true;
      console.info(`✅ Compliance violation resolved: ${this.violations[index].description}`);
    }
  }

  static getViolationReport() {
    return {
      total: this.violations.length,
      unresolved: this.violations.filter(v => !v.resolved).length,
      violations: this.violations
    };
  }

  static getComplianceStatus() {
    const unresolved = this.violations.filter(v => !v.resolved).length;
    return {
      status: unresolved === 0 ? 'COMPLIANT' : 'VIOLATIONS_DETECTED',
      unresolvedViolations: unresolved,
      lastCheck: new Date(),
      boundaries: 'Universal Fleet System Boundaries v1.0'
    };
  }
}