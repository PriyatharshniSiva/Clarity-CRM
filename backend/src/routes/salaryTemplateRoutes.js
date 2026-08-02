const express = require('express');
const router = express.Router();
const {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
} = require('../controllers/salaryTemplateController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getTemplates);
router.post('/', authenticate, createTemplate);
router.put('/:id', authenticate, updateTemplate);
router.delete('/:id', authenticate, deleteTemplate);

module.exports = router;
