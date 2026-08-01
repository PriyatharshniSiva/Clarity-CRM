const prisma = require('../utils/db');

/**
 * Ensures the default Company Chat Room ("Innoviety Community") exists
 * and all active CRM users are added as members.
 */
const ensureCompanyChatRoom = async () => {
  try {
    let companyRoom = await prisma.chatRoom.findFirst({
      where: {
        type: 'COMPANY',
        isDefault: true,
        isArchived: false
      }
    });

    const activeUsers = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true }
    });
    const activeUserIds = activeUsers.map(u => u.id);

    if (!companyRoom) {
      companyRoom = await prisma.chatRoom.create({
        data: {
          name: 'Innoviety Community',
          type: 'COMPANY',
          isDefault: true,
          isArchived: false,
          lastActivityAt: new Date(),
          members: {
            create: activeUserIds.map(userId => ({ userId }))
          }
        }
      });
      console.log(`[ChatService] Created default Company Group "Innoviety Community" with ${activeUserIds.length} members.`);
    } else {
      const existingMembers = await prisma.chatRoomMember.findMany({
        where: { roomId: companyRoom.id },
        select: { userId: true }
      });
      const existingUserIds = new Set(existingMembers.map(m => m.userId));

      const missingUserIds = activeUserIds.filter(id => !existingUserIds.has(id));
      if (missingUserIds.length > 0) {
        await prisma.chatRoomMember.createMany({
          data: missingUserIds.map(userId => ({ roomId: companyRoom.id, userId })),
          skipDuplicates: true
        });
        console.log(`[ChatService] Synced ${missingUserIds.length} active users into Company Group.`);
      }

      // Automatically remove any members who are no longer active
      const activeUserIdSet = new Set(activeUserIds);
      const inactiveUserIds = Array.from(existingUserIds).filter(id => !activeUserIdSet.has(id));
      if (inactiveUserIds.length > 0) {
        await prisma.chatRoomMember.deleteMany({
          where: { roomId: companyRoom.id, userId: { in: inactiveUserIds } }
        });
        console.log(`[ChatService] Removed ${inactiveUserIds.length} inactive users from Company Group.`);
      }
    }

    return companyRoom;
  } catch (error) {
    console.error('[ChatService] Error ensuring company chat room:', error);
  }
};

/**
 * Adds a user to the default Company Chat Room
 */
const addUserToCompanyChat = async (userId) => {
  try {
    const companyRoom = await ensureCompanyChatRoom();
    if (!companyRoom) return;

    await prisma.chatRoomMember.upsert({
      where: { roomId_userId: { roomId: companyRoom.id, userId } },
      update: {},
      create: { roomId: companyRoom.id, userId }
    });
  } catch (error) {
    console.error(`[ChatService] Failed to add user ${userId} to company chat:`, error);
  }
};

/**
 * Removes a user from the default Company Chat Room (e.g. on deactivation/delete)
 */
const removeUserFromCompanyChat = async (userId) => {
  try {
    const companyRoom = await prisma.chatRoom.findFirst({
      where: { type: 'COMPANY', isDefault: true, isArchived: false }
    });
    if (!companyRoom) return;

    await prisma.chatRoomMember.deleteMany({
      where: { roomId: companyRoom.id, userId }
    });
  } catch (error) {
    console.error(`[ChatService] Failed to remove user ${userId} from company chat:`, error);
  }
};

module.exports = {
  ensureCompanyChatRoom,
  addUserToCompanyChat,
  removeUserFromCompanyChat
};
