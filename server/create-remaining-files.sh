#!/bin/bash

# Create job controller
cat > src/controllers/job.controller.ts << 'EOF'
import { Request, Response } from 'express';
import Job from '../models/Job';
import logger from '../utils/logger';

export class JobController {
  async getJobs(req: Request, res: Response) {
    try {
      const { page = '1', limit = '20', category, jobType, search } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const query: any = {};
      if (category) query.category = category;
      if (jobType) query.jobType = jobType;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
        ];
      }

      const [jobs, total] = await Promise.all([
        Job.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit as string)),
        Job.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: jobs,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error: any) {
      logger.error('Failed to get jobs:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getJobById(req: Request, res: Response) {
    try {
      const job = await Job.findById(req.params.id);
      if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }
      res.json({ success: true, data: job });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new JobController();
EOF

# Create health controller
cat > src/controllers/health.controller.ts << 'EOF'
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import redisClient from '../config/redis';
import jobQueueService from '../services/jobQueue.service';

export class HealthController {
  async getHealth(req: Request, res: Response) {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const redisStatus = redisClient.status === 'ready' ? 'connected' : 'disconnected';
    const queueStats = await jobQueueService.getStats();

    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      mongodb: mongoStatus,
      redis: redisStatus,
      queue: queueStats,
      timestamp: new Date().toISOString(),
    });
  }
}

export default new HealthController();
EOF

# Create routes
cat > src/routes/import.routes.ts << 'EOF'
import { Router } from 'express';
import importController from '../controllers/import.controller';

const router = Router();

router.post('/trigger', importController.triggerImport.bind(importController));
router.get('/history', importController.getHistory.bind(importController));
router.get('/history/:id', importController.getById.bind(importController));
router.get('/stats', importController.getStats.bind(importController));

export default router;
EOF

cat > src/routes/job.routes.ts << 'EOF'
import { Router } from 'express';
import jobController from '../controllers/job.controller';

const router = Router();

router.get('/', jobController.getJobs.bind(jobController));
router.get('/:id', jobController.getJobById.bind(jobController));

export default router;
EOF

cat > src/routes/health.routes.ts << 'EOF'
import { Router } from 'express';
import healthController from '../controllers/health.controller';

const router = Router();

router.get('/', healthController.getHealth.bind(healthController));

export default router;
EOF

cat > src/routes/index.ts << 'EOF'
import { Router } from 'express';
import importRoutes from './import.routes';
import jobRoutes from './job.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use('/import', importRoutes);
router.use('/jobs', jobRoutes);
router.use('/health', healthRoutes);

export default router;
EOF

# Create cron job
cat > src/jobs/import.cron.ts << 'EOF'
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
EOF

mkdir -p src/jobs

echo "All remaining files created successfully!"
