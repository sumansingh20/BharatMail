import nodemailer from 'nodemailer';
export declare class EmailService {
    private static transporter;
    static initialize(): Promise<void>;
    static sendWelcomeEmail(email: string, firstName: string): Promise<void>;
    static sendPasswordResetEmail(email: string, firstName: string, resetToken: string): Promise<void>;
    static sendEmail(options: {
        from: string;
        to: string | string[];
        cc?: string | string[];
        bcc?: string | string[];
        subject: string;
        text?: string;
        html?: string;
        attachments?: any[];
    }): Promise<nodemailer.SentMessageInfo>;
    static getTransporter(): nodemailer.Transporter;
}
//# sourceMappingURL=email.d.ts.map