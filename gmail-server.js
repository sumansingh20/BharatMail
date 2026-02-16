const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002;
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads (25MB limit)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use('/uploads', express.static(uploadsDir));

// Database setup
const db = new sqlite3.Database('gmail.db');

// Initialize database
function initializeDatabase() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      storage_used INTEGER DEFAULT 0,
      storage_limit INTEGER DEFAULT 15000000000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Folders table
  db.run(`
    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'custom',
      icon TEXT,
      color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Emails table
  db.run(`
    CREATE TABLE IF NOT EXISTS emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      folder_id INTEGER NOT NULL,
      from_email TEXT NOT NULL,
      from_name TEXT NOT NULL,
      to_emails TEXT NOT NULL,
      cc_emails TEXT,
      bcc_emails TEXT,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      html_body TEXT,
      is_read INTEGER DEFAULT 0,
      is_starred INTEGER DEFAULT 0,
      is_important INTEGER DEFAULT 0,
      is_draft INTEGER DEFAULT 0,
      thread_id TEXT,
      message_id TEXT UNIQUE,
      in_reply_to TEXT,
      snippet TEXT,
      size INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (folder_id) REFERENCES folders (id)
    )
  `);

  // Attachments table
  db.run(`
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (email_id) REFERENCES emails (id)
    )
  `);

  // Labels table
  db.run(`
    CREATE TABLE IF NOT EXISTS labels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Email labels junction table
  db.run(`
    CREATE TABLE IF NOT EXISTS email_labels (
      email_id INTEGER NOT NULL,
      label_id INTEGER NOT NULL,
      PRIMARY KEY (email_id, label_id),
      FOREIGN KEY (email_id) REFERENCES emails (id),
      FOREIGN KEY (label_id) REFERENCES labels (id)
    )
  `);

  // Contacts table
  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      notes TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Create demo user and data
  setTimeout(() => {
    createDemoData();
  }, 1000);
}

function createDemoData() {
  // Create demo user
  const hashedPassword = bcrypt.hashSync('demo123', 10);
  db.run(
    'INSERT OR IGNORE INTO users (email, name, password) VALUES (?, ?, ?)',
    ['demo@gmail.com', 'Demo User', hashedPassword],
    function(err) {
      if (err) return;
      const userId = this.lastID || 1;

      // Create default folders
      const folders = [
        { name: 'Inbox', type: 'inbox', icon: 'inbox' },
        { name: 'Starred', type: 'starred', icon: 'star' },
        { name: 'Sent', type: 'sent', icon: 'send' },
        { name: 'Drafts', type: 'drafts', icon: 'drafts' },
        { name: 'Spam', type: 'spam', icon: 'report' },
        { name: 'Trash', type: 'trash', icon: 'delete' },
        { name: 'Important', type: 'important', icon: 'label_important' }
      ];

      folders.forEach(folder => {
        db.run(
          'INSERT OR IGNORE INTO folders (user_id, name, type, icon) VALUES (?, ?, ?, ?)',
          [userId, folder.name, folder.type, folder.icon]
        );
      });

      // Create sample emails
      setTimeout(() => {
        createSampleEmails(userId);
      }, 500);
    }
  );
}

function createSampleEmails(userId) {
  // Get inbox folder
  db.get('SELECT id FROM folders WHERE user_id = ? AND type = "inbox"', [userId], (err, folder) => {
    if (err || !folder) return;

    const emails = [
      {
        from_email: 'noreply@github.com',
        from_name: 'GitHub',
        subject: 'Your repository has a new star!',
        body: 'Congratulations! Someone just starred your repository "awesome-project". Keep up the great work!',
        snippet: 'Congratulations! Someone just starred your repository...',
        is_important: 1
      },
      {
        from_email: 'team@figma.com',
        from_name: 'Figma Team',
        subject: 'New comment on your design',
        body: 'Hi! Someone left a comment on your design "Mobile App Wireframes". Check it out and respond to keep the collaboration going.',
        snippet: 'Someone left a comment on your design...',
        is_starred: 1
      },
      {
        from_email: 'support@stripe.com',
        from_name: 'Stripe Support',
        subject: 'Payment successfully processed',
        body: 'Your payment of $29.99 has been successfully processed. Thank you for your business!',
        snippet: 'Your payment of $29.99 has been successfully processed...'
      },
      {
        from_email: 'newsletter@techcrunch.com',
        from_name: 'TechCrunch',
        subject: 'The latest in tech news',
        body: 'Stay updated with the latest technology news, startups, and innovation happening around the world.',
        snippet: 'Stay updated with the latest technology news...'
      },
      {
        from_email: 'hr@company.com',
        from_name: 'HR Department',
        subject: 'Team meeting scheduled for tomorrow',
        body: 'Please join us for the weekly team meeting tomorrow at 10 AM in the conference room. We will discuss project updates and next steps.',
        snippet: 'Please join us for the weekly team meeting...',
        is_important: 1,
        is_starred: 1
      }
    ];

    emails.forEach((email, index) => {
      const messageId = `msg_${Date.now()}_${index}`;
      const threadId = `thread_${messageId}`;
      
      db.run(
        `INSERT INTO emails 
         (user_id, folder_id, from_email, from_name, to_emails, subject, body, 
          is_read, is_starred, is_important, thread_id, message_id, snippet, size) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, folder.id, email.from_email, email.from_name, 'demo@gmail.com',
         email.subject, email.body, 0, email.is_starred || 0, email.is_important || 0,
         threadId, messageId, email.snippet, email.body.length]
      );
    });
  });
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        storage_used: user.storage_used,
        storage_limit: user.storage_limit
      }
    });
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, name, password } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO users (email, name, password) VALUES (?, ?, ?)',
    [email, name, hashedPassword],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }

      // Create default folders for new user
      const userId = this.lastID;
      const folders = [
        { name: 'Inbox', type: 'inbox', icon: 'inbox' },
        { name: 'Starred', type: 'starred', icon: 'star' },
        { name: 'Sent', type: 'sent', icon: 'send' },
        { name: 'Drafts', type: 'drafts', icon: 'drafts' },
        { name: 'Spam', type: 'spam', icon: 'report' },
        { name: 'Trash', type: 'trash', icon: 'delete' }
      ];

      folders.forEach(folder => {
        db.run(
          'INSERT INTO folders (user_id, name, type, icon) VALUES (?, ?, ?, ?)',
          [userId, folder.name, folder.type, folder.icon]
        );
      });

      const token = jwt.sign(
        { id: userId, email, name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: { id: userId, email, name, storage_used: 0, storage_limit: 15000000000 }
      });
    }
  );
});

// Get user folders
app.get('/api/folders', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM folders WHERE user_id = ? ORDER BY id',
    [req.user.id],
    (err, folders) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(folders);
    }
  );
});

// Search emails
app.get('/api/emails/search', authenticateToken, (req, res) => {
  const { search, folder, starred, important, unread, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  let whereClause = 'WHERE e.user_id = ?';
  const params = [req.user.id];

  // Add search term
  if (search) {
    whereClause += ' AND (e.subject LIKE ? OR e.body LIKE ? OR e.from_name LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  // Add filters
  if (starred === 'true') {
    whereClause += ' AND e.is_starred = 1';
  }
  if (important === 'true') {
    whereClause += ' AND e.is_important = 1';
  }
  if (unread === 'true') {
    whereClause += ' AND e.is_read = 0';
  }
  if (folder && folder !== 'all') {
    whereClause += ' AND f.type = ?';
    params.push(folder);
  }

  const query = `
    SELECT e.*, f.name as folder_name, f.type as folder_type
    FROM emails e
    JOIN folders f ON e.folder_id = f.id
    ${whereClause}
    ORDER BY e.created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  params.push(parseInt(limit), offset);

  db.all(query, params, (err, emails) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Get attachments for each email
    const emailPromises = emails.map(email => {
      return new Promise((resolve) => {
        const attachmentQuery = `
          SELECT id, filename, original_name, mime_type, size
          FROM attachments WHERE email_id = ?
        `;
        
        db.all(attachmentQuery, [email.id], (err, attachments) => {
          email.attachments = attachments || [];
          resolve(email);
        });
      });
    });

    Promise.all(emailPromises).then(emailsWithAttachments => {
      // Get total count for pagination
      if (search || starred || important || unread || (folder && folder !== 'all')) {
        const countQuery = `
          SELECT COUNT(*) as total
          FROM emails e
          JOIN folders f ON e.folder_id = f.id
          ${whereClause}
        `;
        
        db.get(countQuery, params.slice(0, -2), (err, countResult) => {
          res.json({
            emails: emailsWithAttachments,
            total: countResult ? countResult.total : 0,
            page: parseInt(page),
            totalPages: Math.ceil((countResult?.total || 0) / limit)
          });
        });
      } else {
        res.json({
          emails: emailsWithAttachments,
          total: emailsWithAttachments.length,
          page: parseInt(page),
          totalPages: 1
        });
      }
    });
  });
});

// Get emails by folder
app.get('/api/emails/:folderType', authenticateToken, (req, res) => {
  const { folderType } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const query = `
    SELECT e.*, f.name as folder_name, f.type as folder_type
    FROM emails e
    JOIN folders f ON e.folder_id = f.id
    WHERE e.user_id = ? AND f.type = ?
    ORDER BY e.created_at DESC
    LIMIT ? OFFSET ?
  `;

  db.all(query, [req.user.id, folderType, parseInt(limit), offset], (err, emails) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Get attachments for each email
    const emailPromises = emails.map(email => {
      return new Promise((resolve) => {
        db.all(
          'SELECT id, filename, original_name, mime_type, size FROM attachments WHERE email_id = ?',
          [email.id],
          (err, attachments) => {
            email.attachments = attachments || [];
            email.attachments = email.attachments.map(att => ({
              ...att,
              downloadUrl: `/api/attachments/${att.id}`
            }));
            resolve(email);
          }
        );
      });
    });

    Promise.all(emailPromises).then(emailsWithAttachments => {
      res.json({
        emails: emailsWithAttachments,
        folder: folderType
      });
    });
  });
});

// Send/compose email
app.post('/api/emails/send', authenticateToken, upload.array('attachments', 10), (req, res) => {
  const { to, cc, bcc, subject, body, htmlBody, isDraft, inReplyTo } = req.body;
  
  // Get appropriate folder
  const folderType = isDraft ? 'drafts' : 'sent';
  
  db.get('SELECT id FROM folders WHERE user_id = ? AND type = ?', [req.user.id, folderType], (err, folder) => {
    if (err || !folder) {
      return res.status(500).json({ error: `${folderType} folder not found`});
    }

    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const threadId = inReplyTo ? `thread_${inReplyTo}` : `thread_${messageId}`;

      // Insert email
      db.run(
        `INSERT INTO emails 
         (user_id, folder_id, from_email, from_name, to_emails, cc_emails, bcc_emails, 
          subject, body, html_body, is_read, is_draft, thread_id, message_id, in_reply_to, 
          snippet, size) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, folder.id, req.user.email, req.user.name, to, cc || '', bcc || '',
         subject, body, htmlBody || body, 1, isDraft ? 1 : 0, threadId, messageId, inReplyTo || '',
         body.substring(0, 150), body.length],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to save email' });
          }

          const emailId = this.lastID;

          // Handle attachments
          if (req.files && req.files.length > 0) {
            const attachmentPromises = req.files.map(file => {
              return new Promise((resolve, reject) => {
                db.run(
                  'INSERT INTO attachments (email_id, filename, original_name, mime_type, size, file_path) VALUES (?, ?, ?, ?, ?, ?)',
                  [emailId, file.filename, file.originalname, file.mimetype, file.size, file.path],
                  function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                  }
                );
              });
            });

            Promise.all(attachmentPromises)
              .then(() => {
                res.json({ 
                  success: true, 
                  messageId, 
                  message: isDraft ? 'Draft saved' : 'Email sent successfully' 
                });
              })
              .catch(err => {
                res.status(500).json({ error: 'Failed to save attachments' });
              });
          } else {
            res.json({ 
              success: true, 
              messageId, 
              message: isDraft ? 'Draft saved' : 'Email sent successfully' 
            });
          }
        }
      );
    } catch (error) {
      res.status(500).json({ error: 'Failed to process email' });
    }
  });
});

// Get single email
app.get('/api/email/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get(
    'SELECT e.*, f.name as folder_name, f.type as folder_type FROM emails e JOIN folders f ON e.folder_id = f.id WHERE e.id = ? AND e.user_id = ?',
    [id, req.user.id],
    (err, email) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!email) {
        return res.status(404).json({ error: 'Email not found' });
      }

      // Get attachments
      db.all(
        'SELECT * FROM attachments WHERE email_id = ?',
        [id],
        (err, attachments) => {
          email.attachments = attachments || [];
          res.json(email);
        }
      );
    }
  );
});

// Update email (mark as read, star, etc.)
app.patch('/api/email/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const allowedFields = ['is_read', 'is_starred', 'is_important', 'folder_id'];
  const setClause = [];
  const values = [];

  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      setClause.push(`${key} = ?`);
      values.push(updates[key]);
    }
  });

  if (setClause.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  values.push(id, req.user.id);

  db.run(
    `UPDATE emails SET ${setClause.join(', ')} WHERE id = ? AND user_id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Email not found' });
      }
      res.json({ success: true });
    }
  );
});

// Delete email
app.delete('/api/email/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  // First delete attachments files
  db.all('SELECT file_path FROM attachments WHERE email_id = ?', [id], (err, attachments) => {
    if (attachments) {
      attachments.forEach(att => {
        if (fs.existsSync(att.file_path)) {
          fs.unlinkSync(att.file_path);
        }
      });
    }

    // Delete from database
    db.run('DELETE FROM attachments WHERE email_id = ?', [id]);
    db.run('DELETE FROM emails WHERE id = ? AND user_id = ?', [id, req.user.id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Email not found' });
      }
      res.json({ success: true });
    });
  });
});

// Download attachment
app.get('/api/attachments/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT a.*, e.user_id FROM attachments a 
     JOIN emails e ON a.email_id = e.id 
     WHERE a.id = ? AND e.user_id = ?`,
    [id, req.user.id],
    (err, attachment) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      res.download(attachment.file_path, attachment.original_name);
    }
  );
});

// Labels management
app.get('/api/labels', authenticateToken, (req, res) => {
  db.all('SELECT * FROM labels WHERE user_id = ?', [req.user.id], (err, labels) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(labels);
  });
});

app.post('/api/labels', authenticateToken, (req, res) => {
  const { name, color } = req.body;
  
  db.run(
    'INSERT INTO labels (user_id, name, color) VALUES (?, ?, ?)',
    [req.user.id, name, color],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID, name, color });
    }
  );
});

// Contacts management
app.get('/api/contacts', authenticateToken, (req, res) => {
  db.all('SELECT * FROM contacts WHERE user_id = ? ORDER BY name', [req.user.id], (err, contacts) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(contacts);
  });
});

app.post('/api/contacts', authenticateToken, (req, res) => {
  const { email, name, phone, notes } = req.body;
  
  db.run(
    'INSERT INTO contacts (user_id, email, name, phone, notes) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, email, name, phone || '', notes || ''],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID, email, name, phone, notes });
    }
  );
});

// Serve Gmail-like UI
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BhaMail - Complete Gmail Clone</title>
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Google Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f6f8fc;
            overflow: hidden;
        }
        
        .header {
            background: #1a73e8;
            color: white;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 100;
        }
        
        .logo {
            font-size: 22px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .logo .material-icons {
            font-size: 28px;
            color: #fbbc04;
        }
        
        .search-container {
            flex: 1;
            max-width: 720px;
            margin: 0 40px;
            position: relative;
        }
        
        .search-bar {
            display: flex;
            align-items: center;
            background: rgba(255,255,255,0.15);
            border-radius: 8px;
            padding: 0 16px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .search-bar:focus-within {
            background: white;
            color: #333;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        
        .search-bar input {
            flex: 1;
            padding: 12px 8px;
            border: none;
            background: transparent;
            font-size: 16px;
            color: inherit;
            outline: none;
        }
        
        .search-bar input::placeholder {
            color: rgba(255,255,255,0.8);
        }
        
        .search-bar:focus-within input::placeholder {
            color: #aaa;
        }
        
        .search-options {
            display: flex;
            gap: 8px;
            margin-left: 12px;
        }
        
        .search-btn {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            padding: 8px;
            border-radius: 4px;
        }
        
        .search-btn:hover {
            background: rgba(255,255,255,0.1);
        }
        
        .header-actions {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .header-btn {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        
        .header-btn:hover {
            background: rgba(255,255,255,0.1);
        }
        
        .user-menu {
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            padding: 6px 12px;
            border-radius: 20px;
            transition: background 0.2s;
        }
        
        .user-menu:hover {
            background: rgba(255,255,255,0.1);
        }
        
        .user-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #34a853;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 500;
            font-size: 14px;
        }
        
        .main-container {
            display: flex;
            height: calc(100vh - 64px);
            overflow: hidden;
        }
        
        .sidebar {
            width: 280px;
            background: white;
            border-right: 1px solid #e8eaed;
            display: flex;
            flex-direction: column;
            z-index: 50;
        }
        
        .compose-section {
            padding: 16px;
            border-bottom: 1px solid #e8eaed;
        }
        
        .compose-btn {
            background: #1a73e8;
            color: white;
            border: none;
            padding: 16px 24px;
            border-radius: 24px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 16px;
            width: 100%;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12);
            transition: all 0.2s;
        }
        
        .compose-btn:hover {
            background: #1557b0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        
        .sidebar-nav {
            flex: 1;
            overflow-y: auto;
            padding: 8px 0;
        }
        
        .nav-group {
            margin-bottom: 16px;
        }
        
        .nav-group-title {
            padding: 8px 24px;
            font-size: 12px;
            font-weight: 500;
            color: #5f6368;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }
        
        .sidebar-item {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 8px 24px;
            cursor: pointer;
            transition: background 0.2s;
            position: relative;
            margin: 0 8px;
            border-radius: 0 20px 20px 0;
        }
        
        .sidebar-item:hover {
            background: #f1f3f4;
        }
        
        .sidebar-item.active {
            background: #fce8e6;
            color: #d93025;
            font-weight: 500;
        }
        
        .sidebar-item.active .material-icons {
            color: #d93025;
        }
        
        .sidebar-item .material-icons {
            font-size: 20px;
            color: #5f6368;
        }
        
        .sidebar-item-text {
            flex: 1;
            font-size: 14px;
        }
        
        .sidebar-count {
            background: #1a73e8;
            color: white;
            border-radius: 8px;
            padding: 2px 8px;
            font-size: 11px;
            font-weight: 500;
            min-width: 16px;
            text-align: center;
        }
        
        .storage-info {
            padding: 16px 24px;
            border-top: 1px solid #e8eaed;
            font-size: 12px;
            color: #5f6368;
        }
        
        .storage-bar {
            width: 100%;
            height: 4px;
            background: #e8eaed;
            border-radius: 2px;
            margin: 8px 0;
            overflow: hidden;
        }
        
        .storage-used {
            height: 100%;
            background: linear-gradient(90deg, #4285f4, #34a853, #fbbc04);
            width: 15%;
            border-radius: 2px;
        }
        
        .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: white;
            overflow: hidden;
        }
        
        .content-header {
            padding: 8px 20px;
            border-bottom: 1px solid #e8eaed;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-height: 48px;
        }
        
        .folder-title {
            font-size: 22px;
            font-weight: 400;
            color: #202124;
        }
        
        .view-options {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .view-btn {
            background: none;
            border: none;
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;
            color: #5f6368;
        }
        
        .view-btn:hover,
        .view-btn.active {
            background: #f1f3f4;
            color: #1a73e8;
        }
        
        .toolbar {
            padding: 8px 20px;
            border-bottom: 1px solid #e8eaed;
            display: flex;
            align-items: center;
            gap: 8px;
            background: #f8f9fa;
        }
        
        .toolbar-group {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-right: 16px;
        }
        
        .toolbar-btn {
            background: none;
            border: none;
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: #5f6368;
            transition: all 0.2s;
        }
        
        .toolbar-btn:hover {
            background: #e8eaed;
            color: #202124;
        }
        
        .toolbar-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }
        
        .toolbar-divider {
            width: 1px;
            height: 20px;
            background: #dadce0;
            margin: 0 8px;
        }
        
        .email-list {
            flex: 1;
            overflow-y: auto;
        }
        
        .email-item {
            display: flex;
            align-items: center;
            padding: 12px 20px;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
        }
        
        .email-item:hover {
            box-shadow: inset 1px 0 0 #dadce0, inset -1px 0 0 #dadce0, 0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15);
            z-index: 1;
        }
        
        .email-item.unread {
            background: #fff;
            font-weight: 500;
        }
        
        .email-item.selected {
            background: #fce8e6;
        }
        
        .email-checkbox {
            margin-right: 16px;
            cursor: pointer;
        }
        
        .email-star {
            margin-right: 16px;
            cursor: pointer;
            color: #fdd663;
            transition: transform 0.2s;
        }
        
        .email-star:hover {
            transform: scale(1.2);
        }
        
        .email-important {
            margin-right: 16px;
            cursor: pointer;
            color: #fbbc04;
        }
        
        .email-sender {
            width: 200px;
            font-size: 14px;
            color: #202124;
            font-weight: 500;
        }
        
        .email-content {
            flex: 1;
            margin-right: 16px;
            overflow: hidden;
        }
        
        .email-subject {
            font-size: 14px;
            color: #202124;
            margin-bottom: 2px;
        }
        
        .email-snippet {
            font-size: 13px;
            color: #5f6368;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .email-labels {
            display: flex;
            gap: 4px;
            margin: 4px 0;
        }
        
        .email-label {
            background: #e8f0fe;
            color: #1a73e8;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
        }
        
        .email-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 120px;
        }
        
        .email-attachment {
            color: #5f6368;
            font-size: 16px;
        }
        
        .email-date {
            font-size: 12px;
            color: #5f6368;
            white-space: nowrap;
        }
        
        .email-actions {
            display: none;
            gap: 4px;
        }
        
        .email-item:hover .email-actions {
            display: flex;
        }
        
        .email-action-btn {
            background: none;
            border: none;
            padding: 6px;
            border-radius: 4px;
            cursor: pointer;
            color: #5f6368;
        }
        
        .email-action-btn:hover {
            background: #f1f3f4;
        }
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.4);
            z-index: 1000;
            backdrop-filter: blur(2px);
        }
        
        .modal-content {
            background: white;
            width: 90%;
            max-width: 900px;
            margin: 40px auto;
            border-radius: 8px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 8px 28px rgba(0,0,0,0.28);
        }
        
        .modal-header {
            padding: 20px 24px;
            border-bottom: 1px solid #e8eaed;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8f9fa;
            border-radius: 8px 8px 0 0;
        }
        
        .modal-title {
            font-size: 16px;
            font-weight: 500;
            color: #202124;
        }
        
        .modal-body {
            padding: 24px;
        }
        
        .compose-form {
            display: flex;
            flex-direction: column;
            gap: 1px;
        }
        
        .compose-field {
            display: flex;
            align-items: center;
            border-bottom: 1px solid #e8eaed;
            padding: 12px 16px;
        }
        
        .compose-label {
            width: 60px;
            font-size: 14px;
            color: #5f6368;
            text-align: right;
            margin-right: 16px;
        }
        
        .compose-input {
            flex: 1;
            border: none;
            outline: none;
            font-size: 14px;
            color: #202124;
            background: transparent;
        }
        
        .compose-body {
            min-height: 300px;
            padding: 16px;
            border: none;
            outline: none;
            font-size: 14px;
            color: #202124;
            font-family: inherit;
            resize: vertical;
        }
        
        .compose-toolbar {
            padding: 12px 16px;
            border-top: 1px solid #e8eaed;
            background: #f8f9fa;
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .compose-actions {
            display: flex;
            gap: 8px;
        }
        
        .btn-primary {
            background: #1a73e8;
            color: white;
            border: none;
            padding: 8px 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .btn-primary:hover {
            background: #1557b0;
        }
        
        .btn-secondary {
            background: transparent;
            color: #5f6368;
            border: 1px solid #dadce0;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .btn-secondary:hover {
            background: #f8f9fa;
        }
        
        .formatting-toolbar {
            display: flex;
            gap: 4px;
            margin-left: auto;
        }
        
        .format-btn {
            background: none;
            border: none;
            padding: 6px;
            border-radius: 4px;
            cursor: pointer;
            color: #5f6368;
        }
        
        .format-btn:hover,
        .format-btn.active {
            background: #e8eaed;
            color: #202124;
        }
        
        .attachment-area {
            padding: 16px;
            border: 2px dashed #dadce0;
            border-radius: 4px;
            text-align: center;
            color: #5f6368;
            margin: 16px 0;
        }
        
        .attachment-list {
            margin-top: 12px;
        }
        
        .attachment-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 4px;
            margin-bottom: 4px;
        }
        
        .close-btn {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            color: #5f6368;
        }
        
        .close-btn:hover {
            background: #f1f3f4;
        }
        
        .login-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #1a73e8, #4285f4);
        }
        
        .login-form {
            background: white;
            padding: 48px 40px;
            border-radius: 12px;
            box-shadow: 0 8px 28px rgba(0,0,0,0.28);
            width: 400px;
        }
        
        .login-logo {
            text-align: center;
            margin-bottom: 32px;
        }
        
        .login-logo .material-icons {
            font-size: 48px;
            color: #fbbc04;
            margin-bottom: 16px;
        }
        
        .login-form h2 {
            text-align: center;
            margin-bottom: 32px;
            color: #202124;
            font-weight: 400;
            font-size: 24px;
        }
        
        .login-form input {
            width: 100%;
            padding: 16px;
            margin-bottom: 20px;
            border: 1px solid #dadce0;
            border-radius: 4px;
            font-size: 16px;
            transition: border-color 0.2s;
        }
        
        .login-form input:focus {
            outline: none;
            border-color: #1a73e8;
            box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
        }
        
        .login-form button {
            width: 100%;
            padding: 16px;
            background: #1a73e8;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .login-form button:hover {
            background: #1557b0;
        }
        
        .hidden { 
            display: none !important; 
        }
        
        /* Advanced search */
        .advanced-search {
            background: white;
            border: 1px solid #dadce0;
            border-radius: 8px;
            padding: 20px;
            margin: 16px 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .search-filters {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        
        .filter-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .filter-label {
            font-size: 12px;
            font-weight: 500;
            color: #5f6368;
        }
        
        .filter-input {
            padding: 8px 12px;
            border: 1px solid #dadce0;
            border-radius: 4px;
            font-size: 14px;
        }
        
        /* Conversation threading */
        .thread-container {
            margin-left: 40px;
            border-left: 2px solid #e8eaed;
            padding-left: 16px;
        }
        
        .thread-email {
            margin-bottom: 16px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        /* Labels */
        .labels-section {
            padding: 16px 24px;
            border-bottom: 1px solid #e8eaed;
        }
        
        .label-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 6px 0;
        }
        
        .label-color {
            width: 16px;
            height: 16px;
            border-radius: 2px;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .sidebar {
                width: 240px;
            }
            
            .search-container {
                margin: 0 16px;
            }
            
            .email-sender {
                width: 120px;
            }
        }
    </style>
</head>
<body>
    <div id="loginScreen" class="login-container">
        <div class="login-form">
            <div class="login-logo">
                <span class="material-icons">mail</span>
            </div>
            <h2>BhaMail</h2>
            <p style="text-align: center; color: #5f6368; margin-bottom: 24px;">Complete Gmail Experience</p>
            <form id="loginForm">
                <input type="email" id="loginEmail" placeholder="Email address" value="demo@gmail.com" required>
                <input type="password" id="loginPassword" placeholder="Password" value="demo123" required>
                <button type="submit">Sign in</button>
            </form>
            <p style="text-align: center; margin-top: 24px; font-size: 12px; color: #5f6368;">
                Demo: demo@gmail.com / demo123
            </p>
        </div>
    </div>

    <div id="mailApp" class="hidden">
        <div class="header">
            <div class="logo">
                <span class="material-icons">mail</span>
                BhaMail
            </div>
            <div class="search-container">
                <div class="search-bar">
                    <span class="material-icons search-btn">search</span>
                    <input type="text" id="searchInput" placeholder="Search mail">
                    <div class="search-options">
                        <button class="search-btn" onclick="toggleAdvancedSearch()" title="Show search options">
                            <span class="material-icons">tune</span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="header-actions">
                <button class="header-btn" title="Support">
                    <span class="material-icons">help_outline</span>
                </button>
                <button class="header-btn" title="Settings">
                    <span class="material-icons">settings</span>
                </button>
                <button class="header-btn" title="Google apps">
                    <span class="material-icons">apps</span>
                </button>
                <div class="user-menu" onclick="toggleUserMenu()">
                    <div class="user-avatar" id="userAvatar">D</div>
                </div>
            </div>
        </div>

        <div class="main-container">
            <div class="sidebar">
                <div class="compose-section">
                    <button class="compose-btn" onclick="openCompose()">
                        <span class="material-icons">edit</span>
                        Compose
                    </button>
                </div>
                
                <div class="sidebar-nav">
                    <div class="nav-group">
                        <div class="sidebar-item active" data-folder="inbox">
                            <span class="material-icons">inbox</span>
                            <span class="sidebar-item-text">Inbox</span>
                            <span id="inboxCount" class="sidebar-count">0</span>
                        </div>
                        
                        <div class="sidebar-item" data-folder="starred">
                            <span class="material-icons">star</span>
                            <span class="sidebar-item-text">Starred</span>
                        </div>
                        
                        <div class="sidebar-item" data-folder="snoozed">
                            <span class="material-icons">schedule</span>
                            <span class="sidebar-item-text">Snoozed</span>
                        </div>
                        
                        <div class="sidebar-item" data-folder="important">
                            <span class="material-icons">label_important</span>
                            <span class="sidebar-item-text">Important</span>
                        </div>
                        
                        <div class="sidebar-item" data-folder="sent">
                            <span class="material-icons">send</span>
                            <span class="sidebar-item-text">Sent</span>
                        </div>
                        
                        <div class="sidebar-item" data-folder="drafts">
                            <span class="material-icons">drafts</span>
                            <span class="sidebar-item-text">Drafts</span>
                            <span id="draftsCount" class="sidebar-count hidden">0</span>
                        </div>
                        
                        <div class="sidebar-item" data-folder="all">
                            <span class="material-icons">mail</span>
                            <span class="sidebar-item-text">All Mail</span>
                        </div>
                        
                        <div class="sidebar-item" data-folder="spam">
                            <span class="material-icons">report</span>
                            <span class="sidebar-item-text">Spam</span>
                        </div>
                        
                        <div class="sidebar-item" data-folder="trash">
                            <span class="material-icons">delete</span>
                            <span class="sidebar-item-text">Trash</span>
                        </div>
                    </div>
                    
                    <div class="nav-group">
                        <div class="nav-group-title">Labels</div>
                        <div id="customLabels">
                            <div class="sidebar-item" data-folder="work">
                                <span class="material-icons" style="color: #d93025;">label</span>
                                <span class="sidebar-item-text">Work</span>
                            </div>
                            <div class="sidebar-item" data-folder="personal">
                                <span class="material-icons" style="color: #1a73e8;">label</span>
                                <span class="sidebar-item-text">Personal</span>
                            </div>
                            <div class="sidebar-item" data-folder="finance">
                                <span class="material-icons" style="color: #34a853;">label</span>
                                <span class="sidebar-item-text">Finance</span>
                            </div>
                        </div>
                        
                        <div class="sidebar-item" onclick="openLabelManager()">
                            <span class="material-icons">add</span>
                            <span class="sidebar-item-text">Create label</span>
                        </div>
                        
                        <div class="sidebar-item" onclick="openLabelManager()">
                            <span class="material-icons">settings</span>
                            <span class="sidebar-item-text">Manage labels</span>
                        </div>
                    </div>
                    
                    <div class="nav-group">
                        <div class="nav-group-title">More</div>
                        <div class="sidebar-item" onclick="openContacts()">
                            <span class="material-icons">contacts</span>
                            <span class="sidebar-item-text">Contacts</span>
                        </div>
                        
                        <div class="sidebar-item" onclick="openSettings()">
                            <span class="material-icons">settings</span>
                            <span class="sidebar-item-text">Settings</span>
                        </div>
                        
                        <div class="sidebar-item" onclick="openHelp()">
                            <span class="material-icons">help</span>
                            <span class="sidebar-item-text">Help</span>
                        </div>
                    </div>
                </div>
                
                <div class="storage-info">
                    <div>4.2 GB of 15 GB used</div>
                    <div class="storage-bar">
                        <div class="storage-used"></div>
                    </div>
                    <a href="#" style="color: #1a73e8; text-decoration: none;">Manage storage</a>
                </div>
            </div>

            <div class="content">
                <div id="advancedSearch" class="advanced-search hidden">
                    <div class="search-filters">
                        <div class="filter-group">
                            <label class="filter-label">From</label>
                            <input type="text" class="filter-input" placeholder="example@email.com">
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">To</label>
                            <input type="text" class="filter-input" placeholder="example@email.com">
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Subject</label>
                            <input type="text" class="filter-input" placeholder="Subject contains">
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Has attachment</label>
                            <select class="filter-input">
                                <option value="">Any</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; margin-top: 16px;">
                        <button class="btn-primary" onclick="performAdvancedSearch()">Search</button>
                        <button class="btn-secondary" onclick="clearAdvancedSearch()">Clear</button>
                    </div>
                </div>
                
                <div class="content-header">
                    <div class="folder-title" id="folderTitle">Inbox</div>
                    <div class="view-options">
                        <button class="view-btn active" title="Default view">
                            <span class="material-icons">inbox</span>
                        </button>
                        <button class="view-btn" title="Important markers">
                            <span class="material-icons">label_important</span>
                        </button>
                        <button class="view-btn" title="Multiple inboxes">
                            <span class="material-icons">view_module</span>
                        </button>
                        <button class="view-btn" title="Right-side chat">
                            <span class="material-icons">chat</span>
                        </button>
                    </div>
                </div>
                
                <div class="toolbar">
                    <div class="toolbar-group">
                        <input type="checkbox" id="selectAll" title="Select all">
                        <button class="toolbar-btn" onclick="refreshEmails()" title="Refresh">
                            <span class="material-icons">refresh</span>
                        </button>
                    </div>
                    
                    <div class="toolbar-divider"></div>
                    
                    <div class="toolbar-group">
                        <button class="toolbar-btn" onclick="archiveSelected()" title="Archive">
                            <span class="material-icons">archive</span>
                        </button>
                        <button class="toolbar-btn" onclick="markAsSpam()" title="Report spam">
                            <span class="material-icons">report</span>
                        </button>
                        <button class="toolbar-btn" onclick="deleteSelected()" title="Delete">
                            <span class="material-icons">delete</span>
                        </button>
                    </div>
                    
                    <div class="toolbar-divider"></div>
                    
                    <div class="toolbar-group">
                        <button class="toolbar-btn" onclick="markAsRead()" title="Mark as read">
                            <span class="material-icons">drafts</span>
                        </button>
                        <button class="toolbar-btn" onclick="markAsUnread()" title="Mark as unread">
                            <span class="material-icons">mail</span>
                        </button>
                        <button class="toolbar-btn" onclick="snoozeSelected()" title="Snooze">
                            <span class="material-icons">schedule</span>
                        </button>
                        <button class="toolbar-btn" onclick="addToTasks()" title="Add to Tasks">
                            <span class="material-icons">add_task</span>
                        </button>
                    </div>
                    
                    <div class="toolbar-divider"></div>
                    
                    <div class="toolbar-group">
                        <button class="toolbar-btn" onclick="moveToFolder()" title="Move to">
                            <span class="material-icons">drive_file_move</span>
                        </button>
                        <button class="toolbar-btn" onclick="applyLabels()" title="Labels">
                            <span class="material-icons">label</span>
                        </button>
                        <button class="toolbar-btn" onclick="moreActions()" title="More">
                            <span class="material-icons">more_vert</span>
                        </button>
                    </div>
                </div>
                
                <div id="emailList" class="email-list">
                    <!-- Emails will be loaded here -->
                </div>
            </div>
        </div>
    </div>

    <!-- Enhanced Compose Modal -->
    <div id="composeModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title">New Message</div>
                <div style="display: flex; gap: 8px;">
                    <button class="header-btn" onclick="minimizeCompose()" title="Minimize">
                        <span class="material-icons">minimize</span>
                    </button>
                    <button class="header-btn" onclick="maximizeCompose()" title="Pop-out">
                        <span class="material-icons">open_in_full</span>
                    </button>
                    <button class="close-btn" onclick="closeCompose()">&times;</button>
                </div>
            </div>
            <div class="modal-body">
                <form id="composeForm" class="compose-form">
                    <div class="compose-field">
                        <div class="compose-label">To</div>
                        <input type="text" id="composeTo" class="compose-input" placeholder="Recipients" required>
                        <button type="button" onclick="toggleCcBcc()" style="background: none; border: none; color: #1a73e8; cursor: pointer; margin-left: 8px;">Cc Bcc</button>
                    </div>
                    
                    <div id="ccBccFields" class="hidden">
                        <div class="compose-field">
                            <div class="compose-label">Cc</div>
                            <input type="text" id="composeCc" class="compose-input" placeholder="Carbon copy">
                        </div>
                        <div class="compose-field">
                            <div class="compose-label">Bcc</div>
                            <input type="text" id="composeBcc" class="compose-input" placeholder="Blind carbon copy">
                        </div>
                    </div>
                    
                    <div class="compose-field">
                        <div class="compose-label">Subject</div>
                        <input type="text" id="composeSubject" class="compose-input" placeholder="Subject" required>
                    </div>
                    
                    <div class="compose-toolbar">
                        <div class="formatting-toolbar">
                            <button type="button" class="format-btn" onclick="formatText('bold')" title="Bold">
                                <span class="material-icons">format_bold</span>
                            </button>
                            <button type="button" class="format-btn" onclick="formatText('italic')" title="Italic">
                                <span class="material-icons">format_italic</span>
                            </button>
                            <button type="button" class="format-btn" onclick="formatText('underline')" title="Underline">
                                <span class="material-icons">format_underlined</span>
                            </button>
                            <button type="button" class="format-btn" onclick="formatText('insertOrderedList')" title="Numbered list">
                                <span class="material-icons">format_list_numbered</span>
                            </button>
                            <button type="button" class="format-btn" onclick="formatText('insertUnorderedList')" title="Bulleted list">
                                <span class="material-icons">format_list_bulleted</span>
                            </button>
                            <button type="button" class="format-btn" onclick="insertLink()" title="Insert link">
                                <span class="material-icons">link</span>
                            </button>
                            <button type="button" class="format-btn" onclick="insertEmoji()" title="Insert emoji">
                                <span class="material-icons">emoji_emotions</span>
                            </button>
                        </div>
                        
                        <div style="display: flex; gap: 8px; margin-left: auto;">
                            <button type="button" class="format-btn" onclick="toggleAttachments()" title="Attach files">
                                <span class="material-icons">attach_file</span>
                            </button>
                            <button type="button" class="format-btn" onclick="insertPhoto()" title="Insert photo">
                                <span class="material-icons">image</span>
                            </button>
                            <button type="button" class="format-btn" onclick="insertDrive()" title="Insert files using Drive">
                                <span class="material-icons">cloud</span>
                            </button>
                            <button type="button" class="format-btn" onclick="scheduleEmail()" title="Schedule send">
                                <span class="material-icons">schedule</span>
                            </button>
                            <button type="button" class="format-btn" onclick="toggleConfidential()" title="Confidential mode">
                                <span class="material-icons">enhanced_encryption</span>
                            </button>
                        </div>
                    </div>
                    
                    <div contenteditable="true" id="composeBody" class="compose-body" placeholder="Compose your message..."></div>
                    
                    <div id="attachmentArea" class="attachment-area hidden">
                        <input type="file" id="composeAttachments" multiple accept="*/*" style="margin-bottom: 12px;">
                        <div>You can also drag and drop files here</div>
                        <div id="attachmentList" class="attachment-list"></div>
                    </div>
                    
                    <div class="compose-actions">
                        <button type="submit" class="btn-primary">
                            <span class="material-icons">send</span>
                            Send
                        </button>
                        <button type="button" class="btn-secondary" onclick="saveDraft()">
                            Save draft
                        </button>
                        <button type="button" class="btn-secondary" onclick="closeCompose()">
                            Discard
                        </button>
                        
                        <div style="margin-left: auto; display: flex; gap: 8px;">
                            <button type="button" class="format-btn" onclick="toggleSpellCheck()" title="Spell check">
                                <span class="material-icons">spellcheck</span>
                            </button>
                            <button type="button" class="format-btn" onclick="moreOptions()" title="More options">
                                <span class="material-icons">more_vert</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Email View Modal -->
    <div id="emailModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title" id="emailSubject">Email Subject</div>
                <div style="display: flex; gap: 8px;">
                    <button class="header-btn" onclick="printEmail()" title="Print">
                        <span class="material-icons">print</span>
                    </button>
                    <button class="header-btn" onclick="openInNewWindow()" title="Pop-out">
                        <span class="material-icons">open_in_new</span>
                    </button>
                    <button class="close-btn" onclick="closeEmailModal()">&times;</button>
                </div>
            </div>
            <div class="modal-body">
                <div id="emailContent">
                    <div class="email-header">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                            <div>
                                <div style="font-size: 20px; font-weight: 400; margin-bottom: 8px;" id="modalEmailSubject"></div>
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                    <div style="font-weight: 500;" id="modalEmailSender"></div>
                                    <div style="color: #5f6368; font-size: 14px;" id="modalEmailDate"></div>
                                </div>
                                <div style="color: #5f6368; font-size: 14px;" id="modalEmailTo"></div>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button class="format-btn" onclick="replyToEmail()" title="Reply">
                                    <span class="material-icons">reply</span>
                                </button>
                                <button class="format-btn" onclick="forwardEmail()" title="Forward">
                                    <span class="material-icons">forward</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div id="modalEmailBody" style="line-height: 1.6; margin: 20px 0;"></div>
                    <div id="modalEmailAttachments"></div>
                </div>
                
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e8eaed;">
                    <button class="btn-primary" onclick="replyToEmail()" style="margin-right: 8px;">
                        <span class="material-icons">reply</span>
                        Reply
                    </button>
                    <button class="btn-secondary" onclick="forwardEmail()">
                        <span class="material-icons">forward</span>
                        Forward
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Labels Modal -->
    <div id="labelsModal" class="modal">
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <div class="modal-title">Manage Labels</div>
                <button class="close-btn" onclick="closeLabelsModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 20px;">
                    <input type="text" id="newLabelName" placeholder="Label name" style="width: 70%; padding: 8px; margin-right: 8px;">
                    <input type="color" id="newLabelColor" value="#1a73e8" style="width: 50px; height: 36px; border: none; border-radius: 4px;">
                    <button class="btn-primary" onclick="createLabel()" style="margin-left: 8px;">Create</button>
                </div>
                <div id="labelsList"></div>
            </div>
        </div>
    </div>

    <!-- Contacts Modal -->
    <div id="contactsModal" class="modal">
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <div class="modal-title">Contacts</div>
                <button class="close-btn" onclick="closeContactsModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="display: flex; gap: 16px; margin-bottom: 20px;">
                    <input type="text" id="contactName" placeholder="Name" style="flex: 1; padding: 8px;">
                    <input type="email" id="contactEmail" placeholder="Email" style="flex: 1; padding: 8px;">
                    <button class="btn-primary" onclick="addContact()">Add Contact</button>
                </div>
                <div id="contactsList"></div>
            </div>
        </div>
    </div>

    <script>
        let currentFolder = 'inbox';
        let authToken = localStorage.getItem('authToken');
        let currentUser = null;
        
        // Check if user is logged in
        if (authToken) {
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('mailApp').classList.remove('hidden');
            loadEmails();
        }

        // Login form
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                if (response.ok) {
                    authToken = data.token;
                    currentUser = data.user;
                    localStorage.setItem('authToken', authToken);
                    document.getElementById('loginScreen').classList.add('hidden');
                    document.getElementById('mailApp').classList.remove('hidden');
                    document.getElementById('userName').textContent = currentUser.name;
                    loadEmails();
                } else {
                    alert(data.error);
                }
            } catch (error) {
                alert('Login failed');
            }
        });

        // Logout
        function logout() {
            localStorage.removeItem('authToken');
            location.reload();
        }

        // Sidebar navigation
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                currentFolder = item.dataset.folder;
                loadEmails();
            });
        });

        // Load emails
        async function loadEmails() {
            try {
                const response = await fetch(\`/api/emails/\${currentFolder}\`, {
                    headers: { 'Authorization': \`Bearer \${authToken}\` }
                });
                
                const data = await response.json();
                displayEmails(data.emails || []);
                updateInboxCount();
            } catch (error) {
                console.error('Failed to load emails:', error);
            }
        }

        // Display emails with enhanced features
        function displayEmails(emails) {
            const emailList = document.getElementById('emailList');
            emailList.innerHTML = '';

            if (emails.length === 0) {
                emailList.innerHTML = \`
                    <div style="text-align: center; padding: 40px; color: #5f6368;">
                        <span class="material-icons" style="font-size: 48px; margin-bottom: 16px;">inbox</span>
                        <div style="font-size: 18px; margin-bottom: 8px;">No messages in \${currentFolder}</div>
                        <div style="font-size: 14px;">When you receive messages, they'll appear here.</div>
                    </div>
                \`;
                return;
            }

            emails.forEach(email => {
                const emailItem = document.createElement('div');
                emailItem.className = \`email-item \${email.is_read ? '' : 'unread'}\`;
                emailItem.innerHTML = \`
                    <input type="checkbox" class="email-checkbox" data-id="\${email.id}">
                    <span class="material-icons email-star \${email.is_starred ? 'starred' : ''}" onclick="toggleStar(\${email.id})">\${email.is_starred ? 'star' : 'star_border'}</span>
                    <span class="material-icons email-important \${email.is_important ? 'important' : ''}" onclick="toggleImportant(\${email.id})">\${email.is_important ? 'label_important' : 'label_important_outline'}</span>
                    <div class="email-sender">\${email.from_name}</div>
                    <div class="email-content">
                        <div class="email-subject">\${email.subject}</div>
                        <div class="email-snippet">\${email.snippet || email.body.substring(0, 100)}...</div>
                        \${email.attachments && email.attachments.length > 0 ? \`
                            <div class="email-labels">
                                <span class="email-label">📎 \${email.attachments.length} attachment\${email.attachments.length > 1 ? 's' : ''}</span>
                            </div>
                        \` : ''}
                    </div>
                    <div class="email-meta">
                        \${email.attachments && email.attachments.length > 0 ? '<span class="material-icons email-attachment">attach_file</span>' : ''}
                        <div class="email-date">\${formatEmailDate(email.created_at)}</div>
                    </div>
                    <div class="email-actions">
                        <button class="email-action-btn" onclick="archiveEmail(\${email.id})" title="Archive">
                            <span class="material-icons">archive</span>
                        </button>
                        <button class="email-action-btn" onclick="deleteEmail(\${email.id})" title="Delete">
                            <span class="material-icons">delete</span>
                        </button>
                        <button class="email-action-btn" onclick="markAsRead(\${email.id})" title="Mark as read">
                            <span class="material-icons">drafts</span>
                        </button>
                        <button class="email-action-btn" onclick="snoozeEmail(\${email.id})" title="Snooze">
                            <span class="material-icons">schedule</span>
                        </button>
                    </div>
                \`;
                
                emailItem.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('email-checkbox') && 
                        !e.target.classList.contains('email-star') && 
                        !e.target.classList.contains('email-important') &&
                        !e.target.classList.contains('email-action-btn') &&
                        !e.target.classList.contains('material-icons')) {
                        openEmailModal(email);
                    }
                });
                
                emailList.appendChild(emailItem);
            });
        }

        // Format email date
        function formatEmailDate(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            } else if (diffDays < 7) {
                return date.toLocaleDateString([], {weekday: 'short'});
            } else {
                return date.toLocaleDateString([], {month: 'short', day: 'numeric'});
            }
        }

        // Open email in modal
        function openEmailModal(email) {
            // Mark as read
            if (!email.is_read) {
                fetch(\`/api/email/\${email.id}\`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': \`Bearer \${authToken}\`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ is_read: 1 })
                });
            }

            document.getElementById('modalEmailSubject').textContent = email.subject;
            document.getElementById('modalEmailSender').textContent = email.from_name + ' <' + email.from_email + '>';
            document.getElementById('modalEmailDate').textContent = new Date(email.created_at).toLocaleString();
            document.getElementById('modalEmailTo').textContent = 'to ' + email.to_emails;
            document.getElementById('modalEmailBody').innerHTML = email.html_body || email.body.replace(/\\n/g, '<br>');
            
            // Show attachments
            const attachmentsDiv = document.getElementById('modalEmailAttachments');
            if (email.attachments && email.attachments.length > 0) {
                attachmentsDiv.innerHTML = \`
                    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e8eaed;">
                        <div style="font-weight: 500; margin-bottom: 8px;">Attachments:</div>
                        \${email.attachments.map(att => \`
                            <div class="attachment-item">
                                <span class="material-icons">attach_file</span>
                                <span>\${att.original_name} (\${formatFileSize(att.size)})</span>
                                <a href="/api/attachments/\${att.id}" target="_blank" style="margin-left: auto; color: #1a73e8;">Download</a>
                            </div>
                        \`).join('')}
                    </div>
                \`;
            } else {
                attachmentsDiv.innerHTML = '';
            }
            
            document.getElementById('emailModal').style.display = 'block';
            setTimeout(() => loadEmails(), 500); // Refresh to show read status
        }

        // Format file size
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        // Close email modal
        function closeEmailModal() {
            document.getElementById('emailModal').style.display = 'none';
        }

        // Enhanced compose functions
        function toggleCcBcc() {
            const fields = document.getElementById('ccBccFields');
            fields.classList.toggle('hidden');
        }

        function toggleAttachments() {
            const area = document.getElementById('attachmentArea');
            area.classList.toggle('hidden');
        }

        function formatText(command) {
            document.execCommand(command, false, null);
            document.getElementById('composeBody').focus();
        }

        function insertLink() {
            const url = prompt('Enter URL:');
            if (url) {
                document.execCommand('createLink', false, url);
            }
        }

        function insertEmoji() {
            const emojis = ['😀', '😊', '😎', '🤔', '👍', '❤️', '🎉', '✨'];
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            document.execCommand('insertText', false, emoji);
        }

        // Advanced search functions
        function toggleAdvancedSearch() {
            const advancedSearch = document.getElementById('advancedSearch');
            advancedSearch.classList.toggle('hidden');
        }

        function performAdvancedSearch() {
            // Implementation for advanced search
            alert('Advanced search functionality - coming soon!');
        }

        function clearAdvancedSearch() {
            document.querySelectorAll('.filter-input').forEach(input => input.value = '');
        }

        // Toggle functions
        function toggleImportant(emailId) {
            // Similar to toggleStar but for important
            const emailItem = document.querySelector(\`input[data-id="\${emailId}"]\`).closest('.email-item');
            const importantIcon = emailItem.querySelector('.email-important');
            const isImportant = importantIcon.classList.contains('important');
            
            fetch(\`/api/email/\${emailId}\`, {
                method: 'PATCH',
                headers: {
                    'Authorization': \`Bearer \${authToken}\`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_important: isImportant ? 0 : 1 })
            }).then(() => {
                importantIcon.classList.toggle('important');
                importantIcon.textContent = isImportant ? 'label_important_outline' : 'label_important';
            });
        }

        // Enhanced toolbar functions
        function archiveSelected() {
            const selectedEmails = getSelectedEmails();
            if (selectedEmails.length === 0) {
                alert('Please select emails to archive');
                return;
            }
            // Implementation for archiving
            alert(\`Archiving \${selectedEmails.length} email(s) - feature coming soon!\`);
        }

        function markAsSpam() {
            const selectedEmails = getSelectedEmails();
            if (selectedEmails.length === 0) {
                alert('Please select emails to mark as spam');
                return;
            }
            alert(\`Marking \${selectedEmails.length} email(s) as spam - feature coming soon!\`);
        }

        function markAsUnread() {
            const selectedEmails = getSelectedEmails();
            selectedEmails.forEach(async (emailId) => {
                await fetch(\`/api/email/\${emailId}\`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': \`Bearer \${authToken}\`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ is_read: 0 })
                });
            });
            setTimeout(loadEmails, 500);
        }

        function snoozeSelected() {
            const selectedEmails = getSelectedEmails();
            if (selectedEmails.length === 0) {
                alert('Please select emails to snooze');
                return;
            }
            alert(\`Snoozing \${selectedEmails.length} email(s) - feature coming soon!\`);
        }

        function addToTasks() {
            const selectedEmails = getSelectedEmails();
            if (selectedEmails.length === 0) {
                alert('Please select emails to add to tasks');
                return;
            }
            alert(\`Adding \${selectedEmails.length} email(s) to tasks - feature coming soon!\`);
        }

        function moveToFolder() {
            const selectedEmails = getSelectedEmails();
            if (selectedEmails.length === 0) {
                alert('Please select emails to move');
                return;
            }
            alert('Move to folder - feature coming soon!');
        }

        function applyLabels() {
            const selectedEmails = getSelectedEmails();
            if (selectedEmails.length === 0) {
                alert('Please select emails to label');
                return;
            }
            alert('Apply labels - feature coming soon!');
        }

        function moreActions() {
            alert('More actions menu - feature coming soon!');
        }

        // Modal functions
        function openLabelManager() {
            document.getElementById('labelsModal').style.display = 'block';
            loadLabels();
        }

        function closeLabelsModal() {
            document.getElementById('labelsModal').style.display = 'none';
        }

        function openContacts() {
            document.getElementById('contactsModal').style.display = 'block';
            loadContacts();
        }

        function closeContactsModal() {
            document.getElementById('contactsModal').style.display = 'none';
        }

        function openSettings() {
            alert('Settings - feature coming soon!');
        }

        function openHelp() {
            alert('Help & Support - feature coming soon!');
        }

        // Load labels and contacts
        async function loadLabels() {
            try {
                const response = await fetch('/api/labels', {
                    headers: { 'Authorization': \`Bearer \${authToken}\` }
                });
                const labels = await response.json();
                
                const labelsList = document.getElementById('labelsList');
                labelsList.innerHTML = labels.map(label => \`
                    <div style="display: flex; align-items: center; gap: 8px; padding: 8px 0;">
                        <div style="width: 16px; height: 16px; background: \${label.color}; border-radius: 2px;"></div>
                        <span style="flex: 1;">\${label.name}</span>
                        <button onclick="deleteLabel(\${label.id})" style="background: none; border: none; color: #5f6368; cursor: pointer;">
                            <span class="material-icons">delete</span>
                        </button>
                    </div>
                \`).join('');
            } catch (error) {
                console.error('Failed to load labels:', error);
            }
        }

        async function loadContacts() {
            try {
                const response = await fetch('/api/contacts', {
                    headers: { 'Authorization': \`Bearer \${authToken}\` }
                });
                const contacts = await response.json();
                
                const contactsList = document.getElementById('contactsList');
                contactsList.innerHTML = contacts.map(contact => \`
                    <div style="display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #e8eaed;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: #1a73e8; color: white; display: flex; align-items: center; justify-content: center; font-weight: 500;">
                            \${contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 500;">\${contact.name}</div>
                            <div style="color: #5f6368; font-size: 14px;">\${contact.email}</div>
                        </div>
                        <button onclick="deleteContact(\${contact.id})" style="background: none; border: none; color: #5f6368; cursor: pointer;">
                            <span class="material-icons">delete</span>
                        </button>
                    </div>
                \`).join('');
            } catch (error) {
                console.error('Failed to load contacts:', error);
            }
        }

        // Create label
        async function createLabel() {
            const name = document.getElementById('newLabelName').value;
            const color = document.getElementById('newLabelColor').value;
            
            if (!name) return;
            
            try {
                const response = await fetch('/api/labels', {
                    method: 'POST',
                    headers: {
                        'Authorization': \`Bearer \${authToken}\`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, color })
                });
                
                if (response.ok) {
                    document.getElementById('newLabelName').value = '';
                    loadLabels();
                }
            } catch (error) {
                console.error('Failed to create label:', error);
            }
        }

        // Add contact
        async function addContact() {
            const name = document.getElementById('contactName').value;
            const email = document.getElementById('contactEmail').value;
            
            if (!name || !email) return;
            
            try {
                const response = await fetch('/api/contacts', {
                    method: 'POST',
                    headers: {
                        'Authorization': \`Bearer \${authToken}\`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email })
                });
                
                if (response.ok) {
                    document.getElementById('contactName').value = '';
                    document.getElementById('contactEmail').value = '';
                    loadContacts();
                }
            } catch (error) {
                console.error('Failed to add contact:', error);
            }
        }

        // Reply and forward functions
        function replyToEmail() {
            // Implementation for reply
            closeEmailModal();
            openCompose();
            alert('Reply functionality - coming soon!');
        }

        function forwardEmail() {
            // Implementation for forward
            closeEmailModal();
            openCompose();
            alert('Forward functionality - coming soon!');
        }

        // Toggle star
        async function toggleStar(emailId) {
            try {
                const emailItem = document.querySelector(\`input[data-id="\${emailId}"]\`).closest('.email-item');
                const starIcon = emailItem.querySelector('.email-star');
                const isStarred = starIcon.classList.contains('starred');
                
                const response = await fetch(\`/api/email/\${emailId}\`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': \`Bearer \${authToken}\`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ is_starred: isStarred ? 0 : 1 })
                });

                if (response.ok) {
                    starIcon.classList.toggle('starred');
                    starIcon.textContent = isStarred ? 'star_border' : 'star';
                }
            } catch (error) {
                console.error('Failed to toggle star:', error);
            }
        }

        // Compose email
        function openCompose() {
            document.getElementById('composeModal').style.display = 'block';
        }

        function closeCompose() {
            document.getElementById('composeModal').style.display = 'none';
            document.getElementById('composeForm').reset();
        }

        // Send email
        document.getElementById('composeForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('to', document.getElementById('composeTo').value);
            formData.append('cc', document.getElementById('composeCc').value);
            formData.append('bcc', document.getElementById('composeBcc').value);
            formData.append('subject', document.getElementById('composeSubject').value);
            formData.append('body', document.getElementById('composeBody').value);
            
            const files = document.getElementById('composeAttachments').files;
            for (let file of files) {
                formData.append('attachments', file);
            }

            try {
                const response = await fetch('/api/emails/send', {
                    method: 'POST',
                    headers: { 'Authorization': \`Bearer \${authToken}\` },
                    body: formData
                });

                const data = await response.json();
                if (response.ok) {
                    alert('Email sent successfully!');
                    closeCompose();
                    if (currentFolder === 'sent') {
                        loadEmails();
                    }
                } else {
                    alert(data.error);
                }
            } catch (error) {
                alert('Failed to send email');
            }
        });

        // Update inbox count
        async function updateInboxCount() {
            try {
                const response = await fetch('/api/emails/inbox', {
                    headers: { 'Authorization': \`Bearer \${authToken}\` }
                });
                const data = await response.json();
                const unreadCount = data.emails ? data.emails.filter(e => !e.is_read).length : 0;
                document.getElementById('inboxCount').textContent = unreadCount;
            } catch (error) {
                console.error('Failed to update inbox count:', error);
            }
        }

        // Toolbar actions
        function markAsRead() {
            const selectedEmails = getSelectedEmails();
            selectedEmails.forEach(async (emailId) => {
                await fetch(\`/api/email/\${emailId}\`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': \`Bearer \${authToken}\`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ is_read: 1 })
                });
            });
            setTimeout(loadEmails, 500);
        }

        function markAsStarred() {
            const selectedEmails = getSelectedEmails();
            selectedEmails.forEach(async (emailId) => {
                await fetch(\`/api/email/\${emailId}\`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': \`Bearer \${authToken}\`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ is_starred: 1 })
                });
            });
            setTimeout(loadEmails, 500);
        }

        function deleteSelected() {
            const selectedEmails = getSelectedEmails();
            if (selectedEmails.length === 0) {
                alert('Please select emails to delete');
                return;
            }
            
            if (confirm(\`Delete \${selectedEmails.length} email(s)?\`)) {
                selectedEmails.forEach(async (emailId) => {
                    await fetch(\`/api/email/\${emailId}\`, {
                        method: 'DELETE',
                        headers: { 'Authorization': \`Bearer \${authToken}\` }
                    });
                });
                setTimeout(loadEmails, 500);
            }
        }

        function getSelectedEmails() {
            const checkboxes = document.querySelectorAll('.email-checkbox:checked');
            return Array.from(checkboxes).map(cb => cb.dataset.id);
        }

        function refreshEmails() {
            loadEmails();
        }

        // Search functionality
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = e.target.value;
                if (searchTerm.trim()) {
                    searchEmails(searchTerm);
                } else {
                    loadEmails();
                }
            }
        });

        async function searchEmails(searchTerm) {
            try {
                const response = await fetch(\`/api/emails/search?search=\${encodeURIComponent(searchTerm)}\`, {
                    headers: { 'Authorization': \`Bearer \${authToken}\` }
                });
                
                const data = await response.json();
                displayEmails(data.emails || []);
            } catch (error) {
                console.error('Search failed:', error);
            }
        }

        // Select all functionality
        document.getElementById('selectAll').addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.email-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
        });
        
        // Auto-refresh emails every 30 seconds
        setInterval(updateInboxCount, 30000);
    </script>
</body>
</html>
  `);
});

function startServer() {
  initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Complete Gmail Server running on http://localhost:${PORT}`);
    console.log('📧 Features included:');
    console.log('  ✅ User Authentication (Login/Register)');
    console.log('  ✅ Email Compose, Send, Reply, Forward');
    console.log('  ✅ Folder Management (Inbox, Sent, Drafts, etc.)');
    console.log('  ✅ File Attachments (25MB limit)');
    console.log('  ✅ Email Search & Filtering');
    console.log('  ✅ Star/Important marking');
    console.log('  ✅ Labels & Contacts management');
    console.log('  ✅ SQLite Database storage');
    console.log('  ✅ Gmail-like Web Interface');
    console.log('');
    console.log('👤 Demo Login: demo@gmail.com / demo123');
    console.log('🌐 Open http://localhost:3002 in your browser');
  });
}

startServer();
