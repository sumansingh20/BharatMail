const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/emails');
const folderRoutes = require('./routes/folders');
const labelRoutes = require('./routes/labels');
const contactRoutes = require('./routes/contacts');
const attachmentRoutes = require('./routes/attachments');
const searchRoutes = require('./routes/search');
const settingsRoutes = require('./routes/settings');

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');

// Import config
const config = require('./config/config');
const { initializeDatabase } = require('./config/database');

const app = express();
const PORT = config.PORT || 3002;

// Security middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(cors(config.corsOptions));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(requestLogger);
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', authenticateToken, emailRoutes);
app.use('/api/folders', authenticateToken, folderRoutes);
app.use('/api/labels', authenticateToken, labelRoutes);
app.use('/api/contacts', authenticateToken, contactRoutes);
app.use('/api/attachments', authenticateToken, attachmentRoutes);
app.use('/api/search', authenticateToken, searchRoutes);
app.use('/api/settings/email', authenticateToken, require('./routes/emailSettings'));
app.use('/api/settings', authenticateToken, settingsRoutes);

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 BhaMail Server running on http://localhost:${PORT}`);
      console.log('📧 Professional Email Platform with Advanced Features');
      console.log('');
      console.log('🎯 Features Available:');
      console.log('  ✅ Complete Email UI/UX Experience');
      console.log('  ✅ Advanced Email Management');
      console.log('  ✅ Smart Compose & Rich Text Editor');
      console.log('  ✅ Intelligent Search & Filters');
      console.log('  ✅ Labels & Organization System');
      console.log('  ✅ Contacts Management');
      console.log('  ✅ File Attachments (25MB)');
      console.log('  ✅ Email Threading & Conversations');
      console.log('  ✅ Keyboard Shortcuts');
      console.log('  ✅ Responsive Design');
      console.log('  ✅ Security & Rate Limiting');
      console.log('  ✅ Real SMTP/IMAP Email Integration');
      console.log('');
      console.log('👤 Demo Login: demo@bhamail.com / demo123');
      console.log('🌐 Open http://localhost:3002 in your browser');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down BhaMail server...');
  process.exit(0);
});

startServer();

module.exports = app;