import { Router } from 'express';
import jobController from '../controllers/job.controller';

const router = Router();

router.get('/', jobController.getJobs.bind(jobController));
router.get('/:id', jobController.getJobById.bind(jobController));

export default router;
