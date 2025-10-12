// Simple development server for BhaMail API
// This runs without Docker for quick testing

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'BhaMail API (Development Mode)',
    message: 'Running without Docker - limited functionality'
  });
});

// Mock API endpoints for development
app.get('/api/auth/me', (req, res) => {
  res.json({
    user: {
      id: '1',
      email: 'admin@bhamail.local',
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@bhamail.local' && password === 'password') {
    res.json({
      user: {
        id: '1',
        email: 'admin@bhamail.local',
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true
      },
      token: 'mock-jwt-token-for-development'
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/messages', (req, res) => {
  res.json({
    messages: [
      {
        id: '1',
        from: 'system@bhamail.local',
        to: ['admin@bhamail.local'],
        subject: 'Welcome to BhaMail! 🎉',
        body: 'Welcome to BhaMail, your self-hosted email solution!',
        timestamp: new Date().toISOString(),
        isRead: false
      }
    ],
    total: 1
  });
});

// API documentation
app.get('/api-docs', (req, res) => {
  res.send(`
    <html>
    <head>
      <title>BhaMail API Documentation</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .method { font-weight: bold; color: #0066cc; }
      </style>
    </head>
    <body>
      <h1>🚀 BhaMail API (Development Mode)</h1>
      <p><strong>Status:</strong> Running in development mode without Docker</p>
      <p><strong>Base URL:</strong> http://localhost:${PORT}</p>
      
      <h2>Available Endpoints:</h2>
      
      <div class="endpoint">
        <span class="method">GET</span> /health
        <p>Check API health status</p>
      </div>
      
      <div class="endpoint">
        <span class="method">POST</span> /api/auth/login
        <p>Login with email and password</p>
        <pre>{ "email": "admin@bhamail.local", "password": "password" }</pre>
      </div>
      
      <div class="endpoint">
        <span class="method">GET</span> /api/auth/me
        <p>Get current user information</p>
      </div>
      
      <div class="endpoint">
        <span class="method">GET</span> /api/messages
        <p>Get user messages</p>
      </div>
      
      <h2>Next Steps:</h2>
      <ul>
        <li>Fix Docker Desktop API version issues</li>
        <li>Start full Docker stack with: <code>docker-compose up -d</code></li>
        <li>Run database migrations and seed script</li>
        <li>Access full web application at <a href="http://localhost:3000">http://localhost:3000</a></li>
      </ul>
      
      <p><em>This is a minimal development server. For full functionality, please use the complete Docker setup.</em></p>
    </body>
    </html>
  `);
});

// Enhanced web interface routes
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BhaMail - Email Client</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
        
        /* Header */
        .header { background: #1a73e8; color: white; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; }
        .logo { font-size: 20px; font-weight: 500; }
        .user-info { display: flex; align-items: center; gap: 12px; }
        
        /* Layout */
        .container { display: flex; height: calc(100vh - 60px); }
        .sidebar { width: 240px; background: white; border-right: 1px solid #e0e0e0; }
        .main-content { flex: 1; background: white; }
        
        /* Sidebar */
        .sidebar-item { padding: 12px 24px; cursor: pointer; border-bottom: 1px solid #f0f0f0; }
        .sidebar-item:hover { background: #f8f9fa; }
        .sidebar-item.active { background: #e8f0fe; color: #1a73e8; font-weight: 500; }
        
        /* Email List */
        .email-list { height: 100%; overflow-y: auto; }
        .email-item { padding: 16px 24px; border-bottom: 1px solid #f0f0f0; cursor: pointer; }
        .email-item:hover { background: #f8f9fa; }
        .email-item.unread { background: #fafbfc; font-weight: 500; }
        .email-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .email-sender { font-weight: 500; color: #202124; }
        .email-time { color: #5f6368; font-size: 14px; }
        .email-subject { color: #202124; margin-bottom: 4px; }
        .email-preview { color: #5f6368; font-size: 14px; }
        
        /* Compose Button */
        .compose-btn { margin: 16px; padding: 12px 24px; background: #1a73e8; color: white; border: none; border-radius: 24px; cursor: pointer; font-size: 14px; font-weight: 500; }
        .compose-btn:hover { background: #1557b0; }
        
        /* Dev Mode Banner */
        .dev-banner { background: #fff3cd; color: #856404; padding: 8px 16px; text-align: center; font-size: 14px; border-bottom: 1px solid #ffeaa7; }
    </style>
</head>
<body>
    <div class="dev-banner">
        🚧 Development Mode - Mock data and limited functionality without Docker
    </div>
    
    <div class="header">
        <div class="logo">� BhaMail</div>
        <div class="user-info">
            <span>demo@bhamail.com</span>
            <button onclick="window.open('/api-docs', '_blank')" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 6px 12px; border-radius: 4px; cursor: pointer;">API Docs</button>
        </div>
    </div>
    
    <div class="container">
        <div class="sidebar">
            <button class="compose-btn" onclick="compose()">✏️ Compose</button>
            <div class="sidebar-item active" onclick="showFolder('inbox')">📥 Inbox (3)</div>
            <div class="sidebar-item" onclick="showFolder('sent')">📤 Sent</div>
            <div class="sidebar-item" onclick="showFolder('drafts')">📝 Drafts</div>
            <div class="sidebar-item" onclick="showFolder('spam')">🚫 Spam</div>
            <div class="sidebar-item" onclick="showFolder('trash')">🗑️ Trash</div>
        </div>
        
        <div class="main-content">
            <div id="inbox" class="email-list">
                <div class="email-item unread" onclick="openEmail(1)">
                    <div class="email-header">
                        <span class="email-sender">BhaMail Team</span>
                        <span class="email-time">2 min ago</span>
                    </div>
                    <div class="email-subject">Welcome to BhaMail! 🎉</div>
                    <div class="email-preview">Thank you for trying BhaMail. This is a development preview with mock data...</div>
                </div>
                
                <div class="email-item unread" onclick="openEmail(2)">
                    <div class="email-header">
                        <span class="email-sender">GitHub</span>
                        <span class="email-time">1 hour ago</span>
                    </div>
                    <div class="email-subject">[GitHub] Your repository BhaMail has been updated</div>
                    <div class="email-preview">New commits have been pushed to your repository. Check out the latest changes...</div>
                </div>
                
                <div class="email-item" onclick="openEmail(3)">
                    <div class="email-header">
                        <span class="email-sender">Newsletter</span>
                        <span class="email-time">Yesterday</span>
                    </div>
                    <div class="email-subject">Weekly Tech News Digest</div>
                    <div class="email-preview">Latest updates in web development, AI, and open source projects...</div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        function showFolder(folder) {
            // Update sidebar active state
            document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
            event.target.classList.add('active');
            
            // Mock folder content
            const content = {
                inbox: \`
                    <div class="email-item unread" onclick="openEmail(1)">
                        <div class="email-header"><span class="email-sender">BhaMail Team</span><span class="email-time">2 min ago</span></div>
                        <div class="email-subject">Welcome to BhaMail! 🎉</div>
                        <div class="email-preview">Thank you for trying BhaMail. This is a development preview...</div>
                    </div>
                    <div class="email-item unread" onclick="openEmail(2)">
                        <div class="email-header"><span class="email-sender">GitHub</span><span class="email-time">1 hour ago</span></div>
                        <div class="email-subject">[GitHub] Your repository BhaMail has been updated</div>
                        <div class="email-preview">New commits have been pushed to your repository...</div>
                    </div>
                    <div class="email-item" onclick="openEmail(3)">
                        <div class="email-header"><span class="email-sender">Newsletter</span><span class="email-time">Yesterday</span></div>
                        <div class="email-subject">Weekly Tech News Digest</div>
                        <div class="email-preview">Latest updates in web development, AI, and open source...</div>
                    </div>
                \`,
                sent: \`
                    <div class="email-item" onclick="openEmail(4)">
                        <div class="email-header"><span class="email-sender">To: colleague@company.com</span><span class="email-time">3 hours ago</span></div>
                        <div class="email-subject">Project Update</div>
                        <div class="email-preview">Here's the latest progress on the BhaMail project...</div>
                    </div>
                \`,
                drafts: \`
                    <div class="email-item" onclick="openEmail(5)">
                        <div class="email-header"><span class="email-sender">Draft</span><span class="email-time">1 day ago</span></div>
                        <div class="email-subject">Meeting notes draft</div>
                        <div class="email-preview">Notes from yesterday's team meeting...</div>
                    </div>
                \`,
                spam: '<div style="padding: 40px; text-align: center; color: #666;">No spam messages</div>',
                trash: '<div style="padding: 40px; text-align: center; color: #666;">Trash is empty</div>'
            };
            
            document.querySelector('.main-content').innerHTML = \`<div class="email-list">\${content[folder]}</div>\`;
        }
        
        function openEmail(id) {
            // Mock email view
            alert('Email opened! In full version, this would show the complete email with reply/forward options.');
        }
        
        function compose() {
            // Mock compose dialog
            alert('Compose email! In full version, this would open a rich text editor for writing emails.');
        }
    </script>
</body>
</html>
    `);
});

// Catch-all for API routes (must be last)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.listen(PORT, () => {
  console.log('🚀 BhaMail Development Server Starting...');
  console.log('=====================================');
  console.log(`📡 API Server: http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('⚠️  DEVELOPMENT MODE:');
  console.log('   • Limited functionality without Docker');
  console.log('   • Mock data and endpoints only');
  console.log('   • For full features, start Docker services');
  console.log('');
  console.log('📋 To start full BhaMail:');
  console.log('   1. Fix Docker Desktop API issues');
  console.log('   2. Run: docker-compose up -d');
  console.log('   3. Run: node scripts/seed.js');
  console.log('   4. Access: http://localhost:3000');
  console.log('=====================================');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down BhaMail Development Server...');
  process.exit(0);
});