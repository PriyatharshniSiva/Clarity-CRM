const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigateChats() {
  console.log('====================================================');
  console.log('INVESTIGATION: CHAT ROOMS & PROJECTS IN POSTGRESQL');
  console.log('====================================================');

  try {
    const projects = await prisma.project.findMany({
      select: { id: true, projectCode: true, name: true, status: true, createdAt: true }
    });

    const chatRooms = await prisma.chatRoom.findMany({
      include: {
        project: { select: { id: true, projectCode: true, name: true } },
        team: { select: { id: true, name: true } },
        _count: { select: { members: true, messages: true } }
      }
    });

    console.log(`\n1. Projects in Database (${projects.length} total):`);
    projects.forEach(p => {
      console.log(`   - [${p.projectCode}] "${p.name}" (Status: ${p.status}, Created: ${p.createdAt.toISOString()})`);
    });

    console.log(`\n2. Chat Rooms in Database (${chatRooms.length} total):`);
    chatRooms.forEach(r => {
      console.log(`   - Room ID: ${r.id} | Type: ${r.type} | Name: "${r.name}" | Project: ${r.project ? `[${r.project.projectCode}] ${r.project.name}` : 'NONE'} | Members: ${r._count.members} | Messages: ${r._count.messages}`);
    });

  } catch (error) {
    console.error('Investigation error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateChats();
