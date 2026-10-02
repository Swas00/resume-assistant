import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { User } from '../models';
import { AppError } from '../middleware/error.middleware';
import { sendSuccess } from '../utils/response';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import {
  JwtPayload,
  AuthResponse,
  SignupRequest,
  LoginRequest,
  RefreshTokenRequest,
  LogoutRequest,
  VerifyEmailRequest,
  RequestResetPasswordRequest,
  ResetPasswordRequest,
} from '../types/auth.types';

const ONE_HOUR_MS = 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * ONE_HOUR_MS;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Random hex token for email verification / password reset
const generateToken = (length: number = 32): string =>
  crypto.randomBytes(length).toString('hex');

// Short-lived access JWT (same secret/expiry the auth middleware verifies with)
const generateJWT = (userId: string, email: string, role?: string): string => {
  const payload: JwtPayload = { id: userId, email, role };
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
};

// Long-lived opaque refresh token
const generateRefreshToken = (length: number = 64): string =>
  crypto.randomBytes(length).toString('hex');

// SMTP settings come from .env
const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE || 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const frontendUrl = (): string => process.env.FRONTEND_URL || 'http://localhost:3000';

const getVerificationEmailHTML = (token: string): string => {
  const verificationLink = `${frontendUrl()}/verify-email?token=${token}`;
  return `
    <h1>Verify Your Email</h1>
    <p>Click the link below to verify your email address:</p>
    <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
      Verify Email
    </a>
    <p>Or copy this link: ${verificationLink}</p>
    <p>This link expires in 1 hour.</p>
  `;
};

const getResetPasswordEmailHTML = (token: string): string => {
  const resetLink = `${frontendUrl()}/reset-password?token=${token}`;
  return `
    <h1>Reset Your Password</h1>
    <p>Click the link below to reset your password:</p>
    <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
      Reset Password
    </a>
    <p>Or copy this link: ${resetLink}</p>
    <p>This link expires in 1 hour.</p>
  `;
};

// ---------------------------------------------------------------------------
// 1. Signup
// ---------------------------------------------------------------------------

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name } = req.body as SignupRequest;

    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        message: 'Email, password, and name are required',
      } satisfies AuthResponse);
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({ success: false, message: 'Invalid email format' } satisfies AuthResponse);
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      } satisfies AuthResponse);
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email already registered' } satisfies AuthResponse);
      return;
    }

    const verificationToken = generateToken();

    // Password is hashed by the User pre-save hook
    const newUser = new User({
      email: email.toLowerCase(),
      password,
      name,
      subscriptionTier: 'free',
      emailVerified: false,
      verificationToken,
      verificationTokenExpiry: new Date(Date.now() + ONE_HOUR_MS),
    });
    await newUser.save();
    logger.info(`User registered: ${newUser.email}`);

    const token = generateJWT(newUser._id.toString(), newUser.email, newUser.role);

    // Don't fail signup if the email can't be sent
    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: newUser.email,
        subject: 'Verify Your Resume Assistant Email',
        html: getVerificationEmailHTML(verificationToken),
      });
      logger.info(`Verification email sent to: ${newUser.email}`);
    } catch (emailError) {
      logger.error('Verification email send failed:', emailError);
    }

    const body: AuthResponse = {
      success: true,
      message: 'Signup successful. Check your email to verify.',
      token,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        subscriptionTier: newUser.subscriptionTier,
        emailVerified: newUser.emailVerified,
      },
    };
    res.status(201).json(body);
  } catch (error) {
    logger.error('Signup error:', error);
    next(error);
  }
};

// ---------------------------------------------------------------------------
// 2. Login
// ---------------------------------------------------------------------------

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body as LoginRequest;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      } satisfies AuthResponse);
      return;
    }

    // password is select:false on the model, so request it explicitly
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' } satisfies AuthResponse);
      return;
    }

    // Check the password first so unverified status isn't revealed to guessers
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ success: false, message: 'Invalid email or password' } satisfies AuthResponse);
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
      } satisfies AuthResponse);
      return;
    }

    const token = generateJWT(user._id.toString(), user.email, user.role);
    const newRefreshToken = generateRefreshToken();

    user.refreshToken = newRefreshToken;
    user.refreshTokenExpiry = new Date(Date.now() + THIRTY_DAYS_MS);
    await user.save();

    logger.info(`User logged in: ${user.email}`);

    const body: AuthResponse = {
      success: true,
      message: 'Login successful',
      token,
      refreshToken: newRefreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        subscriptionTier: user.subscriptionTier,
        emailVerified: user.emailVerified,
      },
    };
    res.status(200).json(body);
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

// ---------------------------------------------------------------------------
// 3. Refresh token
// ---------------------------------------------------------------------------

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body as RefreshTokenRequest;

    if (!token) {
      res.status(400).json({ success: false, message: 'Refresh token is required' } satisfies AuthResponse);
      return;
    }

    // refreshTokenExpiry is select:false, so request it explicitly
    const user = await User.findOne({ refreshToken: token }).select('+refreshTokenExpiry');
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid refresh token' } satisfies AuthResponse);
      return;
    }

    if (!user.refreshTokenExpiry || user.refreshTokenExpiry < new Date()) {
      res.status(401).json({ success: false, message: 'Refresh token expired' } satisfies AuthResponse);
      return;
    }

    const newToken = generateJWT(user._id.toString(), user.email, user.role);
    logger.info(`Token refreshed for: ${user.email}`);

    const body: AuthResponse = { success: true, message: 'Token refreshed', token: newToken };
    res.status(200).json(body);
  } catch (error) {
    logger.error('Refresh token error:', error);
    next(error);
  }
};

// ---------------------------------------------------------------------------
// 4. Logout
// ---------------------------------------------------------------------------

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body as LogoutRequest;

    if (!token) {
      res.status(400).json({ success: false, message: 'Refresh token is required' } satisfies AuthResponse);
      return;
    }

    const user = await User.findOneAndUpdate(
      { refreshToken: token },
      { refreshToken: null, refreshTokenExpiry: null },
      { new: true }
    );

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid refresh token' } satisfies AuthResponse);
      return;
    }

    logger.info(`User logged out: ${user.email}`);
    res.status(200).json({ success: true, message: 'Logged out successfully' } satisfies AuthResponse);
  } catch (error) {
    logger.error('Logout error:', error);
    next(error);
  }
};

// ---------------------------------------------------------------------------
// 5. Verify email
// ---------------------------------------------------------------------------

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Token can come from the query string or the body
    const token =
      (typeof req.query.token === 'string' ? req.query.token : undefined) ||
      (req.body as Partial<VerifyEmailRequest> | undefined)?.token;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ success: false, message: 'Verification token is required' } satisfies AuthResponse);
      return;
    }

    // verificationTokenExpiry is select:false, so request it explicitly
    const user = await User.findOne({ verificationToken: token }).select('+verificationTokenExpiry');
    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid verification token' } satisfies AuthResponse);
      return;
    }

    if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
      res.status(410).json({
        success: false,
        message: 'Verification token expired. Request a new one.',
      } satisfies AuthResponse);
      return;
    }

    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    logger.info(`Email verified: ${user.email}`);
    res.status(200).json({ success: true, message: 'Email verified successfully' } satisfies AuthResponse);
  } catch (error) {
    logger.error('Email verification error:', error);
    next(error);
  }
};

// ---------------------------------------------------------------------------
// 6. Request password reset
// ---------------------------------------------------------------------------

export const requestResetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body as RequestResetPasswordRequest;

    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, message: 'Email is required' } satisfies AuthResponse);
      return;
    }

    // Same response whether or not the account exists, so emails can't be enumerated
    const genericResponse: AuthResponse = {
      success: true,
      message: 'If email exists, reset link will be sent',
    };

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(200).json(genericResponse);
      return;
    }

    const resetToken = generateToken();
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + ONE_HOUR_MS);
    await user.save();

    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: user.email,
        subject: 'Reset Your Resume Assistant Password',
        html: getResetPasswordEmailHTML(resetToken),
      });
      logger.info(`Password reset email sent to: ${user.email}`);
    } catch (emailError) {
      logger.error('Reset email send failed:', emailError);
    }

    res.status(200).json(genericResponse);
  } catch (error) {
    logger.error('Request reset password error:', error);
    next(error);
  }
};

// ---------------------------------------------------------------------------
// 7. Reset password
// ---------------------------------------------------------------------------

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, newPassword } = req.body as ResetPasswordRequest;

    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Token and new password are required',
      } satisfies AuthResponse);
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      } satisfies AuthResponse);
      return;
    }

    // resetTokenExpiry is select:false, so request it explicitly
    const user = await User.findOne({ resetToken: token }).select('+resetTokenExpiry');
    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid reset token' } satisfies AuthResponse);
      return;
    }

    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      res.status(410).json({ success: false, message: 'Reset token expired' } satisfies AuthResponse);
      return;
    }

    // Password is hashed by the User pre-save hook
    user.password = newPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    // Invalidate existing sessions after a password change
    user.refreshToken = null;
    user.refreshTokenExpiry = null;
    await user.save();

    logger.info(`Password reset for: ${user.email}`);
    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    } satisfies AuthResponse);
  } catch (error) {
    logger.error('Reset password error:', error);
    next(error);
  }
};

// ---------------------------------------------------------------------------
// Current user profile (used by GET /auth/me)
// ---------------------------------------------------------------------------

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Unauthenticated request', 401);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError('User profile not found', 404);
    }

    sendSuccess(res, { user }, 'User profile retrieved');
  } catch (error) {
    next(error);
  }
}
