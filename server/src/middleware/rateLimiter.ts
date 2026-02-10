import { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis';
import logger from './logger';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

export class RateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private message: string;

  constructor(options: RateLimitOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.message = options.message || 'Too many requests, please try again later.';
  }

  middleware = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const clientKey = this.getClientKey(req);
      const redisKey = `ratelimit:${clientKey}`;

      // Get current request count
      const currentCount = await redisClient.get(redisKey);

      if (currentCount && parseInt(currentCount) >= this.maxRequests) {
        logger.warn(`Rate limit exceeded for ${clientKey}`);
        res.status(429).json({
          success: false,
          message: this.message,
          retryAfter: Math.ceil(this.windowMs / 1000),
        });
        return;
      }

      // Increment counter
      const multi = redisClient.multi();
      multi.incr(redisKey);
      
      if (!currentCount) {
        multi.expire(redisKey, Math.ceil(this.windowMs / 1000));
      }

      await multi.exec();

      // Add rate limit headers
      const remaining = this.maxRequests - (currentCount ? parseInt(currentCount) + 1 : 1);
      res.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + this.windowMs).toISOString());

      next();
    } catch (error) {
      logger.error('Rate limiter error:', error);
      // Fail open - allow request if rate limiting fails
      next();
    }
  };

  private getClientKey(req: Request): string {
    // Use IP address or authenticated user ID
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
    // In production, you might use: req.user?.id || ip
    return ip || 'unknown';
  }
}

// Pre-configured rate limiters
export const strictRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  message: 'Too many import requests, please try again in 15 minutes.',
});

export const standardRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
});

export const lenientRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
});
