import app from './app';
import { env } from './config/environment';
import { logger } from './shared/logger';
import { closeDatabaseConnection } from './config/database';

const PORT = env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`FleetChat server started`, {
    port: PORT,
    environment: env.NODE_ENV,
    nodeVersion: process.version,
  });
});

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown`);
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      await closeDatabaseConnection();
      logger.info('Database connection closed');
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', error instanceof Error ? error : new Error(String(error)));
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', new Error(String(reason)), {
    promise: promise.toString(),
  });
  process.exit(1);
});

export default server;