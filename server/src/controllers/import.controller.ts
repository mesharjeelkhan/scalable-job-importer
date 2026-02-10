import { Request, Response } from 'express';
import importService from '../services/import.service';
import logger from '../utils/logger';

export class ImportController {
  /**
   * Trigger new import
   */
  async triggerImport(req: Request, res: Response) {
    try {
      const { triggeredBy = 'manual', importType = 'full' } = req.body;

      logger.info('Import triggered via API');

      const importLogs = await importService.triggerImport({
        triggeredBy,
        importType,
      });

      res.status(202).json({
        success: true,
        message: 'Import started successfully',
        data: importLogs,
      });
    } catch (error: any) {
      logger.error('Import trigger failed:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to trigger import',
      });
    }
  }

  /**
   * Get import history
   */
  async getHistory(req: Request, res: Response) {
    try {
      const {
        status,
        fileName,
        startDate,
        endDate,
        page = '1',
        limit = '20',
      } = req.query;

      const result = await importService.getImportHistory({
        status: status as string,
        fileName: fileName as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      });

      res.json({
        success: true,
        data: result.logs,
        pagination: result.pagination,
      });
    } catch (error: any) {
      logger.error('Failed to get import history:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get import history',
      });
    }
  }

  /**
   * Get import by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const importLog = await importService.getImportById(id);

      if (!importLog) {
        return res.status(404).json({
          success: false,
          message: 'Import log not found',
        });
      }

      res.json({
        success: true,
        data: importLog,
      });
    } catch (error: any) {
      logger.error('Failed to get import:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get import',
      });
    }
  }

  /**
   * Get import statistics
   */
  async getStats(req: Request, res: Response) {
    try {
      const stats = await importService.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Failed to get stats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get stats',
      });
    }
  }
}

export default new ImportController();
