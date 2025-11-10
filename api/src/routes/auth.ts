import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

import { Database } from '../services/database';
import { RedisService } from '../services/redis';
import { EmailService } from '../services/email';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 */
router.post('/signup', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  body('firstName').trim().isLength({ min: 1, max: 100 }),
  body('lastName').trim().isLength({ min: 1, max: 100 }),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { email, password, firstName, lastName } = req.body;
  const db = Database.getInstance();

  // Check if user already exists
  const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    throw createError('User already exists', 409);
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const userId = uuidv4();
  await db.query(
    `INSERT INTO users (id, email, password_hash, first_name, last_name) 
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, email, passwordHash, firstName, lastName]
  );

  // Create primary account
  await db.query(
    `INSERT INTO accounts (user_id, email, domain, is_primary) 
     VALUES ($1, $2, $3, true)`,
    [userId, email, email.split('@')[1]]
  );

  // Generate tokens
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  
  if (!jwtSecret || !jwtRefreshSecret) {
    throw createError('JWT configuration error', 500);
  }

  const token = jwt.sign(
    { userId, email },
    jwtSecret as string
  );

  const refreshToken = jwt.sign(
    { userId },
    jwtRefreshSecret as string
  );

  // Store refresh token
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await db.query(
    `INSERT INTO user_sessions (user_id, refresh_token_hash, expires_at) 
     VALUES ($1, $2, $3)`,
    [userId, refreshTokenHash, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
  );

  // Send welcome email
  try {
    await EmailService.sendWelcomeEmail(email, firstName);
  } catch (error) {
    logger.warn('Failed to send welcome email:', error);
  }

  res.status(201).json({
    user: {
      id: userId,
      email,
      firstName,
      lastName,
    },
    token,
    refreshToken,
  });
}));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               totpCode:
 *                 type: string
 *                 description: TOTP code for 2FA (if enabled)
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Invalid credentials', 400);
  }

  const { email, password, totpCode } = req.body;
  const db = Database.getInstance();

  // Get user
  const userResult = await db.query(
    `SELECT id, email, password_hash, first_name, last_name, is_active, 
            two_factor_enabled, two_factor_secret
     FROM users WHERE email = $1`,
    [email]
  );

  if (userResult.rows.length === 0) {
    throw createError('Invalid credentials', 401);
  }

  const user = userResult.rows[0];

  if (!user.is_active) {
    throw createError('Account is disabled', 401);
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw createError('Invalid credentials', 401);
  }

  // Check 2FA if enabled
  if (user.two_factor_enabled) {
    if (!totpCode) {
      throw createError('TOTP code required', 401);
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: totpCode,
      window: 2,
    });

    if (!verified) {
      throw createError('Invalid TOTP code', 401);
    }
  }

  // Update last login
  await db.query(
    'UPDATE users SET last_login_at = NOW() WHERE id = $1',
    [user.id]
  );

  // Generate tokens
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  
  if (!jwtSecret || !jwtRefreshSecret) {
    throw createError('JWT configuration error', 500);
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    jwtSecret as string
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    jwtRefreshSecret as string
  );

  // Store refresh token
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await db.query(
    `INSERT INTO user_sessions (user_id, refresh_token_hash, expires_at) 
     VALUES ($1, $2, $3)`,
    [user.id, refreshTokenHash, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
  );

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      twoFactorEnabled: user.two_factor_enabled,
    },
    token,
    refreshToken,
  });
}));

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 */
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw createError('Refresh token required', 401);
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    const db = Database.getInstance();

    // Verify refresh token exists and is valid
    const sessions = await db.query(
      `SELECT refresh_token_hash FROM user_sessions 
       WHERE user_id = $1 AND expires_at > NOW()`,
      [decoded.userId]
    );

    let validSession = false;
    for (const session of sessions.rows) {
      if (await bcrypt.compare(refreshToken, session.refresh_token_hash)) {
        validSession = true;
        break;
      }
    }

    if (!validSession) {
      throw createError('Invalid refresh token', 401);
    }

    // Get user info
    const userResult = await db.query(
      'SELECT id, email FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      throw createError('User not found', 401);
    }

    const user = userResult.rows[0];

    // Generate new access token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw createError('JWT configuration error', 500);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret as string
    );

    res.json({ token });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw createError('Invalid refresh token', 401);
    }
    throw error;
  }
}));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post('/logout', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;
  const db = Database.getInstance();

  if (refreshToken) {
    // Remove specific session
    const sessions = await db.query(
      'SELECT id, refresh_token_hash FROM user_sessions WHERE user_id = $1',
      [req.user!.id]
    );

    for (const session of sessions.rows) {
      if (await bcrypt.compare(refreshToken, session.refresh_token_hash)) {
        await db.query('DELETE FROM user_sessions WHERE id = $1', [session.id]);
        break;
      }
    }
  } else {
    // Remove all sessions for user
    await db.query('DELETE FROM user_sessions WHERE user_id = $1', [req.user!.id]);
  }

  res.json({ message: 'Logged out successfully' });
}));

/**
 * @swagger
 * /api/auth/setup-2fa:
 *   post:
 *     summary: Setup two-factor authentication
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post('/setup-2fa', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = Database.getInstance();
  const userId = req.user!.id;
  const userEmail = req.user!.email;

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `BhaMail (${userEmail})`,
    issuer: 'BhaMail',
  });

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  // Store secret temporarily (not enabled until verified)
  await db.query(
    'UPDATE users SET two_factor_secret = $1 WHERE id = $2',
    [secret.base32, userId]
  );

  res.json({
    secret: secret.base32,
    qrCode: qrCodeUrl,
    manualEntryKey: secret.base32,
  });
}));

/**
 * @swagger
 * /api/auth/verify-2fa:
 *   post:
 *     summary: Verify and enable two-factor authentication
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post('/verify-2fa', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { totpCode } = req.body;
  const db = Database.getInstance();
  const userId = req.user!.id;

  if (!totpCode) {
    throw createError('TOTP code required', 400);
  }

  // Get user's secret
  const userResult = await db.query(
    'SELECT two_factor_secret FROM users WHERE id = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw createError('User not found', 404);
  }

  const secret = userResult.rows[0].two_factor_secret;

  if (!secret) {
    throw createError('2FA setup not initiated', 400);
  }

  // Verify code
  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: totpCode,
    window: 2,
  });

  if (!verified) {
    throw createError('Invalid TOTP code', 400);
  }

  // Enable 2FA
  await db.query(
    'UPDATE users SET two_factor_enabled = true WHERE id = $1',
    [userId]
  );

  res.json({ message: '2FA enabled successfully' });
}));

/**
 * @swagger
 * /api/auth/disable-2fa:
 *   post:
 *     summary: Disable two-factor authentication
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post('/disable-2fa', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { password, totpCode } = req.body;
  const db = Database.getInstance();
  const userId = req.user!.id;

  if (!password || !totpCode) {
    throw createError('Password and TOTP code required', 400);
  }

  // Get user
  const userResult = await db.query(
    'SELECT password_hash, two_factor_secret FROM users WHERE id = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw createError('User not found', 404);
  }

  const user = userResult.rows[0];

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw createError('Invalid password', 401);
  }

  // Verify TOTP code
  const verified = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: 'base32',
    token: totpCode,
    window: 2,
  });

  if (!verified) {
    throw createError('Invalid TOTP code', 401);
  }

  // Disable 2FA
  await db.query(
    `UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL 
     WHERE id = $1`,
    [userId]
  );

  res.json({ message: '2FA disabled successfully' });
}));

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 */
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Invalid email', 400);
  }

  const { email } = req.body;
  const db = Database.getInstance();

  // Check if user exists
  const userResult = await db.query(
    'SELECT id, first_name FROM users WHERE email = $1 AND is_active = true',
    [email]
  );

  // Always return success to prevent email enumeration
  if (userResult.rows.length === 0) {
    res.json({ message: 'If the email exists, a reset link has been sent' });
    return;
  }

  const user = userResult.rows[0];

  // Generate reset token
  const resetToken = uuidv4();

  // Store reset token in Redis (expires in 1 hour)
  await RedisService.set(
    `password_reset:${resetToken}`,
    user.id,
    3600 // 1 hour
  );

  // Send password reset email
  try {
    await EmailService.sendPasswordResetEmail(email, user.first_name, resetToken);
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    throw createError('Failed to send reset email', 500);
  }

  res.json({ message: 'If the email exists, a reset link has been sent' });
}));

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 */
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Invalid token or password', 400);
  }

  const { token, password } = req.body;
  const db = Database.getInstance();

  // Verify reset token
  const userId = await RedisService.get(`password_reset:${token}`);
  if (!userId) {
    throw createError('Invalid or expired reset token', 400);
  }

  // Hash new password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Update password
  await db.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2',
    [passwordHash, userId]
  );

  // Remove reset token
  await RedisService.del(`password_reset:${token}`);

  // Remove all user sessions to force re-login
  await db.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);

  res.json({ message: 'Password reset successfully' });
}));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user info
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = Database.getInstance();
  const userId = req.user!.id;

  const userResult = await db.query(
    `SELECT id, email, first_name, last_name, role, phone, avatar_url, 
            timezone, language, two_factor_enabled, quota_bytes, used_bytes,
            last_login_at, created_at
     FROM users WHERE id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw createError('User not found', 404);
  }

  const user = userResult.rows[0];

  res.json({
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    phone: user.phone,
    avatarUrl: user.avatar_url,
    timezone: user.timezone,
    language: user.language,
    twoFactorEnabled: user.two_factor_enabled,
    quotaBytes: parseInt(user.quota_bytes),
    usedBytes: parseInt(user.used_bytes),
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
  });
}));

export { router as authRoutes };
