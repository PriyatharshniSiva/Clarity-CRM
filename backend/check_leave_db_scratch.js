const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- USERS BY ROLE ---');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      employeeId: true,
      name: true,
      email: true,
      role: true,
      casualLeaveQuota: true,
      sickLeaveQuota: true,
      emergencyLeaveQuota: true
    }
  });
  console.table(users);

  console.log('--- TEAMS ---');
  const teams = await prisma.team.findMany({
    include: {
      leader: { select: { id: true, name: true, role: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, role: true } }
        }
      }
    }
  });
  console.log(JSON.stringify(teams, null, 2));

  console.log('--- LEAVE REQUESTS ---');
  const leaves = await prisma.leaveRequest.findMany({
    include: {
      user: { select: { id: true, name: true, role: true } }
    }
  });
  console.log(JSON.stringify(leaves, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
