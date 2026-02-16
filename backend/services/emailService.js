const nodemailer = require('nodemailer');
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.smtpTransporter = null;
    this.imapClient = null;
    this.isConnected = false;
    this.syncInterval = null;
  }

  // Initialize email service with user settings
  async initialize(userSettings) {
    try {
      await this.setupSMTP(userSettings.smtp);
      await this.setupIMAP(userSettings.imap);
      this.isConnected = true;
      console.log('✅ Email service initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      return { success: false, error: error.message };
    }
  }

  // Setup SMTP transporter
  async setupSMTP(smtpConfig) {
    const config = {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure, // true for 465, false for other ports
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    };

    // Common SMTP configurations
    const presets = {
      'gmail': {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false
      },
      'outlook': {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false
      },
      'yahoo': {
        host: 'smtp.mail.yahoo.com',
        port: 587,
        secure: false
      }
    };

    if (presets[smtpConfig.provider]) {
      Object.assign(config, presets[smtpConfig.provider]);
    }

    this.smtpTransporter = nodemailer.createTransporter(config);
    
    // Verify SMTP connection
    await this.smtpTransporter.verify();
    console.log('✅ SMTP connection verified');
  }

  // Setup IMAP client
  async setupIMAP(imapConfig) {
    const config = {
      host: imapConfig.host,
      port: imapConfig.port,
      secure: imapConfig.secure,
      auth: {
        user: imapConfig.username,
        pass: imapConfig.password
      },
      logger: false
    };

    // Common IMAP configurations
    const presets = {
      'gmail': {
        host: 'imap.gmail.com',
        port: 993,
        secure: true
      },
      'outlook': {
        host: 'outlook.office365.com',
        port: 993,
        secure: true
      },
      'yahoo': {
        host: 'imap.mail.yahoo.com',
        port: 993,
        secure: true
      }
    };

    if (presets[imapConfig.provider]) {
      Object.assign(config, presets[imapConfig.provider]);
    }

    this.imapClient = new ImapFlow(config);
    
    // Test IMAP connection
    await this.imapClient.connect();
    await this.imapClient.logout();
    console.log('✅ IMAP connection verified');
  }

  // Send email
  async sendEmail(emailData, attachments = []) {
    if (!this.smtpTransporter) {
      throw new Error('SMTP not configured');
    }

    try {
      const mailOptions = {
        from: emailData.from,
        to: emailData.to,
        cc: emailData.cc,
        bcc: emailData.bcc,
        subject: emailData.subject,
        text: emailData.bodyText,
        html: emailData.bodyHtml,
        attachments: attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }))
      };

      const info = await this.smtpTransporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw error;
    }
  }

  // Fetch emails from IMAP server
  async fetchEmails(folder = 'INBOX', limit = 50, since = null) {
    if (!this.imapClient) {
      throw new Error('IMAP not configured');
    }

    try {
      await this.imapClient.connect();
      
      // Select folder
      let mailbox;
      try {
        mailbox = await this.imapClient.selectMailbox(folder);
      } catch (error) {
        // Try common folder names
        const folderMappings = {
          'INBOX': ['INBOX', 'Inbox'],
          'SENT': ['Sent', '[Gmail]/Sent Mail', 'Sent Items'],
          'DRAFTS': ['Drafts', '[Gmail]/Drafts'],
          'TRASH': ['Trash', '[Gmail]/Trash', 'Deleted Items'],
          'SPAM': ['Spam', '[Gmail]/Spam', 'Junk']
        };
        
        const alternatives = folderMappings[folder.toUpperCase()] || [folder];
        for (const alt of alternatives) {
          try {
            mailbox = await this.imapClient.selectMailbox(alt);
            break;
          } catch (e) {
            continue;
          }
        }
        
        if (!mailbox) {
          throw new Error(`Folder ${folder} not found`);
        }
      }

      // Build search criteria
      let searchCriteria = ['ALL'];
      if (since) {
        searchCriteria = ['SINCE', since];
      }

      // Search for messages
      const messages = [];
      const messageCount = Math.min(limit, mailbox.exists);
      
      if (messageCount > 0) {
        // Get recent messages
        const sequence = `${Math.max(1, mailbox.exists - messageCount + 1)}:${mailbox.exists}`;
        
        for await (const message of this.imapClient.fetch(sequence, {
          envelope: true,
          bodyStructure: true,
          source: true,
          flags: true,
          uid: true
        })) {
          try {
            const parsed = await simpleParser(message.source);
            
            messages.push({
              uid: message.uid,
              messageId: parsed.messageId,
              subject: parsed.subject || '(no subject)',
              from: this.parseAddress(parsed.from),
              to: this.parseAddressList(parsed.to),
              cc: this.parseAddressList(parsed.cc),
              bcc: this.parseAddressList(parsed.bcc),
              date: parsed.date,
              bodyText: parsed.text,
              bodyHtml: parsed.html,
              attachments: parsed.attachments || [],
              flags: message.flags || [],
              isRead: message.flags ? message.flags.has('\\Seen') : false,
              isStarred: message.flags ? message.flags.has('\\Flagged') : false,
              size: message.source.length
            });
          } catch (parseError) {
            console.error('Error parsing message:', parseError);
          }
        }
      }

      await this.imapClient.logout();
      
      return {
        success: true,
        emails: messages.reverse(), // Show newest first
        totalCount: mailbox.exists
      };
      
    } catch (error) {
      console.error('❌ Failed to fetch emails:', error);
      if (this.imapClient.usable) {
        await this.imapClient.logout();
      }
      throw error;
    }
  }

  // Mark email as read/unread
  async markAsRead(uid, isRead = true) {
    if (!this.imapClient) {
      throw new Error('IMAP not configured');
    }

    try {
      await this.imapClient.connect();
      await this.imapClient.selectMailbox('INBOX');
      
      if (isRead) {
        await this.imapClient.messageFlagsAdd(uid, ['\\Seen'], { uid: true });
      } else {
        await this.imapClient.messageFlagsRemove(uid, ['\\Seen'], { uid: true });
      }
      
      await this.imapClient.logout();
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to mark email as read:', error);
      if (this.imapClient.usable) {
        await this.imapClient.logout();
      }
      throw error;
    }
  }

  // Mark email as starred/unstarred
  async markAsStarred(uid, isStarred = true) {
    if (!this.imapClient) {
      throw new Error('IMAP not configured');
    }

    try {
      await this.imapClient.connect();
      await this.imapClient.selectMailbox('INBOX');
      
      if (isStarred) {
        await this.imapClient.messageFlagsAdd(uid, ['\\Flagged'], { uid: true });
      } else {
        await this.imapClient.messageFlagsRemove(uid, ['\\Flagged'], { uid: true });
      }
      
      await this.imapClient.logout();
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to mark email as starred:', error);
      if (this.imapClient.usable) {
        await this.imapClient.logout();
      }
      throw error;
    }
  }

  // Move email to folder
  async moveEmail(uid, targetFolder) {
    if (!this.imapClient) {
      throw new Error('IMAP not configured');
    }

    try {
      await this.imapClient.connect();
      await this.imapClient.selectMailbox('INBOX');
      
      await this.imapClient.messageMove(uid, targetFolder, { uid: true });
      
      await this.imapClient.logout();
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to move email:', error);
      if (this.imapClient.usable) {
        await this.imapClient.logout();
      }
      throw error;
    }
  }

  // Delete email
  async deleteEmail(uid) {
    if (!this.imapClient) {
      throw new Error('IMAP not configured');
    }

    try {
      await this.imapClient.connect();
      await this.imapClient.selectMailbox('INBOX');
      
      // Mark as deleted and expunge
      await this.imapClient.messageFlagsAdd(uid, ['\\Deleted'], { uid: true });
      await this.imapClient.expunge();
      
      await this.imapClient.logout();
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete email:', error);
      if (this.imapClient.usable) {
        await this.imapClient.logout();
      }
      throw error;
    }
  }

  // Get available folders
  async getFolders() {
    if (!this.imapClient) {
      throw new Error('IMAP not configured');
    }

    try {
      await this.imapClient.connect();
      
      const folders = await this.imapClient.list();
      
      await this.imapClient.logout();
      
      return {
        success: true,
        folders: folders.map(folder => ({
          name: folder.name,
          path: folder.path,
          delimiter: folder.delimiter,
          flags: folder.flags,
          specialUse: folder.specialUse
        }))
      };
    } catch (error) {
      console.error('❌ Failed to get folders:', error);
      if (this.imapClient.usable) {
        await this.imapClient.logout();
      }
      throw error;
    }
  }

  // Start automatic email synchronization
  startSync(intervalMinutes = 5) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      try {
        console.log('🔄 Syncing emails...');
        await this.syncEmails();
      } catch (error) {
        console.error('❌ Sync error:', error);
      }
    }, intervalMinutes * 60 * 1000);

    console.log(`✅ Email sync started (every ${intervalMinutes} minutes)`);
  }

  // Stop email synchronization
  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Email sync stopped');
    }
  }

  // Sync emails (to be implemented with database integration)
  async syncEmails() {
    // This would integrate with the database to sync new emails
    // For now, just log the sync attempt
    console.log('📧 Email sync placeholder - would sync with database');
  }

  // Test email connection
  async testConnection(config) {
    try {
      // Test SMTP
      const smtpTransporter = nodemailer.createTransporter({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.username,
          pass: config.smtp.password
        }
      });

      await smtpTransporter.verify();
      console.log('✅ SMTP test successful');

      // Test IMAP
      const imapClient = new ImapFlow({
        host: config.imap.host,
        port: config.imap.port,
        secure: config.imap.secure,
        auth: {
          user: config.imap.username,
          pass: config.imap.password
        }
      });

      await imapClient.connect();
      await imapClient.logout();
      console.log('✅ IMAP test successful');

      return {
        success: true,
        smtp: true,
        imap: true
      };
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper methods
  parseAddress(address) {
    if (!address || !address.value || !address.value[0]) {
      return null;
    }
    const addr = address.value[0];
    return {
      name: addr.name || null,
      email: addr.address
    };
  }

  parseAddressList(addressList) {
    if (!addressList || !addressList.value) {
      return [];
    }
    return addressList.value.map(addr => ({
      name: addr.name || null,
      email: addr.address
    }));
  }

  // Cleanup
  async disconnect() {
    this.stopSync();
    
    if (this.imapClient && this.imapClient.usable) {
      await this.imapClient.logout();
    }
    
    this.isConnected = false;
    console.log('🔌 Email service disconnected');
  }
}

module.exports = EmailService;