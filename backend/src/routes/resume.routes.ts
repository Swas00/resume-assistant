import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';
import {
  uploadResume,
  getResumes,
  getResumeById,
  deleteResume,
} from '../controllers/resume.controller';

const router = Router();

// All routes require authentication
router.use(verifyToken);

/**
 * POST /api/resumes/upload
 * Upload a new resume (PDF or DOCX)
 * Multipart form data: file (field name: 'resume')
 * Returns: 201 with resume metadata
 */
router.post('/upload', uploadMiddleware.single('resume'), uploadResume);

/**
 * GET /api/resumes
 * Get all resumes for authenticated user
 * Returns: 200 with array of resumes
 */
router.get('/', getResumes);

/**
 * GET /api/resumes/:resumeId
 * Get single resume by ID
 * Returns: 200 with resume data, 404 if not found
 */
router.get('/:resumeId', getResumeById);

/**
 * DELETE /api/resumes/:resumeId
 * Delete a resume (cascades to generated resumes)
 * Returns: 200 on success
 */
router.delete('/:resumeId', deleteResume);

export default router;
