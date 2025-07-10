import { env } from '../config/environment';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  error?: Error;
  requestId?: string;
}

class Logger {
  private level: LogLevel;
  private format: 'json' | 'text';

  constructor() {
    this.level = this.getLogLevel(env.LOG_LEVEL);
    this.format = env.LOG_FORMAT;
  }

  private getLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private formatMessage(entry: LogEntry): string {
    if (this.format === 'json') {
      return JSON.stringify({
        timestamp: entry.timestamp.toISOString(),
        level: LogLevel[entry.level],
        message: entry.message,
        requestId: entry.requestId,
        context: entry.context,
        error: entry.error ? {
          name: entry.error.name,
          message: entry.error.message,
          stack: entry.error.stack,
        } : undefined,
      });
    }

    // Text format
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level].padEnd(5);
    const requestId = entry.requestId ? `[${entry.requestId}]` : '';
    const context = entry.context ? `\n  Context: ${JSON.stringify(entry.context)}` : '';
    const error = entry.error ? `\n  Error: ${entry.error.stack}` : '';
    
    return `${timestamp} ${level} ${requestId} ${entry.message}${context}${error}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error, requestId?: string): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
      requestId,
    };

    const formatted = this.formatMessage(entry);
    
    if (level === LogLevel.ERROR) {
      console.error(formatted);
    } else if (level === LogLevel.WARN) {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>, requestId?: string): void {
    this.log(LogLevel.ERROR, message, context, error, requestId);
  }

  warn(message: string, context?: Record<string, any>, requestId?: string): void {
    this.log(LogLevel.WARN, message, context, undefined, requestId);
  }

  info(message: string, context?: Record<string, any>, requestId?: string): void {
    this.log(LogLevel.INFO, message, context, undefined, requestId);
  }

  debug(message: string, context?: Record<string, any>, requestId?: string): void {
    this.log(LogLevel.DEBUG, message, context, undefined, requestId);
  }

  // Create child logger with persistent context
  child(context: Record<string, any>): Logger {
    const childLogger = new Logger();
    const originalLog = childLogger.log.bind(childLogger);
    
    childLogger.log = (level: LogLevel, message: string, additionalContext?: Record<string, any>, error?: Error, requestId?: string) => {
      const mergedContext = { ...context, ...additionalContext };
      originalLog(level, message, mergedContext, error, requestId);
    };
    
    return childLogger;
  }
}

export const logger = new Logger();

// Request logger middleware helper
export function createRequestLogger(requestId: string) {
  return {
    error: (message: string, error?: Error, context?: Record<string, any>) => 
      logger.error(message, error, context, requestId),
    warn: (message: string, context?: Record<string, any>) => 
      logger.warn(message, context, requestId),
    info: (message: string, context?: Record<string, any>) => 
      logger.info(message, context, requestId),
    debug: (message: string, context?: Record<string, any>) => 
      logger.debug(message, context, requestId),
  };
}