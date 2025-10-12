import { Router, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';

import { googleApiService } from '../services/googleApiService';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/google/auth:
 *   post:
 *     summary: Setup Google API authentication
 *     tags: [Google]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *               - clientSecret
 *               - redirectUri
 *               - refreshToken
 *             properties:
 *               clientId:
 *                 type: string
 *               clientSecret:
 *                 type: string
 *               redirectUri:
 *                 type: string
 *               refreshToken:
 *                 type: string
 *               accessToken:
 *                 type: string
 */
router.post('/auth', [
  body('clientId').notEmpty(),
  body('clientSecret').notEmpty(),
  body('redirectUri').notEmpty(),
  body('refreshToken').notEmpty(),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { clientId, clientSecret, redirectUri, refreshToken, accessToken } = req.body;
  const userId = req.user!.id;

  try {
    await googleApiService.setupGoogleAuth(userId, {
      clientId,
      clientSecret,
      redirectUri,
      refreshToken,
      accessToken
    });

    res.json({
      status: 'connected',
      message: 'Google API authentication configured successfully'
    });
  } catch (error: any) {
    throw createError(`Failed to setup Google auth: ${error.message}`, 400);
  }
}));

/**
 * @swagger
 * /api/google/profile:
 *   get:
 *     summary: Get Google user profile
 *     tags: [Google]
 *     security:
 *       - bearerAuth: []
 */
router.get('/profile', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const profile = await googleApiService.getGoogleProfile(userId);
    res.json(profile);
  } catch (error: any) {
    throw createError(`Failed to get Google profile: ${error.message}`, 500);
  }
}));

// Calendar routes
/**
 * @swagger
 * /api/google/calendar/events:
 *   get:
 *     summary: Get calendar events
 *     tags: [Google Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: calendarId
 *         schema:
 *           type: string
 *           default: primary
 *       - in: query
 *         name: timeMin
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: timeMax
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: maxResults
 *         schema:
 *           type: integer
 *           default: 10
 */
router.get('/calendar/events', [
  query('maxResults').optional().isInt({ min: 1, max: 250 }),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { calendarId, timeMin, timeMax, maxResults } = req.query;

  try {
    const events = await googleApiService.getCalendarEvents(userId, {
      calendarId: calendarId as string,
      timeMin: timeMin as string,
      timeMax: timeMax as string,
      maxResults: parseInt(maxResults as string) || 10
    });

    res.json({ events });
  } catch (error: any) {
    throw createError(`Failed to get calendar events: ${error.message}`, 500);
  }
}));

/**
 * @swagger
 * /api/google/calendar/events:
 *   post:
 *     summary: Create calendar event
 *     tags: [Google Calendar]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - summary
 *               - start
 *               - end
 *             properties:
 *               summary:
 *                 type: string
 *               description:
 *                 type: string
 *               start:
 *                 type: object
 *                 properties:
 *                   dateTime:
 *                     type: string
 *                   date:
 *                     type: string
 *                   timeZone:
 *                     type: string
 *               end:
 *                 type: object
 *                 properties:
 *                   dateTime:
 *                     type: string
 *                   date:
 *                     type: string
 *                   timeZone:
 *                     type: string
 *               location:
 *                 type: string
 *               attendees:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *               calendarId:
 *                 type: string
 */
router.post('/calendar/events', [
  body('summary').notEmpty(),
  body('start').isObject(),
  body('end').isObject(),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const userId = req.user!.id;
  const eventData = req.body;

  try {
    const event = await googleApiService.createCalendarEvent(userId, eventData);
    res.status(201).json(event);
  } catch (error: any) {
    throw createError(`Failed to create calendar event: ${error.message}`, 500);
  }
}));

// Contacts routes
/**
 * @swagger
 * /api/google/contacts:
 *   get:
 *     summary: Get Google contacts
 *     tags: [Google Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: pageToken
 *         schema:
 *           type: string
 */
router.get('/contacts', [
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { pageSize, pageToken } = req.query;

  try {
    const result = await googleApiService.getContacts(userId, {
      pageSize: parseInt(pageSize as string) || 50,
      pageToken: pageToken as string
    });

    res.json(result);
  } catch (error: any) {
    throw createError(`Failed to get contacts: ${error.message}`, 500);
  }
}));

/**
 * @swagger
 * /api/google/contacts:
 *   post:
 *     summary: Create Google contact
 *     tags: [Google Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               givenName:
 *                 type: string
 *               familyName:
 *                 type: string
 *               emailAddress:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               organization:
 *                 type: string
 *               title:
 *                 type: string
 */
router.post('/contacts', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const contactData = req.body;

  try {
    const contact = await googleApiService.createContact(userId, contactData);
    res.status(201).json(contact);
  } catch (error: any) {
    throw createError(`Failed to create contact: ${error.message}`, 500);
  }
}));

// Drive routes
/**
 * @swagger
 * /api/google/drive/files:
 *   get:
 *     summary: Get Google Drive files
 *     tags: [Google Drive]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: pageToken
 *         schema:
 *           type: string
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           default: modifiedTime desc
 */
router.get('/drive/files', [
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { q, pageSize, pageToken, orderBy } = req.query;

  try {
    const result = await googleApiService.getDriveFiles(userId, {
      q: q as string,
      pageSize: parseInt(pageSize as string) || 50,
      pageToken: pageToken as string,
      orderBy: orderBy as string
    });

    res.json(result);
  } catch (error: any) {
    throw createError(`Failed to get Drive files: ${error.message}`, 500);
  }
}));

/**
 * @swagger
 * /api/google/drive/upload:
 *   post:
 *     summary: Upload file to Google Drive
 *     tags: [Google Drive]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *               parents:
 *                 type: array
 *                 items:
 *                   type: string
 */
router.post('/drive/upload', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  
  // Note: This would need multer middleware for file upload
  // For now, expecting base64 encoded file in request body
  const { name, content, mimeType, parents } = req.body;

  if (!name || !content || !mimeType) {
    throw createError('Missing required fields: name, content, mimeType', 400);
  }

  try {
    const fileBuffer = Buffer.from(content, 'base64');
    
    const file = await googleApiService.uploadDriveFile(userId, {
      name,
      content: fileBuffer,
      mimeType,
      parents
    });

    res.status(201).json(file);
  } catch (error: any) {
    throw createError(`Failed to upload file: ${error.message}`, 500);
  }
}));

/**
 * @swagger
 * /api/google/drive/{fileId}/share:
 *   post:
 *     summary: Share Google Drive file
 *     tags: [Google Drive]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - role
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [user, group, domain, anyone]
 *               role:
 *                 type: string
 *                 enum: [owner, organizer, fileOrganizer, writer, commenter, reader]
 *               emailAddress:
 *                 type: string
 *               domain:
 *                 type: string
 */
router.post('/drive/:fileId/share', [
  body('type').isIn(['user', 'group', 'domain', 'anyone']),
  body('role').isIn(['owner', 'organizer', 'fileOrganizer', 'writer', 'commenter', 'reader']),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const userId = req.user!.id;
  const { fileId } = req.params;
  const shareData = req.body;

  try {
    await googleApiService.shareDriveFile(userId, fileId, shareData);
    res.json({ 
      success: true, 
      message: 'File shared successfully' 
    });
  } catch (error: any) {
    throw createError(`Failed to share file: ${error.message}`, 500);
  }
}));

/**
 * @swagger
 * /api/google/refresh-token:
 *   post:
 *     summary: Refresh Google access token
 *     tags: [Google]
 *     security:
 *       - bearerAuth: []
 */
router.post('/refresh-token', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const accessToken = await googleApiService.refreshAccessToken(userId);
    res.json({ accessToken });
  } catch (error: any) {
    throw createError(`Failed to refresh token: ${error.message}`, 500);
  }
}));

export { router as googleRoutes };