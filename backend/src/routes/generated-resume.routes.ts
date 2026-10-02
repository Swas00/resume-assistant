import { Router } from 'express';
import { GeneratedResumeController } from '../controllers/generated-resume.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * Generated Resume Routes
 * All routes require authentication
 */
router.use(verifyToken);

// POST /api/generated-resumes/tailor - Generate tailored resume
router.post('/tailor', GeneratedResumeController.tailorResume);

// GET /api/generated-resumes - Get all generated resumes for user
router.get('/', GeneratedResumeController.getGeneratedResumes);

// GET /api/generated-resumes/:generatedResumeId - Get specific generated resume
router.get('/:generatedResumeId', GeneratedResumeController.getGeneratedResumeById);

// DELETE /api/generated-resumes/:generatedResumeId - Delete generated resume
router.delete('/:generatedResumeId', GeneratedResumeController.deleteGeneratedResume);

export const generatedResumeRoutes = router;
