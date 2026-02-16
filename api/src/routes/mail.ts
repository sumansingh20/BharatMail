import { Router, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// BhaMail API - Mail routing endpoints
import { Database } from '../services/database';
import { QueueService } from '../services/queue';
import { realEmailService } from '../services/realEmailService';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// Apply authentication to all mail routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/mail/connect-gmail:
 *   post:
 *     summary: Connect to Gmail account
 *     tags: [Mail]
 *     security:
 *       - bearerAuth: []
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
 *               password:
 *                 type: string
 */
router.post('/connect-gmail', [
  body('email').isEmail().notEmpty(),
  body('password').notEmpty(),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { email, password } = req.body;
  const userId = req.user!.id;

  const emailAccount = {
    id: uuidv4(),
    userId,
    email,
    password,
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    isActive: true
  };

  try {
    await realEmailService.connectToGmail(emailAccount);
    
    // Store account in database
    const db = Database.getInstance();
    await db.query(
      `INSERT INTO email_accounts (id, user_id, email, imap_host, imap_port, smtp_host, smtp_port, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [emailAccount.id, userId, email, emailAccount.imapHost, emailAccount.imapPort, 
       emailAccount.smtpHost, emailAccount.smtpPort, true]
    );

    res.json({
      accountId: emailAccount.id,
      email,
      status: 'connected'
    });
  } catch (error: any) {
    throw createError(`Failed to connect to Gmail: ${error.message}`, 400);
  }
}));

/**
 * @swagger
 * /api/mail/sync-gmail:
 *   post:
 *     summary: Sync Gmail emails
 *     tags: [Mail]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *             properties:
 *               accountId:
 *                 type: string
 *               folder:
 *                 type: string
 *                 default: INBOX
 *               limit:
 *                 type: integer
 *                 default: 50
 */
router.post('/sync-gmail', [
  body('accountId').notEmpty(),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { accountId, folder = 'INBOX', limit = 50 } = req.body;
  const userId = req.user!.id;

  try {
    const emails = await realEmailService.getInboxEmails(accountId, {
      folder,
      limit,
      unreadOnly: false
    });

    const db = Database.getInstance();
    let syncedCount = 0;

    for (const email of emails) {
      // Check if message already exists
      const existing = await db.query(
        'SELECT id FROM messages WHERE message_id = $1',
        [email.messageId]
      );

      if (existing.rows.length === 0) {
        // Create thread if needed
        let threadId = email.threadId;
        const threadExists = await db.query(
          'SELECT id FROM threads WHERE id = $1',
          [threadId]
        );

        if (threadExists.rows.length === 0) {
          await db.query(
            `INSERT INTO threads (id, subject, subject_normalized, message_count, last_message_at)
             VALUES ($1, $2, $3, 1, $4)`,
            [threadId, email.subject, normalizeSubject(email.subject), email.date]
          );
        }

        // Insert message
        const messageId = uuidv4();
        await db.query(
          `INSERT INTO messages (
             id, thread_id, message_id, from_email, to_emails, cc_emails, bcc_emails,
             subject, body_text, body_html, size_bytes, has_attachments, received_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            messageId, threadId, email.messageId, email.from.email,
            JSON.stringify(email.to), JSON.stringify(email.cc || []), 
            JSON.stringify(email.bcc || []), email.subject, email.bodyText,
            email.bodyHtml, email.attachments.reduce((sum, att) => sum + att.size, 0),
            email.attachments.length > 0, email.date
          ]
        );

        // Create user message state
        await db.query(
          `INSERT INTO user_message_states (user_id, message_id, folder, is_read, is_starred, is_important)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, messageId, 'inbox', email.isRead, email.isStarred, email.isImportant]
        );

        syncedCount++;
      }
    }

    res.json({
      syncedCount,
      totalEmails: emails.length,
      folder
    });
  } catch (error: any) {
    throw createError(`Failed to sync Gmail: ${error.message}`, 500);
  }
}));

/**
 * @swagger
 * /api/mail/send:
 *   post:
 *     summary: Send an email
 *     tags: [Mail]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *             properties:
 *               to:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *               cc:
 *                 type: array
 *                 items:
 *                   type: object
 *               bcc:
 *                 type: array
 *                 items:
 *                   type: object
 *               subject:
 *                 type: string
 *               bodyText:
 *                 type: string
 *               bodyHtml:
 *                 type: string
 *               scheduleAt:
 *                 type: string
 *                 format: date-time
 *               threadId:
 *                 type: string
 *               replyToMessageId:
 *                 type: string
 */
router.post('/send', [
  body('to').isArray().notEmpty(),
  body('subject').trim().notEmpty(),
  body('bodyText').optional().trim(),
  body('bodyHtml').optional().trim(),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const {
    to,
    cc = [],
    bcc = [],
    subject,
    bodyText = '',
    bodyHtml = '',
    scheduleAt,
    threadId,
    replyToMessageId,
  } = req.body;

  const userId = req.user!.id;
  const userEmail = req.user!.email;
  const db = Database.getInstance();

  // Generate message ID
  const messageId = `<${uuidv4()}@bhamail.local>`;

  let finalThreadId = threadId;
  let references: string[] = [];
  let inReplyTo: string | null = null;

  // If replying to a message, get thread info and references
  if (replyToMessageId) {
    const originalMessage = await db.query(
      'SELECT thread_id, message_id, references FROM messages WHERE id = $1',
      [replyToMessageId]
    );

    if (originalMessage.rows.length > 0) {
      finalThreadId = originalMessage.rows[0].thread_id;
      inReplyTo = originalMessage.rows[0].message_id;
      references = originalMessage.rows[0].references || [];
      references.push(originalMessage.rows[0].message_id);
    }
  }

  // Create thread if needed
  if (!finalThreadId) {
    finalThreadId = uuidv4();
    const normalizedSubject = normalizeSubject(subject);
    
    await db.query(
      `INSERT INTO threads (id, subject, subject_normalized, message_count, last_message_at)
       VALUES ($1, $2, $3, 1, NOW())`,
      [finalThreadId, subject, normalizedSubject]
    );
  } else {
    // Update existing thread
    await db.query(
      `UPDATE threads SET message_count = message_count + 1, last_message_at = NOW()
       WHERE id = $1`,
      [finalThreadId]
    );
  }

  // Calculate message size
  const messageSize = Buffer.byteLength(bodyText + bodyHtml, 'utf8');

  // Create message record
  const messageResult = await db.query(
    `INSERT INTO messages (
       id, thread_id, message_id, in_reply_to, references, from_email, 
       to_emails, cc_emails, bcc_emails, subject, body_text, body_html,
       size_bytes, is_sent, sent_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, NOW())
     RETURNING id`,
    [
      uuidv4(),
      finalThreadId,
      messageId,
      inReplyTo,
      references,
      userEmail,
      JSON.stringify(to),
      JSON.stringify(cc),
      JSON.stringify(bcc),
      subject,
      bodyText,
      bodyHtml,
      messageSize,
    ]
  );

  const newMessageId = messageResult.rows[0].id;

  // Create user message state (sent folder)
  await db.query(
    `INSERT INTO user_message_states (user_id, message_id, folder, is_read)
     VALUES ($1, $2, 'sent', true)`,
    [userId, newMessageId]
  );

  // Get user's email account for sending
  const accountResult = await db.query(
    'SELECT id FROM email_accounts WHERE user_id = $1 AND is_active = true LIMIT 1',
    [userId]
  );

  if (accountResult.rows.length > 0) {
    const accountId = accountResult.rows[0].id;
    
    try {
      // Send email using real Gmail service
      const sentMessageId = await realEmailService.sendEmail(accountId, {
        to,
        cc,
        bcc,
        subject,
        bodyText,
        bodyHtml,
        replyTo: inReplyTo || undefined,
        inReplyTo: inReplyTo || undefined
      });

      logger.info(`Email sent successfully via Gmail: ${sentMessageId}`);
    } catch (error: any) {
      logger.error('Failed to send email via Gmail:', error);
      // Fall back to queue service
      const emailData = {
        from: `${req.user!.email}`,
        to: to.map((recipient: any) => recipient.email),
        cc: cc.map((recipient: any) => recipient.email),
        bcc: bcc.map((recipient: any) => recipient.email),
        subject,
        text: bodyText,
        html: bodyHtml,
        messageId,
        userId,
      };

      if (scheduleAt) {
        const scheduleTime = new Date(scheduleAt);
        const delay = scheduleTime.getTime() - Date.now();
        
        if (delay > 0) {
          await QueueService.addEmailJob(emailData, delay);
        } else {
          await QueueService.addEmailJob(emailData);
        }
      } else {
        await QueueService.addEmailJob(emailData);
      }
    }
  } else {
    // No Gmail account connected, use queue service
    const emailData = {
      from: `${req.user!.email}`,
      to: to.map((recipient: any) => recipient.email),
      cc: cc.map((recipient: any) => recipient.email),
      bcc: bcc.map((recipient: any) => recipient.email),
      subject,
      text: bodyText,
      html: bodyHtml,
      messageId,
      userId,
    };

    if (scheduleAt) {
      const scheduleTime = new Date(scheduleAt);
      const delay = scheduleTime.getTime() - Date.now();
      
      if (delay > 0) {
        await QueueService.addEmailJob(emailData, delay);
      } else {
        await QueueService.addEmailJob(emailData);
      }
    } else {
      await QueueService.addEmailJob(emailData);
    }
  }

  res.status(201).json({
    messageId: newMessageId,
    threadId: finalThreadId,
    status: scheduleAt ? 'scheduled' : 'queued',
  });
}));

/**
 * @swagger
 * /api/mail/inbox:
 *   get:
 *     summary: Get inbox messages
 *     tags: [Mail]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *           default: inbox
 */
router.get('/inbox', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('folder').optional().isIn(['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive']),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const folder = req.query.folder as string || 'inbox';
  const offset = (page - 1) * limit;

  const db = Database.getInstance();

  // Get messages with thread info
  const result = await db.query(
    `SELECT 
       m.id, m.thread_id, m.from_email, m.to_emails, m.cc_emails,
       m.subject, m.body_text, m.body_html, m.has_attachments,
       m.size_bytes, m.received_at, m.sent_at, m.created_at,
       ums.is_read, ums.is_starred, ums.is_important, ums.snooze_until,
       t.message_count as thread_message_count
     FROM messages m
     JOIN user_message_states ums ON m.id = ums.message_id
     JOIN threads t ON m.thread_id = t.id
     WHERE ums.user_id = $1 AND ums.folder = $2
       AND (ums.snooze_until IS NULL OR ums.snooze_until <= NOW())
     ORDER BY COALESCE(m.received_at, m.sent_at, m.created_at) DESC
     LIMIT $3 OFFSET $4`,
    [userId, folder, limit, offset]
  );

  // Get total count
  const countResult = await db.query(
    `SELECT COUNT(*) as total
     FROM messages m
     JOIN user_message_states ums ON m.id = ums.message_id
     WHERE ums.user_id = $1 AND ums.folder = $2
       AND (ums.snooze_until IS NULL OR ums.snooze_until <= NOW())`,
    [userId, folder]
  );

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);

  res.json({
    messages: result.rows.map(row => ({
      id: row.id,
      threadId: row.thread_id,
      from: row.from_email,
      to: JSON.parse(row.to_emails || '[]'),
      cc: JSON.parse(row.cc_emails || '[]'),
      subject: row.subject,
      preview: extractPreview(row.body_text || row.body_html),
      hasAttachments: row.has_attachments,
      sizeBytes: row.size_bytes,
      isRead: row.is_read,
      isStarred: row.is_starred,
      isImportant: row.is_important,
      threadMessageCount: row.thread_message_count,
      date: row.received_at || row.sent_at || row.created_at,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}));

/**
 * @swagger
 * /api/mail/thread/{threadId}:
 *   get:
 *     summary: Get thread messages
 *     tags: [Mail]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/thread/:threadId', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { threadId } = req.params;
  const db = Database.getInstance();

  // Get all messages in thread
  const result = await db.query(
    `SELECT 
       m.id, m.message_id, m.from_email, m.to_emails, m.cc_emails, m.bcc_emails,
       m.subject, m.body_text, m.body_html, m.has_attachments,
       m.size_bytes, m.received_at, m.sent_at, m.created_at,
       ums.is_read, ums.is_starred, ums.is_important, ums.folder
     FROM messages m
     JOIN user_message_states ums ON m.id = ums.message_id
     WHERE m.thread_id = $1 AND ums.user_id = $2
     ORDER BY COALESCE(m.received_at, m.sent_at, m.created_at) ASC`,
    [threadId, userId]
  );

  if (result.rows.length === 0) {
    throw createError('Thread not found', 404);
  }

  // Mark messages as read
  await db.query(
    `UPDATE user_message_states 
     SET is_read = true, updated_at = NOW()
     WHERE user_id = $1 AND message_id IN (
       SELECT m.id FROM messages m WHERE m.thread_id = $2
     ) AND is_read = false`,
    [userId, threadId]
  );

  res.json({
    threadId,
    messages: result.rows.map(row => ({
      id: row.id,
      messageId: row.message_id,
      from: row.from_email,
      to: JSON.parse(row.to_emails || '[]'),
      cc: JSON.parse(row.cc_emails || '[]'),
      bcc: JSON.parse(row.bcc_emails || '[]'),
      subject: row.subject,
      bodyText: row.body_text,
      bodyHtml: row.body_html,
      hasAttachments: row.has_attachments,
      sizeBytes: row.size_bytes,
      isRead: row.is_read,
      isStarred: row.is_starred,
      isImportant: row.is_important,
      folder: row.folder,
      date: row.received_at || row.sent_at || row.created_at,
    })),
  });
}));

/**
 * @swagger
 * /api/mail/message/{messageId}/star:
 *   patch:
 *     summary: Star/unstar a message
 *     tags: [Mail]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/message/:messageId/star', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { messageId } = req.params;
  const { starred } = req.body;
  const db = Database.getInstance();

  await db.query(
    `UPDATE user_message_states 
     SET is_starred = $1, updated_at = NOW()
     WHERE user_id = $2 AND message_id = $3`,
    [starred, userId, messageId]
  );

  res.json({ success: true });
}));

/**
 * @swagger
 * /api/mail/message/{messageId}/move:
 *   patch:
 *     summary: Move message to folder
 *     tags: [Mail]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/message/:messageId/move', [
  body('folder').isIn(['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive']),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Invalid folder', 400);
  }

  const userId = req.user!.id;
  const { messageId } = req.params;
  const { folder } = req.body;
  const db = Database.getInstance();

  await db.query(
    `UPDATE user_message_states 
     SET folder = $1, updated_at = NOW()
     WHERE user_id = $2 AND message_id = $3`,
    [folder, userId, messageId]
  );

  res.json({ success: true });
}));

// Helper functions
function normalizeSubject(subject: string): string {
  return subject
    .replace(/^(Re:|Fwd?:|FW:)\s*/gi, '')
    .trim()
    .toLowerCase();
}

function extractPreview(body: string, maxLength: number = 150): string {
  if (!body) return '';
  
  // Strip HTML tags and get plain text
  const text = body.replace(/<[^>]*>/g, '').trim();
  
  // Truncate and add ellipsis
  return text.length > maxLength 
    ? text.substring(0, maxLength) + '...' 
    : text;
}

export { router as mailRoutes };