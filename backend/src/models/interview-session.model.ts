import mongoose, { Document, Schema } from 'mongoose';

export interface IInterviewMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IAnswerScore {
  questionIndex: number;
  score: number;
  feedback?: string;
}

export interface IInterviewSession extends Document {
  userId: mongoose.Types.ObjectId;
  jobRole: string;
  company?: string;
  messages: IInterviewMessage[];
  overallScore?: number;
  answerScores: IAnswerScore[];
  transcript?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IInterviewMessage>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AnswerScoreSchema = new Schema<IAnswerScore>(
  {
    questionIndex: { type: Number, required: true, min: 0 },
    score: { type: Number, required: true, min: 0, max: 100 },
    feedback: { type: String, default: '' },
  },
  { _id: false }
);

const InterviewSessionSchema = new Schema<IInterviewSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },
    // e.g. 'Senior Developer'
    jobRole: {
      type: String,
      required: [true, 'Job role is required'],
      trim: true,
      maxlength: [200, 'Job role cannot exceed 200 characters'],
    },
    company: { type: String, trim: true },
    messages: { type: [MessageSchema], default: [] },
    overallScore: {
      type: Number,
      min: [0, 'Overall score cannot be below 0'],
      max: [100, 'Overall score cannot exceed 100'],
    },
    answerScores: { type: [AnswerScoreSchema], default: [] },
    // Full conversation as plain text
    transcript: { type: String, default: '' },
  },
  { timestamps: true }
);

InterviewSessionSchema.index({ userId: 1 });
InterviewSessionSchema.index({ createdAt: -1 });

export const InterviewSession = mongoose.model<IInterviewSession>(
  'InterviewSession',
  InterviewSessionSchema
);
