module.exports = {
  // Server configuration
  PORT: process.env.PORT || 3002,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database configuration
  database: {
    path: '../database/bhamail.db',
    options: {
      verbose: process.env.NODE_ENV === 'development' ? console.log : null
    }
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'bhamail-super-secret-key-change-in-production',
    expiresIn: '24h'
  },
  
  // Email configuration
  email: {
    maxAttachmentSize: 25 * 1024 * 1024, // 25MB
    allowedMimeTypes: [
      'image/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/*'
    ]
  },
  
  // CORS configuration
  corsOptions: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] 
      : ['http://localhost:3002', 'http://127.0.0.1:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  
  // Upload configuration
  upload: {
    directory: '../uploads',
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB
      files: 10 // max 10 files per email
    }
  },
  
  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  },
  
  // Gmail features configuration
  features: {
    enableConversationThreading: true,
    enableAdvancedSearch: true,
    enableKeyboardShortcuts: true,
    enableSmartCompose: false, // AI features
    enableConfidentialMode: true,
    enableScheduledSending: true,
    enableUndo: true,
    undoTimeoutSeconds: 10
  },
  
  // Storage limits
  storage: {
    defaultLimitBytes: 15 * 1024 * 1024 * 1024, // 15GB like Gmail
    warningThresholdPercent: 80
  }
};