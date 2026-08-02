const express = require('express');
const router = express.Router();
const { getPayslips, getPayslipById, emailPayslip } = require('../controllers/payslipController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getPayslips);
router.get('/:id', authenticate, getPayslipById);
router.post('/:id/email', authenticate, emailPayslip);

module.exports = router;
