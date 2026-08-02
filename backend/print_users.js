const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      employeeId: true,
      name: true,
      email: true,
      role: true,
      dob: true,
      casualLeaveQuota: true,
      sickLeaveQuota: true,
      emergencyLeaveQuota: true,
      teamMembers: {
        include: {
          team: {
            include: {
              leader: { select: { id: true, name: true, role: true } }
            }
          }
        }
      },
      ledTeams: {
        select: { id: true, name: true }
      }
    }
  });

  for (const u of users) {
    console.log(`Role: ${u.role} | Name: ${u.name} | Email: ${u.email} | EmpID: ${u.employeeId} | DOB: ${u.dob}`);
    if (u.ledTeams.length > 0) {
      console.log(`  Led Teams: ${u.ledTeams.map(t => t.name).join(', ')}`);
    }
    if (u.teamMembers.length > 0) {
      console.log(`  Member of Teams: ${u.teamMembers.map(tm => `${tm.team.name} (TL: ${tm.team.leader?.name || 'None'})`).join(', ')}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
