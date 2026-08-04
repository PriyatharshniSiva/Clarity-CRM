const buildExecutiveSummaryPrompt = (context) => {
  return `Synthesize an executive summary for Innoveity CRM based on the following project context:
- Total Projects: ${context.totalProjects}
- Healthy Projects: ${context.healthyProjects}
- At Risk Projects: ${context.atRiskProjects}
- Delayed Projects: ${context.delayedProjects}
- Total Tasks: ${context.totalTasks}
- Completed Tasks: ${context.completedTasks}
- Logged Hours: ${context.totalHours}
Provide a natural language executive summary detailing accomplishments, risks, and next actions.`;
};

module.exports = {
  buildExecutiveSummaryPrompt
};
