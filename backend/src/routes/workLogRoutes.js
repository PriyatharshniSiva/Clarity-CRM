const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createWorkLog,
  updateWorkLog,
  deleteWorkLog,
  getWorkLogs
} = require('../controllers/workLogController');

router.use(authenticate);

// List work logs with metrics & filters
router.get('/', getWorkLogs);

// Create work log
router.post('/', createWorkLog);

// Update work log
router.put('/:id', updateWorkLog);

// Delete work log
router.delete('/:id', deleteWorkLog);

module.exports = router;
