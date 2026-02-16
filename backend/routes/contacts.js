const express = require('express');
const router = express.Router();
const ContactController = require('../controllers/contactController');
const auth = require('../middleware/auth');
const multer = require('multer');

// Configure multer for contact photo uploads
const upload = multer({
    dest: 'uploads/contacts/',
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit for contact photos
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for contact photos'));
        }
    }
});

// Apply authentication middleware
router.use(auth.authenticateToken);

// Get all contacts with search and pagination
router.get('/', ContactController.getContacts);

// Get frequently contacted people
router.get('/frequent', ContactController.getFrequentContacts);

// Search contacts
router.get('/search', ContactController.searchContacts);

// Get contact by ID
router.get('/:id', ContactController.getContactById);

// Create new contact
router.post('/', upload.single('photo'), ContactController.createContact);

// Update contact
router.put('/:id', upload.single('photo'), ContactController.updateContact);

// Delete contact
router.delete('/:id', ContactController.deleteContact);

// Bulk operations
router.post('/bulk-delete', ContactController.bulkDeleteContacts);
router.post('/bulk-export', ContactController.exportContacts);

// Import contacts
router.post('/import', upload.single('file'), ContactController.importContacts);

// Contact groups
router.get('/groups', ContactController.getContactGroups);
router.post('/groups', ContactController.createContactGroup);
router.put('/groups/:id', ContactController.updateContactGroup);
router.delete('/groups/:id', ContactController.deleteContactGroup);
router.post('/groups/:id/members', ContactController.addContactToGroup);
router.delete('/groups/:groupId/members/:contactId', ContactController.removeContactFromGroup);

// Contact suggestions
router.get('/suggestions', ContactController.getContactSuggestions);

module.exports = router;
