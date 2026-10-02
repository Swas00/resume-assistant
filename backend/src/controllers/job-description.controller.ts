import { Response, NextFunction } from 'express';
import path from 'path';
import { AuthenticatedRequest } from '../types/auth.types';
import { JobDescription } from '../models';
import { extractTextFromFile } from '../services/file-extraction.service';
import { logger } from '../utils/logger';
import { removeTempFile } from '../utils/file';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

export class JobDescriptionController {
  /**
   * Upload a job description (PDF or DOCX).
   * Multipart form data: file (field 'job'), plus text fields `jobTitle` and `company`.
   */
  static async uploadJob(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const file = req.file;
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }

      // The model requires both; they can't be read from a PDF/DOCX reliably
      const { jobTitle, company } = req.body as { jobTitle?: string; company?: string };
      if (!jobTitle?.trim() || !company?.trim()) {
        res.status(400).json({
          success: false,
          message: 'jobTitle and company are required',
        });
        return;
      }

      const { originalname, size } = file;
      const userId = req.user.id;
      const ext = path.extname(originalname).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        res.status(400).json({ success: false, message: 'Only PDF and DOCX files are allowed' });
        return;
      }

      logger.info(`Uploading job description: ${originalname} (${size} bytes) for user ${userId}`);

      let rawContent: string;
      try {
        rawContent = await extractTextFromFile(file.path, ext === '.pdf' ? 'pdf' : 'docx');
      } catch (extractError) {
        logger.error(`Text extraction failed for ${originalname}:`, extractError);
        res.status(400).json({
          success: false,
          message:
            extractError instanceof Error
              ? extractError.message
              : 'Failed to extract text from file',
        });
        return;
      }

      const jobDescription = await JobDescription.create({
        userId,
        jobTitle: jobTitle.trim(),
        company: company.trim(),
        rawContent,
        fileName: originalname,
        fileSize: size,
      });

      logger.info(`Job description saved: ${jobDescription._id}`);

      res.status(201).json({
        success: true,
        message: 'Job description uploaded successfully',
        jobId: jobDescription._id,
        jobTitle: jobDescription.jobTitle,
        company: jobDescription.company,
        fileName: jobDescription.fileName,
        fileSize: jobDescription.fileSize,
        uploadedAt: jobDescription.uploadedAt,
      });
    } catch (error) {
      logger.error('Error uploading job description:', error);
      next(error);
    } finally {
      removeTempFile(file?.path);
    }
  }

  /** Get all job descriptions for the authenticated user (newest first, without raw text). */
  static async getJobs(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const userId = req.user.id;

      const jobs = await JobDescription.find({ userId })
        .select('-rawContent')
        .sort({ uploadedAt: -1 });

      logger.info(`Retrieved ${jobs.length} jobs for user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Jobs retrieved successfully',
        count: jobs.length,
        data: jobs,
      });
    } catch (error) {
      logger.error('Error retrieving jobs:', error);
      next(error);
    }
  }

  /** Get a single job description (scoped to the owner). */
  static async getJobById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const { jobId } = req.params;
      const userId = req.user.id;

      const job = await JobDescription.findOne({ _id: jobId, userId });
      if (!job) {
        res.status(404).json({ success: false, message: 'Job description not found' });
        return;
      }

      logger.info(`Retrieved job ${jobId} for user ${userId}`);

      res.status(200).json({ success: true, message: 'Job retrieved successfully', data: job });
    } catch (error) {
      logger.error('Error retrieving job:', error);
      next(error);
    }
  }

  /** Delete a job description (scoped to the owner). */
  static async deleteJob(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const { jobId } = req.params;
      const userId = req.user.id;

      const job = await JobDescription.findOneAndDelete({ _id: jobId, userId });
      if (!job) {
        res.status(404).json({ success: false, message: 'Job description not found' });
        return;
      }

      logger.info(`Deleted job ${jobId} for user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Job description deleted successfully',
        jobId: job._id,
      });
    } catch (error) {
      logger.error('Error deleting job:', error);
      next(error);
    }
  }
}
