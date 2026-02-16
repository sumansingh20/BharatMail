"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./routes/auth");
const mail_1 = require("./routes/mail");
const admin_1 = __importDefault(require("./routes/admin"));
const attachments_1 = __importDefault(require("./routes/attachments"));
const search_1 = __importDefault(require("./routes/search"));
const users_1 = __importDefault(require("./routes/users"));
const database_1 = require("./services/database");
const redis_1 = require("./services/redis");
const queue_1 = require("./services/queue");
const logger_1 = require("./utils/logger");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.WEB_BASE_URL
        : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
// General middleware
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined', { stream: { write: message => logger_1.logger.info(message.trim()) } }));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Swagger API documentation
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'BhaMail API',
            version: '1.0.0',
            description: 'Open source Gmail-like email service API',
        },
        servers: [
            {
                url: process.env.API_BASE_URL || 'http://localhost:8000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./src/routes/*.ts'],
};
const specs = (0, swagger_jsdoc_1.default)(swaggerOptions);
app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
            database: 'connected',
            redis: 'connected',
            opensearch: 'connected',
        }
    });
});
// API routes
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/mail', mail_1.mailRoutes);
app.use('/api/admin', admin_1.default);
app.use('/api/attachments', attachments_1.default);
app.use('/api/search', search_1.default);
app.use('/api/users', users_1.default);
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
async function startServer() {
    try {
        // Initialize services
        await database_1.Database.initialize();
        await redis_1.RedisService.initialize();
        await queue_1.QueueService.initialize();
        app.listen(PORT, () => {
            logger_1.logger.info(`BhaMail API server running on port ${PORT}`);
            logger_1.logger.info(`API Documentation: http://localhost:${PORT}/docs`);
            logger_1.logger.info(`Health Check: http://localhost:${PORT}/health`);
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
    await database_1.Database.close();
    await redis_1.RedisService.close();
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    await database_1.Database.close();
    await redis_1.RedisService.close();
    process.exit(0);
});
startServer();
//# sourceMappingURL=index.js.map