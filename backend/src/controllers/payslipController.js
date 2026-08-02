const prisma = require('../utils/db');
const { logActivity } = require('../utils/activityLogger');
const { createNotification } = require('../services/notification');

// 1. Get Payslips (Role Scoped)
const getPayslips = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    let payslips = [];

    if (['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      payslips = await prisma.payslip.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, employeeId: true, role: true, department: true, profilePic: true } },
          batch: true
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }]
      });
    } else {
      // Employees/Interns/TLs view published or own payslips
      payslips = await prisma.payslip.findMany({
        where: {
          userId,
          status: 'PUBLISHED'
        },
        include: {
          user: { select: { id: true, name: true, email: true, employeeId: true, role: true, department: true, profilePic: true } },
          batch: true
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }]
      });
    }

    res.json(payslips);
  } catch (error) {
    console.error('Get payslips error:', error);
    res.status(500).json({ message: 'Failed to retrieve payslips.' });
  }
};

// 2. Get Detailed Single Payslip by ID (for View / Print / PDF / QR Verification)
const getPayslipById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true, name: true, email: true, phone: true, employeeId: true,
            role: true, department: true, designation: true, profilePic: true,
            joiningDate: true, companyName: true
          }
        },
        batch: true
      }
    });

    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found.' });
    }

    // Role-based access control
    if (['INTERN', 'EMPLOYEE'].includes(userRole) && payslip.userId !== userId) {
      return res.status(403).json({ message: 'You can only view your own payslips.' });
    }

    const settings = await prisma.payrollSettings.findUnique({ where: { id: 'GLOBAL' } }) || {};

    await logActivity({
      userId: req.user.id,
      action: 'PAYSLIP_VIEW',
      details: `Viewed payslip for ${payslip.user.name} (${payslip.month}/${payslip.year})`
    });

    res.json({
      payslip,
      settings
    });
  } catch (error) {
    console.error('Get payslip details error:', error);
    res.status(500).json({ message: 'Failed to retrieve payslip details.' });
  }
};

// 3. Email Payslip to Employee (Admin Only)
const emailPayslip = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only Administrators can send payslip emails.' });
    }

    const { id } = req.params;
    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found.' });
    }

    await createNotification({
      userId: payslip.userId,
      title: 'Payslip Emailed',
      message: `Your itemized payslip for ${payslip.month}/${payslip.year} has been sent to your email (${payslip.user.email}).`,
      type: 'PAYSLIP_EMAILED'
    });

    await logActivity({
      userId: req.user.id,
      action: 'PAYSLIP_EMAIL_SEND',
      details: `Sent payslip email to ${payslip.user.name} (${payslip.user.email})`
    });

    res.json({ message: `Payslip notification sent to ${payslip.user.email}.` });
  } catch (error) {
    console.error('Email payslip error:', error);
    res.status(500).json({ message: 'Failed to send payslip email.' });
  }
};

module.exports = {
  getPayslips,
  getPayslipById,
  emailPayslip
};
