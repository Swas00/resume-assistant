import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { JwtPayload, AuthenticatedRequest } from '../types/auth.types';

export type { JwtPayload };

// Extend Express Request object to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware to verify JWT token and attach user to request
 * Usage: router.post('/protected', verifyToken, handler)
 */
export const verifyToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract token from Authorization header: "Bearer <token>"
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    // Same secret the auth controller signs with (includes the dev fallback)
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    // Attach user data to request
    // Note: JwtPayload uses 'id', not 'userId' (standardized across app)
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Token verification failed',
    });
  }
};

// Backwards-compatible name used by existing routes
export const authenticateToken = verifyToken;

/**
 * Middleware to verify subscription tier
 * Usage: router.post('/premium-feature', verifyToken, verifySubscription(['pro', 'premium']), handler)
 */
export const verifySubscription = (allowedTiers: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    // The JWT doesn't carry subscriptionTier yet, so this defaults to 'free'.
    // Add it to the token payload or look it up from the DB to make this meaningful.
    const userTier =
      (req.user as JwtPayload & { subscriptionTier?: string }).subscriptionTier || 'free';

    if (!allowedTiers.includes(userTier)) {
      res.status(403).json({
        success: false,
        message: `This feature requires ${allowedTiers.join(' or ')} subscription`,
      });
      return;
    }

    next();
  };
};

/**
 * Role-Based Access Control Middleware Helper
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    if (req.user.role && !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient privileges for this operation.',
      });
      return;
    }

    next();
  };
}
