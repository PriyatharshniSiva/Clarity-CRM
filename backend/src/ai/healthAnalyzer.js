const prisma = require('../utils/db');

const analyzeProjectHealth = async (projectId) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        include: {
          prerequisites: { include: { dependsOnTask: true } },
          workLogs: true
        }
      },
      milestones: true,
      members: true
    }
  });

  if (!project) {
    return {
      projectId,
      healthScore: 100,
      healthBadge: 'HEALTHY',
      reasons: ['No project data found.'],
      recommendedActions: ['Add project tasks and milestones to begin health tracking.'],
      dataSources: ['Project Schema']
    };
  }

  const now = new Date();
  let score = 100;
  const reasons = [];
  const recommendedActions = [];

  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter(t => t.status === 'APPROVED' || t.status === 'COMPLETED').length;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // 1. Check Schedule Delay
  const isPastEnd = project.estimatedEndDate && new Date(project.estimatedEndDate) < now && project.status !== 'COMPLETED';
  if (isPastEnd) {
    score -= 30;
    reasons.push(`Project has passed estimated completion date (${new Date(project.estimatedEndDate).toLocaleDateString()}).`);
    recommendedActions.push('Adjust project completion deadline or add capacity.');
  }

  // 2. Overdue Tasks
  const overdueTasks = project.tasks.filter(t => t.deadline < now && t.status !== 'APPROVED' && t.status !== 'COMPLETED');
  if (overdueTasks.length > 0) {
    score -= Math.min(25, overdueTasks.length * 8);
    reasons.push(`${overdueTasks.length} task(s) are overdue past deadline.`);
    recommendedActions.push(`Focus on finishing overdue task "${overdueTasks[0].title}".`);
  }

  // 3. Dependency Bottlenecks
  const blockedTasks = project.tasks.filter(t => {
    const unfinishedPrereqs = t.prerequisites.filter(
      p => p.dependsOnTask?.status !== 'APPROVED' && p.dependsOnTask?.status !== 'COMPLETED'
    );
    return unfinishedPrereqs.length > 0 && t.status === 'PENDING';
  });

  if (blockedTasks.length > 0) {
    score -= Math.min(20, blockedTasks.length * 5);
    reasons.push(`${blockedTasks.length} task(s) are currently blocked by prerequisite task dependencies.`);
    recommendedActions.push('Unblock root tasks first to release dependent workflow nodes.');
  }

  // 4. Overdue Milestones
  const overdueMilestones = project.milestones.filter(m => m.dueDate < now && m.status !== 'COMPLETED');
  if (overdueMilestones.length > 0) {
    score -= Math.min(15, overdueMilestones.length * 7);
    reasons.push(`${overdueMilestones.length} milestone(s) missed target due date.`);
    recommendedActions.push('Review milestone scope and re-prioritize milestone deliverables.');
  }

  // Bound score 0 - 100
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  let healthBadge = 'HEALTHY';
  if (isPastEnd || finalScore < 50) healthBadge = 'DELAYED';
  else if (finalScore < 70) healthBadge = 'CRITICAL';
  else if (finalScore < 85) healthBadge = 'AT_RISK';

  if (reasons.length === 0) {
    reasons.push('Project execution is progressing smoothly on track.');
    recommendedActions.push('Maintain current task completion velocity.');
  }

  return {
    projectId,
    projectCode: project.projectCode,
    name: project.name,
    healthScore: finalScore,
    healthBadge,
    progressPercent: Math.round(progressPercent),
    reasons,
    recommendedActions,
    dataSources: ['Task Dependencies', 'Work Logs', 'Milestones', 'Schedule Variance']
  };
};

module.exports = {
  analyzeProjectHealth
};
