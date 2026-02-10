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
