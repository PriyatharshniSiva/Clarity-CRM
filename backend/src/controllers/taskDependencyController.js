const prisma = require('../utils/db');
const { logActivity } = require('../utils/activityLogger');
const { createNotification } = require('../services/notification');

// Helper to check circular dependencies via Depth First Search
const checkCircularDependency = async (taskId, targetPrerequisiteId) => {
  const visited = new Set();
  const queue = [targetPrerequisiteId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (currentId === taskId) {
      return true; // Circular dependency detected!
    }

    if (!visited.has(currentId)) {
      visited.add(currentId);
      const prerequisites = await prisma.taskDependency.findMany({
        where: { taskId: currentId },
        select: { dependsOnTaskId: true }
      });
      for (const p of prerequisites) {
        queue.push(p.dependsOnTaskId);
      }
    }
  }
  return false;
};

// 1. Create Dependency (Task A depends on Task B)
const createDependency = async (req, res) => {
  try {
    const { taskId, dependsOnTaskId } = req.body;

    if (!taskId || !dependsOnTaskId) {
      return res.status(400).json({ message: 'taskId and dependsOnTaskId are required.' });
    }

    if (taskId === dependsOnTaskId) {
      return res.status(400).json({ message: 'A task cannot depend on itself.' });
    }

    // Verify tasks exist
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    const dependsOnTask = await prisma.task.findUnique({ where: { id: dependsOnTaskId } });

    if (!task || !dependsOnTask) {
      return res.status(404).json({ message: 'One or both tasks were not found.' });
    }

    // Check duplicate
    const existing = await prisma.taskDependency.findUnique({
      where: {
        taskId_dependsOnTaskId: { taskId, dependsOnTaskId }
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'This task dependency link already exists.' });
    }

    // Check circular dependency
    const isCircular = await checkCircularDependency(taskId, dependsOnTaskId);
    if (isCircular) {
      return res.status(400).json({ message: 'Circular dependency detected! Linking these tasks would create an infinite loop.' });
    }

    const dependency = await prisma.taskDependency.create({
      data: { taskId, dependsOnTaskId },
      include: {
        task: { select: { id: true, title: true } },
        dependsOnTask: { select: { id: true, title: true, status: true } }
      }
    });

    await logActivity({
      userId: req.user.id,
      action: 'TASK_DEPENDENCY_CREATE',
      details: `Created dependency: "${task.title}" depends on "${dependsOnTask.title}"`
    });

    return res.status(201).json(dependency);
  } catch (error) {
    console.error('[createDependency Error]:', error);
    return res.status(500).json({ message: 'Failed to create task dependency.', error: error.message });
  }
};

// 2. Delete Dependency
const deleteDependency = async (req, res) => {
  try {
    const { id } = req.params;

    const dependency = await prisma.taskDependency.findUnique({ where: { id } });
    if (!dependency) {
      return res.status(404).json({ message: 'Task dependency not found.' });
    }

    await prisma.taskDependency.delete({ where: { id } });

    return res.status(200).json({ message: 'Task dependency link removed successfully.' });
  } catch (error) {
    console.error('[deleteDependency Error]:', error);
    return res.status(500).json({ message: 'Failed to remove task dependency.', error: error.message });
  }
};

// 3. Get Dependencies for a Task (Prerequisites & Dependents)
const getTaskDependencies = async (req, res) => {
  try {
    const { taskId } = req.params;

    const prerequisites = await prisma.taskDependency.findMany({
      where: { taskId },
      include: {
        dependsOnTask: {
          select: { id: true, title: true, status: true, priority: true, assignee: { select: { id: true, name: true, profilePic: true } } }
        }
      }
    });

    const dependents = await prisma.taskDependency.findMany({
      where: { dependsOnTaskId: taskId },
      include: {
        task: {
          select: { id: true, title: true, status: true, priority: true, assignee: { select: { id: true, name: true, profilePic: true } } }
        }
      }
    });

    const allPrerequisitesCompleted = prerequisites.every(
      p => p.dependsOnTask.status === 'APPROVED' || p.dependsOnTask.status === 'COMPLETED'
    );

    return res.status(200).json({
      taskId,
      prerequisites,
      dependents,
      isUnlocked: allPrerequisitesCompleted
    });
  } catch (error) {
    console.error('[getTaskDependencies Error]:', error);
    return res.status(500).json({ message: 'Failed to retrieve task dependencies.', error: error.message });
  }
};

module.exports = {
  createDependency,
  deleteDependency,
  getTaskDependencies
};
