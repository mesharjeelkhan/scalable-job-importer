import Redis from 'ioredis';
import config from '../config';
import logger from './logger';

const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redisClient.on('connect', () => {
  logger.info('✅ Redis connected successfully');
});

redisClient.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis reconnecting...');
});

// Graceful shutdown
process.on('SIGINT', () => {
  redisClient.quit();
  logger.info('Redis connection closed through app termination');
});

export default redisClient;
