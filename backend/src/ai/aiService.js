const { analyzeProjectHealth } = require('./healthAnalyzer');
const { predictProjectDelays } = require('./predictionEngine');
const { analyzeWorkload } = require('./workloadAnalyzer');
const { generateRecommendations } = require('./recommendationEngine');
const { generateExecutiveSummary } = require('./summaryGenerator');
const { getProviderMetadata } = require('./llmProvider');
const { getCachedAIContext } = require('./analyticsContext');
const prisma = require('../utils/db');

const getAIDashboardData = async (forceRefresh = false) => {
  const fetchAllAI = async () => {
    const projects = await prisma.project.findMany({ select: { id: true, name: true, projectCode: true } });

    const healthPromises = projects.map(p => analyzeProjectHealth(p.id));
    const projectHealths = await Promise.all(healthPromises);

    const delayPredictions = await predictProjectDelays();
    const workload = await analyzeWorkload();
    const recommendations = await generateRecommendations();
    const summary = await generateExecutiveSummary();

    return {
      projectHealths,
      delayPredictions,
      workload,
      recommendations,
      summary
    };
  };

  const contextData = await getCachedAIContext(fetchAllAI, forceRefresh);

  return {
    metadata: {
      generatedAt: new Date(),
      generatedBy: 'rule-engine-and-llm-layer',
      confidenceScore: 89,
      version: getProviderMetadata()
    },
    ...contextData
  };
};

module.exports = {
  getAIDashboardData
};
