const db = require('../config/database');

class FolderController {
    static async getFolders(req, res) {
        try {
            const userId = req.user.id;

            // Get system folder counts
            const folderCounts = await Promise.all([
                // Inbox
                db.get(`
                    SELECT COUNT(*) as total, COUNT(CASE WHEN is_read = 0 THEN 1 END) as unread 
                    FROM emails 
                    WHERE user_id = ? AND folder = 'inbox' AND is_deleted = 0
                `, [userId]),
                
                // Sent
                db.get(`
                    SELECT COUNT(*) as total, 0 as unread 
                    FROM emails 
                    WHERE user_id = ? AND folder = 'sent'
                `, [userId]),
                
                // Drafts
                db.get(`
                    SELECT COUNT(*) as total, COUNT(*) as unread 
                    FROM emails 
                    WHERE user_id = ? AND folder = 'drafts'
                `, [userId]),
                
                // Starred
                db.get(`
                    SELECT COUNT(*) as total, COUNT(CASE WHEN is_read = 0 THEN 1 END) as unread 
                    FROM emails 
                    WHERE user_id = ? AND is_starred = 1 AND is_deleted = 0
                `, [userId]),
                
                // Important
                db.get(`
                    SELECT COUNT(*) as total, COUNT(CASE WHEN is_read = 0 THEN 1 END) as unread 
                    FROM emails 
                    WHERE user_id = ? AND is_important = 1 AND is_deleted = 0
                `, [userId]),
                
                // Spam
                db.get(`
                    SELECT COUNT(*) as total, COUNT(CASE WHEN is_read = 0 THEN 1 END) as unread 
                    FROM emails 
                    WHERE user_id = ? AND folder = 'spam'
                `, [userId]),
                
                // Trash
                db.get(`
                    SELECT COUNT(*) as total, COUNT(*) as unread 
                    FROM emails 
                    WHERE user_id = ? AND is_deleted = 1
                `, [userId]),
                
                // All Mail
                db.get(`
                    SELECT COUNT(*) as total, COUNT(CASE WHEN is_read = 0 THEN 1 END) as unread 
                    FROM emails 
                    WHERE user_id = ? AND is_deleted = 0
                `, [userId]),
                
                // Snoozed
                db.get(`
                    SELECT COUNT(*) as total, COUNT(CASE WHEN is_read = 0 THEN 1 END) as unread 
                    FROM emails 
                    WHERE user_id = ? AND snooze_until > datetime('now') AND is_deleted = 0
                `, [userId])
            ]);

            const folders = [
                { name: 'inbox', display_name: 'Inbox', total: folderCounts[0].total, unread_count: folderCounts[0].unread },
                { name: 'sent', display_name: 'Sent', total: folderCounts[1].total, unread_count: folderCounts[1].unread },
                { name: 'drafts', display_name: 'Drafts', total: folderCounts[2].total, unread_count: folderCounts[2].unread },
                { name: 'starred', display_name: 'Starred', total: folderCounts[3].total, unread_count: folderCounts[3].unread },
                { name: 'important', display_name: 'Important', total: folderCounts[4].total, unread_count: folderCounts[4].unread },
                { name: 'spam', display_name: 'Spam', total: folderCounts[5].total, unread_count: folderCounts[5].unread },
                { name: 'trash', display_name: 'Trash', total: folderCounts[6].total, unread_count: folderCounts[6].unread },
                { name: 'all', display_name: 'All Mail', total: folderCounts[7].total, unread_count: folderCounts[7].unread },
                { name: 'snoozed', display_name: 'Snoozed', total: folderCounts[8].total, unread_count: folderCounts[8].unread }
            ];

            // Get custom labels
            const labels = await db.all(`
                SELECT l.*, COUNT(el.email_id) as total,
                       COUNT(CASE WHEN e.is_read = 0 THEN 1 END) as unread_count
                FROM labels l
                LEFT JOIN email_labels el ON l.id = el.label_id
                LEFT JOIN emails e ON el.email_id = e.id AND e.is_deleted = 0
                WHERE l.user_id = ?
                GROUP BY l.id
                ORDER BY l.display_order
            `, [userId]);

            res.json({
                success: true,
                folders,
                labels
            });

        } catch (error) {
            console.error('Error getting folders:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get folders'
            });
        }
    }

    static async getFolderStats(req, res) {
        try {
            const userId = req.user.id;
            const { folderId } = req.params;

            let whereClause = '';
            let params = [userId];

            switch (folderId) {
                case 'inbox':
                    whereClause = "folder = 'inbox' AND is_deleted = 0";
                    break;
                case 'sent':
                    whereClause = "folder = 'sent'";
                    break;
                case 'drafts':
                    whereClause = "folder = 'drafts'";
                    break;
                case 'starred':
                    whereClause = "is_starred = 1 AND is_deleted = 0";
                    break;
                case 'important':
                    whereClause = "is_important = 1 AND is_deleted = 0";
                    break;
                case 'spam':
                    whereClause = "folder = 'spam'";
                    break;
                case 'trash':
                    whereClause = "is_deleted = 1";
                    break;
                case 'all':
                    whereClause = "is_deleted = 0";
                    break;
                case 'snoozed':
                    whereClause = "snooze_until > datetime('now') AND is_deleted = 0";
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid folder ID'
                    });
            }

            const stats = await db.get(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN is_read = 0 THEN 1 END) as unread,
                    COUNT(CASE WHEN is_starred = 1 THEN 1 END) as starred,
                    COUNT(CASE WHEN is_important = 1 THEN 1 END) as important,
                    COUNT(CASE WHEN has_attachments = 1 THEN 1 END) as with_attachments
                FROM emails
                WHERE user_id = ? AND ${whereClause}
            `, params);

            res.json({
                success: true,
                stats
            });

        } catch (error) {
            console.error('Error getting folder stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get folder stats'
            });
        }
    }

    static async createFolder(req, res) {
        try {
            const userId = req.user.id;
            const { name, color = '#1a73e8' } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Folder name is required'
                });
            }

            // Check if folder already exists
            const existing = await db.get(`
                SELECT id FROM labels 
                WHERE user_id = ? AND name = ?
            `, [userId, name]);

            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Folder with this name already exists'
                });
            }

            // Get next display order
            const maxOrder = await db.get(`
                SELECT MAX(display_order) as max_order 
                FROM labels 
                WHERE user_id = ?
            `, [userId]);

            const nextOrder = (maxOrder.max_order || 0) + 1;

            const result = await db.run(`
                INSERT INTO labels (user_id, name, color, display_order, created_at)
                VALUES (?, ?, ?, ?, datetime('now'))
            `, [userId, name, color, nextOrder]);

            res.json({
                success: true,
                message: 'Folder created successfully',
                folderId: result.lastID
            });

        } catch (error) {
            console.error('Error creating folder:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create folder'
            });
        }
    }

    static async updateFolder(req, res) {
        try {
            const userId = req.user.id;
            const folderId = req.params.id;
            const { name, color } = req.body;

            // Check if folder exists and belongs to user
            const folder = await db.get(`
                SELECT id FROM labels 
                WHERE id = ? AND user_id = ?
            `, [folderId, userId]);

            if (!folder) {
                return res.status(404).json({
                    success: false,
                    message: 'Folder not found'
                });
            }

            // Update folder
            await db.run(`
                UPDATE labels 
                SET name = COALESCE(?, name), 
                    color = COALESCE(?, color),
                    updated_at = datetime('now')
                WHERE id = ? AND user_id = ?
            `, [name, color, folderId, userId]);

            res.json({
                success: true,
                message: 'Folder updated successfully'
            });

        } catch (error) {
            console.error('Error updating folder:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update folder'
            });
        }
    }

    static async deleteFolder(req, res) {
        try {
            const userId = req.user.id;
            const folderId = req.params.id;

            // Check if folder exists and belongs to user
            const folder = await db.get(`
                SELECT id FROM labels 
                WHERE id = ? AND user_id = ?
            `, [folderId, userId]);

            if (!folder) {
                return res.status(404).json({
                    success: false,
                    message: 'Folder not found'
                });
            }

            // Remove folder from all emails
            await db.run(`
                DELETE FROM email_labels 
                WHERE label_id = ?
            `, [folderId]);

            // Delete the folder
            await db.run(`
                DELETE FROM labels 
                WHERE id = ? AND user_id = ?
            `, [folderId, userId]);

            res.json({
                success: true,
                message: 'Folder deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting folder:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete folder'
            });
        }
    }

    static async getEmailsInFolder(req, res) {
        try {
            const userId = req.user.id;
            const { folderId } = req.params;
            const { page = 1, limit = 50 } = req.query;

            // For custom labels, redirect to email controller with label filter
            if (!['inbox', 'sent', 'drafts', 'starred', 'important', 'spam', 'trash', 'all', 'snoozed'].includes(folderId)) {
                // This is a custom label
                req.query.folder = null;
                req.query.labelId = folderId;
            } else {
                req.query.folder = folderId;
            }

            // Import and call email controller
            const EmailController = require('./emailController');
            return EmailController.getEmails(req, res);

        } catch (error) {
            console.error('Error getting emails in folder:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get emails in folder'
            });
        }
    }
}

module.exports = FolderController;