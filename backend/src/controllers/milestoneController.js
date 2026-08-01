const prisma = require('../utils/db');
const { logActivity } = require('../utils/activityLogger');

// 1. Get Milestones for a Project
const getProjectMilestones = async (req, res) => {
  try {
    const { projectId } = req.params;

    const milestones = await prisma.projectMilestone.findMany({
      where: { projectId },
      include: {
        tasks: {
          select: { id: true, title: true, status: true, priority: true, assignee: { select: { id: true, name: true, profilePic: true } } }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    return res.status(200).json(milestones);
  } catch (error) {
    console.error('[getProjectMilestones Error]:', error);
    return res.status(500).json({ message: 'Failed to retrieve project milestones.', error: error.message });
  }
};

// 2. Create Milestone
const createMilestone = async (req, res) => {
  try {
    const { projectId, title, description, dueDate, status } = req.body;

    if (!projectId || !title || !dueDate) {
      return res.status(400).json({ message: 'Project ID, Title, and Due Date are required.' });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.isDeleted) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const milestone = await prisma.projectMilestone.create({
      data: {
        projectId,
        title,
        description: description || null,
        dueDate: new Date(dueDate),
        status: status || 'PENDING'
      },
      include: { tasks: true }
    });

    // Record Audit History
    await prisma.projectHistory.create({
      data: {
        projectId,
        changedById: req.user.id,
        action: 'MILESTONE_CREATED',
        detail: `Created milestone "${title}" due on ${new Date(dueDate).toLocaleDateString()}`
      }
    });

    await logActivity({
      userId: req.user.id,
      action: 'MILESTONE_CREATE',
      details: `Created milestone "${title}" for project code ${project.projectCode}`
    });

    return res.status(201).json(milestone);
  } catch (error) {
    console.error('[createMilestone Error]:', error);
    return res.status(500).json({ message: 'Failed to create milestone.', error: error.message });
  }
};

// 3. Update Milestone
const updateMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, status } = req.body;

    const existing = await prisma.projectMilestone.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Milestone not found.' });
    }

    const updated = await prisma.projectMilestone.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        description: description !== undefined ? description : existing.description,
        dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
        status: status || existing.status
      },
      include: { tasks: true }
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('[updateMilestone Error]:', error);
    return res.status(500).json({ message: 'Failed to update milestone.', error: error.message });
  }
};

// 4. Delete Milestone
const deleteMilestone = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.projectMilestone.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Milestone not found.' });
    }

    await prisma.projectMilestone.delete({ where: { id } });

    return res.status(200).json({ message: 'Milestone deleted successfully.' });
  } catch (error) {
    console.error('[deleteMilestone Error]:', error);
    return res.status(500).json({ message: 'Failed to delete milestone.', error: error.message });
  }
};

module.exports = {
  getProjectMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone
};
