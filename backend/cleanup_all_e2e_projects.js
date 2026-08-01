const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupAllE2EProjects() {
  console.log('====================================================');
  console.log('PERMANENT CLEANUP: REMOVING ALL E2E TEST PROJECTS (PRJ-1001 to PRJ-1007)');
  console.log('====================================================');

  try {
    // 1. Identify all E2E test projects (PRJ-1001 through PRJ-1007 or names matching E2E Testing Platform / Enterprise Core Platform)
    const testProjects = await prisma.project.findMany({
      where: {
        OR: [
          { projectCode: { in: ['PRJ-1001', 'PRJ-1002', 'PRJ-1003', 'PRJ-1004', 'PRJ-1005', 'PRJ-1006', 'PRJ-1007'] } },
          { name: { contains: 'E2E Testing Platform' } },
          { name: { contains: 'Enterprise Core Platform' } }
        ]
      },
      select: { id: true, projectCode: true, name: true }
    });

    const testProjectIds = testProjects.map(p => p.id);

    console.log(`Found ${testProjects.length} E2E Test Projects to Delete:`);
    testProjects.forEach(p => console.log(`   - [${p.projectCode}] "${p.name}" (ID: ${p.id})`));

    if (testProjectIds.length === 0) {
      console.log('No test projects found to clean up.');
      return;
    }

    // 2. Find associated Chat Rooms
    const testChatRooms = await prisma.chatRoom.findMany({
      where: {
        OR: [
          { projectId: { in: testProjectIds } },
          { name: { contains: 'PRJ-' } }
        ]
      },
      select: { id: true, name: true }
    });
    const testRoomIds = testChatRooms.map(r => r.id);

    console.log(`Found ${testChatRooms.length} associated Project Chat Rooms to Delete:`);
    testChatRooms.forEach(r => console.log(`   - Chat Room: "${r.name}" (ID: ${r.id})`));

    // 3. Find associated Tasks
    const testTasks = await prisma.task.findMany({
      where: { projectId: { in: testProjectIds } },
      select: { id: true }
    });
    const testTaskIds = testTasks.map(t => t.id);

    // 4. Cascade Delete in Strict Dependency Order
    console.log('\nExecuting Permanent Cascade Deletion...');

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

    // C. Chat Messages & Message Reads
    const testMessages = await prisma.chatMessage.findMany({
      where: { roomId: { in: testRoomIds } },
      select: { id: true }
    });
    const testMessageIds = testMessages.map(m => m.id);

    const deletedReads = await prisma.messageRead.deleteMany({
      where: { messageId: { in: testMessageIds } }
    });
    console.log(`✓ Deleted ${deletedReads.count} Message Read Receipts`);

    const deletedMessages = await prisma.chatMessage.deleteMany({
      where: { roomId: { in: testRoomIds } }
    });
    console.log(`✓ Deleted ${deletedMessages.count} Chat Messages`);

    // D. Chat Room Members & Chat Rooms
    const deletedChatMembers = await prisma.chatRoomMember.deleteMany({
      where: { roomId: { in: testRoomIds } }
    });
    console.log(`✓ Deleted ${deletedChatMembers.count} Chat Room Memberships`);

    const deletedRooms = await prisma.chatRoom.deleteMany({
      where: { id: { in: testRoomIds } }
    });
    console.log(`✓ Deleted ${deletedRooms.count} Project Chat Rooms`);

    // E. Tasks & Milestones
    const deletedTasks = await prisma.task.deleteMany({
      where: { id: { in: testTaskIds } }
    });
    console.log(`✓ Deleted ${deletedTasks.count} Tasks`);

    const deletedMilestones = await prisma.projectMilestone.deleteMany({
      where: { projectId: { in: testProjectIds } }
    });
    console.log(`✓ Deleted ${deletedMilestones.count} Milestones`);

    // F. Project Members & Project History
    const deletedMembers = await prisma.projectMember.deleteMany({
      where: { projectId: { in: testProjectIds } }
    });
    console.log(`✓ Deleted ${deletedMembers.count} Project Memberships`);

    const deletedHistory = await prisma.projectHistory.deleteMany({
      where: { projectId: { in: testProjectIds } }
    });
    console.log(`✓ Deleted ${deletedHistory.count} Project History Entries`);

    // G. Projects
    const deletedProjects = await prisma.project.deleteMany({
      where: { id: { in: testProjectIds } }
    });
    console.log(`✓ Deleted ${deletedProjects.count} Projects`);

    // 5. Verification of Remaining Projects and Chat Rooms in Database
    const remainingProjects = await prisma.project.findMany({ select: { id: true, projectCode: true, name: true } });
    const remainingChatRooms = await prisma.chatRoom.findMany({
      select: { id: true, name: true, type: true }
    });

    console.log('\n====================================================');
    console.log('FINAL DATABASE VERIFICATION AFTER CLEANUP');
    console.log('====================================================');
    console.log(`Remaining Projects in DB: ${remainingProjects.length}`);
    remainingProjects.forEach(p => console.log(`   - [${p.projectCode}] ${p.name}`));

    console.log(`Remaining Chat Rooms in DB: ${remainingChatRooms.length}`);
    remainingChatRooms.forEach(r => console.log(`   - [${r.type}] ${r.name}`));
    console.log('====================================================');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupAllE2EProjects();
