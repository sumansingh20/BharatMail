const db = require('../config/database');

class LabelController {
    static async getLabels(req, res) {
        try {
            const userId = req.user.id;

            const labels = await db.all(`
                SELECT l.*, COUNT(el.email_id) as email_count
                FROM labels l
                LEFT JOIN email_labels el ON l.id = el.label_id
                WHERE l.user_id = ?
                GROUP BY l.id
                ORDER BY l.display_order
            `, [userId]);

            res.json({
                success: true,
                labels
            });

        } catch (error) {
            console.error('Error getting labels:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get labels'
            });
        }
    }

    static async getLabelById(req, res) {
        try {
            const userId = req.user.id;
            const labelId = req.params.id;

            const label = await db.get(`
                SELECT * FROM labels
                WHERE id = ? AND user_id = ?
            `, [labelId, userId]);

            if (!label) {
                return res.status(404).json({
                    success: false,
                    message: 'Label not found'
                });
            }

            res.json({
                success: true,
                label
            });

        } catch (error) {
            console.error('Error getting label:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get label'
            });
        }
    }

    static async createLabel(req, res) {
        try {
            const userId = req.user.id;
            const { name, color = '#1a73e8' } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Label name is required'
                });
            }

            // Check if label already exists
            const existing = await db.get(`
                SELECT id FROM labels
                WHERE user_id = ? AND name = ?
            `, [userId, name]);

            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Label with this name already exists'
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
                INSERT INTO labels (user_id, name, color, display_order, created_at, updated_at)
                VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
            `, [userId, name, color, nextOrder]);

            res.json({
                success: true,
                message: 'Label created successfully',
                labelId: result.lastID
            });

        } catch (error) {
            console.error('Error creating label:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create label'
            });
        }
    }

    static async updateLabel(req, res) {
        try {
            const userId = req.user.id;
            const labelId = req.params.id;
            const { name, color } = req.body;

            // Check if label exists
            const label = await db.get(`
                SELECT id FROM labels
                WHERE id = ? AND user_id = ?
            `, [labelId, userId]);

            if (!label) {
                return res.status(404).json({
                    success: false,
                    message: 'Label not found'
                });
            }

            await db.run(`
                UPDATE labels
                SET name = COALESCE(?, name),
                    color = COALESCE(?, color),
                    updated_at = datetime('now')
                WHERE id = ? AND user_id = ?
            `, [name, color, labelId, userId]);

            res.json({
                success: true,
                message: 'Label updated successfully'
            });

        } catch (error) {
            console.error('Error updating label:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update label'
            });
        }
    }

    static async deleteLabel(req, res) {
        try {
            const userId = req.user.id;
            const labelId = req.params.id;

            // Check if label exists
            const label = await db.get(`
                SELECT id FROM labels
                WHERE id = ? AND user_id = ?
            `, [labelId, userId]);

            if (!label) {
                return res.status(404).json({
                    success: false,
                    message: 'Label not found'
                });
            }

            // Remove label from all emails
            await db.run('DELETE FROM email_labels WHERE label_id = ?', [labelId]);

            // Delete the label
            await db.run('DELETE FROM labels WHERE id = ? AND user_id = ?', [labelId, userId]);

            res.json({
                success: true,
                message: 'Label deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting label:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete label'
            });
        }
    }

    static async getEmailsByLabel(req, res) {
        try {
            const userId = req.user.id;
            const labelId = req.params.id;
            const { page = 1, limit = 50 } = req.query;

            // Check if label exists
            const label = await db.get(`
                SELECT id FROM labels
                WHERE id = ? AND user_id = ?
            `, [labelId, userId]);

            if (!label) {
                return res.status(404).json({
                    success: false,
                    message: 'Label not found'
                });
            }

            const offset = (page - 1) * limit;

            // Get emails with this label
            const emails = await db.all(`
                SELECT e.*, l.name as label_name, l.color as label_color
                FROM emails e
                JOIN email_labels el ON e.id = el.email_id
                JOIN labels l ON el.label_id = l.id
                WHERE el.label_id = ? AND e.user_id = ? AND e.is_deleted = 0
                ORDER BY e.created_at DESC
                LIMIT ? OFFSET ?
            `, [labelId, userId, parseInt(limit), offset]);

            // Get total count
            const countResult = await db.get(`
                SELECT COUNT(*) as total
                FROM emails e
                JOIN email_labels el ON e.id = el.email_id
                WHERE el.label_id = ? AND e.user_id = ? AND e.is_deleted = 0
            `, [labelId, userId]);

            res.json({
                success: true,
                emails,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult.total,
                    totalPages: Math.ceil(countResult.total / limit)
                }
            });

        } catch (error) {
            console.error('Error getting emails by label:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get emails by label'
            });
        }
    }

    static async getLabelStats(req, res) {
        try {
            const userId = req.user.id;
            const labelId = req.params.id;

            // Check if label exists
            const label = await db.get(`
                SELECT id FROM labels
                WHERE id = ? AND user_id = ?
            `, [labelId, userId]);

            if (!label) {
                return res.status(404).json({
                    success: false,
                    message: 'Label not found'
                });
            }

            const stats = await db.get(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN e.is_read = 0 THEN 1 END) as unread,
                    COUNT(CASE WHEN e.is_starred = 1 THEN 1 END) as starred,
                    COUNT(CASE WHEN e.is_important = 1 THEN 1 END) as important
                FROM emails e
                JOIN email_labels el ON e.id = el.email_id
                WHERE el.label_id = ? AND e.user_id = ? AND e.is_deleted = 0
            `, [labelId, userId]);

            res.json({
                success: true,
                stats
            });

        } catch (error) {
            console.error('Error getting label stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get label stats'
            });
        }
    }

    static async reorderLabels(req, res) {
        try {
            const userId = req.user.id;
            const { labelIds } = req.body;

            if (!Array.isArray(labelIds)) {
                return res.status(400).json({
                    success: false,
                    message: 'Label IDs array is required'
                });
            }

            // Update display order for each label
            for (let i = 0; i < labelIds.length; i++) {
                await db.run(`
                    UPDATE labels
                    SET display_order = ?
                    WHERE id = ? AND user_id = ?
                `, [i + 1, labelIds[i], userId]);
            }

            res.json({
                success: true,
                message: 'Labels reordered successfully'
            });

        } catch (error) {
            console.error('Error reordering labels:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reorder labels'
            });
        }
    }
}

module.exports = LabelController;