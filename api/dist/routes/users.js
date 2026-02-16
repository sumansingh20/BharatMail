"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 avatar:
 *                   type: string
 *                 preferences:
 *                   type: object
 */
router.get('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        // Mock user profile
        const profile = {
            id: '1',
            email: 'demo@bhamail.com',
            firstName: 'Demo',
            lastName: 'User',
            avatar: null,
            preferences: {
                theme: 'light',
                language: 'en',
                emailsPerPage: 25,
                autoRefresh: true,
                notifications: {
                    email: true,
                    desktop: false,
                    mobile: true
                }
            },
            storage: {
                used: '1.2 GB',
                total: '15 GB',
                percentage: 8
            }
        };
        res.json(profile);
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            error: 'Failed to fetch profile',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const { firstName, lastName, preferences } = req.body;
        // Mock profile update
        const updatedProfile = {
            id: '1',
            email: 'demo@bhamail.com',
            firstName: firstName || 'Demo',
            lastName: lastName || 'User',
            preferences: preferences || {},
            updatedAt: new Date()
        };
        res.json({
            message: 'Profile updated successfully',
            profile: updatedProfile
        });
    }
    catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            error: 'Failed to update profile',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * @swagger
 * /api/users/settings:
 *   get:
 *     summary: Get user settings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User settings
 */
router.get('/settings', auth_1.authenticateToken, async (req, res) => {
    try {
        // Mock user settings
        const settings = {
            general: {
                language: 'en',
                timezone: 'UTC',
                dateFormat: 'MM/DD/YYYY',
                timeFormat: '12h'
            },
            email: {
                signature: 'Sent from BhaMail',
                autoReply: false,
                forwardingEnabled: false,
                forwardingAddress: null
            },
            privacy: {
                showOnlineStatus: true,
                allowReadReceipts: true,
                blockImages: false
            },
            notifications: {
                email: true,
                desktop: false,
                mobile: true,
                sound: true
            }
        };
        res.json(settings);
    }
    catch (error) {
        console.error('Settings error:', error);
        res.status(500).json({
            error: 'Failed to fetch settings',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * @swagger
 * /api/users/settings:
 *   put:
 *     summary: Update user settings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
router.put('/settings', auth_1.authenticateToken, async (req, res) => {
    try {
        const settings = req.body;
        // Mock settings update
        res.json({
            message: 'Settings updated successfully',
            settings,
            updatedAt: new Date()
        });
    }
    catch (error) {
        console.error('Settings update error:', error);
        res.status(500).json({
            error: 'Failed to update settings',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * @swagger
 * /api/users/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.post('/change-password', auth_1.authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long' });
        }
        // Mock password change
        res.json({
            message: 'Password changed successfully'
        });
    }
    catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            error: 'Failed to change password',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map