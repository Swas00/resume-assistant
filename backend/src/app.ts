import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env';
import apiRoutes from './routes';
import { errorHandler, AppError } from './middleware/error.middleware';

export function createApp(): Application {
  const app: Application = express();

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, true); // Permissive in development
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Request logging
  if (config.nodeEnv !== 'test') {
    app.use(morgan(config.isProduction ? 'combined' : 'dev'));
  }

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Root welcome & health route
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      message: 'Antigravity Express Backend API is running',
      version: '1.0.0',
      docs: '/api/v1/health',
    });
  });

  // Mount API router
  app.use('/api', apiRoutes);
  app.use('/api/v1', apiRoutes);

  // 404 Route Handler
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(`Endpoint not found - ${req.originalUrl}`, 404));
  });

  // Central Error Handling Middleware
  app.use(errorHandler);

  return app;
}
