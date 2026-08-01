const prisma = require('../utils/db');
const { logActivity } = require('../utils/activityLogger');

// Helper to recalculate and store Task.actualHours in DB
const recalculateTaskActualHours = async (taskId) => {
  if (!taskId) return;
  try {
    const aggregate = await prisma.workLog.aggregate({
      where: {
        taskId,
        status: 'APPROVED'
      },
      _sum: { hoursWorked: true }
    });

    const totalHours = aggregate._sum.hoursWorked || 0;

    await prisma.task.update({
      where: { id: taskId },
      data: { actualHours: totalHours }
    });
  } catch (err) {
    console.error(`Failed to recalculate actualHours for task ${taskId}:`, err);
  }
};

// 1. Create WorkLog
const createWorkLog = async (req, res) => {
  try {
    const { projectId, taskId, description, hoursWorked, workDate } = req.body;

    const hours = parseFloat(hoursWorked);
    if (isNaN(hours) || hours <= 0) {
      return res.status(400).json({ message: 'Hours worked must be a positive number greater than 0.' });
    }

    if (hours > 24) {
      return res.status(400).json({ message: 'Hours worked cannot exceed 24 hours in a single log.' });
    }

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ message: 'Work description is required.' });
    }

    const logDate = workDate ? new Date(workDate) : new Date();

    // Check daily total for user
    const startOfDay = new Date(logDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(logDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dailyAggregate = await prisma.workLog.aggregate({
      where: {
        userId: req.user.id,
        workDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      _sum: { hoursWorked: true }
    });

    const existingDailyHours = dailyAggregate._sum.hoursWorked || 0;
    if (existingDailyHours + hours > 24) {
      return res.status(400).json({
        message: `Total work hours for ${logDate.toLocaleDateString()} cannot exceed 24 hours (Currently logged: ${existingDailyHours} hrs).`
      });
    }

    const workLog = await prisma.workLog.create({
      data: {
        userId: req.user.id,
        projectId: projectId || null,
        taskId: taskId || null,
        description,
        hoursWorked: hours,
        workDate: logDate,
        status: 'APPROVED' // Auto-approved by default
      },
      include: {
        user: { select: { id: true, name: true, profilePic: true } },
        task: { select: { id: true, title: true, estimatedHours: true, actualHours: true } },
        project: { select: { id: true, name: true, projectCode: true } }
      }
    });

    if (taskId) {
      await recalculateTaskActualHours(taskId);
    }

    await logActivity({
      userId: req.user.id,
      action: 'WORKLOG_CREATE',
      details: `Logged ${hours} hours for "${description}"`
    });

    return res.status(201).json(workLog);
  } catch (error) {
    console.error('[createWorkLog Error]:', error);
    return res.status(500).json({ message: 'Failed to create work log.', error: error.message });
  }
};

// 2. Edit WorkLog
const updateWorkLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, hoursWorked, workDate, status } = req.body;

    const existing = await prisma.workLog.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Work log not found.' });
    }

    // Permission: Only owner or Admin/TL can update
    const isOwner = existing.userId === req.user.id;
    const isAdminOrTL = req.user.role === 'ADMIN' || req.user.role === 'TEAM_LEADER';
    if (!isOwner && !isAdminOrTL) {
      return res.status(403).json({ message: 'You can only edit your own work logs.' });
    }

    let hours = existing.hoursWorked;
    if (hoursWorked !== undefined) {
      hours = parseFloat(hoursWorked);
      if (isNaN(hours) || hours <= 0) {
        return res.status(400).json({ message: 'Hours worked must be a positive number greater than 0.' });
      }
      if (hours > 24) {
        return res.status(400).json({ message: 'Hours worked cannot exceed 24 hours.' });
      }
    }

    const updated = await prisma.workLog.update({
      where: { id },
      data: {
        description: description !== undefined ? description : existing.description,
        hoursWorked: hours,
        workDate: workDate ? new Date(workDate) : existing.workDate,
        status: status || existing.status
      },
      include: {
        user: { select: { id: true, name: true, profilePic: true } },
        task: { select: { id: true, title: true, estimatedHours: true, actualHours: true } },
        project: { select: { id: true, name: true, projectCode: true } }
      }
    });

    if (existing.taskId) {
      await recalculateTaskActualHours(existing.taskId);
    }

    return res.status(200).json(updated);
  } catch (error) {
    console.error('[updateWorkLog Error]:', error);
    return res.status(500).json({ message: 'Failed to update work log.', error: error.message });
  }
};

// 3. Delete WorkLog
const deleteWorkLog = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.workLog.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Work log not found.' });
    }

    const isOwner = existing.userId === req.user.id;
    const isAdminOrTL = req.user.role === 'ADMIN' || req.user.role === 'TEAM_LEADER';
    if (!isOwner && !isAdminOrTL) {
      return res.status(403).json({ message: 'You can only delete your own work logs.' });
    }

    const taskId = existing.taskId;
    await prisma.workLog.delete({ where: { id } });

    if (taskId) {
      await recalculateTaskActualHours(taskId);
    }

    return res.status(200).json({ message: 'Work log deleted successfully.' });
  } catch (error) {
    console.error('[deleteWorkLog Error]:', error);
    return res.status(500).json({ message: 'Failed to delete work log.', error: error.message });
  }
};

// 4. List WorkLogs with Filtering and Summary Dashboard Metrics
const getWorkLogs = async (req, res) => {
  try {
    const { userId, taskId, projectId, startDate, endDate, status } = req.query;

    const where = {};
    if (userId) where.userId = userId;
    if (taskId) where.taskId = taskId;
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.workDate = {};
      if (startDate) where.workDate.gte = new Date(startDate);
      if (endDate) where.workDate.lte = new Date(endDate);
    }

    // Role filtering: Employees/Interns only see their own work logs unless filtering by project
    if (req.user.role === 'EMPLOYEE' || req.user.role === 'INTERN') {
      if (!projectId) {
        where.userId = req.user.id;
      }
    }

    const logs = await prisma.workLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, profilePic: true, role: true } },
        task: { select: { id: true, title: true, estimatedHours: true, actualHours: true } },
        project: { select: { id: true, name: true, projectCode: true } }
      },
      orderBy: { workDate: 'desc' }
    });

    // Compute Summary Widgets for "My Work Logs" Dashboard
    const targetUserLogs = logs.filter(l => l.userId === (userId || req.user.id) && l.status === 'APPROVED');
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const hoursToday = targetUserLogs
      .filter(l => new Date(l.workDate) >= startOfToday)
      .reduce((sum, l) => sum + l.hoursWorked, 0);

    const hoursThisWeek = targetUserLogs
      .filter(l => new Date(l.workDate) >= startOfWeek)
      .reduce((sum, l) => sum + l.hoursWorked, 0);

    const hoursThisMonth = targetUserLogs
      .filter(l => new Date(l.workDate) >= startOfMonth)
      .reduce((sum, l) => sum + l.hoursWorked, 0);

    const tasksWorkedOnCount = new Set(targetUserLogs.map(l => l.taskId).filter(Boolean)).size;
    const avgHoursPerDay = targetUserLogs.length > 0 ? (hoursThisMonth / Math.max(1, now.getDate())).toFixed(1) : '0.0';

    return res.status(200).json({
      summary: {
        hoursToday,
        hoursThisWeek,
        hoursThisMonth,
        tasksWorkedOnCount,
        avgHoursPerDay
      },
      logs
    });
  } catch (error) {
    console.error('[getWorkLogs Error]:', error);
    return res.status(500).json({ message: 'Failed to retrieve work logs.', error: error.message });
  }
};

module.exports = {
  createWorkLog,
  updateWorkLog,
  deleteWorkLog,
  getWorkLogs,
  recalculateTaskActualHours
};
