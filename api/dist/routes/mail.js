"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const uuid_1 = require("uuid");
// BhaMail API - Mail routing endpoints
const database_1 = require("../services/database");
const queue_1 = require("../services/queue");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
exports.mailRoutes = router;
// Apply authentication to all mail routes
router.use(auth_1.authenticateToken);
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
    (0, express_validator_1.body)('to').isArray().notEmpty(),
    (0, express_validator_1.body)('subject').trim().notEmpty(),
    (0, express_validator_1.body)('bodyText').optional().trim(),
    (0, express_validator_1.body)('bodyHtml').optional().trim(),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400);
    }
    const { to, cc = [], bcc = [], subject, bodyText = '', bodyHtml = '', scheduleAt, threadId, replyToMessageId, } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;
    const db = database_1.Database.getInstance();
    // Generate message ID
    const messageId = `<${(0, uuid_1.v4)()}@bhamail.local>`;
    let finalThreadId = threadId;
    let references = [];
    let inReplyTo = null;
    // If replying to a message, get thread info and references
    if (replyToMessageId) {
        const originalMessage = await db.query('SELECT thread_id, message_id, references FROM messages WHERE id = $1', [replyToMessageId]);
        if (originalMessage.rows.length > 0) {
            finalThreadId = originalMessage.rows[0].thread_id;
            inReplyTo = originalMessage.rows[0].message_id;
            references = originalMessage.rows[0].references || [];
            references.push(originalMessage.rows[0].message_id);
        }
    }
    // Create thread if needed
    if (!finalThreadId) {
        finalThreadId = (0, uuid_1.v4)();
        const normalizedSubject = normalizeSubject(subject);
        await db.query(`INSERT INTO threads (id, subject, subject_normalized, message_count, last_message_at)
       VALUES ($1, $2, $3, 1, NOW())`, [finalThreadId, subject, normalizedSubject]);
    }
    else {
        // Update existing thread
        await db.query(`UPDATE threads SET message_count = message_count + 1, last_message_at = NOW()
       WHERE id = $1`, [finalThreadId]);
    }
    // Calculate message size
    const messageSize = Buffer.byteLength(bodyText + bodyHtml, 'utf8');
    // Create message record
    const messageResult = await db.query(`INSERT INTO messages (
       id, thread_id, message_id, in_reply_to, references, from_email, 
       to_emails, cc_emails, bcc_emails, subject, body_text, body_html,
       size_bytes, is_sent, sent_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, NOW())
     RETURNING id`, [
        (0, uuid_1.v4)(),
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
    ]);
    const newMessageId = messageResult.rows[0].id;
    // Create user message state (sent folder)
    await db.query(`INSERT INTO user_message_states (user_id, message_id, folder, is_read)
     VALUES ($1, $2, 'sent', true)`, [userId, newMessageId]);
    // Prepare email for sending
    const emailData = {
        from: `${req.user.email}`,
        to: to.map((recipient) => recipient.email),
        cc: cc.map((recipient) => recipient.email),
        bcc: bcc.map((recipient) => recipient.email),
        subject,
        text: bodyText,
        html: bodyHtml,
        messageId,
        userId,
    };
    // Schedule or send immediately
    if (scheduleAt) {
        const scheduleTime = new Date(scheduleAt);
        const delay = scheduleTime.getTime() - Date.now();
        if (delay > 0) {
            await queue_1.QueueService.addEmailJob(emailData, delay);
        }
        else {
            await queue_1.QueueService.addEmailJob(emailData);
        }
    }
    else {
        await queue_1.QueueService.addEmailJob(emailData);
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
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('folder').optional().isIn(['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive']),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const folder = req.query.folder || 'inbox';
    const offset = (page - 1) * limit;
    const db = database_1.Database.getInstance();
    // Get messages with thread info
    const result = await db.query(`SELECT 
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
     LIMIT $3 OFFSET $4`, [userId, folder, limit, offset]);
    // Get total count
    const countResult = await db.query(`SELECT COUNT(*) as total
     FROM messages m
     JOIN user_message_states ums ON m.id = ums.message_id
     WHERE ums.user_id = $1 AND ums.folder = $2
       AND (ums.snooze_until IS NULL OR ums.snooze_until <= NOW())`, [userId, folder]);
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
router.get('/thread/:threadId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { threadId } = req.params;
    const db = database_1.Database.getInstance();
    // Get all messages in thread
    const result = await db.query(`SELECT 
       m.id, m.message_id, m.from_email, m.to_emails, m.cc_emails, m.bcc_emails,
       m.subject, m.body_text, m.body_html, m.has_attachments,
       m.size_bytes, m.received_at, m.sent_at, m.created_at,
       ums.is_read, ums.is_starred, ums.is_important, ums.folder
     FROM messages m
     JOIN user_message_states ums ON m.id = ums.message_id
     WHERE m.thread_id = $1 AND ums.user_id = $2
     ORDER BY COALESCE(m.received_at, m.sent_at, m.created_at) ASC`, [threadId, userId]);
    if (result.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Thread not found', 404);
    }
    // Mark messages as read
    await db.query(`UPDATE user_message_states 
     SET is_read = true, updated_at = NOW()
     WHERE user_id = $1 AND message_id IN (
       SELECT m.id FROM messages m WHERE m.thread_id = $2
     ) AND is_read = false`, [userId, threadId]);
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
router.patch('/message/:messageId/star', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { messageId } = req.params;
    const { starred } = req.body;
    const db = database_1.Database.getInstance();
    await db.query(`UPDATE user_message_states 
     SET is_starred = $1, updated_at = NOW()
     WHERE user_id = $2 AND message_id = $3`, [starred, userId, messageId]);
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
    (0, express_validator_1.body)('folder').isIn(['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive']),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Invalid folder', 400);
    }
    const userId = req.user.id;
    const { messageId } = req.params;
    const { folder } = req.body;
    const db = database_1.Database.getInstance();
    await db.query(`UPDATE user_message_states 
     SET folder = $1, updated_at = NOW()
     WHERE user_id = $2 AND message_id = $3`, [folder, userId, messageId]);
    res.json({ success: true });
}));
// Helper functions
function normalizeSubject(subject) {
    return subject
        .replace(/^(Re:|Fwd?:|FW:)\s*/gi, '')
        .trim()
        .toLowerCase();
}
function extractPreview(body, maxLength = 150) {
    if (!body)
        return '';
    // Strip HTML tags and get plain text
    const text = body.replace(/<[^>]*>/g, '').trim();
    // Truncate and add ellipsis
    return text.length > maxLength
        ? text.substring(0, maxLength) + '...'
        : text;
}
//# sourceMappingURL=mail.js.map