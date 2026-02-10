import { Server, Socket } from 'socket.io';
import logger from '../utils/logger';

export class SocketHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });

      socket.on('import:cancel', () => {
        logger.info(`Import cancelled by client: ${socket.id}`);
        // Emit cancellation event to all connected clients
        this.io.emit('import:cancelled', {
          message: 'Import cancelled by user',
        });
      });
    });
  }

  /**
   * Emit import progress update
   */
  emitProgress(data: {
    importLogId: string;
    processed: number;
    total: number;
    status: string;
  }): void {
    this.io.emit('import:progress', data);
    logger.debug('Progress update emitted:', data);
  }

  /**
   * Emit import completion
   */
  emitComplete(data: {
    importLogId: string;
    totalImported: number;
    newJobs: number;
    updatedJobs: number;
    failedJobs: number;
    duration: number;
  }): void {
    this.io.emit('import:complete', data);
    logger.info('Import completion emitted:', data);
  }

  /**
   * Emit import failure
   */
  emitFailed(data: {
    importLogId: string;
    error: string;
  }): void {
    this.io.emit('import:failed', data);
    logger.error('Import failure emitted:', data);
  }

  /**
   * Emit job processed event
   */
  emitJobProcessed(data: {
    importLogId: string;
    jobTitle: string;
    isNew: boolean;
  }): void {
    this.io.emit('job:processed', data);
  }

  /**
   * Emit error event
   */
  emitError(data: {
    importLogId: string;
    jobTitle?: string;
    error: string;
  }): void {
    this.io.emit('import:error', data);
  }
}

export default SocketHandler;
