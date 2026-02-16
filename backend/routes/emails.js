const express = require('express');
const router = express.Router();
const EmailController = require('../controllers/emailController');
const { sendEmail: sendRealEmail } = require('../controllers/emailSettingsController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/attachments/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB limit
        files: 10 // Maximum 10 files
    },
    fileFilter: (req, file, cb) => {
        // Allow most common file types
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('File type not allowed'));
        }
    }
});

// Apply authentication middleware to all routes
router.use(auth.authenticateToken);

// Get emails by folder/label with pagination and filtering
router.get('/', EmailController.getEmails);

// Get specific email by ID
router.get('/:id', EmailController.getEmailById);

// Search emails
router.get('/search', EmailController.searchEmails);

// Send new email
router.post('/send', upload.array('attachments'), EmailController.sendEmail);

// Send real email via SMTP
router.post('/send-real', upload.array('attachments'), sendRealEmail);

// Save draft
router.post('/draft', upload.array('attachments'), EmailController.saveDraft);

// Update existing draft
router.put('/draft/:id', upload.array('attachments'), EmailController.updateDraft);

// Delete draft
router.delete('/draft/:id', EmailController.deleteDraft);

// Bulk email actions
router.post('/mark-read', EmailController.markAsRead);
router.post('/mark-unread', EmailController.markAsUnread);
router.post('/mark-starred', EmailController.markAsStarred);
router.post('/mark-unstarred', EmailController.markAsUnstarred);
router.post('/mark-important', EmailController.markAsImportant);
router.post('/mark-unimportant', EmailController.markAsUnimportant);

// Email management actions
router.post('/archive', EmailController.archiveEmails);
router.post('/unarchive', EmailController.unarchiveEmails);
router.post('/delete', EmailController.deleteEmails);
router.post('/restore', EmailController.restoreEmails);
router.post('/move', EmailController.moveToFolder);

// Spam and blocking
router.post('/report-spam', EmailController.reportSpam);
router.post('/not-spam', EmailController.markAsNotSpam);
router.post('/block-sender', EmailController.blockSender);
router.post('/unblock-sender', EmailController.unblockSender);

// Snooze functionality
router.post('/snooze', EmailController.snoozeEmails);
router.post('/unsnooze', EmailController.unsnoozeEmails);

// Label management
router.post('/add-label', EmailController.addLabel);
router.post('/remove-label', EmailController.removeLabel);

// Attachment handling
router.get('/:emailId/attachments/:attachmentId', EmailController.downloadAttachment);
router.delete('/:emailId/attachments/:attachmentId', EmailController.deleteAttachment);

// Conversation threading
router.get('/:id/conversation', EmailController.getConversation);
router.post('/:id/conversation/reply', upload.array('attachments'), EmailController.replyToConversation);

// Email tracking
router.post('/:id/track-open', EmailController.trackEmailOpen);
router.post('/:id/track-click', EmailController.trackEmailClick);

// Email templates
router.get('/templates', EmailController.getTemplates);
router.post('/templates', EmailController.createTemplate);
router.put('/templates/:id', EmailController.updateTemplate);
router.delete('/templates/:id', EmailController.deleteTemplate);

// Email scheduling
router.post('/schedule', upload.array('attachments'), EmailController.scheduleEmail);
router.get('/scheduled', EmailController.getScheduledEmails);
router.delete('/scheduled/:id', EmailController.cancelScheduledEmail);

// Auto-reply/vacation responder
router.get('/auto-reply', EmailController.getAutoReply);
router.post('/auto-reply', EmailController.setAutoReply);
router.delete('/auto-reply', EmailController.disableAutoReply);

// Email statistics
router.get('/stats/summary', EmailController.getEmailStats);
router.get('/stats/activity', EmailController.getActivityStats);

module.exports = router;