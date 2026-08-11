const prisma = require('./src/utils/db');
const bcrypt = require('bcrypt');

async function fixAllAdmins() {
  const hashed = await bcrypt.hash('10062004', 10);
  await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: { password: hashed }
  });
  console.log('Reset all ADMIN passwords to "10062004"');
  await prisma.$disconnect();
}

fixAllAdmins();
