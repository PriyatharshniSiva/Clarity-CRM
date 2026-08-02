const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanPayrollData() {
  console.log('=== CLEANING ALL TEST & DUMMY PAYROLL DATA FROM DATABASE ===');

  const payslips = await prisma.payslip.deleteMany({});
  console.log(`Deleted ${payslips.count} test payslips.`);

  const batches = await prisma.payrollBatch.deleteMany({});
  console.log(`Deleted ${batches.count} test payroll batches.`);

  const revisions = await prisma.salaryRevision.deleteMany({});
  console.log(`Deleted ${revisions.count} test salary revisions.`);

  const structures = await prisma.salaryStructure.deleteMany({});
  console.log(`Deleted ${structures.count} test salary structures.`);

  const templates = await prisma.salaryTemplate.deleteMany({});
  console.log(`Deleted ${templates.count} test salary templates.`);

  const holidays = await prisma.holidayCalendar.deleteMany({});
  console.log(`Deleted ${holidays.count} test holiday calendar entries.`);

  const notifications = await prisma.notification.deleteMany({
    where: {
      type: { in: ['PAYROLL_PUBLISHED', 'PAYSLIP_AVAILABLE', 'PAYSLIP_EMAILED'] }
    }
  });
  console.log(`Deleted ${notifications.count} test payroll notifications.`);

  console.log('=== DATABASE CLEANUP COMPLETED SUCCESSFULLY ===');
}

cleanPayrollData().catch(console.error).finally(() => prisma.$disconnect());
