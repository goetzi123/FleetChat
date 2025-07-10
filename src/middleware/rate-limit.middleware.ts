import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../shared/errors';
import { env } from '../config/environment';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (req: Request) => req.ip || 'unknown',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };
  }

  middleware = (req: Request, res: Response, next: NextFunction): void => {
    const key = this.config.keyGenerator(req);
    const now = Date.now();
    
    // Clean up expired entries
    this.cleanup(now);
    
    const entry = this.requests.get(key);
    
    if (!entry || now > entry.resetTime) {
      // New window or expired entry
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      
      this.setHeaders(res, 1, this.config.maxRequests, now + this.config.windowMs);
      next();
      return;
    }
    
    if (entry.count >= this.config.maxRequests) {
      // Rate limit exceeded
      this.setHeaders(res, entry.count, this.config.maxRequests, entry.resetTime);
      
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      
      const error = new RateLimitError('Too many requests, please try again later');
      next(error);
      return;
    }
    
    // Increment counter
    entry.count++;
    this.setHeaders(res, entry.count, this.config.maxRequests, entry.resetTime);
    
    // Track response to conditionally count the request
    const originalSend = res.send;
    res.send = function(body) {
      const statusCode = res.statusCode;
      const shouldSkip = 
        (statusCode < 400 && config.skipSuccessfulRequests) ||
        (statusCode >= 400 && config.skipFailedRequests);
        
      if (shouldSkip && entry.count > 0) {
        entry.count--;
      }
      
      return originalSend.call(this, body);
    };
    
    next();
  };

  private setHeaders(res: Response, current: number, max: number, resetTime: number): void {
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current));
    res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());
  }

  private cleanup(now: number): void {
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Default rate limiter
export const defaultRateLimit = new RateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
}).middleware;

// Strict rate limiter for sensitive endpoints
export const strictRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
}).middleware;

// API rate limiter by tenant
export const tenantRateLimit = new RateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS * 5, // Higher limit per tenant
  keyGenerator: (req: Request) => req.tenantId || req.ip || 'unknown',
}).middleware;

// Webhook rate limiter
export const webhookRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 1000, // High limit for webhooks
  keyGenerator: (req: Request) => `webhook:${req.ip}`,
}).middleware;