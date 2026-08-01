const prisma = require('../utils/db');

/**
 * Synchronizes the 1:1 Project Chat Room based strictly on Project Status and Member Assignments.
 * Status Matrix:
 * - DRAFT / SCHEDULED: No chat room created. If existing, set status to ARCHIVED.
 * - ACTIVE / ON_HOLD: 1:1 Chat room ACTIVE. Messaging permitted. Incremental member sync.
 * - COMPLETED / CANCELLED / ARCHIVED / Soft-deleted: Chat room status ARCHIVED (read-only). Messages preserved.
 *
 * @param {string} projectId
 */
const syncProjectLifecycleChatRoom = async (projectId) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        leader: { select: { id: true, name: true, role: true, status: true, profilePic: true } },
        creator: { select: { id: true, name: true, role: true, status: true, profilePic: true } },
        team: {
          include: {
            leader: { select: { id: true, name: true, role: true, status: true } },
            members: {
              include: { user: { select: { id: true, name: true, role: true, status: true } } }
            }
          }
        },
        members: {
          include: {
            user: { select: { id: true, name: true, role: true, status: true } }
          }
        }
      }
    });

    if (!project) return null;

    // Standardized Chat Room Name: [PRJ-XXXX] Project Name
    const formattedName = `[${project.projectCode}] ${project.name}`;

    // Find existing 1:1 chat room for this project
    let chatRoom = await prisma.chatRoom.findUnique({
      where: { projectId: project.id }
    });

    const isProjectActiveOrHold = (project.status === 'ACTIVE' || project.status === 'ON_HOLD') && !project.isDeleted;

    if (!isProjectActiveOrHold) {
      // If project is DRAFT, SCHEDULED, COMPLETED, CANCELLED, ARCHIVED, or deleted
      if (chatRoom) {
        chatRoom = await prisma.chatRoom.update({
          where: { id: chatRoom.id },
          data: {
            name: formattedName,
            status: 'ARCHIVED',
            isArchived: true
          }
        });
        console.log(`[ProjectChatService] Archived chat room for project ${project.projectCode} (Status: ${project.status})`);
      }
      return chatRoom;
    }

    // Project is ACTIVE or ON_HOLD -> Ensure Chat Room exists and is ACTIVE
    // Collect all active assigned user IDs (Creator, Project Leader, Direct Project Members)
    const targetUserIds = new Set();

    if (project.creatorId) targetUserIds.add(project.creatorId);
    if (project.leaderId && project.leader?.status === 'ACTIVE') targetUserIds.add(project.leaderId);

    // Direct Project Members (Checked during Project Creation/Editing)
    if (project.members) {
      project.members.forEach(m => {
        if (m.user && m.user.status === 'ACTIVE') {
          targetUserIds.add(m.userId);
        }
      });
    }

    if (!chatRoom) {
      // Create new 1:1 Chat Room
      chatRoom = await prisma.chatRoom.create({
        data: {
          name: formattedName,
          type: 'PROJECT',
          projectId: project.id,
          teamId: project.teamId || null,
          status: 'ACTIVE',
          isArchived: false,
          lastActivityAt: project.createdAt || new Date(),
          members: {
            create: Array.from(targetUserIds).map(userId => ({ userId }))
          }
        }
      });
      console.log(`[ProjectChatService] Created 1:1 active project chat room "${formattedName}"`);
    } else {
      // Update existing 1:1 Chat Room status & name
      chatRoom = await prisma.chatRoom.update({
        where: { id: chatRoom.id },
        data: {
          name: formattedName,
          status: 'ACTIVE',
          isArchived: false,
          teamId: project.teamId || null
        }
      });

      // Incremental Sync of Members
      const existingMembers = await prisma.chatRoomMember.findMany({
        where: { roomId: chatRoom.id },
        select: { userId: true }
      });
      const existingUserIds = new Set(existingMembers.map(m => m.userId));

      const toAdd = Array.from(targetUserIds).filter(id => !existingUserIds.has(id));
      const toRemove = Array.from(existingUserIds).filter(id => !targetUserIds.has(id));

      if (toAdd.length > 0) {
        await prisma.chatRoomMember.createMany({
          data: toAdd.map(userId => ({ roomId: chatRoom.id, userId })),
          skipDuplicates: true
        });
      }

      if (toRemove.length > 0) {
        await prisma.chatRoomMember.deleteMany({
          where: {
            roomId: chatRoom.id,
            userId: { in: toRemove }
          }
        });
      }

      console.log(`[ProjectChatService] Synced active project chat "${formattedName}" (+${toAdd.length}, -${toRemove.length})`);
    }

    return chatRoom;
  } catch (error) {
    console.error('[ProjectChatService] Error syncing project chat room:', error);
  }
};

/**
 * Legacy support for syncAllTeamProjectChats
 */
const syncAllTeamProjectChats = async (teamId) => {
  try {
    const projects = await prisma.project.findMany({
      where: { teamId, isDeleted: false },
      select: { id: true }
    });
    for (const p of projects) {
      await syncProjectLifecycleChatRoom(p.id);
    }
  } catch (error) {
    console.error(`[ProjectChatService] Error syncing all project chats for team ${teamId}:`, error);
  }
};

/**
 * Legacy support / Hard delete backup
 */
const deleteProjectChatRoom = async (targetId) => {
  try {
    const chatRoom = await prisma.chatRoom.findFirst({
      where: {
        OR: [
          { projectId: targetId },
          { id: targetId }
        ]
      }
    });
    if (chatRoom) {
      await prisma.chatRoom.update({
        where: { id: chatRoom.id },
        data: { status: 'ARCHIVED', isArchived: true }
      });
      console.log(`[ProjectChatService] Archived project chat room "${chatRoom.name}"`);
      return chatRoom.id;
    }
  } catch (error) {
    console.error(`[ProjectChatService] Error archiving project chat room for ${targetId}:`, error);
  }
};

module.exports = {
  syncProjectLifecycleChatRoom,
  syncAllTeamProjectChats,
  deleteProjectChatRoom
};
