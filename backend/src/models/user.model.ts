import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  phone?: string;
  subscriptionTier: 'free' | 'pro' | 'premium';
  stripeCustomerId?: string;
  emailVerified: boolean;
  verificationToken?: string | null;
  verificationTokenExpiry?: Date | null;
  refreshToken?: string | null;
  refreshTokenExpiry?: Date | null;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    phone: {
      type: String,
      trim: true,
    },
    // Billing plan; drives feature limits
    subscriptionTier: {
      type: String,
      enum: ['free', 'pro', 'premium'],
      default: 'free',
    },
    stripeCustomerId: {
      type: String,
      trim: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    // Secrets below are hidden from queries by default (select: false);
    // filtering on them in a query still works.
    verificationToken: { type: String, select: false },
    verificationTokenExpiry: { type: Date, select: false },
    refreshToken: { type: String, select: false },
    refreshTokenExpiry: { type: Date, select: false },
    resetToken: { type: String, select: false },
    resetTokenExpiry: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Partial<IUser> & { __v?: number }) => {
        delete ret.password;
        delete ret.verificationToken;
        delete ret.verificationTokenExpiry;
        delete ret.refreshToken;
        delete ret.refreshTokenExpiry;
        delete ret.resetToken;
        delete ret.resetTokenExpiry;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// email is already indexed via `unique: true`; add createdAt for sorting
UserSchema.index({ createdAt: -1 });

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password helper method
UserSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
