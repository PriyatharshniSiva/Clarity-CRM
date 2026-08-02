const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function setup() {
  console.log('=== SETTING UP LEAVE E2E TEST DATA ===');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Ensure Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@enterprise-crm.com' },
    update: { password: passwordHash, role: 'SUPER_ADMIN' },
    create: {
      employeeId: 'SUP-001',
      name: 'Super Admin',
      email: 'superadmin@enterprise-crm.com',
      password: passwordHash,
      role: 'SUPER_ADMIN'
    }
  });
  console.log('Super Admin ready:', superAdmin.email);

  // 2. Ensure Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@enterprise-crm.com' },
    update: { password: passwordHash, role: 'ADMIN' },
    create: {
      employeeId: 'AD-0001',
      name: 'System Admin',
      email: 'admin@enterprise-crm.com',
      password: passwordHash,
      role: 'ADMIN'
    }
  });
  console.log('Admin ready:', admin.email);

  // 3. Ensure Team Leader
  const tl = await prisma.user.upsert({
    where: { email: 'praveen.natarajan.in@gmail.com' },
    update: { password: passwordHash, role: 'TEAM_LEADER' },
    create: {
      employeeId: 'TL-1001',
      name: 'Praveen N',
      email: 'praveen.natarajan.in@gmail.com',
      password: passwordHash,
      role: 'TEAM_LEADER'
    }
  });
  console.log('Team Leader ready:', tl.email);

  // 4. Ensure Employee
  const employee = await prisma.user.upsert({
    where: { email: 'prasathragul75@gmail.com' },
    update: { password: passwordHash, role: 'EMPLOYEE' },
    create: {
      employeeId: 'EM-1004',
      name: 'Raghul Prasath',
      email: 'prasathragul75@gmail.com',
      password: passwordHash,
      role: 'EMPLOYEE'
    }
  });
  console.log('Employee ready:', employee.email);

  // 5. Ensure Intern
  const intern = await prisma.user.upsert({
    where: { email: 'somusuraj72@gmail.com' },
    update: { password: passwordHash, role: 'INTERN' },
    create: {
      employeeId: 'IN-1003',
      name: 'Somusundaram',
      email: 'somusuraj72@gmail.com',
      password: passwordHash,
      role: 'INTERN'
    }
  });
  console.log('Intern ready:', intern.email);

  // 6. Ensure Team & Team Memberships
  let team = await prisma.team.findFirst({
    where: { leaderId: tl.id }
  });

  if (!team) {
    team = await prisma.team.create({
      data: {
        name: 'First bench Team',
        description: 'E2E Testing Core Team',
        leaderId: tl.id
      }
    });
  }
  console.log(`Team "${team.name}" led by TL ${tl.name} (${tl.id})`);

  // Add Employee to Team
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: employee.id } },
    update: {},
    create: { teamId: team.id, userId: employee.id }
  });

  // Add Intern to Team
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: intern.id } },
    update: {},
    create: { teamId: team.id, userId: intern.id }
  });

  console.log(`Added Employee (${employee.name}) and Intern (${intern.name}) to Team "${team.name}"`);
  console.log('=== E2E TEST DATA SETUP COMPLETED ===');
}

setup().catch(console.error).finally(() => prisma.$disconnect());
