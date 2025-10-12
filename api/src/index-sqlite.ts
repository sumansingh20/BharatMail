import express from 'express';
import dotenv from 'dotenv';

import { authRoutes } from './routes/auth';
import { mailRoutes } from './routes/mail';
import { SqliteDatabase } from './services/database-sqlite';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Basic middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0-sqlite',
    mode: 'development',
    database: 'SQLite',
    services: {
      database: 'connected',
      redis: 'disabled (dev mode)',
      opensearch: 'disabled (dev mode)',
    }
  });
});

// Simple API docs endpoint
app.get('/docs', (req, res) => {
  res.json({
    title: 'BhaMail API',
    version: '1.0.0-sqlite',
    description: 'SQLite development mode',
    endpoints: {
      'GET /health': 'Health check',
      'POST /api/auth/login': 'Login user',
      'POST /api/auth/register': 'Register user',
      'GET /api/mail': 'Get emails',
      'POST /api/mail': 'Send email',
    },
    demoUser: {
      email: 'demo@bhamail.com',
      password: 'password123'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/mail', mailRoutes);

// Simple error handling
app.use((err: any, req: any, res: any, next: any) => {
  logger.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

async function startServer() {
  try {
    // Initialize SQLite database
    await SqliteDatabase.initialize();
    
    // Seed initial data
    SqliteDatabase.seedInitialData();
    
    app.listen(PORT, () => {
      logger.info('🚀 BhaMail API server running with SQLite');
      logger.info(`📡 Server: http://localhost:${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/docs`);
      logger.info(`🔍 Health Check: http://localhost:${PORT}/health`);
      logger.info('✅ SQLite database ready with sample data');
      logger.info('🔑 Demo login: demo@bhamail.com / password123');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await SqliteDatabase.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await SqliteDatabase.close();
  process.exit(0);
});

startServer();