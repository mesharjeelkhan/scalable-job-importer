import { Job } from 'bull';
import jobQueueService from '../services/jobQueue.service';
import jobProcessorService from '../services/jobProcessor.service';
import importService from '../services/import.service';
import logger from '../utils/logger';
import config from '../config';
import { JobProcessorData } from '../services/jobQueue.service';

class QueueWorker {
  /**
   * Initialize worker
   */
  init(): void {
    const queue = jobQueueService.getQueue();

    // Process jobs with configured concurrency
    queue.process(config.queue.concurrency, async (job: Job<JobProcessorData>) => {
      return this.processJob(job);
    });

    logger.info(
      `✅ Queue worker started with concurrency: ${config.queue.concurrency}`
    );
  }

  /**
   * Process individual job
   */
  private async processJob(job: Job<JobProcessorData>): Promise<any> {
    const { importLogId, ...jobData } = job.data;

    try {
      logger.debug(`Processing job: ${jobData.title} (${job.id})`);

      // Process the job
      const result = await jobProcessorService.processJob(jobData);

      if (result.success) {
        // Update import log counters
        const type = result.isNew ? 'new' : 'updated';
        await importService.incrementCounters(importLogId, type);

        logger.debug(
          `Job processed successfully: ${jobData.title} (${type})`
        );

        return {
          success: true,
          isNew: result.isNew,
          jobTitle: jobData.title,
        };
      } else {
        // Handle validation/processing errors
        await importService.addError(importLogId, {
          jobId: jobData.sourceId,
          reason: result.error || 'Unknown error',
        });

        throw new Error(result.error);
      }
    } catch (error: any) {
      logger.error(`Job processing failed: ${jobData.title}`, error);

      // Add error to import log
      await importService.addError(importLogId, {
        jobId: jobData.sourceId,
        reason: error.message || 'Unknown error',
        stackTrace: error.stack,
      });

      throw error; // This will trigger retry mechanism
    }
  }

  /**
   * Handle job completion
   */
  onCompleted(job: Job<JobProcessorData>, result: any): void {
    logger.debug(`Job ${job.id} completed:`, result);
  }

  /**
   * Handle job failure
   */
  onFailed(job: Job<JobProcessorData> | undefined, error: Error): void {
    if (job) {
      logger.error(`Job ${job.id} failed after ${job.attemptsMade} attempts:`, error);
    } else {
      logger.error('Job failed:', error);
    }
  }

  /**
   * Handle job progress
   */
  onProgress(job: Job<JobProcessorData>, progress: any): void {
    logger.debug(`Job ${job.id} progress:`, progress);
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down worker...');
    await jobQueueService.close();
    logger.info('Worker shutdown complete');
  }
}

const worker = new QueueWorker();

// Handle process termination
process.on('SIGTERM', async () => {
  await worker.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await worker.shutdown();
  process.exit(0);
});

export default worker;
