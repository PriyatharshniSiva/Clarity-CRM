const prisma = require('../utils/db');
const { logActivity } = require('../utils/activityLogger');

// 1. Get Global Payroll Settings
const getPayrollSettings = async (req, res) => {
  try {
    let settings = await prisma.payrollSettings.findUnique({
      where: { id: 'GLOBAL' }
    });

    if (!settings) {
      settings = await prisma.payrollSettings.create({
        data: { id: 'GLOBAL' }
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Get payroll settings error:', error);
    res.status(500).json({ message: 'Failed to retrieve payroll settings.' });
  }
};

// 2. Update Global Payroll Settings (Admin Only)
const updatePayrollSettings = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only Administrators can modify payroll settings.' });
    }

    const {
      cycleStartDay, payDay, currency, overtimeHourlyRate,
      holidayPayMultiplier, weekendPayMultiplier, lateDeductionRule, lateDeductionRate,
      halfDayDeductionRate, minimumWorkingHours, roundingRule, payslipTemplate,
      companyName, companyLogo, companyAddress, authorizedSignature
    } = req.body;

    const settings = await prisma.payrollSettings.upsert({
      where: { id: 'GLOBAL' },
      update: {
        cycleStartDay: cycleStartDay !== undefined ? Number(cycleStartDay) : 1,
        payDay: payDay !== undefined ? Number(payDay) : 30,
        currency: currency || 'INR',
        overtimeHourlyRate: overtimeHourlyRate !== undefined ? Number(overtimeHourlyRate) : 150.0,
        holidayPayMultiplier: holidayPayMultiplier !== undefined ? Number(holidayPayMultiplier) : 2.0,
        weekendPayMultiplier: weekendPayMultiplier !== undefined ? Number(weekendPayMultiplier) : 1.5,
        lateDeductionRule: lateDeductionRule || 'FLAT_RATE',
        lateDeductionRate: lateDeductionRate !== undefined ? Number(lateDeductionRate) : 100.0,
        halfDayDeductionRate: halfDayDeductionRate !== undefined ? Number(halfDayDeductionRate) : 0.5,
        minimumWorkingHours: minimumWorkingHours !== undefined ? Number(minimumWorkingHours) : 4.0,
        roundingRule: roundingRule || 'ROUND_HALF_UP',
        payslipTemplate: payslipTemplate || 'STANDARD',
        companyName: companyName || 'Innoveity',
        companyLogo: companyLogo || null,
        companyAddress: companyAddress || '100 Innovation Towers, Cyber City, Bangalore - 560001',
        authorizedSignature: authorizedSignature || 'Authorized HR Signatory'
      },
      create: {
        id: 'GLOBAL',
        cycleStartDay: cycleStartDay !== undefined ? Number(cycleStartDay) : 1,
        payDay: payDay !== undefined ? Number(payDay) : 30,
        currency: currency || 'INR',
        overtimeHourlyRate: overtimeHourlyRate !== undefined ? Number(overtimeHourlyRate) : 150.0,
        holidayPayMultiplier: holidayPayMultiplier !== undefined ? Number(holidayPayMultiplier) : 2.0,
        weekendPayMultiplier: weekendPayMultiplier !== undefined ? Number(weekendPayMultiplier) : 1.5,
        lateDeductionRule: lateDeductionRule || 'FLAT_RATE',
        lateDeductionRate: lateDeductionRate !== undefined ? Number(lateDeductionRate) : 100.0,
        halfDayDeductionRate: halfDayDeductionRate !== undefined ? Number(halfDayDeductionRate) : 0.5,
        minimumWorkingHours: minimumWorkingHours !== undefined ? Number(minimumWorkingHours) : 4.0,
        roundingRule: roundingRule || 'ROUND_HALF_UP',
        payslipTemplate: payslipTemplate || 'STANDARD',
        companyName: companyName || 'Innoveity',
        companyLogo: companyLogo || null,
        companyAddress: companyAddress || '100 Innovation Towers, Cyber City, Bangalore - 560001',
        authorizedSignature: authorizedSignature || 'Authorized HR Signatory'
      }
    });

    await logActivity({
      userId: req.user.id,
      action: 'PAYROLL_SETTINGS_UPDATE',
      details: 'Updated global payroll settings configuration'
    });

    res.json(settings);
  } catch (error) {
    console.error('Update payroll settings error:', error);
    res.status(500).json({ message: 'Failed to update payroll settings.' });
  }
};

module.exports = {
  getPayrollSettings,
  updatePayrollSettings
};
