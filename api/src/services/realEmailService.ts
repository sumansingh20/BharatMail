import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import { simpleParser, ParsedMail, AddressObject } from 'mailparser';
import { logger } from '../utils/logger';

interface EmailAccount {
  id: string;
  userId: string;
  email: string;
  password: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  isActive: boolean;
}

interface EmailMessage {
  id: string;
  messageId: string;
  threadId: string;
  from: { name?: string; email: string };
  to: Array<{ name?: string; email: string }>;
  cc?: Array<{ name?: string; email: string }>;
  bcc?: Array<{ name?: string; email: string }>;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
    content: Buffer;
  }>;
  date: Date;
  flags: string[];
  labels: string[];
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  folder: string;
}

export class RealEmailService {
  private imapConnections = new Map<string, ImapFlow>();
  private smtpTransporters = new Map<string, nodemailer.Transporter>();

  private parseAddresses(addresses: AddressObject | AddressObject[] | undefined): Array<{ name?: string; email: string }> {
    if (!addresses) return [];
    
    const addressArray = Array.isArray(addresses) ? addresses : [addresses];
    return addressArray.map((addr: any) => ({
      name: addr.name,
      email: addr.address || ''
    }));
  }

  async connectToGmail(account: EmailAccount): Promise<void> {
    try {
      // IMAP Connection
      const imap = new ImapFlow({
        host: account.imapHost || 'imap.gmail.com',
        port: account.imapPort || 993,
        secure: true,
        auth: {
          user: account.email,
          pass: account.password
        },
        logger: false
      });

      await imap.connect();
      this.imapConnections.set(account.id, imap);

      // SMTP Connection
      const smtp = nodemailer.createTransport({
        host: account.smtpHost || 'smtp.gmail.com',
        port: account.smtpPort || 587,
        secure: false,
        auth: {
          user: account.email,
          pass: account.password
        }
      });

      await smtp.verify();
      this.smtpTransporters.set(account.id, smtp);

      logger.info(`Connected to Gmail for ${account.email}`);
    } catch (error: any) {
      logger.error(`Failed to connect to Gmail for ${account.email}:`, error);
      throw new Error(`Gmail connection failed: ${error?.message || 'Unknown error'}`);
    }
  }

  async getInboxEmails(accountId: string, options: {
    folder?: string;
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  } = {}): Promise<EmailMessage[]> {
    const imap = this.imapConnections.get(accountId);
    if (!imap) {
      throw new Error('IMAP connection not found');
    }

    try {
      const folder = options.folder || 'INBOX';
      await imap.mailboxOpen(folder);

      let searchCriteria: any = {};
      if (options.unreadOnly) {
        searchCriteria.seen = false;
      }

      const messages = await imap.search(searchCriteria, {
        uid: true
      });

      if (!messages || messages === false) {
        return [];
      }

      const messageArray = Array.isArray(messages) ? messages : [];
      const emails: EmailMessage[] = [];
      const limit = Math.min(options.limit || 50, messageArray.length);
      const start = options.offset || 0;

      for (let i = start; i < start + limit && i < messageArray.length; i++) {
        const messageUid = messageArray[i];
        const emailData = await this.fetchEmailContent(imap, messageUid);
        if (emailData) {
          emails.push(emailData);
        }
      }

      return emails.reverse(); // Most recent first
    } catch (error) {
      logger.error('Failed to fetch emails:', error);
      throw error;
    }
  }

  private async fetchEmailContent(imap: ImapFlow, uid: number): Promise<EmailMessage | null> {
    try {
      const message = await imap.fetchOne(uid, {
        envelope: true,
        bodyStructure: true,
        source: true,
        flags: true
      });

      if (!message || message === false) {
        return null;
      }

      const parsed: ParsedMail = await simpleParser((message as any).source as Buffer);

      const emailMessage: EmailMessage = {
        id: uid.toString(),
        messageId: parsed.messageId || uid.toString(),
        threadId: parsed.inReplyTo || parsed.messageId || uid.toString(),
        from: {
          name: (parsed.from as any)?.value?.[0]?.name,
          email: (parsed.from as any)?.value?.[0]?.address || ''
        },
        to: this.parseAddresses(parsed.to),
        cc: parsed.cc ? this.parseAddresses(parsed.cc) : undefined,
        bcc: parsed.bcc ? this.parseAddresses(parsed.bcc) : undefined,
        subject: parsed.subject || '(no subject)',
        bodyText: parsed.text,
        bodyHtml: typeof parsed.html === 'string' ? parsed.html : undefined,
        attachments: parsed.attachments?.map(att => ({
          filename: att.filename || 'attachment',
          contentType: att.contentType || 'application/octet-stream',
          size: att.size || 0,
          content: att.content
        })) || [],
        date: parsed.date || new Date(),
        flags: (message as any).flags || [],
        labels: [],
        isRead: (message as any).flags?.includes('\\Seen') || false,
        isStarred: (message as any).flags?.includes('\\Flagged') || false,
        isImportant: false,
        folder: 'INBOX'
      };

      return emailMessage;
    } catch (error) {
      logger.error(`Failed to fetch email ${uid}:`, error);
      return null;
    }
  }

  async sendEmail(accountId: string, emailData: {
    to: Array<{ email: string; name?: string }>;
    cc?: Array<{ email: string; name?: string }>;
    bcc?: Array<{ email: string; name?: string }>;
    subject: string;
    bodyText?: string;
    bodyHtml?: string;
    attachments?: Array<{
      filename: string;
      content: Buffer;
      contentType?: string;
    }>;
    replyTo?: string;
    inReplyTo?: string;
  }): Promise<string> {
    const smtp = this.smtpTransporters.get(accountId);
    if (!smtp) {
      throw new Error('SMTP connection not found');
    }

    try {
      const mailOptions = {
        to: emailData.to.map(addr => `${addr.name || ''} <${addr.email}>`).join(', '),
        cc: emailData.cc?.map(addr => `${addr.name || ''} <${addr.email}>`).join(', '),
        bcc: emailData.bcc?.map(addr => `${addr.name || ''} <${addr.email}>`).join(', '),
        subject: emailData.subject,
        text: emailData.bodyText,
        html: emailData.bodyHtml,
        attachments: emailData.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        })),
        replyTo: emailData.replyTo,
        inReplyTo: emailData.inReplyTo
      };

      const result = await smtp.sendMail(mailOptions);
      logger.info(`Email sent successfully: ${result.messageId}`);
      return result.messageId;
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  async moveToFolder(accountId: string, messageUid: number, targetFolder: string): Promise<void> {
    const imap = this.imapConnections.get(accountId);
    if (!imap) {
      throw new Error('IMAP connection not found');
    }

    try {
      await imap.messageMove(messageUid, targetFolder);
      logger.info(`Moved message ${messageUid} to ${targetFolder}`);
    } catch (error) {
      logger.error(`Failed to move message ${messageUid}:`, error);
      throw error;
    }
  }

  async markAsRead(accountId: string, messageUid: number): Promise<void> {
    const imap = this.imapConnections.get(accountId);
    if (!imap) {
      throw new Error('IMAP connection not found');
    }

    try {
      await imap.messageFlagsAdd(messageUid, ['\\Seen']);
      logger.info(`Marked message ${messageUid} as read`);
    } catch (error) {
      logger.error(`Failed to mark message ${messageUid} as read:`, error);
      throw error;
    }
  }

  async markAsUnread(accountId: string, messageUid: number): Promise<void> {
    const imap = this.imapConnections.get(accountId);
    if (!imap) {
      throw new Error('IMAP connection not found');
    }

    try {
      await imap.messageFlagsRemove(messageUid, ['\\Seen']);
      logger.info(`Marked message ${messageUid} as unread`);
    } catch (error) {
      logger.error(`Failed to mark message ${messageUid} as unread:`, error);
      throw error;
    }
  }

  async starMessage(accountId: string, messageUid: number): Promise<void> {
    const imap = this.imapConnections.get(accountId);
    if (!imap) {
      throw new Error('IMAP connection not found');
    }

    try {
      await imap.messageFlagsAdd(messageUid, ['\\Flagged']);
      logger.info(`Starred message ${messageUid}`);
    } catch (error) {
      logger.error(`Failed to star message ${messageUid}:`, error);
      throw error;
    }
  }

  async unstarMessage(accountId: string, messageUid: number): Promise<void> {
    const imap = this.imapConnections.get(accountId);
    if (!imap) {
      throw new Error('IMAP connection not found');
    }

    try {
      await imap.messageFlagsRemove(messageUid, ['\\Flagged']);
      logger.info(`Unstarred message ${messageUid}`);
    } catch (error) {
      logger.error(`Failed to unstar message ${messageUid}:`, error);
      throw error;
    }
  }

  async deleteMessage(accountId: string, messageUid: number): Promise<void> {
    const imap = this.imapConnections.get(accountId);
    if (!imap) {
      throw new Error('IMAP connection not found');
    }

    try {
      await imap.messageFlagsAdd(messageUid, ['\\Deleted']);
      logger.info(`Deleted message ${messageUid}`);
    } catch (error) {
      logger.error(`Failed to delete message ${messageUid}:`, error);
      throw error;
    }
  }

  async searchEmails(accountId: string, query: string, folder = 'INBOX'): Promise<EmailMessage[]> {
    const imap = this.imapConnections.get(accountId);
    if (!imap) {
      throw new Error('IMAP connection not found');
    }

    try {
      await imap.mailboxOpen(folder);
      
      const searchCriteria = {
        or: [
          { subject: query },
          { body: query },
          { from: query },
          { to: query }
        ]
      };

      const messages = await imap.search(searchCriteria, { uid: true });
      if (!messages || messages === false) {
        return [];
      }

      const messageArray = Array.isArray(messages) ? messages : [];
      const emails: EmailMessage[] = [];

      for (const messageUid of messageArray.slice(0, 50)) { // Limit to 50 results
        const emailData = await this.fetchEmailContent(imap, messageUid);
        if (emailData) {
          emails.push(emailData);
        }
      }

      return emails;
    } catch (error) {
      logger.error('Failed to search emails:', error);
      throw error;
    }
  }

  async getFolders(accountId: string): Promise<string[]> {
    const imap = this.imapConnections.get(accountId);
    if (!imap) {
      throw new Error('IMAP connection not found');
    }

    try {
      const mailboxes = await imap.list();
      return mailboxes.map(mb => mb.name);
    } catch (error) {
      logger.error('Failed to get folders:', error);
      throw error;
    }
  }

  async disconnect(accountId: string): Promise<void> {
    const imap = this.imapConnections.get(accountId);
    const smtp = this.smtpTransporters.get(accountId);

    if (imap) {
      await imap.logout();
      this.imapConnections.delete(accountId);
    }

    if (smtp) {
      smtp.close();
      this.smtpTransporters.delete(accountId);
    }

    logger.info(`Disconnected from account ${accountId}`);
  }

  async disconnectAll(): Promise<void> {
    const promises = [];
    
    for (const accountId of this.imapConnections.keys()) {
      promises.push(this.disconnect(accountId));
    }

    await Promise.all(promises);
  }
}

export const realEmailService = new RealEmailService();