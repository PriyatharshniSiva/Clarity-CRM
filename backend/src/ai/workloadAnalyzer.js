const prisma = require('../utils/db');

const analyzeWorkload = async () => {
  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    include: {
      assignedTasks: {
        where: { status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING_FOR_REVIEW'] } },
        select: { id: true, title: true, priority: true, estimatedHours: true }
      },
      workLogs: {
        where: { status: 'APPROVED' },
        select: { hoursWorked: true }
      }
    }
  });

  const capacityPerUser = 40; // 40h standard week

  const workloadProfiles = users.map(user => {
    const assignedHours = user.assignedTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const loggedHours = user.workLogs.reduce((sum, w) => sum + w.hoursWorked, 0);
    const workloadPercent = parseFloat(((assignedHours / capacityPerUser) * 100).toFixed(1));

    let status = 'BALANCED';
    if (workloadPercent > 100) status = 'OVERALLOCATED';
    else if (workloadPercent < 50 && workloadPercent > 0) status = 'UNDERUTILIZED';
    else if (workloadPercent === 0) status = 'IDLE';

    return {
      userId: user.id,
      name: user.name,
      role: user.role,
      assignedHours,
      loggedHours,
      workloadPercent,
      status,
      tasks: user.assignedTasks
    };
  });

  // Generate Smart Reassignment Suggestions
  const overallocated = workloadProfiles.filter(p => p.status === 'OVERALLOCATED');
  const underutilizedOrIdle = workloadProfiles.filter(p => p.status === 'UNDERUTILIZED' || p.status === 'IDLE');

  const reassignmentSuggestions = [];

  overallocated.forEach(source => {
    if (source.tasks.length > 0 && underutilizedOrIdle.length > 0) {
      const taskToMove = source.tasks[0];
      const targetUser = underutilizedOrIdle[0];

      reassignmentSuggestions.push({
        taskId: taskToMove.id,
        taskTitle: taskToMove.title,
        fromUserId: source.userId,
        fromUserName: source.name,
        fromUserWorkload: source.workloadPercent,
        toUserId: targetUser.userId,
        toUserName: targetUser.name,
        toUserWorkload: targetUser.workloadPercent,
        estimatedHours: taskToMove.estimatedHours,
        recommendationText: `Reassign task "${taskToMove.title}" (${taskToMove.estimatedHours || 0}h) from ${source.name} (${source.workloadPercent}% workload) to ${targetUser.name} (${targetUser.workloadPercent}% workload).`,
        expectedImpact: `Reduces ${source.name}'s workload and optimizes team capacity balance.`
      });
    }
  });

  return {
    profiles: workloadProfiles,
    reassignmentSuggestions,
    dataSources: ['Task Assignees', 'Estimated Hours', 'Work Logs', 'User Capacity']
  };
};

module.exports = {
  analyzeWorkload
};
