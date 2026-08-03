const prisma = require('./src/utils/db');

async function investigateRootCause() {
  console.log('================ ROOT CAUSE INVESTIGATION ================');

  // 1. Check all projects in Database
  const allProjects = await prisma.project.findMany({
    include: {
      leader: { select: { id: true, name: true, role: true } },
      creator: { select: { id: true, name: true, role: true } },
      team: { select: { id: true, name: true } },
      members: { include: { user: { select: { id: true, name: true, role: true } } } },
      tasks: { select: { id: true, title: true, status: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`\nTotal Projects in DB: ${allProjects.length}\n`);

  allProjects.forEach((p, idx) => {
    console.log(`--- Project #${idx + 1} ---`);
    console.log(`  ID                 : ${p.id}`);
    console.log(`  Project Code       : ${p.projectCode}`);
    console.log(`  Name               : ${p.name}`);
    console.log(`  Status             : "${p.status}"`);
    console.log(`  Type               : ${p.type}`);
    console.log(`  Priority           : ${p.priority}`);
    console.log(`  isDeleted          : ${p.isDeleted}`);
    console.log(`  Creator            : ${p.creator?.name} (${p.creatorId})`);
    console.log(`  Leader             : ${p.leader ? p.leader.name : 'NULL'} (${p.leaderId})`);
    console.log(`  Team               : ${p.team ? p.team.name : 'NULL'} (${p.teamId})`);
    console.log(`  Members Count      : ${p.members.length}`);
    console.log(`  Members            : ${p.members.map(m => m.user?.name).join(', ')}`);
    console.log(`  Tasks Count        : ${p.tasks.length}`);
    console.log(`  Created At         : ${p.createdAt.toISOString()}`);
    console.log('');
  });

  await prisma.$disconnect();
}

investigateRootCause().catch(err => {
  console.error('Investigation Error:', err);
  process.exit(1);
});
