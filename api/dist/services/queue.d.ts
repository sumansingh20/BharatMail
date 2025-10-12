import { Queue, Job } from 'bullmq';
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
export declare class QueueService {
    private static emailQueue;
    private static emailWorker;
    static initialize(): Promise<void>;
    static addEmailJob(data: EmailJob, delay?: number): Promise<Job<EmailJob>>;
    private static processEmailJob;
    static getEmailQueue(): Promise<Queue>;
    static close(): Promise<void>;
}
//# sourceMappingURL=queue.d.ts.map