const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const usersToSeed = [
    {
      email: 'superadmin@enterprise-crm.com',
      passwordPlain: 'SuperAdmin123!',
      role: 'SUPER_ADMIN',
      name: 'Super Admin',
      employeeId: 'SA-001',
    },
    {
      email: 'admin@enterprise-crm.com',
      passwordPlain: 'Admin123!',
      role: 'ADMIN',
      name: 'System Admin',
      employeeId: 'AD-001',
    },
    {
      email: 'paulrenine9487@gmail.com',
      passwordPlain: '04082002',
      role: 'TEAM_LEADER',
      name: 'Paul Renine',
      employeeId: 'TL-001',
    },
    {
      email: 'antorajan501@gmail.com',
      passwordPlain: '10062004',
      role: 'EMPLOYEE',
      name: 'Anto Rajan',
      employeeId: 'EM-001',
    },
    {
      email: 'jeffersonsamuel003@gmail.com',
      passwordPlain: 'Jeff$1407',
      role: 'INTERN',
      name: 'Jefferson Samuel',
      employeeId: 'IN-001',
    }
  ];

  console.log('Seeding test users...');

  for (const u of usersToSeed) {
    const hashedPassword = await bcrypt.hash(u.passwordPlain, 10);
    
    // Upsert user based on email
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        password: hashedPassword,
        role: u.role,
        name: u.name,
      },
      create: {
        email: u.email,
        password: hashedPassword,
        role: u.role,
        name: u.name,
        employeeId: u.employeeId,
      },
    });
    console.log(`Upserted: ${user.email} as ${user.role}`);
  }
  
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
