import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  
  // Samsara Configuration
  SAMSARA_API_BASE_URL: z.string().default('https://api.samsara.com'),
  SAMSARA_API_VERSION: z.string().default('v1'),
  
  // WhatsApp Business API Configuration
  WHATSAPP_API_BASE_URL: z.string().default('https://graph.facebook.com/v18.0'),
  WHATSAPP_BUSINESS_TOKEN: z.string().optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  
  // Stripe Configuration
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Security Configuration
  JWT_SECRET: z.string().default('fleet-chat-development-secret'),
  SESSION_SECRET: z.string().default('fleet-chat-session-secret'),
  ENCRYPTION_KEY: z.string().optional(),
  
  // Application Configuration
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  DEFAULT_LANGUAGE: z.string().default('ENG'),
  
  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'text']).default('text'),
});

type Environment = z.infer<typeof environmentSchema>;

let config: Environment;

try {
  config = environmentSchema.parse(process.env);
} catch (error) {
  console.error('Environment validation failed:', error);
  process.exit(1);
}

export const env = config;

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';