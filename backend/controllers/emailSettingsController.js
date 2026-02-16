const EmailService = require('../services/emailService');
const database = require('../config/database');

// Store email service instances per user
const userEmailServices = new Map();

// Get email settings for user
const getEmailSettings = (req, res) => {
  try {
    const userId = req.user.id;
    
    const settings = database.prepare(`
      SELECT smtp_host, smtp_port, smtp_secure, smtp_username,
             imap_host, imap_port, imap_secure, imap_username,
             sync_enabled, sync_interval
      FROM email_settings 
      WHERE user_id = ?
    `).get(userId);

    if (!settings) {
      return res.json({
        configured: false,
        smtp: {},
        imap: {},
        sync: {
          enabled: false,
          interval: 5
        }
      });
    }

    res.json({
      configured: true,
      smtp: {
        host: settings.smtp_host,
        port: settings.smtp_port,
        secure: settings.smtp_secure === 1,
        username: settings.smtp_username
      },
      imap: {
        host: settings.imap_host,
        port: settings.imap_port,
        secure: settings.imap_secure === 1,
        username: settings.imap_username
      },
      sync: {
        enabled: settings.sync_enabled === 1,
        interval: settings.sync_interval || 5
      }
    });
  } catch (error) {
    console.error('Error getting email settings:', error);
    res.status(500).json({ error: 'Failed to get email settings' });
  }
};

// Update email settings
const updateEmailSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { smtp, imap, sync } = req.body;

    // Validate required fields
    if (!smtp.host || !smtp.username || !smtp.password ||
        !imap.host || !imap.username || !imap.password) {
      return res.status(400).json({ error: 'Missing required email settings' });
    }

    // Test connection before saving
    const testResult = await testEmailConnection(req, res, false);
    if (!testResult.success) {
      return res.status(400).json({ 
        error: 'Email connection test failed',
        details: testResult.error
      });
    }

    // Save settings to database
    const upsertSettings = database.prepare(`
      INSERT OR REPLACE INTO email_settings (
        user_id, smtp_host, smtp_port, smtp_secure, smtp_username, smtp_password,
        imap_host, imap_port, imap_secure, imap_username, imap_password,
        sync_enabled, sync_interval, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    upsertSettings.run(
      userId,
      smtp.host,
      smtp.port || 587,
      smtp.secure ? 1 : 0,
      smtp.username,
      smtp.password, // In production, encrypt this
      imap.host,
      imap.port || 993,
      imap.secure !== false ? 1 : 0,
      imap.username,
      imap.password, // In production, encrypt this
      sync.enabled ? 1 : 0,
      sync.interval || 5,
      new Date().toISOString()
    );

    // Initialize email service for this user
    try {
      const emailService = new EmailService();
      await emailService.initialize({
        smtp: {
          host: smtp.host,
          port: smtp.port || 587,
          secure: smtp.secure || false,
          username: smtp.username,
          password: smtp.password,
          provider: smtp.provider
        },
        imap: {
          host: imap.host,
          port: imap.port || 993,
          secure: imap.secure !== false,
          username: imap.username,
          password: imap.password,
          provider: imap.provider
        }
      });

      // Store email service instance
      userEmailServices.set(userId, emailService);

      // Start sync if enabled
      if (sync.enabled) {
        emailService.startSync(sync.interval);
      }

      console.log(`✅ Email service initialized for user ${userId}`);
    } catch (error) {
      console.error('Error initializing email service:', error);
    }

    res.json({
      success: true,
      message: 'Email settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating email settings:', error);
    res.status(500).json({ error: 'Failed to update email settings' });
  }
};

// Test email connection
const testEmailConnection = async (req, res, sendResponse = true) => {
  try {
    const { smtp, imap } = req.body;

    const emailService = new EmailService();
    const result = await emailService.testConnection({ smtp, imap });

    if (sendResponse) {
      if (result.success) {
        res.json({
          success: true,
          message: 'Email connection test successful',
          smtp: result.smtp,
          imap: result.imap
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Error testing email connection:', error);
    const errorResponse = {
      success: false,
      error: 'Connection test failed'
    };

    if (sendResponse) {
      res.status(500).json(errorResponse);
    }

    return errorResponse;
  }
};

// Send real email
const sendEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { to, cc, bcc, subject, body, attachments = [] } = req.body;

    // Get user's email service
    const emailService = userEmailServices.get(userId);
    if (!emailService) {
      return res.status(400).json({ 
        error: 'Email not configured. Please configure your email settings first.' 
      });
    }

    // Get user's email settings for sender info
    const settings = database.prepare(`
      SELECT smtp_username FROM email_settings WHERE user_id = ?
    `).get(userId);

    if (!settings) {
      return res.status(400).json({ 
        error: 'Email settings not found' 
      });
    }

    // Prepare email data
    const emailData = {
      from: settings.smtp_username,
      to: Array.isArray(to) ? to.join(',') : to,
      cc: cc ? (Array.isArray(cc) ? cc.join(',') : cc) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc.join(',') : bcc) : undefined,
      subject,
      bodyText: body.text || body,
      bodyHtml: body.html
    };

    // Send email
    const result = await emailService.sendEmail(emailData, attachments);

    if (result.success) {
      // Save sent email to database
      const saveEmail = database.prepare(`
        INSERT INTO emails (
          user_id, folder_id, from_email, from_name, to_emails, cc_emails, bcc_emails,
          subject, body, message_id, thread_id, is_sent, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `);

      // Get sent folder
      const sentFolder = database.prepare(`
        SELECT id FROM folders WHERE user_id = ? AND type = 'sent'
      `).get(userId);

      if (sentFolder) {
        const threadId = `thread_${Date.now()}_${userId}`;
        saveEmail.run(
          userId,
          sentFolder.id,
          settings.smtp_username,
          req.user.full_name || settings.smtp_username,
          emailData.to,
          emailData.cc,
          emailData.bcc,
          subject,
          emailData.bodyHtml || emailData.bodyText,
          result.messageId,
          threadId,
          new Date().toISOString()
        );
      }

      res.json({
        success: true,
        messageId: result.messageId,
        message: 'Email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send email'
      });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

// Sync emails from IMAP
const syncEmails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { folder = 'INBOX', limit = 50 } = req.query;

    // Get user's email service
    const emailService = userEmailServices.get(userId);
    if (!emailService) {
      return res.status(400).json({ 
        error: 'Email not configured. Please configure your email settings first.' 
      });
    }

    // Fetch emails from IMAP server
    const result = await emailService.fetchEmails(folder, parseInt(limit));

    if (result.success) {
      // Save new emails to database
      const existingEmails = new Set();
      const existing = database.prepare(`
        SELECT message_id FROM emails WHERE user_id = ?
      `).all(userId);
      
      existing.forEach(email => {
        if (email.message_id) {
          existingEmails.add(email.message_id);
        }
      });

      // Get folder ID
      const folderRecord = database.prepare(`
        SELECT id FROM folders WHERE user_id = ? AND (type = ? OR name = ?)
      `).get(userId, folder.toLowerCase(), folder);

      const folderId = folderRecord?.id || 1; // Default to inbox

      const insertEmail = database.prepare(`
        INSERT INTO emails (
          user_id, folder_id, from_email, from_name, to_emails, cc_emails, bcc_emails,
          subject, body, message_id, thread_id, is_read, is_starred, received_at,
          uid, size, has_attachments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let newEmailsCount = 0;
      for (const email of result.emails) {
        if (!existingEmails.has(email.messageId)) {
          try {
            const threadId = `thread_${email.messageId}`;
            insertEmail.run(
              userId,
              folderId,
              email.from?.email || '',
              email.from?.name || '',
              email.to.map(addr => addr.email).join(','),
              email.cc.map(addr => addr.email).join(','),
              email.bcc.map(addr => addr.email).join(','),
              email.subject,
              email.bodyHtml || email.bodyText,
              email.messageId,
              threadId,
              email.isRead ? 1 : 0,
              email.isStarred ? 1 : 0,
              email.date.toISOString(),
              email.uid,
              email.size,
              email.attachments.length > 0 ? 1 : 0
            );
            newEmailsCount++;
          } catch (error) {
            console.error('Error saving email to database:', error);
          }
        }
      }

      res.json({
        success: true,
        synced: newEmailsCount,
        total: result.emails.length,
        totalOnServer: result.totalCount,
        message: `Synced ${newEmailsCount} new emails`
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to sync emails'
      });
    }
  } catch (error) {
    console.error('Error syncing emails:', error);
    res.status(500).json({ error: 'Failed to sync emails' });
  }
};

// Get email service status
const getEmailStatus = (req, res) => {
  try {
    const userId = req.user.id;
    const emailService = userEmailServices.get(userId);
    
    res.json({
      configured: !!emailService,
      connected: emailService?.isConnected || false,
      syncRunning: emailService?.syncInterval !== null
    });
  } catch (error) {
    console.error('Error getting email status:', error);
    res.status(500).json({ error: 'Failed to get email status' });
  }
};

// Initialize email service for user (called during login)
const initializeUserEmailService = async (userId) => {
  try {
    const settings = database.prepare(`
      SELECT * FROM email_settings WHERE user_id = ?
    `).get(userId);

    if (settings) {
      const emailService = new EmailService();
      await emailService.initialize({
        smtp: {
          host: settings.smtp_host,
          port: settings.smtp_port,
          secure: settings.smtp_secure === 1,
          username: settings.smtp_username,
          password: settings.smtp_password
        },
        imap: {
          host: settings.imap_host,
          port: settings.imap_port,
          secure: settings.imap_secure === 1,
          username: settings.imap_username,
          password: settings.imap_password
        }
      });

      userEmailServices.set(userId, emailService);

      if (settings.sync_enabled) {
        emailService.startSync(settings.sync_interval || 5);
      }

      console.log(`✅ Email service auto-initialized for user ${userId}`);
    }
  } catch (error) {
    console.error(`❌ Failed to auto-initialize email service for user ${userId}:`, error);
  }
};

// Cleanup email service for user (called during logout)
const cleanupUserEmailService = async (userId) => {
  try {
    const emailService = userEmailServices.get(userId);
    if (emailService) {
      await emailService.disconnect();
      userEmailServices.delete(userId);
      console.log(`🧹 Email service cleaned up for user ${userId}`);
    }
  } catch (error) {
    console.error(`❌ Failed to cleanup email service for user ${userId}:`, error);
  }
};

module.exports = {
  getEmailSettings,
  updateEmailSettings,
  testEmailConnection,
  sendEmail,
  syncEmails,
  getEmailStatus,
  initializeUserEmailService,
  cleanupUserEmailService
};