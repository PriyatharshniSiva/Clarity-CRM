const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateRole() {
  const updated = await prisma.user.update({
    where: {
      email: 'praveen.natarajan.in@gmail.com'
    },
    data: {
      role: 'TEAM_LEADER'
    }
  });

  console.log(`Updated role for ${updated.email} to ${updated.role}`);
  await prisma.$disconnect();
}

updateRole().catch(e => {
  console.error('Error updating role:', e);
  process.exit(1);
});
