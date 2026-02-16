"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const bullmq_1 = require("bullmq");
const email_1 = require("./email");
const logger_1 = require("../utils/logger");
class QueueService {
    static async initialize() {
        const redisConfig = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD || undefined,
        };
        // Create email queue
        this.emailQueue = new bullmq_1.Queue('email', { connection: redisConfig });
        // Create email worker
        this.emailWorker = new bullmq_1.Worker('email', async (job) => {
            return await this.processEmailJob(job.data);
        }, { connection: redisConfig });
        // Worker event handlers
        this.emailWorker.on('completed', (job) => {
            logger_1.logger.info(`Email job ${job.id} completed`);
        });
        this.emailWorker.on('failed', (job, err) => {
            logger_1.logger.error(`Email job ${job?.id} failed:`, err);
        });
        logger_1.logger.info('Queue service initialized');
    }
    static async addEmailJob(data, delay) {
        const options = delay ? { delay } : {};
        return await this.emailQueue.add('send-email', data, options);
    }
    static async processEmailJob(data) {
        try {
            await email_1.EmailService.sendEmail(data);
            logger_1.logger.info(`Email sent successfully to ${data.to}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to send email:', error);
            throw error;
        }
    }
    static async getEmailQueue() {
        return this.emailQueue;
    }
    static async close() {
        if (this.emailWorker) {
            await this.emailWorker.close();
        }
        if (this.emailQueue) {
            await this.emailQueue.close();
        }
        logger_1.logger.info('Queue service closed');
    }
}
exports.QueueService = QueueService;
//# sourceMappingURL=queue.js.map