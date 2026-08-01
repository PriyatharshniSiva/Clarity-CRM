const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getProjectMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone
} = require('../controllers/milestoneController');

router.use(authenticate);

// Get milestones for project
router.get('/project/:projectId', getProjectMilestones);

// Create milestone (Admin / Team Leader)
router.post('/', requireRole(['ADMIN', 'TEAM_LEADER']), createMilestone);

// Update milestone
router.put('/:id', requireRole(['ADMIN', 'TEAM_LEADER']), updateMilestone);

// Delete milestone
router.delete('/:id', requireRole(['ADMIN', 'TEAM_LEADER']), deleteMilestone);

module.exports = router;
