import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'socket.io';
import http from 'http';
import config from './config';
import { connectDatabase } from './config/database';
import logger from './utils/logger';
import queueWorker from './workers/queue.worker';
import importCron from './jobs/import.cron';
import importRoutes from './routes/import.routes';
import jobRoutes from './routes/job.routes';
import healthRoutes from './routes/health.routes';

class App {
  public app: Application;
  public server: http.Server;
  public io: Server;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: config.cors.origin,
        methods: ['GET', 'POST'],
      },
    });

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeSocketIO();
  }

  private initializeMiddlewares(): void {
    this.app.use(helmet());
    this.app.use(cors({ origin: config.cors.origin }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
  }

  private initializeRoutes(): void {
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        message: 'Job Importer API',
        version: '1.0.0',
        endpoints: {
          import: '/api/import',
          jobs: '/api/jobs',
          health: '/api/health',
        },
      });
    });

    this.app.use('/api/import', importRoutes);
    this.app.use('/api/jobs', jobRoutes);
    this.app.use('/api/health', healthRoutes);
  }

  private initializeErrorHandling(): void {
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ success: false, message: 'Route not found' });
    });

    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('Unhandled error:', err);
      res.status(500).json({
        success: false,
        message: config.server.env === 'production' ? 'Internal server error' : err.message,
      });
    });
  }

  private initializeSocketIO(): void {
    // Make io accessible globally
    (global as any).io = this.io;

    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await connectDatabase();

      // Initialize queue worker
      queueWorker.init();

      // Start cron job
      importCron.start();

      // Start server
      this.server.listen(config.server.port, () => {
        logger.info(`🚀 Server running on port ${config.server.port}`);
        logger.info(`📝 Environment: ${config.server.env}`);
        logger.info(`🔗 CORS origin: ${config.cors.origin}`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

const app = new App();
app.start();

export default app;
