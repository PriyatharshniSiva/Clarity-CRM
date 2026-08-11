const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const p = new PrismaClient();

async function resetPassword() {
  // Reset Yeshwanth Y's password to their DOB-based default: 15042004
  const newPassword = '15042004';
  const hash = await bcrypt.hash(newPassword, 10);

  const updated = await p.user.update({
    where: { email: 'yeshwanthy1504@gmail.com' },
    data: { password: hash }
  });

  console.log(`Password reset for ${updated.name} (${updated.employeeId})`);
  console.log(`New password: ${newPassword}`);
  console.log(`Login with: email = yeshwanthy1504@gmail.com, password = ${newPassword}`);
}

resetPassword().catch(console.error).finally(() => p.$disconnect());
