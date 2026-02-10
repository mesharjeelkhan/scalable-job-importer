import Bull, { Queue, Job as BullJob } from 'bull';
import config from '../config';
import redisClient from '../config/redis';
import logger from '../utils/logger';
import { JobData } from './jobFetcher.service';

export interface JobProcessorData extends JobData {
  importLogId: string;
}

class JobQueueService {
  private queue: Queue<JobProcessorData>;

  constructor() {
    this.queue = new Bull<JobProcessorData>(config.queue.name, {
      redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
      },
      defaultJobOptions: {
        attempts: config.queue.maxRetries,
        backoff: {
          type: 'exponential',
          delay: config.queue.retryDelay,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    this.setupEventListeners();
  }

  /**
   * Setup queue event listeners
   */
  private setupEventListeners(): void {
    this.queue.on('error', (error) => {
      logger.error('Queue error:', error);
    });

    this.queue.on('waiting', (jobId) => {
      logger.debug(`Job ${jobId} is waiting`);
    });

    this.queue.on('active', (job) => {
      logger.debug(`Job ${job.id} is now active`);
    });

    this.queue.on('completed', (job) => {
      logger.debug(`Job ${job.id} completed`);
    });

    this.queue.on('failed', (job, error) => {
      logger.error(`Job ${job?.id} failed:`, error);
    });

    this.queue.on('stalled', (job) => {
      logger.warn(`Job ${job.id} stalled`);
    });
  }

  /**
   * Add single job to queue
   */
  async addJob(jobData: JobProcessorData): Promise<BullJob<JobProcessorData>> {
    return this.queue.add(jobData, {
      jobId: `${jobData.importLogId}-${jobData.sourceId || Date.now()}`,
    });
  }

  /**
   * Add multiple jobs in bulk
   */
  async addBulk(jobs: JobProcessorData[]): Promise<BullJob<JobProcessorData>[]> {
    const bulkJobs = jobs.map((job, index) => ({
      data: job,
      opts: {
        jobId: `${job.importLogId}-${job.sourceId || `${Date.now()}-${index}`}`,
      },
    }));

    return this.queue.addBulk(bulkJobs);
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<BullJob<JobProcessorData> | null> {
    return this.queue.getJob(jobId);
  }

  /**
   * Get queue statistics
   */
  async getStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Retry failed jobs for a specific import
   */
  async retryFailedJobs(importLogId: string): Promise<number> {
    const failedJobs = await this.queue.getFailed();
    const importJobs = failedJobs.filter(
      (job) => job.data.importLogId === importLogId
    );

    let retriedCount = 0;
    for (const job of importJobs) {
      try {
        await job.retry();
        retriedCount++;
      } catch (error) {
        logger.error(`Failed to retry job ${job.id}:`, error);
      }
    }

    return retriedCount;
  }

  /**
   * Clean old completed/failed jobs
   */
  async cleanQueue(olderThan: number = 24 * 60 * 60 * 1000): Promise<void> {
    await this.queue.clean(olderThan, 'completed');
    await this.queue.clean(olderThan, 'failed');
    logger.info('Queue cleaned successfully');
  }

  /**
   * Pause queue processing
   */
  async pause(): Promise<void> {
    await this.queue.pause();
    logger.info('Queue paused');
  }

  /**
   * Resume queue processing
   */
  async resume(): Promise<void> {
    await this.queue.resume();
    logger.info('Queue resumed');
  }

  /**
   * Empty the queue
   */
  async empty(): Promise<void> {
    await this.queue.empty();
    logger.info('Queue emptied');
  }

  /**
   * Get the queue instance
   */
  getQueue(): Queue<JobProcessorData> {
    return this.queue;
  }

  /**
   * Close the queue connection
   */
  async close(): Promise<void> {
    await this.queue.close();
    logger.info('Queue connection closed');
  }
}

export default new JobQueueService();
