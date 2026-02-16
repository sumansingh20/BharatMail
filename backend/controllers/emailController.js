const db = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

class EmailController {
    // Get emails with filtering, pagination, and search
    static async getEmails(req, res) {
        try {
            const userId = req.user.id;
            const {
                folder = 'inbox',
                page = 1,
                limit = 50,
                search = '',
                unread = null,
                starred = null,
                important = null,
                hasAttachment = null,
                from = null,
                to = null,
                subject = null,
                dateFrom = null,
                dateTo = null
            } = req.query;

            const offset = (page - 1) * limit;
            let whereConditions = ['e.user_id = ?'];
            let params = [userId];

            // Folder filtering
            if (folder === 'inbox') {
                whereConditions.push("e.folder = 'inbox' AND e.is_deleted = 0");
            } else if (folder === 'sent') {
                whereConditions.push("e.folder = 'sent'");
            } else if (folder === 'drafts') {
                whereConditions.push("e.folder = 'drafts'");
            } else if (folder === 'starred') {
                whereConditions.push("e.is_starred = 1 AND e.is_deleted = 0");
            } else if (folder === 'important') {
                whereConditions.push("e.is_important = 1 AND e.is_deleted = 0");
            } else if (folder === 'spam') {
                whereConditions.push("e.folder = 'spam'");
            } else if (folder === 'trash') {
                whereConditions.push("e.is_deleted = 1");
            } else if (folder === 'all') {
                whereConditions.push("e.is_deleted = 0");
            } else if (folder === 'snoozed') {
                whereConditions.push("e.snooze_until > datetime('now') AND e.is_deleted = 0");
            }

            // Search filters
            if (search) {
                whereConditions.push("(e.subject LIKE ? OR e.body_text LIKE ? OR e.sender_name LIKE ? OR e.sender_email LIKE ?)");
                const searchPattern = `%${search}%`;
                params.push(searchPattern, searchPattern, searchPattern, searchPattern);
            }

            if (unread !== null) {
                whereConditions.push("e.is_read = ?");
                params.push(unread === 'true' ? 0 : 1);
            }

            if (starred !== null) {
                whereConditions.push("e.is_starred = ?");
                params.push(starred === 'true' ? 1 : 0);
            }

            if (important !== null) {
                whereConditions.push("e.is_important = ?");
                params.push(important === 'true' ? 1 : 0);
            }

            if (hasAttachment !== null) {
                whereConditions.push("e.has_attachments = ?");
                params.push(hasAttachment === 'true' ? 1 : 0);
            }

            if (from) {
                whereConditions.push("(e.sender_email LIKE ? OR e.sender_name LIKE ?)");
                const fromPattern = `%${from}%`;
                params.push(fromPattern, fromPattern);
            }

            if (to) {
                whereConditions.push("EXISTS (SELECT 1 FROM email_recipients er WHERE er.email_id = e.id AND (er.recipient_email LIKE ? OR er.recipient_name LIKE ?))");
                const toPattern = `%${to}%`;
                params.push(toPattern, toPattern);
            }

            if (subject) {
                whereConditions.push("e.subject LIKE ?");
                params.push(`%${subject}%`);
            }

            if (dateFrom) {
                whereConditions.push("DATE(e.created_at) >= DATE(?)");
                params.push(dateFrom);
            }

            if (dateTo) {
                whereConditions.push("DATE(e.created_at) <= DATE(?)");
                params.push(dateTo);
            }

            const whereClause = whereConditions.join(' AND ');

            // Get total count
            const countQuery = `
                SELECT COUNT(*) as total
                FROM emails e
                WHERE ${whereClause}
            `;
            
            const countResult = await db.get(countQuery, params);
            const total = countResult.total;

            // Get emails
            const emailsQuery = `
                SELECT 
                    e.*,
                    GROUP_CONCAT(
                        CASE WHEN el.label_id IS NOT NULL THEN
                            json_object(
                                'id', l.id,
                                'name', l.name,
                                'color', l.color
                            )
                        END
                    ) as labels
                FROM emails e
                LEFT JOIN email_labels el ON e.id = el.email_id
                LEFT JOIN labels l ON el.label_id = l.id
                WHERE ${whereClause}
                GROUP BY e.id
                ORDER BY e.created_at DESC
                LIMIT ? OFFSET ?
            `;

            params.push(parseInt(limit), offset);
            const emails = await db.all(emailsQuery, params);

            // Parse labels JSON
            const emailsWithLabels = emails.map(email => ({
                ...email,
                labels: email.labels ? JSON.parse(`[${email.labels}]`).filter(l => l) : [],
                preview: email.body_text ? email.body_text.substring(0, 150) : ''
            }));

            res.json({
                success: true,
                emails: emailsWithLabels,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            console.error('Error getting emails:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get emails'
            });
        }
    }

    // Get specific email by ID
    static async getEmailById(req, res) {
        try {
            const userId = req.user.id;
            const emailId = req.params.id;

            const email = await db.get(`
                SELECT e.*
                FROM emails e
                WHERE e.id = ? AND e.user_id = ?
            `, [emailId, userId]);

            if (!email) {
                return res.status(404).json({
                    success: false,
                    message: 'Email not found'
                });
            }

            // Get recipients
            const recipients = await db.all(`
                SELECT recipient_email as email, recipient_name as name, recipient_type as type
                FROM email_recipients
                WHERE email_id = ?
            `, [emailId]);

            // Get attachments
            const attachments = await db.all(`
                SELECT *
                FROM attachments
                WHERE email_id = ?
            `, [emailId]);

            // Get labels
            const labels = await db.all(`
                SELECT l.id, l.name, l.color
                FROM labels l
                JOIN email_labels el ON l.id = el.label_id
                WHERE el.email_id = ?
            `, [emailId]);

            // Separate recipients by type
            email.recipients = recipients.filter(r => r.type === 'to');
            email.cc_recipients = recipients.filter(r => r.type === 'cc');
            email.bcc_recipients = recipients.filter(r => r.type === 'bcc');
            email.attachments = attachments;
            email.labels = labels;

            res.json({
                success: true,
                email
            });

        } catch (error) {
            console.error('Error getting email:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get email'
            });
        }
    }

    // Send new email
    static async sendEmail(req, res) {
        try {
            const userId = req.user.id;
            const {
                to = [],
                cc = [],
                bcc = [],
                subject,
                body,
                replyTo = null,
                forwardFrom = null
            } = req.body;

            // Validate required fields
            if (!to.length || !subject || !body) {
                return res.status(400).json({
                    success: false,
                    message: 'To, subject, and body are required'
                });
            }

            // Get user details
            const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

            // Create email record
            const emailResult = await db.run(`
                INSERT INTO emails (
                    user_id, sender_email, sender_name, subject, body_text, body_html,
                    folder, has_attachments, thread_id, in_reply_to, conversation_id,
                    created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, 'sent', ?, ?, ?, ?, datetime('now'), datetime('now'))
            `, [
                userId,
                user.email,
                user.name,
                subject,
                body,
                body, // For now, treating as plain text
                req.files ? req.files.length > 0 : 0,
                null, // thread_id - implement threading logic if needed
                replyTo,
                null // conversation_id - implement if needed
            ]);

            const emailId = emailResult.lastID;

            // Add recipients
            const allRecipients = [
                ...to.map(r => ({ ...r, type: 'to' })),
                ...cc.map(r => ({ ...r, type: 'cc' })),
                ...bcc.map(r => ({ ...r, type: 'bcc' }))
            ];

            for (const recipient of allRecipients) {
                await db.run(`
                    INSERT INTO email_recipients (email_id, recipient_email, recipient_name, recipient_type)
                    VALUES (?, ?, ?, ?)
                `, [emailId, recipient.email, recipient.name || '', recipient.type]);
            }

            // Handle attachments
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    await db.run(`
                        INSERT INTO attachments (email_id, filename, original_name, file_path, file_size, mime_type)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [
                        emailId,
                        file.filename,
                        file.originalname,
                        file.path,
                        file.size,
                        file.mimetype
                    ]);
                }
            }

            // Update has_attachments flag
            if (req.files && req.files.length > 0) {
                await db.run('UPDATE emails SET has_attachments = 1 WHERE id = ?', [emailId]);
            }

            res.json({
                success: true,
                message: 'Email sent successfully',
                emailId
            });

        } catch (error) {
            console.error('Error sending email:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send email'
            });
        }
    }

    // Save draft
    static async saveDraft(req, res) {
        try {
            const userId = req.user.id;
            const {
                to = [],
                cc = [],
                bcc = [],
                subject = '',
                body = ''
            } = req.body;

            // Get user details
            const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

            // Create draft email record
            const emailResult = await db.run(`
                INSERT INTO emails (
                    user_id, sender_email, sender_name, subject, body_text, body_html,
                    folder, has_attachments, is_draft,
                    created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, 'drafts', ?, 1, datetime('now'), datetime('now'))
            `, [
                userId,
                user.email,
                user.name,
                subject,
                body,
                body,
                req.files ? req.files.length > 0 : 0
            ]);

            const emailId = emailResult.lastID;

            // Add recipients
            const allRecipients = [
                ...to.map(r => ({ ...r, type: 'to' })),
                ...cc.map(r => ({ ...r, type: 'cc' })),
                ...bcc.map(r => ({ ...r, type: 'bcc' }))
            ];

            for (const recipient of allRecipients) {
                if (recipient.email) {
                    await db.run(`
                        INSERT INTO email_recipients (email_id, recipient_email, recipient_name, recipient_type)
                        VALUES (?, ?, ?, ?)
                    `, [emailId, recipient.email, recipient.name || '', recipient.type]);
                }
            }

            // Handle attachments
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    await db.run(`
                        INSERT INTO attachments (email_id, filename, original_name, file_path, file_size, mime_type)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [
                        emailId,
                        file.filename,
                        file.originalname,
                        file.path,
                        file.size,
                        file.mimetype
                    ]);
                }
            }

            res.json({
                success: true,
                message: 'Draft saved successfully',
                emailId
            });

        } catch (error) {
            console.error('Error saving draft:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to save draft'
            });
        }
    }

    // Update existing draft
    static async updateDraft(req, res) {
        try {
            const userId = req.user.id;
            const draftId = req.params.id;
            const {
                to = [],
                cc = [],
                bcc = [],
                subject = '',
                body = ''
            } = req.body;

            // Verify this is a draft belonging to the user
            const draft = await db.get(`
                SELECT * FROM emails 
                WHERE id = ? AND user_id = ? AND is_draft = 1
            `, [draftId, userId]);

            if (!draft) {
                return res.status(404).json({
                    success: false,
                    message: 'Draft not found'
                });
            }

            // Update draft
            await db.run(`
                UPDATE emails 
                SET subject = ?, body_text = ?, body_html = ?, updated_at = datetime('now')
                WHERE id = ?
            `, [subject, body, body, draftId]);

            // Clear existing recipients
            await db.run('DELETE FROM email_recipients WHERE email_id = ?', [draftId]);

            // Add new recipients
            const allRecipients = [
                ...to.map(r => ({ ...r, type: 'to' })),
                ...cc.map(r => ({ ...r, type: 'cc' })),
                ...bcc.map(r => ({ ...r, type: 'bcc' }))
            ];

            for (const recipient of allRecipients) {
                if (recipient.email) {
                    await db.run(`
                        INSERT INTO email_recipients (email_id, recipient_email, recipient_name, recipient_type)
                        VALUES (?, ?, ?, ?)
                    `, [draftId, recipient.email, recipient.name || '', recipient.type]);
                }
            }

            // Handle new attachments (keeping existing ones)
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    await db.run(`
                        INSERT INTO attachments (email_id, filename, original_name, file_path, file_size, mime_type)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [
                        draftId,
                        file.filename,
                        file.originalname,
                        file.path,
                        file.size,
                        file.mimetype
                    ]);
                }

                // Update has_attachments flag
                await db.run('UPDATE emails SET has_attachments = 1 WHERE id = ?', [draftId]);
            }

            res.json({
                success: true,
                message: 'Draft updated successfully'
            });

        } catch (error) {
            console.error('Error updating draft:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update draft'
            });
        }
    }

    // Bulk email operations
    static async markAsRead(req, res) {
        try {
            const userId = req.user.id;
            const { emailIds } = req.body;

            if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email IDs are required'
                });
            }

            const placeholders = emailIds.map(() => '?').join(',');
            await db.run(`
                UPDATE emails 
                SET is_read = 1, read_at = datetime('now')
                WHERE id IN (${placeholders}) AND user_id = ?
            `, [...emailIds, userId]);

            res.json({
                success: true,
                message: 'Emails marked as read'
            });

        } catch (error) {
            console.error('Error marking emails as read:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark emails as read'
            });
        }
    }

    static async markAsUnread(req, res) {
        try {
            const userId = req.user.id;
            const { emailIds } = req.body;

            if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email IDs are required'
                });
            }

            const placeholders = emailIds.map(() => '?').join(',');
            await db.run(`
                UPDATE emails 
                SET is_read = 0, read_at = NULL
                WHERE id IN (${placeholders}) AND user_id = ?
            `, [...emailIds, userId]);

            res.json({
                success: true,
                message: 'Emails marked as unread'
            });

        } catch (error) {
            console.error('Error marking emails as unread:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark emails as unread'
            });
        }
    }

    static async markAsStarred(req, res) {
        try {
            const userId = req.user.id;
            const { emailIds } = req.body;

            if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email IDs are required'
                });
            }

            const placeholders = emailIds.map(() => '?').join(',');
            await db.run(`
                UPDATE emails 
                SET is_starred = 1
                WHERE id IN (${placeholders}) AND user_id = ?
            `, [...emailIds, userId]);

            res.json({
                success: true,
                message: 'Emails starred'
            });

        } catch (error) {
            console.error('Error starring emails:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to star emails'
            });
        }
    }

    static async markAsUnstarred(req, res) {
        try {
            const userId = req.user.id;
            const { emailIds } = req.body;

            if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email IDs are required'
                });
            }

            const placeholders = emailIds.map(() => '?').join(',');
            await db.run(`
                UPDATE emails 
                SET is_starred = 0
                WHERE id IN (${placeholders}) AND user_id = ?
            `, [...emailIds, userId]);

            res.json({
                success: true,
                message: 'Emails unstarred'
            });

        } catch (error) {
            console.error('Error unstarring emails:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to unstar emails'
            });
        }
    }

    static async deleteEmails(req, res) {
        try {
            const userId = req.user.id;
            const { emailIds } = req.body;

            if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email IDs are required'
                });
            }

            const placeholders = emailIds.map(() => '?').join(',');
            await db.run(`
                UPDATE emails 
                SET is_deleted = 1, deleted_at = datetime('now')
                WHERE id IN (${placeholders}) AND user_id = ?
            `, [...emailIds, userId]);

            res.json({
                success: true,
                message: 'Emails deleted'
            });

        } catch (error) {
            console.error('Error deleting emails:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete emails'
            });
        }
    }

    static async archiveEmails(req, res) {
        try {
            const userId = req.user.id;
            const { emailIds } = req.body;

            if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email IDs are required'
                });
            }

            const placeholders = emailIds.map(() => '?').join(',');
            await db.run(`
                UPDATE emails 
                SET folder = 'archive'
                WHERE id IN (${placeholders}) AND user_id = ?
            `, [...emailIds, userId]);

            res.json({
                success: true,
                message: 'Emails archived'
            });

        } catch (error) {
            console.error('Error archiving emails:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to archive emails'
            });
        }
    }

    // Download attachment
    static async downloadAttachment(req, res) {
        try {
            const userId = req.user.id;
            const { emailId, attachmentId } = req.params;

            // Verify email belongs to user
            const email = await db.get(`
                SELECT id FROM emails WHERE id = ? AND user_id = ?
            `, [emailId, userId]);

            if (!email) {
                return res.status(404).json({
                    success: false,
                    message: 'Email not found'
                });
            }

            // Get attachment
            const attachment = await db.get(`
                SELECT * FROM attachments 
                WHERE id = ? AND email_id = ?
            `, [attachmentId, emailId]);

            if (!attachment) {
                return res.status(404).json({
                    success: false,
                    message: 'Attachment not found'
                });
            }

            // Check if file exists
            try {
                await fs.access(attachment.file_path);
            } catch {
                return res.status(404).json({
                    success: false,
                    message: 'File not found on server'
                });
            }

            // Set headers for download
            res.setHeader('Content-Disposition', `attachment; filename="${attachment.original_name}"`);
            res.setHeader('Content-Type', attachment.mime_type || 'application/octet-stream');
            res.setHeader('Content-Length', attachment.file_size);

            // Stream the file
            const fileBuffer = await fs.readFile(attachment.file_path);
            res.send(fileBuffer);

        } catch (error) {
            console.error('Error downloading attachment:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to download attachment'
            });
        }
    }

    // Add more methods as needed...
    static async searchEmails(req, res) {
        // Implementation similar to getEmails but focused on search
        return this.getEmails(req, res);
    }

    static async markAsImportant(req, res) {
        try {
            const userId = req.user.id;
            const { emailIds } = req.body;

            const placeholders = emailIds.map(() => '?').join(',');
            await db.run(`
                UPDATE emails 
                SET is_important = 1
                WHERE id IN (${placeholders}) AND user_id = ?
            `, [...emailIds, userId]);

            res.json({
                success: true,
                message: 'Emails marked as important'
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to mark as important' });
        }
    }

    static async reportSpam(req, res) {
        try {
            const userId = req.user.id;
            const { emailIds } = req.body;

            const placeholders = emailIds.map(() => '?').join(',');
            await db.run(`
                UPDATE emails 
                SET folder = 'spam'
                WHERE id IN (${placeholders}) AND user_id = ?
            `, [...emailIds, userId]);

            res.json({
                success: true,
                message: 'Emails marked as spam'
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to mark as spam' });
        }
    }

    // Placeholder methods for other operations
    static async deleteDraft(req, res) { /* Implementation */ }
    static async markAsUnimportant(req, res) { /* Implementation */ }
    static async unarchiveEmails(req, res) { /* Implementation */ }
    static async restoreEmails(req, res) { /* Implementation */ }
    static async moveToFolder(req, res) { /* Implementation */ }
    static async markAsNotSpam(req, res) { /* Implementation */ }
    static async blockSender(req, res) { /* Implementation */ }
    static async unblockSender(req, res) { /* Implementation */ }
    static async snoozeEmails(req, res) { /* Implementation */ }
    static async unsnoozeEmails(req, res) { /* Implementation */ }
    static async addLabel(req, res) { /* Implementation */ }
    static async removeLabel(req, res) { /* Implementation */ }
    static async deleteAttachment(req, res) { /* Implementation */ }
    static async getConversation(req, res) { /* Implementation */ }
    static async replyToConversation(req, res) { /* Implementation */ }
    static async trackEmailOpen(req, res) { /* Implementation */ }
    static async trackEmailClick(req, res) { /* Implementation */ }
    static async getTemplates(req, res) { /* Implementation */ }
    static async createTemplate(req, res) { /* Implementation */ }
    static async updateTemplate(req, res) { /* Implementation */ }
    static async deleteTemplate(req, res) { /* Implementation */ }
    static async scheduleEmail(req, res) { /* Implementation */ }
    static async getScheduledEmails(req, res) { /* Implementation */ }
    static async cancelScheduledEmail(req, res) { /* Implementation */ }
    static async getAutoReply(req, res) { /* Implementation */ }
    static async setAutoReply(req, res) { /* Implementation */ }
    static async disableAutoReply(req, res) { /* Implementation */ }
    static async getEmailStats(req, res) { /* Implementation */ }
    static async getActivityStats(req, res) { /* Implementation */ }
}

module.exports = EmailController;