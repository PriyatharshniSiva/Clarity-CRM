const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function update() {
  await prisma.systemSettings.upsert({
    where: { id: 'GLOBAL' },
    update: { companyName: 'Clarity', officeLocationName: 'Clarity Headquarters' },
    create: { id: 'GLOBAL', companyName: 'Clarity', officeLocationName: 'Clarity Headquarters' }
  });
  
  await prisma.payrollSettings.upsert({
    where: { id: 'GLOBAL' },
    update: { companyName: 'Clarity' },
    create: { id: 'GLOBAL', companyName: 'Clarity' }
  });
  console.log('Successfully updated database settings to Clarity');
}

update()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
