const prisma = require('../utils/db');
const { logActivity } = require('../utils/activityLogger');

// 1. Get Holidays
const getHolidays = async (req, res) => {
  try {
    const holidays = await prisma.holidayCalendar.findMany({
      orderBy: { date: 'asc' }
    });
    res.json(holidays);
  } catch (error) {
    console.error('Get holidays error:', error);
    res.status(500).json({ message: 'Failed to retrieve holiday calendar.' });
  }
};

// 2. Add Holiday (Admin Only)
const addHoliday = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only Administrators can configure the holiday calendar.' });
    }

    const { title, date, type, isWorkingHoliday, payMultiplier, remarks } = req.body;

    if (!title || !date) {
      return res.status(400).json({ message: 'Holiday title and date are required.' });
    }

    const holidayDate = new Date(date + 'T00:00:00.000Z');

    const holiday = await prisma.holidayCalendar.upsert({
      where: { date: holidayDate },
      update: {
        title,
        type: type || 'COMPANY',
        isWorkingHoliday: Boolean(isWorkingHoliday),
        payMultiplier: Number(payMultiplier) || 2.0,
        remarks
      },
      create: {
        title,
        date: holidayDate,
        type: type || 'COMPANY',
        isWorkingHoliday: Boolean(isWorkingHoliday),
        payMultiplier: Number(payMultiplier) || 2.0,
        remarks
      }
    });

    await logActivity({
      userId: req.user.id,
      action: 'HOLIDAY_CALENDAR_ADD',
      details: `Added holiday "${title}" on ${date}`
    });

    res.status(201).json(holiday);
  } catch (error) {
    console.error('Add holiday error:', error);
    res.status(500).json({ message: 'Failed to save holiday calendar entry.' });
  }
};

// 3. Delete Holiday (Admin Only)
const deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only Administrators can delete holiday calendar entries.' });
    }

    await prisma.holidayCalendar.delete({ where: { id } });
    res.json({ message: 'Holiday calendar entry deleted.' });
  } catch (error) {
    console.error('Delete holiday error:', error);
    res.status(500).json({ message: 'Failed to delete holiday entry.' });
  }
};

module.exports = {
  getHolidays,
  addHoliday,
  deleteHoliday
};
