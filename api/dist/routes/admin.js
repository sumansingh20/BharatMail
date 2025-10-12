"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get admin statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: number
 *                 totalEmails:
 *                   type: number
 *                 activeUsers:
 *                   type: number
 */
router.get('/stats', auth_1.authenticateToken, async (req, res) => {
    try {
        // Mock admin statistics
        const stats = {
            totalUsers: 1250,
            totalEmails: 45230,
            activeUsers: 892,
            storageUsed: '2.4 TB',
            systemHealth: 'healthy'
        };
        res.json(stats);
    }
    catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({
            error: 'Failed to fetch admin statistics',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/users', auth_1.authenticateToken, async (req, res) => {
    try {
        // Mock user list for admin
        const users = [
            {
                id: '1',
                email: 'demo@bhamail.com',
                firstName: 'Demo',
                lastName: 'User',
                createdAt: new Date(),
                lastLogin: new Date(),
                isActive: true
            }
        ];
        res.json({ users });
    }
    catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({
            error: 'Failed to fetch users',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map