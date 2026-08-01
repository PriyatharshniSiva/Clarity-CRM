// Mock AI Provider (Resilient local text generation fallback)
const generateNaturalLanguageSummary = async (context) => {
  const { totalProjects, healthyProjects, atRiskProjects, delayedProjects, completedTasks, pendingTasks, totalHours } = context;

  return `Executive AI Summary: Currently managing ${totalProjects} total projects. ${healthyProjects} projects are healthy and on track, while ${atRiskProjects} projects are at risk and ${delayedProjects} projects require immediate intervention. The team completed ${completedTasks} tasks with a total of ${totalHours} logged hours. Priority focus should be placed on unblocking critical task dependency chains.`;
};

module.exports = {
  providerName: 'mock-provider-v1',
  generateNaturalLanguageSummary
};
