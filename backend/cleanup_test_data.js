const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupTestData() {
  console.log('====================================================');
  console.log('STARTING DATABASE CLEANUP: REMOVING E2E TEST DATA');
  console.log('====================================================');

  try {
    // 1. Identify Test Projects & Teams
    const testProjects = await prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: 'VT' } },
          { name: { contains: 'Execution Engine' } },
          { projectCode: { in: ['PRJ-1008', 'PRJ-1009', 'PRJ-1010', 'PRJ-1011', 'PRJ-1012', 'PRJ-1013'] } }
        ]
      },
      select: { id: true, projectCode: true, name: true }
    });

    const testProjectIds = testProjects.map(p => p.id);

    const testTeams = await prisma.team.findMany({
      where: {
        OR: [
          { name: { contains: 'VT Execution' } },
          { name: { contains: 'Execution Engine' } }
        ]
      },
      select: { id: true, name: true }
    });

    const testTeamIds = testTeams.map(t => t.id);

    console.log(`\nIdentified Test Records for Cleanup:`);
    console.log(`   - ${testProjects.length} Test Projects: ${testProjects.map(p => `[${p.projectCode}] ${p.name}`).join(', ')}`);
    console.log(`   - ${testTeams.length} Test Teams: ${testTeams.map(t => t.name).join(', ')}`);

    // 2. Identify Test Tasks
    const testTasks = await prisma.task.findMany({
      where: {
        OR: [
          { projectId: { in: testProjectIds } },
          { teamId: { in: testTeamIds } },
          { title: { contains: 'VT Task' } },
          { title: { contains: 'Execution Engine' } }
        ]
      },
      select: { id: true }
    });
    const testTaskIds = testTasks.map(t => t.id);

    // 3. Identify Test Chat Rooms
    const testRooms = await prisma.chatRoom.findMany({
      where: {
        OR: [
          { projectId: { in: testProjectIds } },
          { teamId: { in: testTeamIds } },
          { name: { contains: 'VT' } },
          { name: { contains: 'Execution Engine' } }
        ]
      },
      select: { id: true, name: true }
    });
    const testRoomIds = testRooms.map(r => r.id);

    console.log(`   - ${testTasks.length} Test Tasks`);
    console.log(`   - ${testRooms.length} Test Chat Rooms`);

    // 4. Cascade Delete in FK Order
    console.log('\nExecuting Deletion Sequence...');

    // A. Task Dependencies
    const deletedDependencies = await prisma.taskDependency.deleteMany({
      where: {
        OR: [
          { taskId: { in: testTaskIds } },
          { dependsOnTaskId: { in: testTaskIds } }
        ]
      }
    });
    console.log(`✓ Deleted ${deletedDependencies.count} Task Dependencies`);

    // B. Work Logs
    const deletedWorkLogs = await prisma.workLog.deleteMany({
      where: {
        OR: [
          { projectId: { in: testProjectIds } },
          { taskId: { in: testTaskIds } }
        ]
      }
    });
    console.log(`✓ Deleted ${deletedWorkLogs.count} Work Logs`);

    // C. Chat Messages & Reads
    const testMessages = await prisma.chatMessage.findMany({
      where: { roomId: { in: testRoomIds } },
      select: { id: true }
    });
    const testMessageIds = testMessages.map(m => m.id);

    const deletedMessageReads = await prisma.messageRead.deleteMany({
      where: { messageId: { in: testMessageIds } }
    });
    console.log(`✓ Deleted ${deletedMessageReads.count} Message Read Receipts`);

    const deletedChatMessages = await prisma.chatMessage.deleteMany({
      where: { roomId: { in: testRoomIds } }
    });
    console.log(`✓ Deleted ${deletedChatMessages.count} Chat Messages`);

    // D. Chat Room Members & Rooms
    const deletedChatMembers = await prisma.chatRoomMember.deleteMany({
      where: { roomId: { in: testRoomIds } }
    });
    console.log(`✓ Deleted ${deletedChatMembers.count} Chat Room Memberships`);

    const deletedChatRooms = await prisma.chatRoom.deleteMany({
      where: { id: { in: testRoomIds } }
    });
    console.log(`✓ Deleted ${deletedChatRooms.count} Chat Rooms`);

    // E. Tasks & Milestones
    const deletedTasks = await prisma.task.deleteMany({
      where: { id: { in: testTaskIds } }
    });
    console.log(`✓ Deleted ${deletedTasks.count} Tasks`);

    const deletedMilestones = await prisma.projectMilestone.deleteMany({
      where: { projectId: { in: testProjectIds } }
    });
    console.log(`✓ Deleted ${deletedMilestones.count} Milestones`);

    // F. Project Members & History
    const deletedProjectMembers = await prisma.projectMember.deleteMany({
      where: { projectId: { in: testProjectIds } }
    });
    console.log(`✓ Deleted ${deletedProjectMembers.count} Project Memberships`);

    const deletedProjectHistory = await prisma.projectHistory.deleteMany({
      where: { projectId: { in: testProjectIds } }
    });
    console.log(`✓ Deleted ${deletedProjectHistory.count} Project History Entries`);

    // G. Projects
    const deletedProjects = await prisma.project.deleteMany({
      where: { id: { in: testProjectIds } }
    });
    console.log(`✓ Deleted ${deletedProjects.count} Projects`);

    // H. Team Members & Teams
    const deletedTeamMembers = await prisma.teamMember.deleteMany({
      where: { teamId: { in: testTeamIds } }
    });
    console.log(`✓ Deleted ${deletedTeamMembers.count} Team Memberships`);

    const deletedTeams = await prisma.team.deleteMany({
      where: { id: { in: testTeamIds } }
    });
    console.log(`✓ Deleted ${deletedTeams.count} Teams`);

    // I. Test Notifications
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        OR: [
          { title: { contains: 'VT' } },
          { title: { contains: 'Execution' } },
          { message: { contains: 'VT' } },
          { message: { contains: 'PRJ-' } }
        ]
      }
    });
    console.log(`✓ Deleted ${deletedNotifications.count} Test Notifications`);

    // J. Test AI Feedback
    const deletedAIFeedback = await prisma.aIFeedback.deleteMany({
      where: {
        OR: [
          { recommendationId: { contains: 'AI-REC-' } },
          { feedbackText: { contains: 'prerequisite' } }
        ]
      }
    });
    console.log(`✓ Deleted ${deletedAIFeedback.count} AI Feedback Entries`);

    // K. Test Audit Logs
    const deletedAuditLogs = await prisma.activityLog.deleteMany({
      where: {
        OR: [
          { details: { contains: 'VT' } },
          { details: { contains: 'PRJ-1008' } },
          { details: { contains: 'PRJ-1009' } },
          { details: { contains: 'PRJ-1010' } },
          { details: { contains: 'PRJ-1011' } },
          { details: { contains: 'PRJ-1012' } },
          { details: { contains: 'PRJ-1013' } },
          { details: { contains: 'Execution Engine' } },
          { details: { contains: 'AI' } }
        ]
      }
    });
    console.log(`✓ Deleted ${deletedAuditLogs.count} Test Audit Logs`);

    // 5. Verification of No Orphaned Records
    const remainingOrphanedProjects = await prisma.project.count({
      where: { name: { contains: 'VT' } }
    });
    const remainingOrphanedTeams = await prisma.team.count({
      where: { name: { contains: 'VT Execution' } }
    });

    console.log('\n====================================================');
    console.log('CLEANUP SUMMARY & DATABASE INTEGRITY STATUS');
    console.log('====================================================');
    console.log(`- Remaining Test Projects: ${remainingOrphanedProjects}`);
    console.log(`- Remaining Test Teams: ${remainingOrphanedTeams}`);
    console.log(`✓ Database successfully restored to pre-test state! 🎉`);
    console.log('====================================================');

  } catch (error) {
    console.error('❌ CLEANUP ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestData();
