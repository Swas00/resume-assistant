import { Router } from 'express';
import {
  signup,
  login,
  refreshToken,
  logout,
  verifyEmail,
  requestResetPassword,
  resetPassword,
  getMe,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 * Body: { email: string, password: string, name: string }
 * Returns: 201 on success with token
 * Errors: 400 validation error, 409 email already exists
 */
router.post('/register', signup);

/** POST /api/auth/signup - alias of /register */
router.post('/signup', signup);

/**
 * POST /api/auth/login
 * Login user with email and password
 * Body: { email: string, password: string }
 * Returns: 200 with token and refreshToken
 * Errors: 401 invalid credentials, 403 email not verified
 */
router.post('/login', login);

/**
 * POST /api/auth/refresh-token
 * Generate new JWT token using refresh token
 * Body: { refreshToken: string }
 * Returns: 200 with new token
 * Errors: 401 invalid refresh token
 */
router.post('/refresh-token', refreshToken);

/**
 * POST /api/auth/logout
 * Logout user by clearing refresh token
 * Body: { refreshToken: string }
 * Returns: 200 success
 * Errors: 401 invalid token
 */
router.post('/logout', logout);

/**
 * POST|GET /api/auth/verify-email
 * Verify user's email address
 * Query: ?token=xxx OR Body: { token: string }
 * Returns: 200 email verified
 * Errors: 400 invalid token, 410 token expired
 */
router.post('/verify-email', verifyEmail);
router.get('/verify-email', verifyEmail);

/**
 * POST /api/auth/request-reset-password
 * Request password reset link via email
 * Body: { email: string }
 * Returns: 200 (always, for security)
 */
router.post('/request-reset-password', requestResetPassword);

/**
 * POST /api/auth/reset-password
 * Reset password with reset token
 * Body: { token: string, newPassword: string }
 * Returns: 200 password reset
 * Errors: 400 invalid token, 410 token expired
 */
router.post('/reset-password', resetPassword);

/**
 * GET /api/auth/me
 * Current authenticated user's profile (requires Bearer token)
 */
router.get('/me', authenticateToken, getMe);

export default router;
