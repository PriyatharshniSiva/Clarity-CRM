const prisma = require('../utils/db');
const { getAIDashboardData } = require('./aiService');
const { analyzeProjectHealth } = require('./healthAnalyzer');
const { predictProjectDelays } = require('./predictionEngine');
const { analyzeWorkload } = require('./workloadAnalyzer');
const { generateRecommendations } = require('./recommendationEngine');
const { generateExecutiveSummary } = require('./summaryGenerator');
const { invalidateCache } = require('./analyticsContext');
const { logActivity } = require('../utils/activityLogger');

// 1. GET /api/ai/dashboard
const getAIDashboard = async (req, res) => {
  try {
    const data = await getAIDashboardData(false);

    // Audit Log
    await logActivity({
      userId: req.user.id,
      action: 'AI_DASHBOARD_VIEW',
      details: 'Viewed AI Executive Dashboard & Insights'
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error('[getAIDashboard Error]:', error);
    return res.status(500).json({ message: 'Failed to retrieve AI dashboard data.', error: error.message });
  }
};

// 2. GET /api/ai/project-health/:projectId
const getProjectHealth = async (req, res) => {
  try {
    const { projectId } = req.params;
    const health = await analyzeProjectHealth(projectId);
    return res.status(200).json(health);
  } catch (error) {
    console.error('[getProjectHealth Error]:', error);
    return res.status(500).json({ message: 'Failed to analyze project health.', error: error.message });
  }
};

// 3. GET /api/ai/delay-predictions
const getDelayPredictions = async (req, res) => {
  try {
    const predictions = await predictProjectDelays();
    return res.status(200).json({ predictions });
  } catch (error) {
    console.error('[getDelayPredictions Error]:', error);
    return res.status(500).json({ message: 'Failed to predict project delays.', error: error.message });
  }
};

// 4. GET /api/ai/workload
const getWorkloadAnalysis = async (req, res) => {
  try {
    const workload = await analyzeWorkload();
    return res.status(200).json(workload);
  } catch (error) {
    console.error('[getWorkloadAnalysis Error]:', error);
    return res.status(500).json({ message: 'Failed to analyze workload.', error: error.message });
  }
};

// 5. GET /api/ai/recommendations
const getAIRecommendations = async (req, res) => {
  try {
    const { category } = req.query;
    let recs = await generateRecommendations();
    if (category) {
      recs = recs.filter(r => r.category === category);
    }
    return res.status(200).json({ recommendations: recs });
  } catch (error) {
    console.error('[getAIRecommendations Error]:', error);
    return res.status(500).json({ message: 'Failed to generate recommendations.', error: error.message });
  }
};

// 6. GET /api/ai/executive-summary
const getExecutiveSummary = async (req, res) => {
  try {
    const summary = await generateExecutiveSummary();
    return res.status(200).json(summary);
  } catch (error) {
    console.error('[getExecutiveSummary Error]:', error);
    return res.status(500).json({ message: 'Failed to generate executive summary.', error: error.message });
  }
};

// 7. POST /api/ai/analyze (Trigger cache refresh)
const triggerAIAnalysis = async (req, res) => {
  try {
    invalidateCache();
    const freshData = await getAIDashboardData(true);

    await logActivity({
      userId: req.user.id,
      action: 'AI_ANALYSIS_RUN',
      details: 'Triggered fresh AI analysis calculation'
    });

    return res.status(200).json({ message: 'AI Analysis recalculated successfully.', data: freshData });
  } catch (error) {
    console.error('[triggerAIAnalysis Error]:', error);
    return res.status(500).json({ message: 'Failed to run AI analysis.', error: error.message });
  }
};

// 8. POST /api/ai/feedback (Ratings 👍 Helpful / 👎 Not Helpful)
const submitAIFeedback = async (req, res) => {
  try {
    const { recommendationId, rating, category, feedbackText } = req.body;

    if (!recommendationId || !rating) {
      return res.status(400).json({ message: 'recommendationId and rating (HELPFUL / NOT_HELPFUL) are required.' });
    }

    const feedback = await prisma.aIFeedback.create({
      data: {
        userId: req.user.id,
        recommendationId,
        rating,
        category: category || null,
        feedbackText: feedbackText || null
      }
    });

    await logActivity({
      userId: req.user.id,
      action: 'AI_FEEDBACK_SUBMITTED',
      details: `Submitted ${rating} feedback for recommendation ${recommendationId}`
    });

    return res.status(201).json({ message: 'AI Feedback recorded successfully.', feedback });
  } catch (error) {
    console.error('[submitAIFeedback Error]:', error);
    return res.status(500).json({ message: 'Failed to record AI feedback.', error: error.message });
  }
};

module.exports = {
  getAIDashboard,
  getProjectHealth,
  getDelayPredictions,
  getWorkloadAnalysis,
  getAIRecommendations,
  getExecutiveSummary,
  triggerAIAnalysis,
  submitAIFeedback
};
