const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get all users
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, name: true, status: true },
    take: 20
  });
  console.log('=== USERS IN DATABASE ===');
  console.log(JSON.stringify(users, null, 2));

  const counts = {
    intern: await prisma.user.count({ where: { role: 'INTERN' } }),
    employee: await prisma.user.count({ where: { role: 'EMPLOYEE' } }),
    admin: await prisma.user.count({ where: { role: 'ADMIN' } }),
    teamLeader: await prisma.user.count({ where: { role: 'TEAM_LEADER' } }),
  };
  console.log('\n=== USER COUNTS ===');
  console.log(JSON.stringify(counts, null, 2));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
