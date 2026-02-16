const express = require('express');
const router = express.Router();

// Search across all content types
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { q = '', type = 'all', page = 1, limit = 50 } = req.query;

        if (!q.trim()) {
            return res.json({
                success: true,
                results: {
                    emails: [],
                    contacts: [],
                    labels: []
                },
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: 0
                }
            });
        }

        const results = {};
        const searchPattern = `%${q}%`;

        // Search emails
        if (type === 'all' || type === 'emails') {
            const EmailController = require('../controllers/emailController');
            
            // Temporarily modify request for email search
            const emailReq = {
                ...req,
                query: {
                    ...req.query,
                    search: q,
                    folder: null // Search across all folders
                }
            };
            
            const emailRes = {
                json: (data) => {
                    results.emails = data.emails || [];
                }
            };
            
            await EmailController.searchEmails(emailReq, emailRes);
        }

        // Search contacts
        if (type === 'all' || type === 'contacts') {
            const db = require('../config/database');
            
            const contacts = await db.all(`
                SELECT id, name, email, phone, company
                FROM contacts
                WHERE user_id = ? AND (
                    name LIKE ? OR 
                    email LIKE ? OR 
                    phone LIKE ? OR 
                    company LIKE ?
                )
                LIMIT ?
            `, [userId, searchPattern, searchPattern, searchPattern, searchPattern, parseInt(limit)]);
            
            results.contacts = contacts;
        }

        // Search labels
        if (type === 'all' || type === 'labels') {
            const db = require('../config/database');
            
            const labels = await db.all(`
                SELECT id, name, color
                FROM labels
                WHERE user_id = ? AND name LIKE ?
                LIMIT ?
            `, [userId, searchPattern, parseInt(limit)]);
            
            results.labels = labels;
        }

        // Calculate total results
        const total = (results.emails?.length || 0) + 
                     (results.contacts?.length || 0) + 
                     (results.labels?.length || 0);

        res.json({
            success: true,
            results,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total
            }
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Search failed'
        });
    }
});

// Global search suggestions
router.get('/suggestions', async (req, res) => {
    try {
        const userId = req.user.id;
        const { q = '', limit = 10 } = req.query;

        if (!q.trim()) {
            return res.json({
                success: true,
                suggestions: []
            });
        }

        const db = require('../config/database');
        const searchPattern = `%${q}%`;

        // Get suggestions from various sources
        const [emailSuggestions, contactSuggestions, labelSuggestions] = await Promise.all([
            // Email subjects
            db.all(`
                SELECT DISTINCT subject as text, 'email-subject' as type
                FROM emails
                WHERE user_id = ? AND subject LIKE ? AND subject != ''
                LIMIT ?
            `, [userId, searchPattern, Math.floor(limit / 3)]),
            
            // Contact names and emails
            db.all(`
                SELECT DISTINCT name as text, 'contact' as type
                FROM contacts
                WHERE user_id = ? AND name LIKE ? AND name != ''
                UNION
                SELECT DISTINCT email as text, 'contact-email' as type
                FROM contacts
                WHERE user_id = ? AND email LIKE ? AND email != ''
                LIMIT ?
            `, [userId, searchPattern, userId, searchPattern, Math.floor(limit / 3)]),
            
            // Labels
            db.all(`
                SELECT DISTINCT name as text, 'label' as type
                FROM labels
                WHERE user_id = ? AND name LIKE ?
                LIMIT ?
            `, [userId, searchPattern, Math.floor(limit / 3)])
        ]);

        const suggestions = [
            ...emailSuggestions,
            ...contactSuggestions,
            ...labelSuggestions
        ].slice(0, parseInt(limit));

        res.json({
            success: true,
            suggestions
        });

    } catch (error) {
        console.error('Suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get suggestions'
        });
    }
});

// Advanced search with filters
router.post('/advanced', async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            query = '',
            from = '',
            to = '',
            subject = '',
            hasAttachment = null,
            dateFrom = null,
            dateTo = null,
            folder = '',
            labels = [],
            isRead = null,
            isStarred = null,
            isImportant = null
        } = req.body;

        // Build the search request for EmailController
        const searchReq = {
            ...req,
            query: {
                search: query,
                from,
                to,
                subject,
                hasAttachment,
                dateFrom,
                dateTo,
                folder: folder || undefined,
                unread: isRead === false ? 'true' : undefined,
                starred: isStarred === true ? 'true' : undefined,
                important: isImportant === true ? 'true' : undefined,
                page: req.body.page || 1,
                limit: req.body.limit || 50
            }
        };

        // Use EmailController for the search
        const EmailController = require('../controllers/emailController');
        await EmailController.getEmails(searchReq, res);

    } catch (error) {
        console.error('Advanced search error:', error);
        res.status(500).json({
            success: false,
            message: 'Advanced search failed'
        });
    }
});

// Save search query
router.post('/save', async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, query, filters = {} } = req.body;

        if (!name || !query) {
            return res.status(400).json({
                success: false,
                message: 'Name and query are required'
            });
        }

        const db = require('../config/database');

        const result = await db.run(`
            INSERT INTO saved_searches (user_id, name, query, filters, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        `, [userId, name, query, JSON.stringify(filters)]);

        res.json({
            success: true,
            message: 'Search saved successfully',
            searchId: result.lastID
        });

    } catch (error) {
        console.error('Save search error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save search'
        });
    }
});

// Get saved searches
router.get('/saved', async (req, res) => {
    try {
        const userId = req.user.id;
        const db = require('../config/database');

        const searches = await db.all(`
            SELECT id, name, query, filters, created_at
            FROM saved_searches
            WHERE user_id = ?
            ORDER BY created_at DESC
        `, [userId]);

        // Parse filters JSON
        const parsedSearches = searches.map(search => ({
            ...search,
            filters: JSON.parse(search.filters || '{}')
        }));

        res.json({
            success: true,
            searches: parsedSearches
        });

    } catch (error) {
        console.error('Get saved searches error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get saved searches'
        });
    }
});

// Delete saved search
router.delete('/saved/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const searchId = req.params.id;
        const db = require('../config/database');

        await db.run(`
            DELETE FROM saved_searches
            WHERE id = ? AND user_id = ?
        `, [searchId, userId]);

        res.json({
            success: true,
            message: 'Saved search deleted'
        });

    } catch (error) {
        console.error('Delete saved search error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete saved search'
        });
    }
});

module.exports = router;