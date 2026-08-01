const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getDashboardAnalytics,
  getProductivityAnalytics,
  getResourceAnalytics,
  getScheduleAnalytics,
  generateReportData
} = require('../controllers/analyticsController');

router.use(authenticate);

// Executive Dashboard Analytics
router.get('/dashboard', getDashboardAnalytics);

// Productivity Analytics
router.get('/productivity', getProductivityAnalytics);

// Resource Utilization Analytics
router.get('/resources', getResourceAnalytics);

// Schedule Performance Analytics
router.get('/schedule', getScheduleAnalytics);

// Export & Report Generator
router.get('/reports', generateReportData);

module.exports = router;
