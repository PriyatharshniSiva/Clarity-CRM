const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  createDependency,
  deleteDependency,
  getTaskDependencies
} = require('../controllers/taskDependencyController');

router.use(authenticate);

// Get task dependencies
router.get('/task/:taskId', getTaskDependencies);

// Create dependency
router.post('/', createDependency);

// Delete dependency
router.delete('/:id', deleteDependency);

module.exports = router;
