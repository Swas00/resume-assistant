import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import itemRoutes from './item.routes';
import resumeRoutes from './resume.routes';
import { jobDescriptionRoutes } from './job-description.routes';
import { generatedResumeRoutes } from './generated-resume.routes';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'backend-express',
  });
});

// Mount modular sub-routers under /api/v1
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/items', itemRoutes);
router.use('/resumes', resumeRoutes);
router.use('/jobs', jobDescriptionRoutes);
router.use('/generated-resumes', generatedResumeRoutes);

export default router;
