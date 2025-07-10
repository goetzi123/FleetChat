/**
 * Initialize database-based message templates for FleetChat
 * This script sets up the default English templates and tests the system
 */

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Language codes
const LanguageCode = {
  ENGLISH: "ENG",
  SPANISH: "SPA", 
  FRENCH: "FRA",
  GERMAN: "GER",
  PORTUGUESE: "POR"
};

// Template types
const MessageTemplateType = {
  TEXT: "text",
  TEMPLATE: "template", 
  INTERACTIVE: "interactive"
};

// Default English templates
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
      { variableName: '{{pickup_location}}', dataPath: 'data.route.stops.0.location', defaultValue: 'Unknown location' },
      { variableName: '{{delivery_location}}', dataPath: 'data.route.stops.1.location', defaultValue: 'Unknown location' },
      { variableName: '{{pickup_time}}', dataPath: 'data.route.stops.0.scheduledTime', defaultValue: 'TBD' },
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
        displayConditions: { 'data.geofence.type': 'pickup_location' }
      },
      { 
        buttonText: 'Cargo Loaded', 
        buttonPayload: 'loaded', 
        buttonType: 'reply', 
        sortOrder: 2,
        displayConditions: { 'data.geofence.type': 'pickup_location' }
      },
      { 
        buttonText: 'Delivered', 
        buttonPayload: 'delivered', 
        buttonType: 'reply', 
        sortOrder: 1,
        displayConditions: { 'data.geofence.type': 'delivery_location' }
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

async function initializeTemplates() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Initializing FleetChat message templates...');
    
    for (const templateDef of defaultTemplates) {
      // Check if template already exists
      const existingTemplate = await client.query(
        'SELECT id FROM message_templates WHERE event_type = $1 AND language_code = $2',
        [templateDef.eventType, templateDef.languageCode]
      );
      
      if (existingTemplate.rows.length > 0) {
        console.log(`⏭️  Template already exists: ${templateDef.eventType} (${templateDef.languageCode})`);
        continue;
      }
      
      // Create template
      const templateResult = await client.query(`
        INSERT INTO message_templates (event_type, language_code, template_type, header, body, footer, category, priority)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        templateDef.eventType,
        templateDef.languageCode,
        templateDef.templateType,
        templateDef.header,
        templateDef.body,
        templateDef.footer,
        templateDef.category,
        templateDef.priority
      ]);
      
      const templateId = templateResult.rows[0].id;
      console.log(`✅ Created template: ${templateDef.eventType} (ID: ${templateId})`);
      
      // Add response options
      for (const responseDef of templateDef.responses) {
        await client.query(`
          INSERT INTO response_options (template_id, button_text, button_payload, button_type, sort_order, display_conditions)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          templateId,
          responseDef.buttonText,
          responseDef.buttonPayload,
          responseDef.buttonType,
          responseDef.sortOrder,
          responseDef.displayConditions ? JSON.stringify(responseDef.displayConditions) : null
        ]);
      }
      
      // Add template variables
      for (const variableDef of templateDef.variables) {
        await client.query(`
          INSERT INTO template_variables (variable_name, event_type, data_path, default_value)
          VALUES ($1, $2, $3, $4)
        `, [
          variableDef.variableName,
          templateDef.eventType,
          variableDef.dataPath,
          variableDef.defaultValue
        ]);
      }
      
      console.log(`   📝 Added ${templateDef.responses.length} response options and ${templateDef.variables.length} variables`);
    }
    
    // Test template retrieval
    console.log('\n🧪 Testing template retrieval...');
    
    const testEvents = [
      {
        eventType: 'route.assigned',
        data: {
          route: {
            name: 'Hamburg Port → BMW Munich',
            stops: [
              { location: 'Hamburg Port Terminal', scheduledTime: '14:00' },
              { location: 'BMW Plant Munich' }
            ]
          }
        }
      },
      {
        eventType: 'vehicle.geofence.enter',
        data: {
          geofence: { name: 'Hamburg Terminal', type: 'pickup_location' }
        }
      }
    ];
    
    for (const event of testEvents) {
      const template = await client.query(`
        SELECT mt.*, array_agg(
          json_build_object(
            'buttonText', ro.button_text,
            'buttonPayload', ro.button_payload,
            'sortOrder', ro.sort_order,
            'displayConditions', ro.display_conditions
          ) ORDER BY ro.sort_order
        ) as responses
        FROM message_templates mt
        LEFT JOIN response_options ro ON mt.id = ro.template_id AND ro.is_active = true
        WHERE mt.event_type = $1 AND mt.language_code = $2 AND mt.is_active = true
        GROUP BY mt.id
      `, [event.eventType, LanguageCode.ENGLISH]);
      
      if (template.rows.length > 0) {
        console.log(`✅ Retrieved template for ${event.eventType}`);
        
        // Test variable substitution
        const variables = await client.query(
          'SELECT * FROM template_variables WHERE event_type = $1',
          [event.eventType]
        );
        
        let body = template.rows[0].body;
        for (const variable of variables.rows) {
          const value = extractValueFromPath(event, variable.data_path) || variable.default_value || '';
          body = body.replace(new RegExp(variable.variable_name.replace(/[{}]/g, '\\$&'), 'g'), value);
        }
        
        console.log(`   📄 Generated message preview: "${body.substring(0, 100)}..."`);
      } else {
        console.log(`❌ Template not found for ${event.eventType}`);
      }
    }
    
    // Final summary
    const summary = await client.query(`
      SELECT 
        COUNT(DISTINCT mt.id) as total_templates,
        COUNT(DISTINCT ro.id) as total_responses,
        COUNT(DISTINCT tv.id) as total_variables
      FROM message_templates mt
      LEFT JOIN response_options ro ON mt.id = ro.template_id
      LEFT JOIN template_variables tv ON mt.event_type = tv.event_type
      WHERE mt.language_code = $1
    `, [LanguageCode.ENGLISH]);
    
    const stats = summary.rows[0];
    console.log(`\n📊 Template system initialized successfully:`);
    console.log(`   📄 Templates: ${stats.total_templates}`);
    console.log(`   🔘 Response options: ${stats.total_responses}`);
    console.log(`   🔧 Variables: ${stats.total_variables}`);
    console.log(`   🌍 Language: English (${LanguageCode.ENGLISH})`);
    
  } catch (error) {
    console.error('❌ Error initializing templates:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Helper function to extract values from nested objects
function extractValueFromPath(obj, path) {
  try {
    return path.split('.').reduce((current, key) => {
      // Handle array indices like 'stops.0'
      if (!isNaN(key)) {
        return current[parseInt(key)];
      }
      return current[key];
    }, obj);
  } catch {
    return undefined;
  }
}

// Run initialization
if (require.main === module) {
  initializeTemplates()
    .then(() => {
      console.log('\n🎉 Template initialization completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Template initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeTemplates };