import express from 'express';
import cors from 'cors';
import { apiRoutes } from './routes';
import { 
  requestIdMiddleware, 
} from './middleware/auth.middleware';
import { 
  errorHandler, 
  notFoundHandler 
} from './middleware/error.middleware';
import { defaultRateLimit } from './middleware/rate-limit.middleware';
import { env, isDevelopment } from './config/environment';
import { logger } from './shared/logger';

const app = express();

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(cors({
  origin: isDevelopment ? '*' : ['https://fleet.chat', 'https://app.fleet.chat'],
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request middleware
app.use(requestIdMiddleware);

// Rate limiting
app.use('/api', defaultRateLimit);

// API routes
app.use('/api', apiRoutes);

// Demo route for development (preserves existing functionality)
if (isDevelopment) {
  app.get('/demo', (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
    <title>FleetChat Demo - Refactored Architecture</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .panels { display: flex; gap: 20px; }
        .panel { flex: 1; background: white; border-radius: 8px; padding: 20px; }
        .samsara { border-left: 4px solid #1e40af; }
        .whatsapp { border-left: 4px solid #059669; }
        .btn { width: 100%; padding: 15px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 6px; background: #f8f9fa; cursor: pointer; text-align: left; }
        .btn:hover { background: #e9ecef; }
        .info-box { background: #f0f9ff; border: 1px solid #0ea5e9; padding: 15px; border-radius: 6px; margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>FleetChat - Refactored Architecture</h1>
            <p>Modern TypeScript architecture with improved scalability and maintainability</p>
            <div class="info-box">
                <strong>✅ Refactored Codebase Complete</strong><br>
                <small>
                  • Modular service layer architecture<br>
                  • Comprehensive error handling & validation<br>
                  • Enhanced database integration<br>
                  • Improved API structure with middleware<br>
                  • Type-safe integrations for Samsara & WhatsApp
                </small>
            </div>
        </div>
        
        <div class="panels">
            <div class="panel samsara">
                <h2>🚛 System Architecture</h2>
                <div class="info-box">
                    <strong>Core Components:</strong><br>
                    • Service Layer Pattern<br>
                    • Middleware Stack<br>
                    • Integration Layer<br>
                    • Type Safety Throughout
                </div>
                <div class="info-box">
                    <strong>Database Schema:</strong><br>
                    • Multi-tenant isolation<br>
                    • Template system active<br>
                    • Comprehensive relations<br>
                    • Production-ready structure
                </div>
            </div>

            <div class="panel whatsapp">
                <h2>📱 API Endpoints</h2>
                <div class="info-box">
                    <strong>Available APIs:</strong><br>
                    • <code>GET /api/health</code><br>
                    • <code>POST /api/webhook/samsara</code><br>
                    • <code>POST /api/webhook/whatsapp</code><br>
                    • <code>CRUD /api/tenants</code>
                </div>
                <div class="info-box">
                    <strong>Middleware Features:</strong><br>
                    • Request validation<br>
                    • Rate limiting<br>
                    • Error handling<br>
                    • Authentication ready
                </div>
            </div>
        </div>
    </div>
</body>
</html>`);
  });
}

// Root redirect
app.get('/', (req, res) => {
  if (isDevelopment) {
    res.redirect('/demo');
  } else {
    res.json({
      message: 'FleetChat API',
      version: '1.0.0',
      documentation: '/api',
    });
  }
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;