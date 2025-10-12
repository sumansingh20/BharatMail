const express = require('express');
const router = express.Router();
const FolderController = require('../controllers/folderController');
const auth = require('../middleware/auth');

// Apply authentication middleware
router.use(auth.authenticateToken);

// Get all folders with counts
router.get('/', FolderController.getFolders);

// Get specific folder stats
router.get('/:folderId/stats', FolderController.getFolderStats);

// Create custom folder
router.post('/', FolderController.createFolder);

// Update folder
router.put('/:id', FolderController.updateFolder);

// Delete custom folder
router.delete('/:id', FolderController.deleteFolder);

// Get emails in folder
router.get('/:folderId/emails', FolderController.getEmailsInFolder);

module.exports = router;