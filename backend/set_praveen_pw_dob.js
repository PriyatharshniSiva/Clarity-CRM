const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function setPasswordAndDob() {
  const email = 'praveen.natarajan.in@gmail.com';
  const rawPassword = '26092003';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);
  const dobDate = new Date('2003-09-26T00:00:00.000Z');

  const updated = await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      dob: dobDate,
      role: 'TEAM_LEADER'
    }
  });

  console.log(`Successfully updated ${updated.email}: Password set, DOB set to ${updated.dob.toISOString().split('T')[0]}, Role is ${updated.role}`);
  await prisma.$disconnect();
}

setPasswordAndDob().catch(e => {
  console.error('Error setting password and DOB:', e);
  process.exit(1);
});
