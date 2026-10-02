import mongoose, { Document, Schema } from 'mongoose';

export interface IItem extends Document {
  title: string;
  description?: string;
  category: string;
  status: 'active' | 'archived' | 'draft';
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IItem>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      default: 'general',
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'draft'],
      default: 'active',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Item = mongoose.model<IItem>('Item', ItemSchema);
