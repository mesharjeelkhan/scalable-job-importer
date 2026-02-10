import dotenv from 'dotenv';

dotenv.config();

interface Config {
  server: {
    port: number;
    env: string;
  };
  mongodb: {
    uri: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  queue: {
    name: string;
    concurrency: number;
    batchSize: number;
    maxRetries: number;
    retryDelay: number;
  };
  cors: {
    origin: string;
  };
  cron: {
    enabled: boolean;
    schedule: string;
  };
  logging: {
    level: string;
  };
}

const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    env: process.env.NODE_ENV || 'development',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/job-importer',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  queue: {
    name: process.env.QUEUE_NAME || 'job-import-queue',
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5', 10),
    batchSize: parseInt(process.env.BATCH_SIZE || '100', 10),
    maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.RETRY_DELAY || '2000', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  cron: {
    enabled: process.env.ENABLE_CRON === 'true',
    schedule: process.env.CRON_SCHEDULE || '0 * * * *', // Every hour
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export default config;
