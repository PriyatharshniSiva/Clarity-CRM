const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPayrollDefaults() {
  console.log('=== SEEDING PAYROLL DEFAULT SETTINGS, TEMPLATES & STRUCTURES ===');

  // 1. Seed Global Payroll Settings
  const settings = await prisma.payrollSettings.upsert({
    where: { id: 'GLOBAL' },
    update: {
      cycleStartDay: 1,
      payDay: 30,
      currency: 'INR',
      overtimeHourlyRate: 150.0,
      holidayPayMultiplier: 2.0,
      weekendPayMultiplier: 1.5,
      lateDeductionRule: 'FLAT_RATE',
      lateDeductionRate: 100.0,
      halfDayDeductionRate: 0.5,
      minimumWorkingHours: 4.0,
      roundingRule: 'ROUND_HALF_UP',
      payslipTemplate: 'STANDARD',
      companyName: 'Innoveity',
      companyAddress: '100 Innovation Towers, Cyber City, Bangalore - 560001',
      authorizedSignature: 'Authorized HR Signatory'
    },
    create: {
      id: 'GLOBAL',
      cycleStartDay: 1,
      payDay: 30,
      currency: 'INR',
      overtimeHourlyRate: 150.0,
      holidayPayMultiplier: 2.0,
      weekendPayMultiplier: 1.5,
      lateDeductionRule: 'FLAT_RATE',
      lateDeductionRate: 100.0,
      halfDayDeductionRate: 0.5,
      minimumWorkingHours: 4.0,
      roundingRule: 'ROUND_HALF_UP',
      payslipTemplate: 'STANDARD',
      companyName: 'Innoveity',
      companyAddress: '100 Innovation Towers, Cyber City, Bangalore - 560001',
      authorizedSignature: 'Authorized HR Signatory'
    }
  });
  console.log('✅ Global Payroll Settings ready.');

  // 2. Seed Default Salary Templates
  const templatesData = [
    {
      name: 'Default Employee',
      description: 'Standard compensation structure for full-time employees.',
      targetRole: 'EMPLOYEE',
      basicSalary: 25000,
      hra: 10000,
      da: 5000,
      specialAllowance: 5000,
      travelAllowance: 3000,
      medicalAllowance: 2000,
      bonus: 0,
      pfRatePercent: 12.0,
      esiRatePercent: 0.75,
      profTax: 200,
      incomeTaxPercent: 5.0,
      otherDeductions: 0,
      isDefault: true
    },
    {
      name: 'Senior Employee',
      description: 'Compensation structure for experienced senior team members.',
      targetRole: 'EMPLOYEE',
      basicSalary: 45000,
      hra: 18000,
      da: 9000,
      specialAllowance: 10000,
      travelAllowance: 5000,
      medicalAllowance: 3000,
      bonus: 5000,
      pfRatePercent: 12.0,
      esiRatePercent: 0.0,
      profTax: 200,
      incomeTaxPercent: 10.0,
      otherDeductions: 0,
      isDefault: false
    },
    {
      name: 'Lead Employee',
      description: 'Compensation structure for Team Leaders and Module Leads.',
      targetRole: 'TEAM_LEADER',
      basicSalary: 65000,
      hra: 26000,
      da: 13000,
      specialAllowance: 15000,
      travelAllowance: 6000,
      medicalAllowance: 5000,
      bonus: 10000,
      pfRatePercent: 12.0,
      esiRatePercent: 0.0,
      profTax: 200,
      incomeTaxPercent: 15.0,
      otherDeductions: 0,
      isDefault: false
    },
    {
      name: 'Manager',
      description: 'Executive salary structure for Department Managers & Administrators.',
      targetRole: 'ADMIN',
      basicSalary: 90000,
      hra: 36000,
      da: 18000,
      specialAllowance: 20000,
      travelAllowance: 8000,
      medicalAllowance: 5000,
      bonus: 15000,
      pfRatePercent: 12.0,
      esiRatePercent: 0.0,
      profTax: 200,
      incomeTaxPercent: 20.0,
      otherDeductions: 0,
      isDefault: false
    },
    {
      name: 'Intern Stipend',
      description: 'Stipend structure for student interns & trainees.',
      targetRole: 'INTERN',
      basicSalary: 15000,
      hra: 0,
      da: 0,
      specialAllowance: 2000,
      travelAllowance: 1000,
      medicalAllowance: 0,
      bonus: 0,
      pfRatePercent: 0.0,
      esiRatePercent: 0.0,
      profTax: 0,
      incomeTaxPercent: 0.0,
      otherDeductions: 0,
      isDefault: false
    }
  ];

  const templatesMap = {};
  for (const t of templatesData) {
    const tmpl = await prisma.salaryTemplate.upsert({
      where: { name: t.name },
      update: t,
      create: t
    });
    templatesMap[t.name] = tmpl;
    console.log(`✅ Salary Template "${tmpl.name}" ready.`);
  }

  // 3. Assign Salary Structures to Test Users
  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true, email: true }
  });

  for (const u of users) {
    let selectedTmpl = templatesMap['Default Employee'];
    if (u.role === 'INTERN') selectedTmpl = templatesMap['Intern Stipend'];
    else if (u.role === 'TEAM_LEADER') selectedTmpl = templatesMap['Lead Employee'];
    else if (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') selectedTmpl = templatesMap['Manager'];

    if (selectedTmpl) {
      const gross = selectedTmpl.basicSalary + selectedTmpl.hra + selectedTmpl.da +
        selectedTmpl.specialAllowance + selectedTmpl.travelAllowance + selectedTmpl.medicalAllowance + selectedTmpl.bonus;
      const pf = (selectedTmpl.basicSalary * selectedTmpl.pfRatePercent) / 100;
      const esi = (gross * selectedTmpl.esiRatePercent) / 100;
      const tax = (gross * selectedTmpl.incomeTaxPercent) / 100;
      const totalDeductions = pf + esi + selectedTmpl.profTax + tax + selectedTmpl.otherDeductions;
      const net = Math.max(0, gross - totalDeductions);

      await prisma.salaryStructure.upsert({
        where: { userId: u.id },
        update: {
          templateId: selectedTmpl.id,
          basicSalary: selectedTmpl.basicSalary,
          hra: selectedTmpl.hra,
          da: selectedTmpl.da,
          specialAllowance: selectedTmpl.specialAllowance,
          travelAllowance: selectedTmpl.travelAllowance,
          medicalAllowance: selectedTmpl.medicalAllowance,
          bonus: selectedTmpl.bonus,
          pfDeduction: pf,
          esiDeduction: esi,
          profTax: selectedTmpl.profTax,
          incomeTax: tax,
          otherDeductions: selectedTmpl.otherDeductions,
          grossSalary: gross,
          netSalary: net
        },
        create: {
          userId: u.id,
          templateId: selectedTmpl.id,
          basicSalary: selectedTmpl.basicSalary,
          hra: selectedTmpl.hra,
          da: selectedTmpl.da,
          specialAllowance: selectedTmpl.specialAllowance,
          travelAllowance: selectedTmpl.travelAllowance,
          medicalAllowance: selectedTmpl.medicalAllowance,
          bonus: selectedTmpl.bonus,
          pfDeduction: pf,
          esiDeduction: esi,
          profTax: selectedTmpl.profTax,
          incomeTax: tax,
          otherDeductions: selectedTmpl.otherDeductions,
          grossSalary: gross,
          netSalary: net
        }
      });
      console.log(`✅ Salary Structure assigned to ${u.name} (${u.role}) via "${selectedTmpl.name}" (Net: ₹${net})`);
    }
  }

  // 4. Seed Holiday Calendar Entries for Nov 2026
  const holidaysData = [
    { title: 'Diwali Holiday', date: new Date('2026-11-01T00:00:00.000Z'), type: 'NATIONAL', isWorkingHoliday: false, payMultiplier: 2.0, remarks: 'National Festival Holiday' },
    { title: 'Kannada Rajyotsava', date: new Date('2026-11-02T00:00:00.000Z'), type: 'COMPANY', isWorkingHoliday: false, payMultiplier: 2.0, remarks: 'State Holiday' },
    { title: 'Innovation Hackathon Weekend', date: new Date('2026-11-14T00:00:00.000Z'), type: 'WEEKEND', isWorkingHoliday: true, payMultiplier: 1.5, remarks: 'Working Weekend Hackathon' }
  ];

  for (const h of holidaysData) {
    await prisma.holidayCalendar.upsert({
      where: { date: h.date },
      update: h,
      create: h
    });
    console.log(`✅ Holiday Calendar entry "${h.title}" ready.`);
  }

  console.log('=== PAYROLL DEFAULT SEED COMPLETED SUCCESSFULLY ===');
}

seedPayrollDefaults().catch(console.error).finally(() => prisma.$disconnect());
