import { Response, NextFunction } from 'express';
import path from 'path';
import { Resume } from '../models';
import { AuthenticatedRequest } from '../types/auth.types';
import { logger } from '../utils/logger';
import { removeTempFile } from '../utils/file';
import { extractTextFromFile } from '../services/file-extraction.service';
import {
  callResumeParsing,
  updateResumeWithParsedData,
} from '../services/resume-parsing.service';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Upload a resume (PDF or DOCX file)
 * - Expects multer to have saved the file to disk (req.file)
 * - Validates type and size
 * - Extracts text from the file and stores the resume record in MongoDB
 * - Sends the text to the AI service for parsing (failure doesn't fail the upload)
 * - Removes the temp file and returns resume metadata
 */
export const uploadResume = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype) || !ALLOWED_EXTENSIONS.includes(fileExtension)) {
      res.status(400).json({ success: false, message: 'Only PDF and DOCX files are allowed' });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      res.status(400).json({ success: false, message: 'File size exceeds 5MB limit' });
      return;
    }

    const userId = req.user.id;
    const fileType = fileExtension === '.pdf' ? 'pdf' : 'docx';

    // Extract the raw text; an unreadable/empty file is a client error, not a 500
    let originalContent: string;
    try {
      originalContent = await extractTextFromFile(file.path, fileType);
    } catch (extractionError) {
      res.status(422).json({
        success: false,
        message:
          extractionError instanceof Error
            ? extractionError.message
            : 'Could not extract text from file',
      });
      return;
    }

    // parsedData starts with schema defaults; it is filled in by the parsing step below
    const resume = await Resume.create({
      userId,
      fileName: file.originalname,
      originalContent,
      fileType,
      fileSize: file.size,
    });

    logger.info(`Resume uploaded: ${file.originalname} by user ${userId}`);

    // Call the Python AI service to parse the text. Parsing is non-critical:
    // if it fails the resume is still stored and the upload still succeeds.
    let parsed = false;
    try {
      logger.info('Sending to AI Service for parsing...');
      const parsedData = await callResumeParsing(originalContent);
      await updateResumeWithParsedData(resume._id.toString(), parsedData);
      parsed = true;
      logger.info(`Resume parsing complete. Confidence: ${parsedData.confidence}`);
    } catch (parsingError) {
      logger.error('Parsing failed (non-critical):', parsingError);
    }

    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      parsed,
      resume: {
        id: resume._id,
        fileName: resume.fileName,
        fileType: resume.fileType,
        fileSize: resume.fileSize,
        uploadedAt: resume.uploadedAt,
      },
    });
  } catch (error) {
    logger.error('Resume upload error:', error);
    next(error);
  } finally {
    // Temp file is removed on every path: success, validation failure or error
    removeTempFile(file?.path);
  }
};

/**
 * Get all resumes for the authenticated user (newest first).
 * The raw text is omitted from the list; fetch a single resume for it.
 */
export const getResumes = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const resumes = await Resume.find({ userId: req.user.id })
      .select('-originalContent')
      .sort({ uploadedAt: -1 });

    res.status(200).json({ success: true, resumes });
  } catch (error) {
    logger.error('Get resumes error:', error);
    next(error);
  }
};

/**
 * Get single resume by ID
 */
export const getResumeById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const resume = await Resume.findById(req.params.resumeId);
    if (!resume) {
      res.status(404).json({ success: false, message: 'Resume not found' });
      return;
    }

    if (resume.userId.toString() !== req.user.id) {
      res.status(403).json({ success: false, message: 'Not authorized to access this resume' });
      return;
    }

    res.status(200).json({ success: true, resume });
  } catch (error) {
    logger.error('Get resume error:', error);
    next(error);
  }
};

/**
 * Delete resume (cascades to its GeneratedResumes via the model hook)
 */
export const deleteResume = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { resumeId } = req.params;
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      res.status(404).json({ success: false, message: 'Resume not found' });
      return;
    }

    if (resume.userId.toString() !== req.user.id) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this resume' });
      return;
    }

    await Resume.findByIdAndDelete(resumeId);
    logger.info(`Resume deleted: ${resumeId}`);

    res.status(200).json({ success: true, message: 'Resume deleted successfully' });
  } catch (error) {
    logger.error('Delete resume error:', error);
    next(error);
  }
};
