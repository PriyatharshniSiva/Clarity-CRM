const prisma = require('../utils/db');
const llmProvider = require('./llmProvider');

const generateExecutiveSummary = async () => {
  const totalProjects = await prisma.project.count();
  const activeProjects = await prisma.project.count({ where: { status: 'ACTIVE' } });
  const completedProjects = await prisma.project.count({ where: { status: 'COMPLETED' } });
  const onHoldProjects = await prisma.project.count({ where: { status: 'ON_HOLD' } });

  const totalTasks = await prisma.task.count();
  const completedTasks = await prisma.task.count({ where: { status: { in: ['APPROVED', 'COMPLETED'] } } });

  const workLogs = await prisma.workLog.aggregate({
    where: { status: 'APPROVED' },
    _sum: { hoursWorked: true }
  });

  const totalHours = workLogs._sum.hoursWorked || 0;

  const context = {
    totalProjects,
    activeProjects,
    healthyProjects: activeProjects,
    atRiskProjects: onHoldProjects,
    delayedProjects: 0,
    totalTasks,
    completedTasks,
    pendingTasks: totalTasks - completedTasks,
    totalHours
  };

  const naturalLanguageSummary = await llmProvider.generateSummary(context);

  return {
    period: 'WEEKLY',
    summaryText: naturalLanguageSummary,
    metrics: context,
    generatedAt: new Date()
  };
};

module.exports = {
  generateExecutiveSummary
};
