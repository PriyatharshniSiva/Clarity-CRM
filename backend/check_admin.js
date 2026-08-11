const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@enterprise-crm.com';
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });

  console.log('Current Admin User:', admin ? admin.email : 'Not found');

  // Set password hash to Admin123!
  const newHash = await bcrypt.hash('Admin123!', 10);

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        employeeId: 'AD-0001',
        name: 'System Admin',
        email: adminEmail,
        password: newHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        department: 'Management'
      }
    });
    console.log('Created Admin User:', admin.email);
  } else {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { password: newHash, status: 'ACTIVE' }
    });
    console.log('Updated Admin User password for:', admin.email);
  }

  // Also check if Admin@123 can be set or tested
  console.log('Admin password is set to: Admin123!');
  console.log('Admin@123 test match:', await bcrypt.compare('Admin@123', admin.password));
  console.log('Admin123! test match:', await bcrypt.compare('Admin123!', newHash));
}

main().catch(console.error).finally(() => prisma.$disconnect());
