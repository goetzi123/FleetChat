import { 
  messageTemplates, 
  responseOptions, 
  templateVariables,
  type MessageTemplate,
  type ResponseOption,
  type TemplateVariable,
  type InsertMessageTemplate,
  type InsertResponseOption,
  type InsertTemplateVariable,
  LanguageCode,
  MessageTemplateType
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface TemplateWithResponses extends MessageTemplate {
  responses: ResponseOption[];
}

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

export class MessageTemplateService {
  
  /**
   * Get template with responses for a specific event type and language
   */
  async getTemplate(eventType: string, languageCode: string = LanguageCode.ENGLISH): Promise<TemplateWithResponses | null> {
    const [template] = await db
      .select()
      .from(messageTemplates)
      .where(
        and(
          eq(messageTemplates.eventType, eventType),
          eq(messageTemplates.languageCode, languageCode),
          eq(messageTemplates.isActive, true)
        )
      )
      .limit(1);

    if (!template) {
      // Fallback to English if requested language not found
      if (languageCode !== LanguageCode.ENGLISH) {
        return this.getTemplate(eventType, LanguageCode.ENGLISH);
      }
      return null;
    }

    const responses = await db
      .select()
      .from(responseOptions)
      .where(
        and(
          eq(responseOptions.templateId, template.id),
          eq(responseOptions.isActive, true)
        )
      )
      .orderBy(responseOptions.sortOrder);

    return {
      ...template,
      responses
    };
  }

  /**
   * Generate message from template with variable substitution
   */
  async generateMessage(eventType: string, eventData: any, languageCode: string = LanguageCode.ENGLISH): Promise<GeneratedMessage | null> {
    const template = await this.getTemplate(eventType, languageCode);
    if (!template) return null;

    // Get template variables for this event type
    const variables = await db
      .select()
      .from(templateVariables)
      .where(eq(templateVariables.eventType, eventType));

    // Substitute variables in template content
    const substitutedHeader = template.header ? this.substituteVariables(template.header, eventData, variables) : undefined;
    const substitutedBody = this.substituteVariables(template.body, eventData, variables);
    const substitutedFooter = template.footer ? this.substituteVariables(template.footer, eventData, variables) : undefined;

    // Filter responses based on display conditions
    const filteredResponses = template.responses.filter(response => 
      this.evaluateDisplayConditions(response.displayConditions, eventData)
    );

    return {
      type: template.templateType,
      header: substitutedHeader,
      body: substitutedBody,
      footer: substitutedFooter,
      buttons: filteredResponses.map(response => ({
        text: response.buttonText,
        payload: response.buttonPayload,
        type: response.buttonType
      }))
    };
  }

  /**
   * Create a new message template
   */
  async createTemplate(templateData: InsertMessageTemplate): Promise<MessageTemplate> {
    const [template] = await db
      .insert(messageTemplates)
      .values(templateData)
      .returning();
    return template;
  }

  /**
   * Add response option to a template
   */
  async addResponseOption(optionData: InsertResponseOption): Promise<ResponseOption> {
    const [option] = await db
      .insert(responseOptions)
      .values(optionData)
      .returning();
    return option;
  }

  /**
   * Add template variable definition
   */
  async addTemplateVariable(variableData: InsertTemplateVariable): Promise<TemplateVariable> {
    const [variable] = await db
      .insert(templateVariables)
      .values(variableData)
      .returning();
    return variable;
  }

  /**
   * Get all templates for a specific language
   */
  async getTemplatesByLanguage(languageCode: string): Promise<TemplateWithResponses[]> {
    const templates = await db
      .select()
      .from(messageTemplates)
      .where(
        and(
          eq(messageTemplates.languageCode, languageCode),
          eq(messageTemplates.isActive, true)
        )
      )
      .orderBy(messageTemplates.eventType, messageTemplates.priority);

    const templatesWithResponses: TemplateWithResponses[] = [];
    
    for (const template of templates) {
      const responses = await db
        .select()
        .from(responseOptions)
        .where(
          and(
            eq(responseOptions.templateId, template.id),
            eq(responseOptions.isActive, true)
          )
        )
        .orderBy(responseOptions.sortOrder);

      templatesWithResponses.push({
        ...template,
        responses
      });
    }

    return templatesWithResponses;
  }

  /**
   * Initialize default English templates
   */
  async initializeDefaultTemplates(): Promise<void> {
    const defaultTemplates = [
      {
        eventType: 'route.assigned',
        languageCode: LanguageCode.ENGLISH,
        templateType: MessageTemplateType.TEMPLATE,
        header: '🚛 New Route Assigned',
        body: `You have been assigned a new delivery route:

📍 Pickup: {{pickup_location}}
🚩 Delivery: {{delivery_location}}
⏰ Pickup window: {{pickup_time}}
📊 Route: {{route_name}}`,
        category: 'transport',
        priority: 1,
        responses: [
          { buttonText: 'Acknowledge Route', buttonPayload: 'acknowledge_route', buttonType: 'reply', sortOrder: 1 },
          { buttonText: 'View Details', buttonPayload: 'view_details', buttonType: 'reply', sortOrder: 2 }
        ],
        variables: [
          { variableName: '{{pickup_location}}', dataPath: 'data.route.stops[0].location', defaultValue: 'Unknown location' },
          { variableName: '{{delivery_location}}', dataPath: 'data.route.stops[1].location', defaultValue: 'Unknown location' },
          { variableName: '{{pickup_time}}', dataPath: 'data.route.stops[0].scheduledTime', defaultValue: 'TBD' },
          { variableName: '{{route_name}}', dataPath: 'data.route.name', defaultValue: 'Transport route' }
        ]
      },
      {
        eventType: 'vehicle.geofence.enter',
        languageCode: LanguageCode.ENGLISH,
        templateType: MessageTemplateType.TEMPLATE,
        header: '🎯 Arrival Confirmed',
        body: `You have arrived at {{geofence_name}}.

Please confirm when {{operation_type}} is complete.`,
        category: 'transport',
        priority: 1,
        responses: [
          { 
            buttonText: 'Pickup Confirmed', 
            buttonPayload: 'pickup_confirmed', 
            buttonType: 'reply', 
            sortOrder: 1,
            displayConditions: { geofenceType: 'pickup_location' }
          },
          { 
            buttonText: 'Cargo Loaded', 
            buttonPayload: 'loaded', 
            buttonType: 'reply', 
            sortOrder: 2,
            displayConditions: { geofenceType: 'pickup_location' }
          },
          { 
            buttonText: 'Delivered', 
            buttonPayload: 'delivered', 
            buttonType: 'reply', 
            sortOrder: 1,
            displayConditions: { geofenceType: 'delivery_location' }
          },
          { 
            buttonText: 'Issue/Delay', 
            buttonPayload: 'report_issue', 
            buttonType: 'reply', 
            sortOrder: 2 
          }
        ],
        variables: [
          { variableName: '{{geofence_name}}', dataPath: 'data.geofence.name', defaultValue: 'destination' },
          { variableName: '{{operation_type}}', dataPath: 'data.geofence.type', defaultValue: 'operation' }
        ]
      },
      {
        eventType: 'route.pickup_reminder',
        languageCode: LanguageCode.ENGLISH,
        templateType: MessageTemplateType.TEMPLATE,
        header: '⏰ Pickup Reminder',
        body: `Reminder: Your pickup window starts soon.

📍 {{pickup_location}}
📍 {{pickup_address}}
⏰ Window: {{time_window}}
📞 Contact: {{customer_contact}}

Please confirm your arrival time.`,
        category: 'transport',
        priority: 1,
        responses: [
          { buttonText: 'On My Way', buttonPayload: 'en_route', buttonType: 'reply', sortOrder: 1 },
          { buttonText: 'Share Location', buttonPayload: 'share_location', buttonType: 'reply', sortOrder: 2 }
        ],
        variables: [
          { variableName: '{{pickup_location}}', dataPath: 'data.stop.location', defaultValue: 'Pickup location' },
          { variableName: '{{pickup_address}}', dataPath: 'data.stop.address', defaultValue: 'Address not specified' },
          { variableName: '{{time_window}}', dataPath: 'data.stop.timeWindow', defaultValue: 'ASAP' },
          { variableName: '{{customer_contact}}', dataPath: 'data.stop.customerContact', defaultValue: 'N/A' }
        ]
      },
      {
        eventType: 'driver.hos.warning',
        languageCode: LanguageCode.ENGLISH,
        templateType: MessageTemplateType.TEMPLATE,
        header: '⚠️ Hours of Service Warning',
        body: `Drive time limit approaching!

⏰ Time remaining: {{time_remaining}} minutes
🛑 Mandatory break required
📍 Next rest area: {{next_rest_location}}

Please plan your break accordingly.`,
        category: 'safety',
        priority: 1,
        responses: [
          { buttonText: 'Taking Break', buttonPayload: 'need_break', buttonType: 'reply', sortOrder: 1 },
          { buttonText: 'Continue to Delivery', buttonPayload: 'continue_delivery', buttonType: 'reply', sortOrder: 2 }
        ],
        variables: [
          { variableName: '{{time_remaining}}', dataPath: 'data.violation.timeRemaining', defaultValue: 'Unknown' },
          { variableName: '{{next_rest_location}}', dataPath: 'data.violation.nextRestLocation', defaultValue: 'Check navigation' }
        ]
      },
      {
        eventType: 'vehicle.location',
        languageCode: LanguageCode.ENGLISH,
        templateType: MessageTemplateType.TEXT,
        body: `📍 Location update received: {{location_address}}
Speed: {{vehicle_speed}} km/h`,
        category: 'tracking',
        priority: 2,
        responses: [],
        variables: [
          { variableName: '{{location_address}}', dataPath: 'data.location.address', defaultValue: 'Current position' },
          { variableName: '{{vehicle_speed}}', dataPath: 'data.location.speed', defaultValue: '0' }
        ]
      }
    ];

    for (const templateDef of defaultTemplates) {
      // Check if template already exists
      const existingTemplate = await this.getTemplate(templateDef.eventType, templateDef.languageCode);
      if (existingTemplate) continue;

      // Create template
      const template = await this.createTemplate({
        eventType: templateDef.eventType,
        languageCode: templateDef.languageCode,
        templateType: templateDef.templateType,
        header: templateDef.header,
        body: templateDef.body,
        footer: templateDef.footer,
        category: templateDef.category,
        priority: templateDef.priority
      });

      // Add response options
      for (const responseDef of templateDef.responses) {
        await this.addResponseOption({
          templateId: template.id,
          buttonText: responseDef.buttonText,
          buttonPayload: responseDef.buttonPayload,
          buttonType: responseDef.buttonType,
          sortOrder: responseDef.sortOrder,
          displayConditions: responseDef.displayConditions
        });
      }

      // Add template variables
      for (const variableDef of templateDef.variables) {
        await this.addTemplateVariable({
          variableName: variableDef.variableName,
          eventType: templateDef.eventType,
          dataPath: variableDef.dataPath,
          defaultValue: variableDef.defaultValue
        });
      }
    }
  }

  /**
   * Substitute variables in template text
   */
  private substituteVariables(template: string, eventData: any, variables: TemplateVariable[]): string {
    let result = template;
    
    for (const variable of variables) {
      const value = this.extractValueFromPath(eventData, variable.dataPath) || variable.defaultValue || '';
      result = result.replace(new RegExp(variable.variableName.replace(/[{}]/g, '\\$&'), 'g'), value);
    }
    
    return result;
  }

  /**
   * Extract value from nested object using dot notation path
   */
  private extractValueFromPath(obj: any, path: string): any {
    try {
      return path.split('.').reduce((current, key) => {
        // Handle array indices like 'stops[0]'
        const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
        if (arrayMatch) {
          const [, arrayKey, index] = arrayMatch;
          return current?.[arrayKey]?.[parseInt(index)];
        }
        return current?.[key];
      }, obj);
    } catch {
      return undefined;
    }
  }

  /**
   * Evaluate display conditions for response options
   */
  private evaluateDisplayConditions(conditions: any, eventData: any): boolean {
    if (!conditions) return true;
    
    try {
      for (const [key, expectedValue] of Object.entries(conditions)) {
        const actualValue = this.extractValueFromPath(eventData, key);
        if (actualValue !== expectedValue) return false;
      }
      return true;
    } catch {
      return false;
    }
  }
}

export const messageTemplateService = new MessageTemplateService();