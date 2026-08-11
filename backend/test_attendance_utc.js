// Automated verification script for Attendance Timezone Engine & Local/UTC parity
const {
  getSystemTimeZone,
  getZonedParts,
  createZonedDate,
  getShiftWindowDates,
  validateAttendanceWindow
} = require('./src/utils/attendanceUtils');

console.log('=== Attendance Timezone Engine Verification ===');
console.log('Process TZ:', process.env.TZ || 'Default OS Zoned');

// Mock System Settings
const settings = {
  timeZone: 'Asia/Kolkata',
  internShiftStart: '09:30',
  tlShiftStart: '09:30',
  earlyWindowMinutes: 30,
  gracePeriodMinutes: 15
};

// 1. Simulate 09:15 AM IST (Within Early Window - Available to Clock In On Time)
// 09:15 AM IST = 03:45 AM UTC
const nowOnTime = new Date('2026-08-04T03:45:00.000Z');
const resOnTime = validateAttendanceWindow({
  userRole: 'INTERN',
  settings,
  attendanceRecord: null,
  approvedLeave: null,
  now: nowOnTime
});

console.log('\n--- Test Scenario 1: 09:15 AM IST (03:45 UTC) ---');
console.log('Current Zoned Time:', resOnTime.currentTimeFormatted);
console.log('Shift Start:', resOnTime.shiftStartFormatted);
console.log('Window Open:', resOnTime.windowOpenFormatted);
console.log('Window Close:', resOnTime.windowCloseFormatted);
console.log('State:', resOnTime.state);
console.log('Can Clock In:', resOnTime.canClockIn);
console.log('Reason:', resOnTime.reason);

if (resOnTime.canClockIn && resOnTime.state === 'OPEN_ON_TIME') {
  console.log('✅ Scenario 1 Passed: Clock-In is ENABLED on-time in UTC server environment!');
} else {
  console.error('❌ Scenario 1 Failed:', resOnTime);
  process.exit(1);
}

// 2. Simulate 08:30 AM IST (Before Early Window - 03:00 AM UTC)
const nowBefore = new Date('2026-08-04T03:00:00.000Z');
const resBefore = validateAttendanceWindow({
  userRole: 'INTERN',
  settings,
  attendanceRecord: null,
  approvedLeave: null,
  now: nowBefore
});

console.log('\n--- Test Scenario 2: 08:30 AM IST (03:00 UTC) ---');
console.log('State:', resBefore.state);
console.log('Can Clock In:', resBefore.canClockIn);
console.log('Reason:', resBefore.reason);

if (!resBefore.canClockIn && resBefore.reason === 'SHIFT_NOT_STARTED') {
  console.log('✅ Scenario 2 Passed: Clock-In correctly blocked before window open!');
} else {
  console.error('❌ Scenario 2 Failed:', resBefore);
  process.exit(1);
}

// 3. Simulate 10:00 AM IST (Late Window - 04:30 AM UTC)
const nowLate = new Date('2026-08-04T04:30:00.000Z');
const resLate = validateAttendanceWindow({
  userRole: 'INTERN',
  settings,
  attendanceRecord: null,
  approvedLeave: null,
  now: nowLate
});

console.log('\n--- Test Scenario 3: 10:00 AM IST (04:30 UTC) ---');
console.log('State:', resLate.state);
console.log('Can Clock In:', resLate.canClockIn);
console.log('Late Minutes:', resLate.lateMinutes);

if (resLate.canClockIn && resLate.state === 'OPEN_LATE' && resLate.lateMinutes === 15) {
  console.log('✅ Scenario 3 Passed: Clock-In enabled as LATE (15 mins late past grace window)!');
} else {
  console.error('❌ Scenario 3 Failed:', resLate);
  process.exit(1);
}

// 4. Simulate Already Clocked In (On Shift)
const resAlreadyIn = validateAttendanceWindow({
  userRole: 'INTERN',
  settings,
  attendanceRecord: { status: 'PRESENT', clockIn: nowOnTime, clockOut: null },
  approvedLeave: null,
  now: nowOnTime
});

console.log('\n--- Test Scenario 4: Already Clocked In ---');
console.log('Can Clock In:', resAlreadyIn.canClockIn);
console.log('Can Clock Out:', resAlreadyIn.canClockOut);

if (!resAlreadyIn.canClockIn && resAlreadyIn.canClockOut) {
  console.log('✅ Scenario 4 Passed: Clock-In DISABLED, Clock-Out ENABLED!');
} else {
  console.error('❌ Scenario 4 Failed:', resAlreadyIn);
  process.exit(1);
}

console.log('\n=== ALL UTC PARITY TESTS PASSED SUCCESSFULLY! ===');
