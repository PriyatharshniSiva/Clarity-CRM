const prisma = require('./src/utils/db');
const bcrypt = require('bcrypt');

async function resetAllPasswords() {
  const hashAdmin123 = await bcrypt.hash('Admin123!', 10);
  
  await prisma.user.updateMany({
    data: {
      password: hashAdmin123
    }
  });

  console.log('Successfully set password for ALL users to "Admin123!"');
  await prisma.$disconnect();
}

resetAllPasswords().catch(console.error);
