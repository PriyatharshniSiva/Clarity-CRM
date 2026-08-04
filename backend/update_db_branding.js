const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Inspecting and Updating Database Branding Records ---');

  // 1. SystemSettings
  try {
    const systemSettings = await prisma.systemSettings.findMany();
    console.log('Current SystemSettings count:', systemSettings.length);
    for (const sys of systemSettings) {
      console.log('SystemSettings record:', { id: sys.id, companyName: sys.companyName, officeLocationName: sys.officeLocationName, senderEmail: sys.senderEmail });
      
      let needsUpdate = false;
      let newName = sys.companyName;
      let newLocation = sys.officeLocationName;
      let newEmail = sys.senderEmail;

      if (sys.companyName && (sys.companyName.includes('MRF') || sys.companyName.includes('MCC'))) {
        newName = 'Innoveity';
        needsUpdate = true;
      }
      if (sys.officeLocationName && sys.officeLocationName.includes('MRF')) {
        newLocation = sys.officeLocationName.replace(/MRF/g, 'Innoveity');
        needsUpdate = true;
      }
      if (sys.senderEmail && sys.senderEmail.includes('mrf-enterprise')) {
        newEmail = sys.senderEmail.replace(/mrf-enterprise/g, 'innoveity');
        needsUpdate = true;
      }

      if (needsUpdate) {
        await prisma.systemSettings.update({
          where: { id: sys.id },
          data: {
            companyName: newName,
            officeLocationName: newLocation,
            senderEmail: newEmail
          }
        });
        console.log(`Updated SystemSettings ${sys.id}: companyName -> ${newName}, officeLocationName -> ${newLocation}, senderEmail -> ${newEmail}`);
      }
    }
  } catch (err) {
    console.error('Error inspecting SystemSettings:', err.message);
  }

  // 2. PlatformSettings
  try {
    const platformSettings = await prisma.platformSettings.findMany();
    console.log('Current PlatformSettings count:', platformSettings.length);
    for (const plat of platformSettings) {
      console.log('PlatformSettings record:', { id: plat.id, companyName: plat.companyName });
      if (plat.companyName && (plat.companyName.includes('MRF') || plat.companyName.includes('MCC') || plat.companyName.includes('Innoviety'))) {
        await prisma.platformSettings.update({
          where: { id: plat.id },
          data: { companyName: 'Innoveity' }
        });
        console.log(`Updated PlatformSettings ${plat.id}: companyName -> Innoveity`);
      }
    }
  } catch (err) {
    console.error('Error inspecting PlatformSettings:', err.message);
  }

  // 3. PayrollSettings
  try {
    const payrollSettings = await prisma.payrollSettings.findMany();
    console.log('Current PayrollSettings count:', payrollSettings.length);
    for (const pay of payrollSettings) {
      console.log('PayrollSettings record:', { id: pay.id, companyName: pay.companyName });
      if (pay.companyName && (pay.companyName.includes('MRF') || pay.companyName.includes('MCC'))) {
        await prisma.payrollSettings.update({
          where: { id: pay.id },
          data: { companyName: 'Innoveity' }
        });
        console.log(`Updated PayrollSettings ${pay.id}: companyName -> Innoveity`);
      }
    }
  } catch (err) {
    console.error('Error inspecting PayrollSettings:', err.message);
  }

  // 4. User companyName fields
  try {
    const usersWithMrf = await prisma.user.findMany({
      where: {
        OR: [
          { companyName: { contains: 'MRF', mode: 'insensitive' } },
          { companyName: { contains: 'MCC', mode: 'insensitive' } }
        ]
      }
    });
    console.log('Users with MRF/MCC companyName count:', usersWithMrf.length);
    for (const u of usersWithMrf) {
      await prisma.user.update({
        where: { id: u.id },
        data: { companyName: 'Innoveity' }
      });
      console.log(`Updated user ${u.email} companyName -> Innoveity`);
    }
  } catch (err) {
    console.error('Error inspecting User companyName:', err.message);
  }

  console.log('--- Database Branding Update Completed ---');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
