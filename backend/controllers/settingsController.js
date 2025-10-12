const db = require('../config/database');

class SettingsController {
    static async getUserSettings(req, res) {
        try {
            const userId = req.user.id;

            const settings = await db.all(`
                SELECT setting_key, setting_value
                FROM user_settings
                WHERE user_id = ?
            `, [userId]);

            // Convert to object format
            const settingsObj = {};
            settings.forEach(setting => {
                settingsObj[setting.setting_key] = setting.setting_value;
            });

            res.json({
                success: true,
                settings: settingsObj
            });

        } catch (error) {
            console.error('Error getting user settings:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user settings'
            });
        }
    }

    static async updateUserSettings(req, res) {
        try {
            const userId = req.user.id;
            const settings = req.body;

            if (!settings || typeof settings !== 'object') {
                return res.status(400).json({
                    success: false,
                    message: 'Settings object is required'
                });
            }

            // Update or insert each setting
            const upsertStmt = db.prepare(`
                INSERT OR REPLACE INTO user_settings (user_id, setting_key, setting_value, updated_at)
                VALUES (?, ?, ?, datetime('now'))
            `);

            for (const [key, value] of Object.entries(settings)) {
                upsertStmt.run(userId, key, String(value));
            }

            res.json({
                success: true,
                message: 'Settings updated successfully'
            });

        } catch (error) {
            console.error('Error updating user settings:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update user settings'
            });
        }
    }

    static async getFilters(req, res) {
        try {
            const userId = req.user.id;

            const filters = await db.all(`
                SELECT * FROM email_filters
                WHERE user_id = ?
                ORDER BY order_priority ASC
            `, [userId]);

            // Parse JSON fields
            const parsedFilters = filters.map(filter => ({
                ...filter,
                conditions: JSON.parse(filter.conditions),
                actions: JSON.parse(filter.actions)
            }));

            res.json({
                success: true,
                filters: parsedFilters
            });

        } catch (error) {
            console.error('Error getting filters:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get filters'
            });
        }
    }

    static async createFilter(req, res) {
        try {
            const userId = req.user.id;
            const { name, conditions, actions, is_active = 1 } = req.body;

            if (!name || !conditions || !actions) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, conditions, and actions are required'
                });
            }

            const result = await db.run(`
                INSERT INTO email_filters (user_id, name, conditions, actions, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, datetime('now'))
            `, [userId, name, JSON.stringify(conditions), JSON.stringify(actions), is_active]);

            res.json({
                success: true,
                message: 'Filter created successfully',
                filterId: result.lastInsertRowid
            });

        } catch (error) {
            console.error('Error creating filter:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create filter'
            });
        }
    }

    static async updateFilter(req, res) {
        try {
            const userId = req.user.id;
            const filterId = req.params.id;
            const updates = req.body;

            // Check if filter exists
            const filter = await db.get(`
                SELECT id FROM email_filters
                WHERE id = ? AND user_id = ?
            `, [filterId, userId]);

            if (!filter) {
                return res.status(404).json({
                    success: false,
                    message: 'Filter not found'
                });
            }

            const updateFields = [];
            const updateValues = [];

            if (updates.name) {
                updateFields.push('name = ?');
                updateValues.push(updates.name);
            }
            if (updates.conditions) {
                updateFields.push('conditions = ?');
                updateValues.push(JSON.stringify(updates.conditions));
            }
            if (updates.actions) {
                updateFields.push('actions = ?');
                updateValues.push(JSON.stringify(updates.actions));
            }
            if (updates.is_active !== undefined) {
                updateFields.push('is_active = ?');
                updateValues.push(updates.is_active);
            }

            if (updateFields.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid fields to update'
                });
            }

            updateFields.push('updated_at = datetime(\'now\')');
            updateValues.push(filterId, userId);

            await db.run(`
                UPDATE email_filters
                SET ${updateFields.join(', ')}
                WHERE id = ? AND user_id = ?
            `, updateValues);

            res.json({
                success: true,
                message: 'Filter updated successfully'
            });

        } catch (error) {
            console.error('Error updating filter:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update filter'
            });
        }
    }

    static async deleteFilter(req, res) {
        try {
            const userId = req.user.id;
            const filterId = req.params.id;

            // Check if filter exists
            const filter = await db.get(`
                SELECT id FROM email_filters
                WHERE id = ? AND user_id = ?
            `, [filterId, userId]);

            if (!filter) {
                return res.status(404).json({
                    success: false,
                    message: 'Filter not found'
                });
            }

            await db.run('DELETE FROM email_filters WHERE id = ? AND user_id = ?', [filterId, userId]);

            res.json({
                success: true,
                message: 'Filter deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting filter:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete filter'
            });
        }
    }

    static async getTemplates(req, res) {
        try {
            const userId = req.user.id;

            const templates = await db.all(`
                SELECT * FROM email_templates
                WHERE user_id = ? OR is_shared = 1
                ORDER BY usage_count DESC, name ASC
            `, [userId]);

            res.json({
                success: true,
                templates
            });

        } catch (error) {
            console.error('Error getting templates:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get templates'
            });
        }
    }

    static async createTemplate(req, res) {
        try {
            const userId = req.user.id;
            const { name, subject, body, is_shared = 0 } = req.body;

            if (!name || !body) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and body are required'
                });
            }

            const result = await db.run(`
                INSERT INTO email_templates (user_id, name, subject, body, is_shared, created_at)
                VALUES (?, ?, ?, ?, ?, datetime('now'))
            `, [userId, name, subject, body, is_shared]);

            res.json({
                success: true,
                message: 'Template created successfully',
                templateId: result.lastInsertRowid
            });

        } catch (error) {
            console.error('Error creating template:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create template'
            });
        }
    }

    static async updateTemplate(req, res) {
        try {
            const userId = req.user.id;
            const templateId = req.params.id;
            const updates = req.body;

            // Check if template exists and user owns it
            const template = await db.get(`
                SELECT id FROM email_templates
                WHERE id = ? AND user_id = ?
            `, [templateId, userId]);

            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'Template not found'
                });
            }

            const updateFields = [];
            const updateValues = [];

            const allowedFields = ['name', 'subject', 'body', 'is_shared'];
            for (const field of allowedFields) {
                if (updates[field] !== undefined) {
                    updateFields.push(`${field} = ?`);
                    updateValues.push(updates[field]);
                }
            }

            if (updateFields.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid fields to update'
                });
            }

            updateValues.push(templateId, userId);

            await db.run(`
                UPDATE email_templates
                SET ${updateFields.join(', ')}
                WHERE id = ? AND user_id = ?
            `, updateValues);

            res.json({
                success: true,
                message: 'Template updated successfully'
            });

        } catch (error) {
            console.error('Error updating template:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update template'
            });
        }
    }

    static async deleteTemplate(req, res) {
        try {
            const userId = req.user.id;
            const templateId = req.params.id;

            // Check if template exists and user owns it
            const template = await db.get(`
                SELECT id FROM email_templates
                WHERE id = ? AND user_id = ?
            `, [templateId, userId]);

            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'Template not found'
                });
            }

            await db.run('DELETE FROM email_templates WHERE id = ? AND user_id = ?', [templateId, userId]);

            res.json({
                success: true,
                message: 'Template deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting template:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete template'
            });
        }
    }

    static async getAccountInfo(req, res) {
        try {
            const userId = req.user.id;

            const user = await db.get(`
                SELECT id, email, name, avatar, storage_used, storage_limit, 
                       theme, language, timezone, signature, auto_reply_enabled,
                       auto_reply_message, created_at
                FROM users
                WHERE id = ?
            `, [userId]);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                user
            });

        } catch (error) {
            console.error('Error getting account info:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get account info'
            });
        }
    }

    static async updateAccountInfo(req, res) {
        try {
            const userId = req.user.id;
            const updates = req.body;

            const updateFields = [];
            const updateValues = [];

            const allowedFields = ['name', 'avatar', 'theme', 'language', 'timezone', 'signature', 'auto_reply_enabled', 'auto_reply_message'];
            for (const field of allowedFields) {
                if (updates[field] !== undefined) {
                    updateFields.push(`${field} = ?`);
                    updateValues.push(updates[field]);
                }
            }

            if (updateFields.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid fields to update'
                });
            }

            updateFields.push('updated_at = datetime(\'now\')');
            updateValues.push(userId);

            await db.run(`
                UPDATE users
                SET ${updateFields.join(', ')}
                WHERE id = ?
            `, updateValues);

            res.json({
                success: true,
                message: 'Account updated successfully'
            });

        } catch (error) {
            console.error('Error updating account info:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update account info'
            });
        }
    }
}

module.exports = SettingsController;