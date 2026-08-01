const prisma = require('../utils/db');
const { analyzeProjectHealth } = require('./healthAnalyzer');
const { analyzeWorkload } = require('./workloadAnalyzer');

let recCounter = 1000;

const generateRecommendations = async (scopeOptions = {}) => {
  const recommendations = [];

  const projects = await prisma.project.findMany({
    where: { status: 'ACTIVE' },
    include: {
      tasks: {
        include: {
          prerequisites: { include: { dependsOnTask: true } }
        }
      },
      milestones: true
    }
  });

  // 1. Dependency & Bottleneck Recommendations
  for (const project of projects) {
    const blocked = project.tasks.filter(t => {
      const unfinished = t.prerequisites.filter(p => p.dependsOnTask?.status !== 'APPROVED' && p.dependsOnTask?.status !== 'COMPLETED');
      return unfinished.length > 0 && t.status === 'PENDING';
    });

    if (blocked.length > 0) {
      recCounter++;
      recommendations.push({
        recommendationId: `AI-REC-${recCounter}`,
        category: 'DEPENDENCY',
        projectCode: project.projectCode,
        projectId: project.id,
        problem: `${blocked.length} tasks in ${project.name} are blocked by pending prerequisite tasks.`,
        reason: `Dependent workflow nodes cannot start until root prerequisites are completed.`,
        dataSources: ['Task Dependencies', 'Prerequisite Graphs'],
        recommendation: `Prioritize completing root prerequisite task "${blocked[0].prerequisites[0]?.dependsOnTask?.title}" immediately.`,
        expectedImpact: `Unlocks dependent tasks and accelerates project velocity by ~25%.`,
        confidenceScore: 92
      });
    }
  }

  // 2. Resource Allocation & Workload Recommendations
  const workload = await analyzeWorkload();
  if (workload.reassignmentSuggestions.length > 0) {
    for (const sugg of workload.reassignmentSuggestions.slice(0, 3)) {
      recCounter++;
      recommendations.push({
        recommendationId: `AI-REC-${recCounter}`,
        category: 'RESOURCE',
        problem: `Capacity imbalance detected: ${sugg.fromUserName} is overallocated (${sugg.fromUserWorkload}%).`,
        reason: `${sugg.fromUserName} has multiple high-priority assigned tasks exceeding weekly capacity.`,
        dataSources: ['User Workload', 'Estimated Task Hours', 'Work Logs'],
        recommendation: sugg.recommendationText,
        expectedImpact: sugg.expectedImpact,
        confidenceScore: 88
      });
    }
  }

  // 3. Schedule & Delay Risk Recommendations
  const now = new Date();
  const overdueTasks = await prisma.task.findMany({
    where: {
      deadline: { lt: now },
      status: { notIn: ['APPROVED', 'COMPLETED'] }
    },
    include: { project: true }
  });

  if (overdueTasks.length > 0) {
    recCounter++;
    recommendations.push({
      recommendationId: `AI-REC-${recCounter}`,
      category: 'SCHEDULE',
      problem: `${overdueTasks.length} task(s) are past their target completion deadline.`,
      reason: `Tasks missed deadlines due to inaccurate estimation or capacity constraints.`,
      dataSources: ['Task Deadlines', 'Schedule Variance'],
      recommendation: `Review and adjust deadlines or allocate extra support to overdue task "${overdueTasks[0].title}".`,
      expectedImpact: `Mitigates project delay escalation risk.`,
      confidenceScore: 94
    });
  }

  return recommendations;
};

module.exports = {
  generateRecommendations
};
