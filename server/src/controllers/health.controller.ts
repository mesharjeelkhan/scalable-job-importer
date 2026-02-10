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
