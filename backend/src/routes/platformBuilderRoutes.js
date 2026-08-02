const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/superAdminMiddleware');
const platformBuilderController = require('../controllers/platformBuilderController');

// All routes require valid Authentication & SUPER_ADMIN authorization
router.use(authenticate, requireSuperAdmin);

// Dashboard Overview
router.get('/dashboard', platformBuilderController.getPlatformBuilderDashboard);

// Form Builder Schemas
router.get('/forms/schema/:entityType', platformBuilderController.getFormSchema);
router.post('/forms/schema/:entityType/draft', platformBuilderController.saveFormDraft);
router.get('/forms/schema/:entityType/impact', platformBuilderController.analyzePublishImpact);
router.post('/forms/schema/:entityType/publish', platformBuilderController.publishFormSchema);
router.post('/forms/schema/:entityType/rollback/:versionId', platformBuilderController.rollbackFormSchema);
router.get('/forms/schema/:entityType/history', platformBuilderController.getFormVersionHistory);

// Dynamic Menu Hierarchy
router.get('/menus/:role', platformBuilderController.getMenuHierarchy);
router.post('/menus/:role', platformBuilderController.updateMenuHierarchy);

module.exports = router;
