"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = require("./routes/auth");
const mail_1 = require("./routes/mail");
const database_sqlite_1 = require("./services/database-sqlite");
const logger_1 = require("./utils/logger");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
// Basic middleware
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// CORS for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    }
    else {
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
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/mail', mail_1.mailRoutes);
// Simple error handling
app.use((err, req, res, next) => {
    logger_1.logger.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
async function startServer() {
    try {
        // Initialize SQLite database
        await database_sqlite_1.SqliteDatabase.initialize();
        // Seed initial data
        database_sqlite_1.SqliteDatabase.seedInitialData();
        app.listen(PORT, () => {
            logger_1.logger.info('🚀 BhaMail API server running with SQLite');
            logger_1.logger.info(`📡 Server: http://localhost:${PORT}`);
            logger_1.logger.info(`📚 API Documentation: http://localhost:${PORT}/docs`);
            logger_1.logger.info(`🔍 Health Check: http://localhost:${PORT}/health`);
            logger_1.logger.info('✅ SQLite database ready with sample data');
            logger_1.logger.info('🔑 Demo login: demo@bhamail.com / password123');
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    await database_sqlite_1.SqliteDatabase.close();
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    await database_sqlite_1.SqliteDatabase.close();
    process.exit(0);
});
startServer();
//# sourceMappingURL=index-sqlite.js.map