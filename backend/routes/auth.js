const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

const router = express.Router();

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      name: user.name 
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        storage_used: user.storage_used,
        storage_limit: user.storage_limit,
        theme: user.theme,
        language: user.language
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;
    
    if (!email || !name || !password) {
      return res.status(400).json({ 
        error: 'Email, name, and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    try {
      const result = db.prepare('INSERT INTO users (email, name, password) VALUES (?, ?, ?)').run(email, name, hashedPassword);
      const userId = result.lastInsertRowid;
      
      // Create default folders for new user
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

      const folderStmt = db.prepare('INSERT INTO folders (user_id, name, type, icon, sort_order) VALUES (?, ?, ?, ?, ?)');
      folders.forEach(folder => {
        folderStmt.run(userId, folder.name, folder.type, folder.icon, folder.sort_order);
      });

      const token = generateToken({ id: userId, email, name });

      res.status(201).json({
        success: true,
        token,
        user: { 
          id: userId, 
          email, 
          name, 
          storage_used: 0, 
          storage_limit: 16106127360 
        }
      });
    } catch (dbError) {
      if (dbError.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ 
          error: 'Email already exists' 
        });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Verify token
router.post('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    
    res.json({ 
      valid: true, 
      user: decoded 
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ 
      valid: false, 
      error: 'Invalid token' 
    });
  }
});

module.exports = router;