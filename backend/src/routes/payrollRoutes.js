const express = require('express');
const router = express.Router();
const {
  processPayrollBatch,
  getPayrollBatches,
  getPayrollBatchById,
  lockPayrollBatch,
  reviewPayrollBatch,
  publishPayrollBatch,
  rollbackPayrollBatch
} = require('../controllers/payrollController');
const { authenticate } = require('../middleware/auth');

router.get('/batches', authenticate, getPayrollBatches);
router.get('/batch/:id', authenticate, getPayrollBatchById);
router.post('/process', authenticate, processPayrollBatch);
router.put('/batch/:id/lock', authenticate, lockPayrollBatch);
router.put('/batch/:id/review', authenticate, reviewPayrollBatch);
router.put('/batch/:id/publish', authenticate, publishPayrollBatch);
router.put('/batch/:id/rollback', authenticate, rollbackPayrollBatch);

module.exports = router;
