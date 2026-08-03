const prisma = require('./src/utils/db');
const bcrypt = require('bcrypt');

async function debugUserLogin() {
  const emailInput = 'antorajan501@gmail.com';
  const passInput = '10062004';

  console.log(`=== DEBUGGING LOGIN FOR ${emailInput} ===`);

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: emailInput, mode: 'insensitive' } },
        { employeeId: { equals: emailInput, mode: 'insensitive' } },
        { name: { equals: emailInput, mode: 'insensitive' } }
      ]
    }
  });

  if (!user) {
    console.log(`❌ User matching "${emailInput}" NOT FOUND in database!`);
    const allUsers = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, status: true, dob: true } });
    console.log(`\nExisting users in DB (${allUsers.length}):`);
    console.table(allUsers);
    return;
  }

  console.log(`Found User:`, {
    id: user.id,
    name: user.name,
    email: user.email,
    employeeId: user.employeeId,
    role: user.role,
    status: user.status,
    dob: user.dob
  });

  const isMatch = await bcrypt.compare(passInput, user.password);
  console.log(`Bcrypt Password Match for "${passInput}":`, isMatch);

  if (user.dob) {
    const dobFormatted = user.dob.toISOString().split('T')[0];
    const parts = dobFormatted.split('-');
    const dobTemp = `${parts[2]}${parts[1]}${parts[0]}`;
    console.log(`DOB Formatted: ${dobFormatted} -> Calculated Temp Pass (DDMMYYYY): ${dobTemp}`);
    console.log(`Temp Pass Match:`, passInput === dobTemp);
  } else {
    console.log(`User has no DOB recorded.`);
  }

  await prisma.$disconnect();
}

debugUserLogin().catch(err => {
  console.error('Debug error:', err);
  process.exit(1);
});
