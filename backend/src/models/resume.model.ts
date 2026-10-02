import mongoose, { Document, Schema } from 'mongoose';

export interface IParsedResumeData {
  name?: string;
  email?: string;
  phone?: string;
  skills: string[];
  experiences: Record<string, unknown>[];
  education: Record<string, unknown>[];
  certifications: Record<string, unknown>[]; // { name, issuer?, date? }
}

export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;
  fileName: string;
  originalContent: string;
  parsedData: IParsedResumeData;
  fileType: 'pdf' | 'docx';
  fileSize?: number;
  uploadedAt: Date; // timestamps createdAt, renamed
  updatedAt: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    // Raw text extracted from the uploaded file. Empty until text extraction runs
    // (Mongoose's `required` rejects '', so it is defaulted instead).
    originalContent: {
      type: String,
      default: '',
    },
    // Structured data extracted from the raw text
    parsedData: {
      name: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
      skills: { type: [String], default: [] },
      experiences: { type: [Schema.Types.Mixed], default: [] },
      education: { type: [Schema.Types.Mixed], default: [] },
      certifications: { type: [Schema.Types.Mixed], default: [] },
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx'],
      default: 'pdf',
    },
    fileSize: {
      type: Number,
      min: [0, 'File size cannot be negative'],
    },
  },
  {
    // createdAt doubles as the upload time
    timestamps: { createdAt: 'uploadedAt', updatedAt: 'updatedAt' },
  }
);

ResumeSchema.index({ userId: 1 });
ResumeSchema.index({ uploadedAt: -1 });

// Cascade delete: removing a resume removes the tailored resumes generated from it.
// Covers doc.deleteOne() and Model.findOneAndDelete()/findByIdAndDelete().
// Late-bound model lookup avoids a circular import with GeneratedResume.
ResumeSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    await mongoose.model('GeneratedResume').deleteMany({ resumeId: this._id });
    next();
  } catch (error) {
    next(error as Error);
  }
});

ResumeSchema.pre('findOneAndDelete', async function (next) {
  try {
    const doc = await this.model.findOne(this.getFilter()).select('_id').lean<{ _id: unknown }>();
    if (doc) await mongoose.model('GeneratedResume').deleteMany({ resumeId: doc._id });
    next();
  } catch (error) {
    next(error as Error);
  }
});

export const Resume = mongoose.model<IResume>('Resume', ResumeSchema);
