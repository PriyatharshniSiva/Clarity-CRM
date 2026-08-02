const express = require('express');
const router = express.Router();
const { getPayrollSettings, updatePayrollSettings } = require('../controllers/payrollSettingsController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getPayrollSettings);
router.put('/', authenticate, updatePayrollSettings);

module.exports = router;
