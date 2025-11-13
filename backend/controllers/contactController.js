const db = require('../config/database');

class ContactController {
    static async getContacts(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 50, search = '', group = '' } = req.query;

            let query = `
                SELECT c.*, 
                       cg.name as group_name,
                       COUNT(e.id) as email_count
                FROM contacts c
                LEFT JOIN contact_groups cg ON c.group_id = cg.id
                LEFT JOIN emails e ON (e.sender = c.email OR e.recipient LIKE '%' || c.email || '%')
                WHERE c.user_id = ?
            `;
            
            let params = [userId];

            if (search) {
                query += ` AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ?)`;
                const searchPattern = `%${search}%`;
                params.push(searchPattern, searchPattern, searchPattern);
            }

            if (group) {
                query += ` AND cg.name = ?`;
                params.push(group);
            }

            query += ` GROUP BY c.id ORDER BY c.first_name, c.last_name`;

            const offset = (page - 1) * limit;
            query += ` LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), offset);

            const contacts = await db.all(query, params);

            // Get total count
            let countQuery = `
                SELECT COUNT(DISTINCT c.id) as total
                FROM contacts c
                LEFT JOIN contact_groups cg ON c.group_id = cg.id
                WHERE c.user_id = ?
            `;
            
            let countParams = [userId];

            if (search) {
                countQuery += ` AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ?)`;
                const searchPattern = `%${search}%`;
                countParams.push(searchPattern, searchPattern, searchPattern);
            }

            if (group) {
                countQuery += ` AND cg.name = ?`;
                countParams.push(group);
            }

            const countResult = await db.get(countQuery, countParams);

            res.json({
                success: true,
                contacts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult.total,
                    totalPages: Math.ceil(countResult.total / limit)
                }
            });

        } catch (error) {
            console.error('Error getting contacts:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get contacts'
            });
        }
    }

    static async getContactById(req, res) {
        try {
            const userId = req.user.id;
            const contactId = req.params.id;

            const contact = await db.get(`
                SELECT c.*, cg.name as group_name
                FROM contacts c
                LEFT JOIN contact_groups cg ON c.group_id = cg.id
                WHERE c.id = ? AND c.user_id = ?
            `, [contactId, userId]);

            if (!contact) {
                return res.status(404).json({
                    success: false,
                    message: 'Contact not found'
                });
            }

            // Get email history with this contact
            const emailHistory = await db.all(`
                SELECT id, subject, snippet, created_at, is_read
                FROM emails
                WHERE user_id = ? AND (sender = ? OR recipient LIKE '%' || ? || '%')
                ORDER BY created_at DESC
                LIMIT 10
            `, [userId, contact.email, contact.email]);

            res.json({
                success: true,
                contact: {
                    ...contact,
                    emailHistory
                }
            });

        } catch (error) {
            console.error('Error getting contact:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get contact'
            });
        }
    }

    static async createContact(req, res) {
        try {
            const userId = req.user.id;
            const { 
                first_name, 
                last_name, 
                email, 
                phone, 
                company, 
                notes, 
                group_id 
            } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            // Check if contact already exists
            const existing = await db.get(`
                SELECT id FROM contacts
                WHERE user_id = ? AND email = ?
            `, [userId, email]);

            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Contact with this email already exists'
                });
            }

            const result = await db.run(`
                INSERT INTO contacts (
                    user_id, first_name, last_name, email, phone, 
                    company, notes, group_id, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            `, [userId, first_name, last_name, email, phone, company, notes, group_id]);

            res.json({
                success: true,
                message: 'Contact created successfully',
                contactId: result.lastID
            });

        } catch (error) {
            console.error('Error creating contact:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create contact'
            });
        }
    }

    static async updateContact(req, res) {
        try {
            const userId = req.user.id;
            const contactId = req.params.id;
            const updates = req.body;

            // Check if contact exists
            const contact = await db.get(`
                SELECT id FROM contacts
                WHERE id = ? AND user_id = ?
            `, [contactId, userId]);

            if (!contact) {
                return res.status(404).json({
                    success: false,
                    message: 'Contact not found'
                });
            }

            const updateFields = [];
            const updateValues = [];

            const allowedFields = ['first_name', 'last_name', 'email', 'phone', 'company', 'notes', 'group_id'];
            
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
            updateValues.push(contactId, userId);

            await db.run(`
                UPDATE contacts
                SET ${updateFields.join(', ')}
                WHERE id = ? AND user_id = ?
            `, updateValues);

            res.json({
                success: true,
                message: 'Contact updated successfully'
            });

        } catch (error) {
            console.error('Error updating contact:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update contact'
            });
        }
    }

    static async deleteContact(req, res) {
        try {
            const userId = req.user.id;
            const contactId = req.params.id;

            // Check if contact exists
            const contact = await db.get(`
                SELECT id FROM contacts
                WHERE id = ? AND user_id = ?
            `, [contactId, userId]);

            if (!contact) {
                return res.status(404).json({
                    success: false,
                    message: 'Contact not found'
                });
            }

            await db.run('DELETE FROM contacts WHERE id = ? AND user_id = ?', [contactId, userId]);

            res.json({
                success: true,
                message: 'Contact deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting contact:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete contact'
            });
        }
    }

    static async getContactGroups(req, res) {
        try {
            const userId = req.user.id;

            const groups = await db.all(`
                SELECT cg.*, COUNT(c.id) as contact_count
                FROM contact_groups cg
                LEFT JOIN contacts c ON cg.id = c.group_id
                WHERE cg.user_id = ?
                GROUP BY cg.id
                ORDER BY cg.name
            `, [userId]);

            res.json({
                success: true,
                groups
            });

        } catch (error) {
            console.error('Error getting contact groups:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get contact groups'
            });
        }
    }

    static async createContactGroup(req, res) {
        try {
            const userId = req.user.id;
            const { name, description } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Group name is required'
                });
            }

            // Check if group already exists
            const existing = await db.get(`
                SELECT id FROM contact_groups
                WHERE user_id = ? AND name = ?
            `, [userId, name]);

            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Group with this name already exists'
                });
            }

            const result = await db.run(`
                INSERT INTO contact_groups (user_id, name, description, created_at, updated_at)
                VALUES (?, ?, ?, datetime('now'), datetime('now'))
            `, [userId, name, description]);

            res.json({
                success: true,
                message: 'Contact group created successfully',
                groupId: result.lastID
            });

        } catch (error) {
            console.error('Error creating contact group:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create contact group'
            });
        }
    }

    static async bulkImport(req, res) {
        try {
            const userId = req.user.id;
            const { contacts } = req.body;

            if (!Array.isArray(contacts) || contacts.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Contacts array is required'
                });
            }

            let imported = 0;
            let errors = [];

            for (const contactData of contacts) {
                try {
                    const { first_name, last_name, email, phone, company, notes, group_id } = contactData;
                    
                    if (!email) {
                        errors.push(`Contact missing email: ${JSON.stringify(contactData)}`);
                        continue;
                    }

                    // Check if contact already exists
                    const existing = await db.get(`
                        SELECT id FROM contacts
                        WHERE user_id = ? AND email = ?
                    `, [userId, email]);

                    if (existing) {
                        errors.push(`Contact already exists: ${email}`);
                        continue;
                    }

                    await db.run(`
                        INSERT INTO contacts (
                            user_id, first_name, last_name, email, phone, 
                            company, notes, group_id, created_at, updated_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                    `, [userId, first_name, last_name, email, phone, company, notes, group_id]);

                    imported++;

                } catch (error) {
                    errors.push(`Error importing ${contactData.email}: ${error.message}`);
                }
            }

            res.json({
                success: true,
                message: `Imported ${imported} contacts`,
                imported,
                errors: errors.length > 0 ? errors : null
            });

        } catch (error) {
            console.error('Error bulk importing contacts:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to import contacts'
            });
        }
    }

    static async exportContacts(req, res) {
        try {
            const userId = req.user.id;
            const { format = 'json' } = req.query;

            const contacts = await db.all(`
                SELECT c.first_name, c.last_name, c.email, c.phone, c.company, c.notes,
                       cg.name as group_name
                FROM contacts c
                LEFT JOIN contact_groups cg ON c.group_id = cg.id
                WHERE c.user_id = ?
                ORDER BY c.first_name, c.last_name
            `, [userId]);

            if (format === 'csv') {
                let csv = 'First Name,Last Name,Email,Phone,Company,Notes,Group\n';
                for (const contact of contacts) {
                    csv += `"${contact.first_name || ''}","${contact.last_name || ''}","${contact.email || ''}","${contact.phone || ''}","${contact.company || ''}","${contact.notes || ''}","${contact.group_name || ''}"\n`;
                }

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
                res.send(csv);
            } else {
                res.json({
                    success: true,
                    contacts
                });
            }

        } catch (error) {
            console.error('Error exporting contacts:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to export contacts'
            });
        }
    }

    static async getFrequentContacts(req, res) {
        try {
            const userId = req.user.id;
            const { limit = 10 } = req.query;

            const contacts = await db.all(`
                SELECT c.*, COUNT(e.id) as email_count
                FROM contacts c
                LEFT JOIN emails e ON (e.sender = c.email OR e.recipient LIKE '%' || c.email || '%')
                WHERE c.user_id = ? AND c.frequency_contacted > 0
                GROUP BY c.id
                ORDER BY c.frequency_contacted DESC, c.last_contacted DESC
                LIMIT ?
            `, [userId, parseInt(limit)]);

            res.json({
                success: true,
                contacts
            });

        } catch (error) {
            console.error('Error getting frequent contacts:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get frequent contacts'
            });
        }
    }

    static async searchContacts(req, res) {
        try {
            const userId = req.user.id;
            const { q, limit = 50 } = req.query;

            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
            }

            const contacts = await db.all(`
                SELECT c.*, cg.name as group_name
                FROM contacts c
                LEFT JOIN contact_groups cg ON c.group_id = cg.id
                WHERE c.user_id = ? AND (
                    c.first_name LIKE ? OR 
                    c.last_name LIKE ? OR 
                    c.email LIKE ? OR 
                    c.company LIKE ?
                )
                ORDER BY c.first_name, c.last_name
                LIMIT ?
            `, [userId, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, parseInt(limit)]);

            res.json({
                success: true,
                contacts
            });

        } catch (error) {
            console.error('Error searching contacts:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search contacts'
            });
        }
    }

    static async bulkDeleteContacts(req, res) {
        try {
            const userId = req.user.id;
            const { contactIds } = req.body;

            if (!Array.isArray(contactIds) || contactIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Contact IDs array is required'
                });
            }

            const placeholders = contactIds.map(() => '?').join(',');
            await db.run(`
                DELETE FROM contacts 
                WHERE id IN (${placeholders}) AND user_id = ?
            `, [...contactIds, userId]);

            res.json({
                success: true,
                message: `Deleted ${contactIds.length} contacts`
            });

        } catch (error) {
            console.error('Error bulk deleting contacts:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete contacts'
            });
        }
    }

    static async importContacts(req, res) {
        return this.bulkImport(req, res);
    }

    static async updateContactGroup(req, res) {
        try {
            const userId = req.user.id;
            const groupId = req.params.id;
            const { name, description } = req.body;

            // Check if group exists
            const group = await db.get(`
                SELECT id FROM contact_groups
                WHERE id = ? AND user_id = ?
            `, [groupId, userId]);

            if (!group) {
                return res.status(404).json({
                    success: false,
                    message: 'Contact group not found'
                });
            }

            await db.run(`
                UPDATE contact_groups
                SET name = COALESCE(?, name),
                    description = COALESCE(?, description),
                    updated_at = datetime('now')
                WHERE id = ? AND user_id = ?
            `, [name, description, groupId, userId]);

            res.json({
                success: true,
                message: 'Contact group updated successfully'
            });

        } catch (error) {
            console.error('Error updating contact group:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update contact group'
            });
        }
    }

    static async deleteContactGroup(req, res) {
        try {
            const userId = req.user.id;
            const groupId = req.params.id;

            // Check if group exists
            const group = await db.get(`
                SELECT id FROM contact_groups
                WHERE id = ? AND user_id = ?
            `, [groupId, userId]);

            if (!group) {
                return res.status(404).json({
                    success: false,
                    message: 'Contact group not found'
                });
            }

            // Update contacts to remove group association
            await db.run('UPDATE contacts SET group_id = NULL WHERE group_id = ?', [groupId]);

            // Delete the group
            await db.run('DELETE FROM contact_groups WHERE id = ? AND user_id = ?', [groupId, userId]);

            res.json({
                success: true,
                message: 'Contact group deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting contact group:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete contact group'
            });
        }
    }

    static async addContactToGroup(req, res) {
        try {
            const userId = req.user.id;
            const groupId = req.params.id;
            const { contactId } = req.body;

            // Check if group exists
            const group = await db.get(`
                SELECT id FROM contact_groups
                WHERE id = ? AND user_id = ?
            `, [groupId, userId]);

            if (!group) {
                return res.status(404).json({
                    success: false,
                    message: 'Contact group not found'
                });
            }

            // Check if contact exists
            const contact = await db.get(`
                SELECT id FROM contacts
                WHERE id = ? AND user_id = ?
            `, [contactId, userId]);

            if (!contact) {
                return res.status(404).json({
                    success: false,
                    message: 'Contact not found'
                });
            }

            // Update contact's group
            await db.run(`
                UPDATE contacts
                SET group_id = ?, updated_at = datetime('now')
                WHERE id = ? AND user_id = ?
            `, [groupId, contactId, userId]);

            res.json({
                success: true,
                message: 'Contact added to group successfully'
            });

        } catch (error) {
            console.error('Error adding contact to group:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add contact to group'
            });
        }
    }

    static async removeContactFromGroup(req, res) {
        try {
            const userId = req.user.id;
            const { contactId } = req.params;

            // Check if contact exists
            const contact = await db.get(`
                SELECT id FROM contacts
                WHERE id = ? AND user_id = ?
            `, [contactId, userId]);

            if (!contact) {
                return res.status(404).json({
                    success: false,
                    message: 'Contact not found'
                });
            }

            // Remove contact from group
            await db.run(`
                UPDATE contacts
                SET group_id = NULL, updated_at = datetime('now')
                WHERE id = ? AND user_id = ?
            `, [contactId, userId]);

            res.json({
                success: true,
                message: 'Contact removed from group successfully'
            });

        } catch (error) {
            console.error('Error removing contact from group:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove contact from group'
            });
        }
    }

    static async getContactSuggestions(req, res) {
        try {
            const userId = req.user.id;
            const { q, limit = 10 } = req.query;

            let query = `
                SELECT DISTINCT
                    e.sender as email,
                    e.from_name as name,
                    COUNT(*) as email_count
                FROM emails e
                WHERE e.user_id = ? AND e.sender NOT LIKE '%@system%'
                AND e.sender NOT IN (SELECT email FROM contacts WHERE user_id = ?)
            `;
            
            let params = [userId, userId];

            if (q) {
                query += ` AND (e.sender LIKE ? OR e.from_name LIKE ?)`;
                params.push(`%${q}%`, `%${q}%`);
            }

            query += ` GROUP BY e.sender ORDER BY email_count DESC LIMIT ?`;
            params.push(parseInt(limit));

            const suggestions = await db.all(query, params);

            res.json({
                success: true,
                suggestions
            });

        } catch (error) {
            console.error('Error getting contact suggestions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get contact suggestions'
            });
        }
    }
}

module.exports = ContactController;
