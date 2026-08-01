const prisma = require('../utils/db');
const { logActivity } = require('../utils/activityLogger');

// 1. Executive Dashboard Analytics
const getDashboardAnalytics = async (req, res) => {
  try {
    const { projectId, teamId } = req.query;

    // Filters for role access
    const projectWhere = {};
    if (projectId) projectWhere.id = projectId;

    if (req.user.role === 'TEAM_LEADER') {
      const ledTeams = await prisma.team.findMany({ where: { leaderId: req.user.id }, select: { id: true } });
      const teamIds = ledTeams.map(t => t.id);
      projectWhere.teamId = { in: teamIds };
    }

    const projects = await prisma.project.findMany({
      where: projectWhere,
      include: {
        tasks: true,
        members: true,
        milestones: true
      }
    });

    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
    const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
    const onHoldProjects = projects.filter(p => p.status === 'ON_HOLD').length;
    const archivedProjects = projects.filter(p => p.status === 'ARCHIVED' || p.isArchived).length;

    // Health distribution
    const now = new Date();
    let onTrackCount = 0;
    let atRiskCount = 0;
    let delayedCount = 0;

    projects.forEach(p => {
      if (p.status === 'COMPLETED') {
        onTrackCount++;
      } else if (p.estimatedEndDate && new Date(p.estimatedEndDate) < now) {
        delayedCount++;
      } else if (p.health === 'AT_RISK') {
        atRiskCount++;
      } else {
        onTrackCount++;
      }
    });

    // Work Overview
    const tasks = await prisma.task.findMany({
      include: { assignee: { select: { id: true, name: true } } }
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'APPROVED' || t.status === 'COMPLETED').length;
    const pendingTasks = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
    const overdueTasks = tasks.filter(t => t.deadline < now && t.status !== 'APPROVED' && t.status !== 'COMPLETED').length;

    // Time Overview
    const estSum = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const actSum = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    const timeVariance = actSum - estSum;
    const utilizationRate = estSum > 0 ? ((actSum / estSum) * 100).toFixed(1) : '0.0';

    // Team & Members
    const totalTeams = await prisma.team.count();
    const totalMembers = await prisma.user.count({ where: { status: 'ACTIVE' } });
    const overallProductivity = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0.0';

    return res.status(200).json({
      summary: {
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects,
          onHold: onHoldProjects,
          archived: archivedProjects
        },
        health: {
          onTrack: onTrackCount,
          atRisk: atRiskCount,
          delayed: delayedCount
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          overdue: overdueTasks
        },
        time: {
          estimatedHours: estSum,
          actualHours: actSum,
          variance: timeVariance,
          utilizationRatePercent: parseFloat(utilizationRate)
        },
        teams: {
          totalTeams,
          totalMembers,
          overallProductivityPercent: parseFloat(overallProductivity)
        }
      }
    });
  } catch (error) {
    console.error('[getDashboardAnalytics Error]:', error);
    return res.status(500).json({ message: 'Failed to fetch dashboard analytics.', error: error.message });
  }
};

// 2. Productivity Analytics (Individual, Team, Project)
const getProductivityAnalytics = async (req, res) => {
  try {
    const { userId, teamId, projectId, startDate, endDate } = req.query;

    const taskWhere = {};
    if (userId) taskWhere.assigneeId = userId;
    if (projectId) taskWhere.projectId = projectId;

    if (startDate || endDate) {
      taskWhere.createdAt = {};
      if (startDate) taskWhere.createdAt.gte = new Date(startDate);
      if (endDate) taskWhere.createdAt.lte = new Date(endDate);
    }

    const tasks = await prisma.task.findMany({
      where: taskWhere,
      include: {
        assignee: { select: { id: true, name: true, role: true } },
        project: { select: { id: true, name: true, projectCode: true } }
      }
    });

    const totalAssigned = tasks.length;
    const completed = tasks.filter(t => t.status === 'APPROVED' || t.status === 'COMPLETED');
    const completionRate = totalAssigned > 0 ? ((completed.length / totalAssigned) * 100).toFixed(1) : '0.0';

    const now = new Date();
    const lateTasks = tasks.filter(t => t.deadline < now && t.status !== 'APPROVED' && t.status !== 'COMPLETED').length;
    const onTimeTasks = completed.filter(t => t.updatedAt <= t.deadline).length;

    // Work logs count & hours
    const workLogWhere = {};
    if (userId) workLogWhere.userId = userId;
    if (projectId) workLogWhere.projectId = projectId;

    const workLogs = await prisma.workLog.findMany({
      where: workLogWhere
    });

    const totalLoggedHours = workLogs.reduce((sum, w) => sum + w.hoursWorked, 0);
    const avgWorkHoursPerLog = workLogs.length > 0 ? (totalLoggedHours / workLogs.length).toFixed(1) : '0.0';

    return res.status(200).json({
      productivity: {
        totalAssigned,
        completedCount: completed.length,
        completionRatePercent: parseFloat(completionRate),
        onTimeTasks,
        lateTasks,
        totalLoggedHours,
        workLogsSubmitted: workLogs.length,
        avgWorkHoursPerLog: parseFloat(avgWorkHoursPerLog)
      }
    });
  } catch (error) {
    console.error('[getProductivityAnalytics Error]:', error);
    return res.status(500).json({ message: 'Failed to fetch productivity analytics.', error: error.message });
  }
};

// 3. Resource Utilization Analytics
const getResourceAnalytics = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profilePic: true,
        assignedTasks: {
          where: { status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING_FOR_REVIEW'] } },
          select: { id: true, title: true, estimatedHours: true, actualHours: true }
        },
        workLogs: {
          where: { status: 'APPROVED' },
          select: { hoursWorked: true }
        }
      }
    });

    const capacityPerUser = 40; // 40 hours standard capacity per week

    const resourceList = users.map(user => {
      const assignedHours = user.assignedTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
      const loggedHours = user.workLogs.reduce((sum, w) => sum + w.hoursWorked, 0);
      const availableHours = Math.max(0, capacityPerUser - assignedHours);
      const workloadPercent = parseFloat(((assignedHours / capacityPerUser) * 100).toFixed(1));

      let status = 'BALANCED';
      if (workloadPercent > 100) status = 'OVERALLOCATED';
      else if (workloadPercent < 50 && workloadPercent > 0) status = 'UNDERUTILIZED';
      else if (workloadPercent === 0) status = 'IDLE';

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
        capacityHours: capacityPerUser,
        assignedHours,
        loggedHours,
        availableHours,
        workloadPercent,
        status,
        activeTasksCount: user.assignedTasks.length
      };
    });

    const overallocatedCount = resourceList.filter(r => r.status === 'OVERALLOCATED').length;
    const underutilizedCount = resourceList.filter(r => r.status === 'UNDERUTILIZED').length;
    const idleCount = resourceList.filter(r => r.status === 'IDLE').length;
    const balancedCount = resourceList.filter(r => r.status === 'BALANCED').length;

    return res.status(200).json({
      summary: {
        totalResources: resourceList.length,
        overallocatedCount,
        underutilizedCount,
        idleCount,
        balancedCount
      },
      resources: resourceList
    });
  } catch (error) {
    console.error('[getResourceAnalytics Error]:', error);
    return res.status(500).json({ message: 'Failed to fetch resource analytics.', error: error.message });
  }
};

// 4. Schedule Performance & Milestone Velocity
const getScheduleAnalytics = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        milestones: { include: { tasks: true } },
        tasks: true
      }
    });

    const now = new Date();

    const scheduleData = projects.map(p => {
      const estStart = p.estimatedStartDate ? new Date(p.estimatedStartDate) : null;
      const estEnd = p.estimatedEndDate ? new Date(p.estimatedEndDate) : null;

      let plannedDays = 0;
      if (estStart && estEnd) {
        plannedDays = Math.ceil((estEnd - estStart) / (1000 * 3600 * 24));
      }

      const totalMilestones = p.milestones.length;
      const completedMilestones = p.milestones.filter(m => m.status === 'COMPLETED').length;
      const milestoneVelocityPercent = totalMilestones > 0 ? ((completedMilestones / totalMilestones) * 100).toFixed(1) : '0.0';

      const isDelayed = p.status !== 'COMPLETED' && estEnd && estEnd < now;
      const delayDays = isDelayed ? Math.ceil((now - estEnd) / (1000 * 3600 * 24)) : 0;

      return {
        projectId: p.id,
        projectCode: p.projectCode,
        name: p.name,
        status: p.status,
        health: p.health,
        plannedDays,
        delayDays,
        isDelayed,
        totalMilestones,
        completedMilestones,
        milestoneVelocityPercent: parseFloat(milestoneVelocityPercent),
        taskCount: p.tasks.length
      };
    });

    return res.status(200).json({
      schedule: scheduleData
    });
  } catch (error) {
    console.error('[getScheduleAnalytics Error]:', error);
    return res.status(500).json({ message: 'Failed to fetch schedule analytics.', error: error.message });
  }
};

// 5. Generate Report & Export Data
const generateReportData = async (req, res) => {
  try {
    const { reportType, format } = req.query;

    let data = [];

    if (reportType === 'PROJECT_SUMMARY') {
      const projects = await prisma.project.findMany({
        select: {
          projectCode: true,
          name: true,
          status: true,
          type: true,
          priority: true,
          estimatedStartDate: true,
          estimatedEndDate: true,
          tasks: { select: { status: true } }
        }
      });
      data = projects.map(p => {
        const total = p.tasks.length;
        const done = p.tasks.filter(t => t.status === 'APPROVED' || t.status === 'COMPLETED').length;
        const progress = total > 0 ? Math.round((done / total) * 100) : 0;
        const isDelayed = p.status !== 'COMPLETED' && p.estimatedEndDate && new Date(p.estimatedEndDate) < new Date();
        return {
          projectCode: p.projectCode,
          name: p.name,
          status: p.status,
          health: isDelayed ? 'DELAYED' : 'ON_TRACK',
          progress: `${progress}%`,
          estimatedStartDate: p.estimatedStartDate,
          estimatedEndDate: p.estimatedEndDate
        };
      });
    } else if (reportType === 'TIME_TRACKING') {
      const logs = await prisma.workLog.findMany({
        include: {
          user: { select: { name: true } },
          project: { select: { projectCode: true, name: true } },
          task: { select: { title: true } }
        }
      });
      data = logs.map(l => ({
        user: l.user.name,
        project: l.project ? `${l.project.projectCode} - ${l.project.name}` : 'N/A',
        task: l.task ? l.task.title : 'N/A',
        hoursWorked: l.hoursWorked,
        workDate: l.workDate,
        status: l.status,
        description: l.description
      }));
    } else {
      const tasks = await prisma.task.findMany({
        include: {
          assignee: { select: { name: true } },
          project: { select: { projectCode: true } }
        }
      });
      data = tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        estimatedHours: t.estimatedHours,
        actualHours: t.actualHours,
        assignee: t.assignee ? t.assignee.name : 'Unassigned',
        project: t.project ? t.project.projectCode : 'N/A'
      }));
    }

    // Audit Log for report export
    await logActivity({
      userId: req.user.id,
      action: 'REPORT_EXPORT',
      details: `Generated ${reportType || 'GENERAL'} report in ${format || 'JSON'} format`
    });

    return res.status(200).json({
      reportType: reportType || 'GENERAL',
      exportDate: new Date(),
      totalRecords: data.length,
      data
    });
  } catch (error) {
    console.error('[generateReportData Error]:', error);
    return res.status(500).json({ message: 'Failed to generate report data.', error: error.message });
  }
};

module.exports = {
  getDashboardAnalytics,
  getProductivityAnalytics,
  getResourceAnalytics,
  getScheduleAnalytics,
  generateReportData
};
