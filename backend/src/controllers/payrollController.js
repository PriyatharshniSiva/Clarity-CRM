const prisma = require('../utils/db');
const { logActivity } = require('../utils/activityLogger');
const { createNotification } = require('../services/notification');
const crypto = require('crypto');

// Helper to calculate itemized salary for a user in a given month/year
const calculateUserPayroll = async (user, month, year, settings) => {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  const workingDays = endDate.getUTCDate();

  // 1. Fetch user's salary structure
  let structure = await prisma.salaryStructure.findUnique({
    where: { userId: user.id },
    include: { template: true }
  });

  if (!structure) {
    structure = {
      basicSalary: 0,
      hra: 0,
      da: 0,
      specialAllowance: 0,
      travelAllowance: 0,
      medicalAllowance: 0,
      otherAllowances: 0,
      bonus: 0,
      pfDeduction: 0,
      esiDeduction: 0,
      profTax: 0,
      incomeTax: 0,
      otherDeductions: 0,
      grossSalary: 0,
      netSalary: 0
    };
  }

  // 2. Fetch live Attendance logs for month
  const attendances = await prisma.attendance.findMany({
    where: {
      userId: user.id,
      date: { gte: startDate, lte: endDate }
    }
  });

  let presentDays = 0;
  let lateCount = 0;

  attendances.forEach(att => {
    if (att.status === 'PRESENT') presentDays += 1;
    else if (att.status === 'LATE') {
      presentDays += 1;
      lateCount += 1;
    } else if (att.status === 'HALF_DAY') presentDays += 0.5;
  });

  // 3. Fetch live Leave requests for month
  const leaves = await prisma.leaveRequest.findMany({
    where: {
      userId: user.id,
      status: 'APPROVED',
      AND: [
        { startDate: { lte: endDate } },
        { endDate: { gte: startDate } }
      ]
    }
  });

  let paidLeaveDays = 0;
  let wfhDays = 0;

  leaves.forEach(l => {
    const lType = (l.leaveType || l.type || 'CASUAL').toUpperCase();
    const days = Number(l.totalDays) || 1;
    if (lType === 'WFH') wfhDays += days;
    else paidLeaveDays += days;
  });

  const unpaidAbsentDays = Math.max(0, workingDays - (presentDays + paidLeaveDays + wfhDays));

  // 4. Overtime & Holiday Work Calculations
  let overtimeHours = 0;
  let holidayDaysWorked = 0;

  const holidays = await prisma.holidayCalendar.findMany({
    where: {
      date: { gte: startDate, lte: endDate }
    }
  });

  const holidayDatesStr = holidays.map(h => new Date(h.date).toISOString().split('T')[0]);

  attendances.forEach(att => {
    const attDateStr = new Date(att.date).toISOString().split('T')[0];
    if (att.workingHours && att.workingHours > 8) {
      overtimeHours += (att.workingHours - 8);
    }
    if (holidayDatesStr.includes(attDateStr) && ['PRESENT', 'LATE', 'WORK_FROM_HOME'].includes(att.status)) {
      holidayDaysWorked += 1;
    }
  });

  const dailyPay = structure.grossSalary / workingDays;
  const leaveDeduction = Math.round(unpaidAbsentDays * dailyPay);
  const lateDeduction = lateCount * (settings.lateDeductionRate || 100);
  const overtimePay = Math.round(overtimeHours * (settings.overtimeHourlyRate || 150));
  const holidayPay = Math.round(holidayDaysWorked * dailyPay * (settings.holidayPayMultiplier || 2.0));

  const totalEarnings = structure.grossSalary + overtimePay + holidayPay;
  const totalDeductions = structure.pfDeduction + structure.esiDeduction + structure.profTax + structure.incomeTax + structure.otherDeductions + leaveDeduction + lateDeduction;
  const finalNetSalary = Math.max(0, Math.round(totalEarnings - totalDeductions));

  const qrCodeHash = crypto.createHash('sha256').update(`${user.id}-${month}-${year}-${finalNetSalary}`).digest('hex').substring(0, 16);

  return {
    userId: user.id,
    month,
    year,
    basicSalary: structure.basicSalary,
    hra: structure.hra,
    da: structure.da,
    allowancesString: JSON.stringify({
      specialAllowance: structure.specialAllowance,
      travelAllowance: structure.travelAllowance,
      medicalAllowance: structure.medicalAllowance,
      otherAllowances: structure.otherAllowances,
      bonus: structure.bonus
    }),
    deductionsString: JSON.stringify({
      pfDeduction: structure.pfDeduction,
      esiDeduction: structure.esiDeduction,
      profTax: structure.profTax,
      incomeTax: structure.incomeTax,
      otherDeductions: structure.otherDeductions,
      leaveDeduction,
      lateDeduction
    }),
    grossSalary: totalEarnings,
    netSalary: finalNetSalary,
    workingDays,
    presentDays,
    paidLeaveDays,
    unpaidAbsentDays,
    wfhDays,
    overtimeHours: Math.round(overtimeHours * 10) / 10,
    overtimePay,
    holidayDaysWorked,
    holidayPay,
    lateDeduction,
    qrCodeHash
  };
};

// 1. Process Monthly Payroll (Draft / Preview)
const processPayrollBatch = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only Administrators can process payroll.' });
    }

    const { month, year, userIds } = req.body;
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year parameters are required.' });
    }

    const m = Number(month);
    const y = Number(year);

    const settings = await prisma.payrollSettings.findUnique({ where: { id: 'GLOBAL' } }) || {};

    let targetUsers = [];
    if (Array.isArray(userIds) && userIds.length > 0) {
      targetUsers = await prisma.user.findMany({ where: { id: { in: userIds } } });
    } else {
      targetUsers = await prisma.user.findMany({ where: { status: 'ACTIVE' } });
    }

    // Check existing batch
    let batch = await prisma.payrollBatch.findUnique({
      where: { month_year: { month: m, year: y } }
    });

    if (batch && ['LOCKED', 'PUBLISHED', 'COMPLETED'].includes(batch.status)) {
      return res.status(400).json({ message: `Payroll batch for ${m}/${y} is locked or published (${batch.status}). Unlock or Rollback first.` });
    }

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    const payslipsData = [];

    for (const u of targetUsers) {
      const ps = await calculateUserPayroll(u, m, y, settings);
      totalGross += ps.grossSalary;
      totalDeductions += (ps.grossSalary - ps.netSalary);
      totalNet += ps.netSalary;
      payslipsData.push(ps);
    }

    if (!batch) {
      batch = await prisma.payrollBatch.create({
        data: {
          month: m,
          year: y,
          status: 'PREVIEW',
          totalEmployees: targetUsers.length,
          totalGross: Math.round(totalGross),
          totalDeductions: Math.round(totalDeductions),
          totalNet: Math.round(totalNet),
          processedById: req.user.id
        }
      });
    } else {
      batch = await prisma.payrollBatch.update({
        where: { id: batch.id },
        data: {
          status: 'PREVIEW',
          totalEmployees: targetUsers.length,
          totalGross: Math.round(totalGross),
          totalDeductions: Math.round(totalDeductions),
          totalNet: Math.round(totalNet),
          processedById: req.user.id
        }
      });
    }

    // Upsert payslip items
    for (const psData of payslipsData) {
      await prisma.payslip.upsert({
        where: { batchId_userId: { batchId: batch.id, userId: psData.userId } },
        update: { ...psData, status: 'PREVIEW' },
        create: { ...psData, batchId: batch.id, status: 'PREVIEW' }
      });
    }

    await logActivity({
      userId: req.user.id,
      action: 'PAYROLL_GENERATE',
      details: `Processed payroll preview batch for ${m}/${y} (${targetUsers.length} employees, Net: ₹${Math.round(totalNet)})`
    });

    const fullBatch = await prisma.payrollBatch.findUnique({
      where: { id: batch.id },
      include: {
        processedBy: { select: { id: true, name: true, role: true } },
        payslips: {
          include: {
            user: { select: { id: true, name: true, email: true, employeeId: true, role: true, department: true } }
          }
        }
      }
    });

    res.json(fullBatch);
  } catch (error) {
    console.error('Process payroll batch error:', error);
    res.status(500).json({ message: `Failed to process payroll batch: ${error.message}` });
  }
};

// 2. Get All Payroll Batches
const getPayrollBatches = async (req, res) => {
  try {
    const userRole = req.user.role;
    if (userRole === 'INTERN' || userRole === 'EMPLOYEE') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const batches = await prisma.payrollBatch.findMany({
      include: {
        processedBy: { select: { id: true, name: true, role: true } }
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });

    res.json(batches);
  } catch (error) {
    console.error('Get payroll batches error:', error);
    res.status(500).json({ message: 'Failed to retrieve payroll batches.' });
  }
};

// 3. Get Single Payroll Batch by ID
const getPayrollBatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const batch = await prisma.payrollBatch.findUnique({
      where: { id },
      include: {
        processedBy: { select: { id: true, name: true, role: true } },
        payslips: {
          include: {
            user: { select: { id: true, name: true, email: true, employeeId: true, role: true, department: true } }
          }
        }
      }
    });

    if (!batch) {
      return res.status(404).json({ message: 'Payroll batch not found.' });
    }

    res.json(batch);
  } catch (error) {
    console.error('Get payroll batch error:', error);
    res.status(500).json({ message: 'Failed to retrieve payroll batch.' });
  }
};

// 4. Lock Payroll Batch (Admin Only)
const lockPayrollBatch = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only Administrators can lock payroll.' });
    }

    const { id } = req.params;
    const batch = await prisma.payrollBatch.findUnique({ where: { id } });
    if (!batch) return res.status(404).json({ message: 'Batch not found.' });

    const updated = await prisma.payrollBatch.update({
      where: { id },
      data: {
        status: 'LOCKED',
        lockedAt: new Date()
      }
    });

    await prisma.payslip.updateMany({
      where: { batchId: id },
      data: { status: 'LOCKED' }
    });

    await logActivity({
      userId: req.user.id,
      action: 'PAYROLL_LOCK',
      details: `Locked payroll batch for ${batch.month}/${batch.year}`
    });

    res.json(updated);
  } catch (error) {
    console.error('Lock payroll batch error:', error);
    res.status(500).json({ message: 'Failed to lock payroll batch.' });
  }
};

// 5. Review Payroll Batch (Admin Only)
const reviewPayrollBatch = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only Administrators can review payroll.' });
    }

    const { id } = req.params;
    const updated = await prisma.payrollBatch.update({
      where: { id },
      data: { status: 'REVIEW' }
    });

    res.json(updated);
  } catch (error) {
    console.error('Review payroll batch error:', error);
    res.status(500).json({ message: 'Failed to update review status.' });
  }
};

// 6. Publish Payroll Batch & Payslips (Admin Only)
const publishPayrollBatch = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only Administrators can publish payroll.' });
    }

    const { id } = req.params;
    const batch = await prisma.payrollBatch.findUnique({
      where: { id },
      include: { payslips: { include: { user: true } } }
    });

    if (!batch) return res.status(404).json({ message: 'Batch not found.' });

    const updated = await prisma.payrollBatch.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date()
      }
    });

    await prisma.payslip.updateMany({
      where: { batchId: id },
      data: { status: 'PUBLISHED' }
    });

    // Notify all affected users
    for (const ps of batch.payslips) {
      await createNotification({
        userId: ps.userId,
        title: 'Payslip Available',
        message: `Your payslip for ${batch.month}/${batch.year} has been published. Net Pay: ₹${ps.netSalary.toLocaleString()}`,
        type: 'PAYSLIP_AVAILABLE'
      });
    }

    await logActivity({
      userId: req.user.id,
      action: 'PAYROLL_PUBLISH',
      details: `Published payroll batch for ${batch.month}/${batch.year} (${batch.totalEmployees} payslips)`
    });

    res.json(updated);
  } catch (error) {
    console.error('Publish payroll batch error:', error);
    res.status(500).json({ message: 'Failed to publish payroll batch.' });
  }
};

// 7. Rollback Payroll Batch (Admin Only)
const rollbackPayrollBatch = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only Administrators can rollback payroll.' });
    }

    const { id } = req.params;
    const batch = await prisma.payrollBatch.findUnique({ where: { id } });
    if (!batch) return res.status(404).json({ message: 'Batch not found.' });

    await prisma.payrollBatch.update({
      where: { id },
      data: { status: 'ROLLED_BACK' }
    });

    await logActivity({
      userId: req.user.id,
      action: 'PAYROLL_ROLLBACK',
      details: `Rolled back payroll batch for ${batch.month}/${batch.year}`
    });

    res.json({ message: `Payroll batch for ${batch.month}/${batch.year} rolled back successfully.` });
  } catch (error) {
    console.error('Rollback payroll batch error:', error);
    res.status(500).json({ message: 'Failed to rollback payroll batch.' });
  }
};

module.exports = {
  processPayrollBatch,
  getPayrollBatches,
  getPayrollBatchById,
  lockPayrollBatch,
  reviewPayrollBatch,
  publishPayrollBatch,
  rollbackPayrollBatch
};
