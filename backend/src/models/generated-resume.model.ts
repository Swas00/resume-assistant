import mongoose, { Document, Schema } from 'mongoose';

export interface ISuggestion {
  category: string;
  original: string;
  suggested: string;
  reason: string;
  // Present on AI-generated suggestions
  priority?: 'high' | 'medium' | 'low';
  title?: string;
  description?: string;
  example?: string;
}

export interface IGeneratedResume extends Document {
  resumeId: mongoose.Types.ObjectId;
  jobDescriptionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  matchScore: number;
  tailoredContent: string;
  suggestions: ISuggestion[];
  gaps: string[];
  // Match analysis and AI output stored alongside the score
  exactMatches: string[];
  tailoredBulletPoints: string[];
  coverLetterSnippet?: string;
  strengthsSummary?: string;
  improvementSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SuggestionSchema = new Schema<ISuggestion>(
  {
    category: { type: String, required: true, trim: true }, // e.g. 'skills', 'experience'
    original: { type: String, default: '' },
    suggested: { type: String, default: '' },
    reason: { type: String, default: '' },
    priority: { type: String, enum: ['high', 'medium', 'low'] },
    title: { type: String, trim: true },
    description: { type: String },
    example: { type: String },
  },
  { _id: false }
);

const GeneratedResumeSchema = new Schema<IGeneratedResume>(
  {
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
      required: [true, 'resumeId is required'],
    },
    jobDescriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'JobDescription',
      required: [true, 'jobDescriptionId is required'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },
    // How well the resume matches the job, 0-100
    matchScore: {
      type: Number,
      min: [0, 'Match score cannot be below 0'],
      max: [100, 'Match score cannot exceed 100'],
      default: 0,
    },
    // The improved resume text
    tailoredContent: {
      type: String,
      default: '',
    },
    suggestions: { type: [SuggestionSchema], default: [] },
    // Missing skills/experience relative to the job description
    gaps: { type: [String], default: [] },
    exactMatches: { type: [String], default: [] },
    tailoredBulletPoints: { type: [String], default: [] },
    coverLetterSnippet: { type: String },
    strengthsSummary: { type: String },
    improvementSummary: { type: String },
  },
  { timestamps: true }
);

GeneratedResumeSchema.index({ resumeId: 1 });
GeneratedResumeSchema.index({ jobDescriptionId: 1 });
GeneratedResumeSchema.index({ userId: 1 });

export const GeneratedResume = mongoose.model<IGeneratedResume>(
  'GeneratedResume',
  GeneratedResumeSchema
);
