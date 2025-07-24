import express from "express";
import cors from "cors";
import { registerFleetChatRoutes } from "./fleet-chat-routes";

async function createFleetChatServer() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // Fleet.Chat production routes
  const server = await registerFleetChatRoutes(app);

  // Error handling
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Fleet.Chat server error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Endpoint not found',
      message: `${req.method} ${req.originalUrl} is not a valid Fleet.Chat API endpoint`
    });
  });

  return server;
}

export { createFleetChatServer };