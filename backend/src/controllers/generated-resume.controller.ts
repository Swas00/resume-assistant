import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../types/auth.types';
import { GeneratedResume, Resume, JobDescription } from '../models';
import { MatchingService } from '../services/matching.service';
import { aiSuggestionsService } from '../services/ai-suggestions.service';
import { logger } from '../utils/logger';

export class GeneratedResumeController {
  /**
   * Generate tailored resume suggestions for a specific job
   * POST /api/generated-resumes/tailor
   * Body: { resumeId, jobId }
   */
  static async tailorResume(
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
      const { resumeId, jobId } = req.body as { resumeId?: string; jobId?: string };

      if (!resumeId || !jobId) {
        res.status(400).json({ success: false, message: 'resumeId and jobId are required' });
        return;
      }
      if (!mongoose.isValidObjectId(resumeId) || !mongoose.isValidObjectId(jobId)) {
        res.status(400).json({ success: false, message: 'Invalid resumeId or jobId' });
        return;
      }

      logger.info(`Tailoring resume ${resumeId} for job ${jobId}`);

      // Both lookups are scoped to the user, so nobody can tailor against another user's data
      const resume = await Resume.findOne({ _id: resumeId, userId });
      if (!resume) {
        res.status(404).json({ success: false, message: 'Resume not found' });
        return;
      }

      const job = await JobDescription.findOne({ _id: jobId, userId });
      if (!job) {
        res.status(404).json({ success: false, message: 'Job not found' });
        return;
      }

      // Step 1: Calculate match score
      const matchResult = await MatchingService.matchResumeToJob(resumeId, jobId, userId);

      // Step 2: Generate AI suggestions
      const ai = await aiSuggestionsService.generateSuggestions(
        matchResult,
        resume.originalContent,
        job.rawContent
      );

      // Step 3: Store the result
      const generatedResume = await GeneratedResume.create({
        userId,
        resumeId,
        jobDescriptionId: jobId,
        matchScore: matchResult.matchScore,
        gaps: matchResult.skillGaps,
        exactMatches: matchResult.exactMatches,
        suggestions: ai.suggestions.map((s) => ({
          category: s.category,
          priority: s.priority,
          title: s.title,
          description: s.description,
          example: s.example,
          // Mirror into the generic fields so they stay meaningful on their own
          suggested: s.example ?? '',
          reason: s.description,
        })),
        tailoredBulletPoints: ai.tailoredBulletPoints,
        tailoredContent: ai.tailoredBulletPoints.map((b) => `- ${b}`).join('\n'),
        coverLetterSnippet: ai.coverLetterSnippet,
        strengthsSummary: matchResult.strengthsSummary,
        improvementSummary: matchResult.improvementSummary,
      });

      logger.info(`Generated tailored resume: ${generatedResume._id}`);

      res.status(201).json({
        success: true,
        message: 'Tailored resume generated successfully',
        data: {
          generatedResumeId: generatedResume._id,
          matchScore: generatedResume.matchScore,
          strengths: generatedResume.strengthsSummary,
          improvements: generatedResume.improvementSummary,
          recommendations: matchResult.recommendations,
          exactMatches: generatedResume.exactMatches,
          skillGaps: generatedResume.gaps,
          suggestions: generatedResume.suggestions,
          tailoredBullets: generatedResume.tailoredBulletPoints,
          coverLetterSnippet: generatedResume.coverLetterSnippet,
        },
      });
    } catch (error) {
      logger.error('Error tailoring resume:', error);
      next(error);
    }
  }

  /**
   * Get all generated resumes for user (list view, without the detailed suggestions)
   * GET /api/generated-resumes
   */
  static async getGeneratedResumes(
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

      const resumes = await GeneratedResume.find({ userId })
        .sort({ createdAt: -1 })
        .select('-suggestions');

      logger.info(`Retrieved ${resumes.length} generated resumes for user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Generated resumes retrieved successfully',
        count: resumes.length,
        data: resumes,
      });
    } catch (error) {
      logger.error('Error retrieving generated resumes:', error);
      next(error);
    }
  }

  /**
   * Get specific generated resume with full details
   * GET /api/generated-resumes/:generatedResumeId
   */
  static async getGeneratedResumeById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const { generatedResumeId } = req.params;

      const generated = await GeneratedResume.findOne({
        _id: generatedResumeId,
        userId: req.user.id,
      });
      if (!generated) {
        res.status(404).json({ success: false, message: 'Generated resume not found' });
        return;
      }

      logger.info(`Retrieved generated resume ${generatedResumeId}`);

      res.status(200).json({
        success: true,
        message: 'Generated resume retrieved successfully',
        data: generated,
      });
    } catch (error) {
      logger.error('Error retrieving generated resume:', error);
      next(error);
    }
  }

  /**
   * Delete generated resume
   * DELETE /api/generated-resumes/:generatedResumeId
   */
  static async deleteGeneratedResume(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const { generatedResumeId } = req.params;

      const deleted = await GeneratedResume.findOneAndDelete({
        _id: generatedResumeId,
        userId: req.user.id,
      });
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Generated resume not found' });
        return;
      }

      logger.info(`Deleted generated resume ${generatedResumeId}`);

      res.status(200).json({
        success: true,
        message: 'Generated resume deleted successfully',
        generatedResumeId: deleted._id,
      });
    } catch (error) {
      logger.error('Error deleting generated resume:', error);
      next(error);
    }
  }
}
