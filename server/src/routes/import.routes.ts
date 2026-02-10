import { Router } from 'express';
import importController from '../controllers/import.controller';

const router = Router();

router.post('/trigger', importController.triggerImport.bind(importController));
router.get('/history', importController.getHistory.bind(importController));
router.get('/history/:id', importController.getById.bind(importController));
router.get('/stats', importController.getStats.bind(importController));

export default router;
