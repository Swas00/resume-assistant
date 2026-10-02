import { Request } from 'express';

// JWT token payload shape - source of truth for all auth
export interface JwtPayload {
  id: string; // User ID from MongoDB _id
  email: string;
  role?: string;
  iat?: number; // Issued at (automatic)
  exp?: number; // Expires at (automatic)
}

// Extend Express.Request to add user property for authenticated routes
// Use Omit to remove the existing 'user' property first, then add our own typed version
export interface AuthenticatedRequest extends Omit<Request, 'user'> {
  user?: JwtPayload;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    subscriptionTier: 'free' | 'pro' | 'premium';
    emailVerified: boolean;
  };
}

export interface VerifyEmailRequest {
  token: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RequestResetPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface LogoutRequest {
  refreshToken: string;
}
