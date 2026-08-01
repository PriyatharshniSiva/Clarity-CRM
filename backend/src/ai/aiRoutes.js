const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getAIDashboard,
  getProjectHealth,
  getDelayPredictions,
  getWorkloadAnalysis,
  getAIRecommendations,
  getExecutiveSummary,
  triggerAIAnalysis,
  submitAIFeedback
} = require('./aiController');

router.use(authenticate);

router.get('/dashboard', getAIDashboard);
router.get('/project-health/:projectId', getProjectHealth);
router.get('/delay-predictions', getDelayPredictions);
router.get('/workload', getWorkloadAnalysis);
router.get('/recommendations', getAIRecommendations);
router.get('/executive-summary', getExecutiveSummary);
router.post('/analyze', triggerAIAnalysis);
router.post('/feedback', submitAIFeedback);

module.exports = router;
