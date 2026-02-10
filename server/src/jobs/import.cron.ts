import cron from 'node-cron';
import importService from '../services/import.service';
import logger from '../utils/logger';
import config from '../config';

export class ImportCronJob {
  private task: cron.ScheduledTask | null = null;

  start(): void {
    if (!config.cron.enabled) {
      logger.info('Cron job disabled');
      return;
    }

    this.task = cron.schedule(config.cron.schedule, async () => {
      logger.info('Running scheduled import...');
      try {
        await importService.triggerImport({ triggeredBy: 'cron' });
        logger.info('Scheduled import completed');
      } catch (error) {
        logger.error('Scheduled import failed:', error);
      }
    });

    logger.info(`✅ Cron job scheduled: ${config.cron.schedule}`);
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      logger.info('Cron job stopped');
    }
  }
}

export default new ImportCronJob();
