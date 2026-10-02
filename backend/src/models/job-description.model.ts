import mongoose, { Document, Schema } from 'mongoose';

export interface IExtractedJobData {
  requiredSkills: string[];
  responsibilities: string[];
  experience: string[];
  education?: string;
}

export interface IJobDescription extends Document {
  userId: mongoose.Types.ObjectId;
  jobTitle: string;
  company: string;
  rawContent: string;
  fileName?: string; // set when created from an uploaded file
  fileSize?: number;
  extractedData: IExtractedJobData;
  uploadedAt: Date;
  updatedAt: Date;
}

const JobDescriptionSchema = new Schema<IJobDescription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [200, 'Job title cannot exceed 200 characters'],
    },
    company: {
      type: String,
      required: [true, 'Company is required'],
      trim: true,
      maxlength: [200, 'Company cannot exceed 200 characters'],
    },
    // Job posting text exactly as submitted
    rawContent: {
      type: String,
      required: [true, 'Job description content is required'],
    },
    // Original upload metadata (absent when created from pasted text)
    fileName: { type: String, trim: true },
    fileSize: { type: Number, min: [0, 'File size cannot be negative'] },
    // Structured data extracted from rawContent
    extractedData: {
      requiredSkills: { type: [String], default: [] },
      responsibilities: { type: [String], default: [] },
      experience: { type: [String], default: [] },
      education: { type: String, trim: true },
    },
  },
  {
    timestamps: { createdAt: 'uploadedAt', updatedAt: 'updatedAt' },
  }
);

JobDescriptionSchema.index({ userId: 1 });
JobDescriptionSchema.index({ uploadedAt: -1 });

export const JobDescription = mongoose.model<IJobDescription>(
  'JobDescription',
  JobDescriptionSchema
);
