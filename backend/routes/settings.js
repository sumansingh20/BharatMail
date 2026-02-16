const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/settingsController');
const auth = require('../middleware/auth');

// Apply authentication middleware
router.use(auth.authenticateToken);

// General settings
router.get('/', SettingsController.getUserSettings);
router.put('/', SettingsController.updateUserSettings);

// Email filters
router.get('/filters', SettingsController.getFilters);
router.post('/filters', SettingsController.createFilter);
router.put('/filters/:id', SettingsController.updateFilter);
router.delete('/filters/:id', SettingsController.deleteFilter);

// Email templates
router.get('/templates', SettingsController.getTemplates);
router.post('/templates', SettingsController.createTemplate);
router.put('/templates/:id', SettingsController.updateTemplate);
router.delete('/templates/:id', SettingsController.deleteTemplate);

// Account info
router.get('/account', SettingsController.getAccountInfo);
router.put('/account', SettingsController.updateAccountInfo);

module.exports = router;