import { Queue, Worker, Job } from 'bullmq';
import { EmailService } from './email';
import { logger } from '../utils/logger';

export interface EmailJob {
  from: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: any[];
  messageId?: string;
  userId?: string;
}

export class QueueService {
  private static emailQueue: Queue;
  private static emailWorker: Worker;

  static async initialize(): Promise<void> {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
    };

    // Create email queue
    this.emailQueue = new Queue('email', { connection: redisConfig });

    // Create email worker
    this.emailWorker = new Worker('email', async (job: Job<EmailJob>) => {
      return await this.processEmailJob(job.data);
    }, { connection: redisConfig });

    // Worker event handlers
    this.emailWorker.on('completed', (job) => {
      logger.info(`Email job ${job.id} completed`);
    });

    this.emailWorker.on('failed', (job, err) => {
      logger.error(`Email job ${job?.id} failed:`, err);
    });

    logger.info('Queue service initialized');
  }

  static async addEmailJob(data: EmailJob, delay?: number): Promise<Job<EmailJob>> {
    const options = delay ? { delay } : {};
    return await this.emailQueue.add('send-email', data, options);
  }

  private static async processEmailJob(data: EmailJob): Promise<void> {
    try {
      await EmailService.sendEmail(data);
      logger.info(`Email sent successfully to ${data.to}`);
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  static async getEmailQueue(): Promise<Queue> {
    return this.emailQueue;
  }

  static async close(): Promise<void> {
    if (this.emailWorker) {
      await this.emailWorker.close();
    }
    if (this.emailQueue) {
      await this.emailQueue.close();
    }
    logger.info('Queue service closed');
  }
}