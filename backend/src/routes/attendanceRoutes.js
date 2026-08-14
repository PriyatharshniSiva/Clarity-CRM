const express = require('express');
const router = express.Router();
const { getClockInStatus, clockIn, clockOut, getAttendanceLogs, updateAttendance, getAttendanceAnalytics, startBreak, endBreak } = require('../controllers/attendanceController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/status', requireRole(['INTERN', 'TEAM_LEADER', 'EMPLOYEE', 'ADMIN']), getClockInStatus);
router.post('/clock-in', requireRole(['INTERN', 'TEAM_LEADER', 'EMPLOYEE']), clockIn);
router.post('/clock-out', requireRole(['INTERN', 'TEAM_LEADER', 'EMPLOYEE']), clockOut);
router.post('/break/start', requireRole(['INTERN', 'TEAM_LEADER', 'EMPLOYEE']), startBreak);
router.put('/break/end', requireRole(['INTERN', 'TEAM_LEADER', 'EMPLOYEE']), endBreak);
router.get('/logs', getAttendanceLogs);
router.get('/analytics', getAttendanceAnalytics);

// Admin-only manual override of logs
router.put('/:id', requireRole(['ADMIN']), updateAttendance);

module.exports = router;
