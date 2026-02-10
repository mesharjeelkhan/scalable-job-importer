import Job, { IJob } from '../models/Job';
import logger from '../utils/logger';
import { JobData } from './jobFetcher.service';

export interface ProcessResult {
  success: boolean;
  isNew: boolean;
  error?: string;
}

class JobProcessorService {
  /**
   * Process and upsert a single job
   */
  async processJob(jobData: JobData): Promise<ProcessResult> {
    try {
      // Validate job data
      const validationResult = this.validateJob(jobData);
      if (!validationResult.valid) {
        return {
          success: false,
          isNew: false,
          error: validationResult.error,
        };
      }

      // Upsert job
      const result = await this.upsertJob(jobData);
      return {
        success: true,
        isNew: result.isNew,
      };
    } catch (error: any) {
      logger.error('Job processing error:', error);
      return {
        success: false,
        isNew: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Validate job data
   */
  private validateJob(jobData: JobData): {
    valid: boolean;
    error?: string;
  } {
    if (!jobData.title || jobData.title.trim().length === 0) {
      return { valid: false, error: 'Title is required' };
    }

    if (!jobData.company || jobData.company.trim().length === 0) {
      return { valid: false, error: 'Company is required' };
    }

    if (!jobData.location || jobData.location.trim().length === 0) {
      return { valid: false, error: 'Location is required' };
    }

    if (!jobData.url || jobData.url.trim().length === 0) {
      return { valid: false, error: 'URL is required' };
    }

    if (!jobData.source || jobData.source.trim().length === 0) {
      return { valid: false, error: 'Source is required' };
    }

    return { valid: true };
  }

  /**
   * Upsert job to database
   */
  private async upsertJob(
    jobData: JobData
  ): Promise<{ isNew: boolean; job: IJob }> {
    // Create unique identifier based on title, company, location
    const uniqueKey = {
      title: jobData.title.toLowerCase().trim(),
      company: jobData.company.toLowerCase().trim(),
      location: jobData.location.toLowerCase().trim(),
    };

    // Find existing job
    const existingJob = await Job.findOne(uniqueKey);

    if (existingJob) {
      // Update existing job
      Object.assign(existingJob, {
        ...jobData,
        lastSyncedAt: new Date(),
      });

      await existingJob.save();

      logger.debug(`Updated job: ${jobData.title} at ${jobData.company}`);

      return {
        isNew: false,
        job: existingJob,
      };
    } else {
      // Create new job
      const newJob = await Job.create({
        ...jobData,
        lastSyncedAt: new Date(),
      });

      logger.debug(`Created new job: ${jobData.title} at ${jobData.company}`);

      return {
        isNew: true,
        job: newJob,
      };
    }
  }

  /**
   * Bulk upsert jobs
   */
  async bulkUpsert(
    jobs: JobData[]
  ): Promise<{ newCount: number; updatedCount: number; errors: any[] }> {
    let newCount = 0;
    let updatedCount = 0;
    const errors: any[] = [];

    for (const jobData of jobs) {
      try {
        const result = await this.processJob(jobData);
        if (result.success) {
          if (result.isNew) {
            newCount++;
          } else {
            updatedCount++;
          }
        } else {
          errors.push({
            job: jobData,
            error: result.error,
          });
        }
      } catch (error: any) {
        errors.push({
          job: jobData,
          error: error.message,
        });
      }
    }

    return { newCount, updatedCount, errors };
  }

  /**
   * Find duplicate jobs
   */
  async findDuplicates(): Promise<any[]> {
    return Job.aggregate([
      {
        $group: {
          _id: {
            title: { $toLower: '$title' },
            company: { $toLower: '$company' },
            location: { $toLower: '$location' },
          },
          count: { $sum: 1 },
          ids: { $push: '$_id' },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ]);
  }

  /**
   * Remove duplicate jobs (keep the latest)
   */
  async removeDuplicates(): Promise<number> {
    const duplicates = await this.findDuplicates();
    let removedCount = 0;

    for (const dup of duplicates) {
      // Keep the first ID, remove the rest
      const idsToRemove = dup.ids.slice(1);
      await Job.deleteMany({ _id: { $in: idsToRemove } });
      removedCount += idsToRemove.length;
    }

    logger.info(`Removed ${removedCount} duplicate jobs`);
    return removedCount;
  }
}

export default new JobProcessorService();
