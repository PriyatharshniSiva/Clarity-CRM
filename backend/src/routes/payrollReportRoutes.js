const express = require('express');
const router = express.Router();
const { getPayrollReportsSummary } = require('../controllers/payrollReportController');
const { authenticate } = require('../middleware/auth');

router.get('/summary', authenticate, getPayrollReportsSummary);

module.exports = router;
