const express = require('express');
const router = express.Router();
const {
  getEmailSettings,
  updateEmailSettings,
  testEmailConnection,
  sendEmail,
  syncEmails,
  getEmailStatus
} = require('../controllers/emailSettingsController');

// Get email settings
router.get('/', getEmailSettings);

// Update email settings
router.put('/', updateEmailSettings);

// Test email connection
router.post('/test', testEmailConnection);

// Send real email
router.post('/send', sendEmail);

// Sync emails from IMAP
router.post('/sync', syncEmails);

// Get email service status
router.get('/status', getEmailStatus);

module.exports = router;