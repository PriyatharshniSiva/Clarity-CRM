const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { authenticate, requireRole } = require('../middleware/auth');

const upload = require('../middleware/upload');

router.use(authenticate);

// Dashboard KPI Analytics
router.get('/analytics', requireRole(['ADMIN', 'TEAM_LEADER', 'SUPER_ADMIN']), assetController.getAssetAnalytics);

// CRUD routes
router.get('/', assetController.getAllAssets);
router.get('/:id', assetController.getAssetById);

// Admin & Super Admin actions
router.post('/', requireRole(['ADMIN', 'TEAM_LEADER']), upload.single('billPhoto'), assetController.createAsset);
router.put('/:id', requireRole(['ADMIN', 'TEAM_LEADER']), upload.single('billPhoto'), assetController.updateAsset);
router.post('/:id/bill-photo', requireRole(['ADMIN', 'TEAM_LEADER']), upload.single('billPhoto'), assetController.uploadBillPhoto);
router.delete('/:id/bill-photo', requireRole(['ADMIN', 'TEAM_LEADER']), assetController.deleteBillPhoto);
router.post('/:id/assign', requireRole(['ADMIN', 'TEAM_LEADER']), assetController.assignAsset);
router.post('/:id/return', requireRole(['ADMIN', 'TEAM_LEADER']), assetController.returnAsset);
router.delete('/:id', requireRole(['ADMIN', 'TEAM_LEADER']), assetController.deleteAsset);

module.exports = router;
