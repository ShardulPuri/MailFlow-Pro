const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const auth = require('../middleware/auth');

router.post('/', auth, templateController.createTemplate);
router.get('/', auth, templateController.getTemplates);
router.get('/:id', auth, templateController.getTemplate);
router.put('/:id', auth, templateController.updateTemplate);
router.delete('/:id', auth, templateController.deleteTemplate);
router.post('/:id/stats', auth, templateController.updateTemplateStats);

module.exports = router; 