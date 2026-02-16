"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/search/emails:
 *   get:
 *     summary: Search emails
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *         description: Folder to search in
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: number
 *           default: 0
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 emails:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: number
 *                 query:
 *                   type: string
 */
router.get('/emails', auth_1.authenticateToken, async (req, res) => {
    try {
        const { q, folder = 'inbox', limit = 20, offset = 0 } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Search query is required' });
        }
        // Mock search results
        const mockEmails = [
            {
                id: 'search-1',
                from: { email: 'demo@bhamail.com', name: 'Demo User' },
                to: [{ email: 'user@bhamail.com', name: 'User' }],
                subject: `Search result for: ${q}`,
                bodyText: `This email contains the search term: ${q}`,
                timestamp: new Date().toISOString(),
                isRead: false,
                isStarred: false,
                hasAttachments: false,
                threadId: 'thread-search-1',
                folder: folder
            }
        ];
        const response = {
            emails: mockEmails,
            total: mockEmails.length,
            query: q,
            folder,
            limit: Number(limit),
            offset: Number(offset)
        };
        res.json(response);
    }
    catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            error: 'Failed to search emails',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * @swagger
 * /api/search/contacts:
 *   get:
 *     summary: Search contacts
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Contact search results
 */
router.get('/contacts', auth_1.authenticateToken, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Search query is required' });
        }
        // Mock contact search results
        const mockContacts = [
            {
                id: 'contact-1',
                email: 'demo@bhamail.com',
                name: 'Demo User',
                lastContact: new Date().toISOString()
            }
        ];
        res.json({
            contacts: mockContacts,
            total: mockContacts.length,
            query: q
        });
    }
    catch (error) {
        console.error('Contact search error:', error);
        res.status(500).json({
            error: 'Failed to search contacts',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: Get search suggestions
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Partial search query
 *     responses:
 *       200:
 *         description: Search suggestions
 */
router.get('/suggestions', auth_1.authenticateToken, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Query is required' });
        }
        // Mock search suggestions
        const suggestions = [
            `${q} in:inbox`,
            `${q} from:demo@bhamail.com`,
            `${q} subject:meeting`,
            `${q} has:attachment`
        ];
        res.json({ suggestions });
    }
    catch (error) {
        console.error('Suggestions error:', error);
        res.status(500).json({
            error: 'Failed to get suggestions',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=search.js.map