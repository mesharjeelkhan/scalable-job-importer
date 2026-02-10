import ImportLog, { IImportLog } from '../models/ImportLog';
import jobFetcherService from './jobFetcher.service';
import jobQueueService from './jobQueue.service';
import logger from '../utils/logger';
import config from '../config';

export interface ImportOptions {
  triggeredBy?: 'manual' | 'cron' | 'api';
  importType?: 'full' | 'incremental';
}

export interface ImportFilters {
  status?: string;
  fileName?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

class ImportService {
  // List of job feed URLs
  private readonly feedUrls = [
    'https://jobicy.com/?feed=job_feed',
    'https://jobicy.com/?feed=job_feed&job_categories=smm&job_types=full-time',
    'https://jobicy.com/?feed=job_feed&job_categories=seller&job_types=full-time&search_region=france',
    'https://jobicy.com/?feed=job_feed&job_categories=design-multimedia',
    'https://jobicy.com/?feed=job_feed&job_categories=data-science',
    'https://jobicy.com/?feed=job_feed&job_categories=copywriting',
    'https://jobicy.com/?feed=job_feed&job_categories=business',
    'https://jobicy.com/?feed=job_feed&job_categories=management',
    'https://www.higheredjobs.com/rss/articleFeed.cfm',
  ];

  /**
   * Trigger import from all feeds
   */
  async triggerImport(options: ImportOptions = {}): Promise<IImportLog[]> {
    const {
      triggeredBy = 'manual',
      importType = 'full',
    } = options;

    logger.info('Starting import process...');

    const importLogs: IImportLog[] = [];

    for (const feedUrl of this.feedUrls) {
      try {
        const importLog = await this.importFromFeed(
          feedUrl,
          triggeredBy,
          importType
        );
        importLogs.push(importLog);
      } catch (error) {
        logger.error(`Failed to import from ${feedUrl}:`, error);
      }
    }

    logger.info(`Import process completed for ${importLogs.length} feeds`);
    return importLogs;
  }

  /**
   * Import from a single feed
   */
  async importFromFeed(
    feedUrl: string,
    triggeredBy: 'manual' | 'cron' | 'api' = 'manual',
    importType: 'full' | 'incremental' = 'full'
  ): Promise<IImportLog> {
    // Create import log
    const importLog = await this.createImportLog(
      feedUrl,
      triggeredBy,
      importType
    );

    try {
      // Fetch jobs from feed
      const jobs = await jobFetcherService.fetchFeed(feedUrl);

      // Update total fetched
      importLog.totalFetched = jobs.length;
      await importLog.save();

      // Add jobs to queue in batches
      const batchSize = config.queue.batchSize;
      for (let i = 0; i < jobs.length; i += batchSize) {
        const batch = jobs.slice(i, i + batchSize);
        const queueJobs = batch.map((job) => ({
          ...job,
          importLogId: importLog._id.toString(),
        }));

        await jobQueueService.addBulk(queueJobs);
      }

      logger.info(`Queued ${jobs.length} jobs for processing (${feedUrl})`);

      return importLog;
    } catch (error: any) {
      logger.error(`Import failed for ${feedUrl}:`, error);

      // Update import log as failed
      importLog.status = 'failed';
      importLog.endTime = new Date();
      importLog.duration =
        importLog.endTime.getTime() - importLog.startTime.getTime();
      importLog.errors.push({
        reason: error.message || 'Unknown error',
        timestamp: new Date(),
        stackTrace: error.stack,
      });

      await importLog.save();

      return importLog;
    }
  }

  /**
   * Create import log entry
   */
  async createImportLog(
    fileName: string,
    triggeredBy: 'manual' | 'cron' | 'api' = 'manual',
    importType: 'full' | 'incremental' = 'full'
  ): Promise<IImportLog> {
    return ImportLog.create({
      fileName,
      status: 'in_progress',
      triggeredBy,
      importType,
      startTime: new Date(),
      totalFetched: 0,
      totalImported: 0,
      newJobs: 0,
      updatedJobs: 0,
      failedJobs: 0,
      errors: [],
    });
  }

  /**
   * Update import log
   */
  async updateImportLog(
    importLogId: string,
    updates: Partial<IImportLog>
  ): Promise<IImportLog | null> {
    return ImportLog.findByIdAndUpdate(importLogId, updates, { new: true });
  }

  /**
   * Mark import as completed
   */
  async completeImport(importLogId: string): Promise<IImportLog | null> {
    const importLog = await ImportLog.findById(importLogId);

    if (!importLog) {
      logger.error(`Import log not found: ${importLogId}`);
      return null;
    }

    importLog.status = 'completed';
    importLog.endTime = new Date();
    importLog.duration =
      importLog.endTime.getTime() - importLog.startTime.getTime();

    await importLog.save();

    logger.info(`Import completed: ${importLogId}`);
    return importLog;
  }

  /**
   * Increment counters
   */
  async incrementCounters(
    importLogId: string,
    type: 'new' | 'updated' | 'failed'
  ): Promise<void> {
    const update: any = { $inc: { totalImported: 1 } };

    if (type === 'new') {
      update.$inc.newJobs = 1;
    } else if (type === 'updated') {
      update.$inc.updatedJobs = 1;
    } else if (type === 'failed') {
      update.$inc.failedJobs = 1;
    }

    await ImportLog.findByIdAndUpdate(importLogId, update);
  }

  /**
   * Add error to import log
   */
  async addError(
    importLogId: string,
    error: {
      jobId?: string;
      reason: string;
      stackTrace?: string;
    }
  ): Promise<void> {
    await ImportLog.findByIdAndUpdate(importLogId, {
      $push: {
        errors: {
          ...error,
          timestamp: new Date(),
        },
      },
      $inc: { failedJobs: 1 },
    });
  }

  /**
   * Get import history with filters and pagination
   */
  async getImportHistory(filters: ImportFilters = {}) {
    const {
      status,
      fileName,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (fileName) {
      query.fileName = { $regex: fileName, $options: 'i' };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = startDate;
      }
      if (endDate) {
        query.createdAt.$lte = endDate;
      }
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ImportLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ImportLog.countDocuments(query),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get import log by ID
   */
  async getImportById(importLogId: string): Promise<IImportLog | null> {
    return ImportLog.findById(importLogId);
  }

  /**
   * Get overall statistics
   */
  async getStats() {
    const [totalImports, completedImports, failedImports, inProgressImports] =
      await Promise.all([
        ImportLog.countDocuments(),
        ImportLog.countDocuments({ status: 'completed' }),
        ImportLog.countDocuments({ status: 'failed' }),
        ImportLog.countDocuments({ status: 'in_progress' }),
      ]);

    const aggregateStats = await ImportLog.aggregate([
      {
        $match: { status: 'completed' },
      },
      {
        $group: {
          _id: null,
          totalJobsImported: { $sum: '$totalImported' },
          totalNewJobs: { $sum: '$newJobs' },
          totalUpdatedJobs: { $sum: '$updatedJobs' },
          totalFailedJobs: { $sum: '$failedJobs' },
          averageDuration: { $avg: '$duration' },
        },
      },
    ]);

    const stats = aggregateStats[0] || {
      totalJobsImported: 0,
      totalNewJobs: 0,
      totalUpdatedJobs: 0,
      totalFailedJobs: 0,
      averageDuration: 0,
    };

    return {
      totalImports,
      completedImports,
      failedImports,
      inProgressImports,
      ...stats,
    };
  }

  /**
   * Get feed URLs
   */
  getFeedUrls(): string[] {
    return [...this.feedUrls];
  }
}

export default new ImportService();
