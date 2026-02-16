const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

let db;

function initializeDatabase() {
  try {
    const dbPath = path.join(__dirname, '../database/bhamail.db');
    db = new Database(dbPath);
    console.log('📁 Connected to SQLite database');
    createTables();
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    return Promise.reject(error);
  }
}

// Initialize database immediately when this module is loaded
initializeDatabase();

function createTables() {
  try {
    // Create tables one by one to identify issues
    
    // Users table
    db.exec(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      storage_used INTEGER DEFAULT 0,
      storage_limit INTEGER DEFAULT 16106127360,
      theme TEXT DEFAULT 'light',
      language TEXT DEFAULT 'en',
      timezone TEXT DEFAULT 'UTC',
      signature TEXT,
      auto_reply_enabled INTEGER DEFAULT 0,
      auto_reply_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Email folders
    db.exec(`CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'custom',
      icon TEXT,
      color TEXT,
      sort_order INTEGER DEFAULT 0,
      is_visible INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Emails table
    db.exec(`CREATE TABLE IF NOT EXISTS emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      folder_id INTEGER NOT NULL,
      from_email TEXT NOT NULL,
      from_name TEXT NOT NULL,
      to_emails TEXT NOT NULL,
      cc_emails TEXT,
      bcc_emails TEXT,
      reply_to TEXT,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      html_body TEXT,
      snippet TEXT,
      is_read INTEGER DEFAULT 0,
      is_starred INTEGER DEFAULT 0,
      is_important INTEGER DEFAULT 0,
      is_draft INTEGER DEFAULT 0,
      is_sent INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0,
      is_spam INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      thread_id TEXT,
      message_id TEXT UNIQUE,
      in_reply_to TEXT,
      priority INTEGER DEFAULT 3,
      sensitivity TEXT DEFAULT 'normal',
      size INTEGER DEFAULT 0,
      has_attachments INTEGER DEFAULT 0,
      scheduled_at DATETIME,
      snoozed_until DATETIME,
      auto_delete_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Attachments
    db.exec(`CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      is_inline INTEGER DEFAULT 0,
      content_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Labels
    db.exec(`CREATE TABLE IF NOT EXISTS labels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#1a73e8',
      is_system INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Email-Label junction
    db.exec(`CREATE TABLE IF NOT EXISTS email_labels (
      email_id INTEGER NOT NULL,
      label_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (email_id, label_id)
    )`);

    // Contacts
    db.exec(`CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      company TEXT,
      job_title TEXT,
      address TEXT,
      notes TEXT,
      avatar TEXT,
      is_favorite INTEGER DEFAULT 0,
      frequency_contacted INTEGER DEFAULT 0,
      last_contacted DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Contact groups
    db.exec(`CREATE TABLE IF NOT EXISTS contact_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Email filters
    db.exec(`CREATE TABLE IF NOT EXISTS email_filters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      conditions TEXT NOT NULL,
      actions TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      apply_to_existing INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Search history
    db.exec(`CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      query TEXT NOT NULL,
      filters TEXT,
      results_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Email tracking
    db.exec(`CREATE TABLE IF NOT EXISTS email_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      user_agent TEXT
    )`);

    // Conversations
    db.exec(`CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      participants TEXT NOT NULL,
      last_message_id INTEGER,
      message_count INTEGER DEFAULT 0,
      is_read INTEGER DEFAULT 0,
      is_starred INTEGER DEFAULT 0,
      is_important INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // User settings
    db.exec(`CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      setting_key TEXT NOT NULL,
      setting_value TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Email templates
    db.exec(`CREATE TABLE IF NOT EXISTS email_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      subject TEXT,
      body TEXT NOT NULL,
      is_shared INTEGER DEFAULT 0,
      usage_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Saved searches
    db.exec(`CREATE TABLE IF NOT EXISTS saved_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      query TEXT NOT NULL,
      filters TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Email settings for SMTP/IMAP configuration
    db.exec(`CREATE TABLE IF NOT EXISTS email_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      provider TEXT NOT NULL,
      smtp_host TEXT NOT NULL,
      smtp_port INTEGER NOT NULL,
      smtp_secure INTEGER DEFAULT 1,
      imap_host TEXT NOT NULL,
      imap_port INTEGER NOT NULL,
      imap_secure INTEGER DEFAULT 1,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT,
      signature TEXT,
      auto_sync INTEGER DEFAULT 1,
      sync_frequency INTEGER DEFAULT 300,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);

    console.log('📊 All database tables created successfully');
    createDemoData();
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

function createDemoData() {
  try {
    // Create demo user
    const hashedPassword = bcrypt.hashSync('demo123', 10);
    
    const userStmt = db.prepare('INSERT OR IGNORE INTO users (email, name, password) VALUES (?, ?, ?)');
    const userResult = userStmt.run('demo@bhamail.com', 'BhaMail Demo User', hashedPassword);
    
    const userId = userResult.lastInsertRowid || 1;
    
    // Create default folders
    const folders = [
      { name: 'Inbox', type: 'inbox', icon: 'inbox', sort_order: 1 },
      { name: 'Starred', type: 'starred', icon: 'star', sort_order: 2 },
      { name: 'Snoozed', type: 'snoozed', icon: 'schedule', sort_order: 3 },
      { name: 'Important', type: 'important', icon: 'label_important', sort_order: 4 },
      { name: 'Sent', type: 'sent', icon: 'send', sort_order: 5 },
      { name: 'Drafts', type: 'drafts', icon: 'drafts', sort_order: 6 },
      { name: 'All Mail', type: 'all', icon: 'mail', sort_order: 7 },
      { name: 'Spam', type: 'spam', icon: 'report', sort_order: 8 },
      { name: 'Trash', type: 'trash', icon: 'delete', sort_order: 9 }
    ];

    const folderStmt = db.prepare('INSERT OR IGNORE INTO folders (user_id, name, type, icon, sort_order) VALUES (?, ?, ?, ?, ?)');
    folders.forEach(folder => {
      folderStmt.run(userId, folder.name, folder.type, folder.icon, folder.sort_order);
    });

    // Create sample labels
    const labels = [
      { name: 'Work', color: '#d93025' },
      { name: 'Personal', color: '#1a73e8' },
      { name: 'Finance', color: '#34a853' },
      { name: 'Travel', color: '#ff6d01' },
      { name: 'Family', color: '#9c27b0' }
    ];

    const labelStmt = db.prepare('INSERT OR IGNORE INTO labels (user_id, name, color) VALUES (?, ?, ?)');
    labels.forEach(label => {
      labelStmt.run(userId, label.name, label.color);
    });

    // Create sample emails
    setTimeout(() => createSampleEmails(userId), 100);
    
    console.log('🎯 Demo data created successfully');
  } catch (error) {
    console.error('Error creating demo data:', error);
  }
}

function createSampleEmails(userId) {
  try {
    // Get inbox folder
    const folder = db.prepare('SELECT id FROM folders WHERE user_id = ? AND type = ?').get(userId, 'inbox');
    if (!folder) return;

    const emails = [
      {
        from_email: 'github@noreply.github.com',
        from_name: 'GitHub',
        subject: '🌟 Your repository gained a new star!',
        body: 'Congratulations! Someone just starred your repository "BhaMail". Your project is getting attention from the developer community. Keep up the excellent work!\n\nRepository: BhaMail\nStars: 127\nWatchers: 23\n\nThis is great progress for your Gmail clone project!',
        snippet: 'Congratulations! Someone just starred your repository "BhaMail"...',
        is_important: 1,
        has_attachments: 0
      },
      {
        from_email: 'team@figma.com',
        from_name: 'Figma Design Team',
        subject: '💬 New comment on "BhaMail UI Design"',
        body: 'Hi there! Someone left a new comment on your design file "BhaMail UI Design".\n\nComment from Sarah Chen:\n"This Gmail clone design looks incredibly authentic! The attention to detail in the UI components is impressive. How did you achieve such perfect color matching with the original Gmail interface?"\n\nReply to keep the collaboration going!',
        snippet: 'Someone left a new comment on your design file...',
        is_starred: 1,
        has_attachments: 0
      },
      {
        from_email: 'billing@stripe.com',
        from_name: 'Stripe',
        subject: '✅ Payment confirmed - $29.99',
        body: 'Thank you for your payment!\n\nPayment Details:\nAmount: $29.99\nDescription: Professional Email Hosting\nDate: ' + new Date().toLocaleDateString() + '\nMethod: •••• 4242\n\nYour service is now active. If you have any questions, please contact our support team.',
        snippet: 'Thank you for your payment! Amount: $29.99...',
        has_attachments: 0
      },
      {
        from_email: 'newsletter@techcrunch.com',
        from_name: 'TechCrunch',
        subject: '📰 The latest in tech: AI email assistants on the rise',
        body: 'Stay ahead of the curve with today\'s top tech stories:\n\n🤖 AI-Powered Email Management: The Future is Here\nEmail clients are integrating AI to help users manage their inboxes more efficiently. Features like smart compose, priority detection, and automated responses are becoming standard.\n\n📱 Mobile Email Usage Surpasses Desktop\nNew data shows that 67% of emails are now opened on mobile devices...\n\nRead more at techcrunch.com',
        snippet: 'Stay ahead of the curve with today\'s top tech stories...',
        has_attachments: 0
      },
      {
        from_email: 'hr@company.com',
        from_name: 'Human Resources',
        subject: '📅 Team meeting: Project BhaMail Demo',
        body: 'Dear Team,\n\nYou\'re invited to attend our weekly project review meeting:\n\n📅 Date: Tomorrow\n🕐 Time: 10:00 AM - 11:00 AM\n📍 Location: Conference Room A / Zoom\n\nAgenda:\n• BhaMail project progress review\n• Feature demonstrations\n• Next sprint planning\n• Q&A session\n\nPlease come prepared with your project updates. Looking forward to seeing the amazing progress on the BhaMail email platform!',
        snippet: 'You\'re invited to attend our weekly project review meeting...',
        is_important: 1,
        is_starred: 1,
        has_attachments: 0
      }
    ];

    const emailStmt = db.prepare(`
      INSERT INTO emails 
      (user_id, folder_id, from_email, from_name, to_emails, subject, body, 
       is_read, is_starred, is_important, thread_id, message_id, snippet, 
       size, has_attachments) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    emails.forEach((email, index) => {
      const messageId = `msg_${Date.now()}_${index}`;
      const threadId = `thread_${messageId}`;
      
      emailStmt.run(
        userId, folder.id, email.from_email, email.from_name, 'demo@bhamail.com',
        email.subject, email.body, 0, email.is_starred || 0, email.is_important || 0,
        threadId, messageId, email.snippet, email.body.length, email.has_attachments
      );
    });
  } catch (error) {
    console.error('Error creating sample emails:', error);
  }
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Export the db directly for better-sqlite3 compatibility
module.exports = getDatabase();

// Also export the init function for setup
module.exports.initializeDatabase = initializeDatabase;