const fs = require('fs');
const path = require('path');
const prisma = require('./src/utils/db');

async function checkPic() {
  const user = await prisma.user.findFirst({ where: { email: 'antorajan501@gmail.com' } });
  console.log('User Profile Pic in DB:', user?.profilePic);

  if (user?.profilePic) {
    const fullPath = path.join(__dirname, user.profilePic);
    console.log('Checking file path:', fullPath);
    console.log('File exists:', fs.existsSync(fullPath));
  }

  const uploadsDir = path.join(__dirname, 'uploads', 'profile-pics');
  if (fs.existsSync(uploadsDir)) {
    console.log('Files in uploads/profile-pics:');
    console.log(fs.readdirSync(uploadsDir));
  } else {
    console.log('uploads/profile-pics directory does not exist!');
  }

  await prisma.$disconnect();
}

checkPic();
