const express = require('express');
const router = express.Router();
const LabelController = require('../controllers/labelController');
const auth = require('../middleware/auth');

// Apply authentication middleware
router.use(auth.authenticateToken);

// Get all labels for the user
router.get('/', LabelController.getLabels);

// Get label by ID
router.get('/:id', LabelController.getLabelById);

// Create new label
router.post('/', LabelController.createLabel);

// Update label
router.put('/:id', LabelController.updateLabel);

// Delete label
router.delete('/:id', LabelController.deleteLabel);

// Get emails with specific label
router.get('/:id/emails', LabelController.getEmailsByLabel);

// Get label statistics
router.get('/:id/stats', LabelController.getLabelStats);

// Reorder labels
router.post('/reorder', LabelController.reorderLabels);

module.exports = router;