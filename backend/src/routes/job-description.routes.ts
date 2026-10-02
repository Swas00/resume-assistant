import { Router } from 'express';
import { JobDescriptionController } from '../controllers/job-description.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();

// All routes require authentication (auth runs before multer, so nothing is written for anonymous requests)
router.use(verifyToken);

/**
 * POST /api/jobs/upload
 * Multipart form data: file (field name: 'job'), text fields: jobTitle, company
 */
router.post('/upload', uploadMiddleware.single('job'), JobDescriptionController.uploadJob);
router.get('/', JobDescriptionController.getJobs);
router.get('/:jobId', JobDescriptionController.getJobById);
router.delete('/:jobId', JobDescriptionController.deleteJob);

export const jobDescriptionRoutes = router;
