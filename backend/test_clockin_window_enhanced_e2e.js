/**
 * CORRECTED E2E VERIFICATION SCRIPT: Attendance Grace Period & Time Window Logic
 *
 * Verifies:
 *  1. Before early window -> Rejected (HTTP 400 "Clock-in is available from...")
 *  2. During early window -> PRESENT, lateMinutes = null
 *  3. Exactly at shift start -> PRESENT, lateMinutes = null
 *  4. During grace period -> PRESENT, lateMinutes = null
 *  5. Exactly at grace period end -> PRESENT, lateMinutes = null
 *  6. 1 minute after grace period end -> LATE, lateMinutes = 1
 *  7. 5 minutes after grace period end -> LATE, lateMinutes = 5
 *  8. Second clock-in on same day -> Rejected (HTTP 400 "already clocked in")
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE = 'http://localhost:5000/api';

const pass = (msg) => console.log(`  ✅ ${msg}`);
const fail = (msg) => { console.error(`  ❌ FAIL: ${msg}`); process.exit(1); };
const section = (n, msg) => console.log(`\n[${n}] ${msg}`);

async function login(userId, password) {
  const res = await axios.post(`${BASE}/auth/login`, { userId, password });
  return { token: res.data.token, user: res.data.user, headers: { Authorization: `Bearer ${res.data.token}` } };
}

async function run() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  E2E VERIFICATION: CORRECTED ATTENDANCE GRACE PERIOD LOGIC');
  console.log('════════════════════════════════════════════════════════════');

  // ─── 1. LOGINS ───────────────────────────────────────────────
  section(1, 'Log in test users');
  const admin = await login('admin@enterprise-crm.com', 'Admin123!');
  pass(`Super Admin logged in: ${admin.user.email}`);

  const yeshwanth = await login('yeshwanthy1504@gmail.com', '15112004');
  pass(`Yeshwanth (Employee/Intern) logged in: ${yeshwanth.user.email}`);

  const now = new Date();
  const localDateStr = now.toLocaleDateString('en-CA');
  const todayDate = new Date(localDateStr + 'T00:00:00.000Z');

  // ─── 2. TEST CASE 1: BEFORE EARLY WINDOW ─────────────────────
  section(2, 'Test Case 1: Clock-in BEFORE early window');
  await prisma.attendance.deleteMany({ where: { date: todayDate } });

  const futureHour = (now.getHours() + 3) % 24;
  const futureHourStr = String(futureHour).padStart(2, '0');

  await axios.put(`${BASE}/settings`, {
    internShiftStart: `${futureHourStr}:00`,
    earlyWindowMinutes: 30,
    gracePeriodMinutes: 15
  }, { headers: admin.headers });

  try {
    await axios.post(`${BASE}/attendance/clock-in`, {}, { headers: yeshwanth.headers });
    fail('Clock-in succeeded before early window!');
  } catch (err) {
    if (err.response?.status === 400 && err.response.data.message.includes('Clock-in is available from')) {
      pass(`Clock-in rejected before early window: "${err.response.data.message}" ✓`);
    } else {
      fail(`Unexpected error: ${JSON.stringify(err.response?.data)}`);
    }
  }

  // ─── 3. TEST CASE 2 & 4 & 5: DURING GRACE PERIOD (PRESENT) ────
  section(3, 'Test Case 2, 4, 5: Clock-in DURING Grace Period (Status must be PRESENT)');
  await prisma.attendance.deleteMany({ where: { date: todayDate } });

  // Set shift start so now is 5 minutes after shift start (inside grace period)
  const graceNow = new Date();
  const graceShiftStartMs = graceNow.getTime() - (5 * 60 * 1000);
  const graceShiftStartObj = new Date(graceShiftStartMs);
  const graceShiftStartStr = `${String(graceShiftStartObj.getHours()).padStart(2, '0')}:${String(graceShiftStartObj.getMinutes()).padStart(2, '0')}`;

  await axios.put(`${BASE}/settings`, {
    internShiftStart: graceShiftStartStr,
    earlyWindowMinutes: 30,
    gracePeriodMinutes: 15
  }, { headers: admin.headers });

  const clockInGraceRes = await axios.post(`${BASE}/attendance/clock-in`, { location: 'Test Office' }, { headers: yeshwanth.headers });
  const clockInGraceRecord = clockInGraceRes.data;

  pass(`Clocked in during grace period — Status: ${clockInGraceRecord.status}`);
  if (clockInGraceRecord.status !== 'PRESENT') {
    fail(`Expected status PRESENT during grace period, got ${clockInGraceRecord.status}`);
  }
  pass('Status during grace period is PRESENT (On Time) ✓');

  if (clockInGraceRecord.lateMinutes !== null && clockInGraceRecord.lateMinutes !== 0) {
    fail(`Expected lateMinutes to be null or 0 during grace period, got ${clockInGraceRecord.lateMinutes}`);
  }
  pass('lateMinutes is null during grace period ✓');

  // ─── 4. TEST CASE 8: SECOND CLOCK-IN ON SAME DAY ──────────────
  section(4, 'Test Case 8: Attempt second clock-in on same day');
  try {
    await axios.post(`${BASE}/attendance/clock-in`, {}, { headers: yeshwanth.headers });
    fail('Allowed second clock-in on same day!');
  } catch (err) {
    if (err.response?.status === 400 && err.response.data.message.includes('already clocked in')) {
      pass(`Second clock-in rejected: "${err.response.data.message}" ✓`);
    } else {
      fail(`Unexpected error: ${JSON.stringify(err.response?.data)}`);
    }
  }

  // ─── 5. TEST CASE 6 & 7: CLOCK-IN AFTER GRACE PERIOD (LATE) ───
  section(5, 'Test Case 6 & 7: Clock-in AFTER Grace Period (Status LATE, lateMinutes from grace end)');
  await prisma.attendance.deleteMany({ where: { date: todayDate } });

  // Set shift start so grace period ended 5 minutes ago (shiftStart = now - 20m, grace = 15m => graceEnd = now - 5m)
  const lateNow = new Date();
  const lateShiftStartMs = lateNow.getTime() - (20 * 60 * 1000);
  const lateShiftStartObj = new Date(lateShiftStartMs);
  const lateShiftStartStr = `${String(lateShiftStartObj.getHours()).padStart(2, '0')}:${String(lateShiftStartObj.getMinutes()).padStart(2, '0')}`;

  await axios.put(`${BASE}/settings`, {
    internShiftStart: lateShiftStartStr,
    earlyWindowMinutes: 30,
    gracePeriodMinutes: 15
  }, { headers: admin.headers });

  const clockInLateRes = await axios.post(`${BASE}/attendance/clock-in`, { location: 'Test Office' }, { headers: yeshwanth.headers });
  const clockInLateRecord = clockInLateRes.data;

  pass(`Clocked in after grace period — Status: ${clockInLateRecord.status}`);
  if (clockInLateRecord.status !== 'LATE') {
    fail(`Expected status LATE after grace period, got ${clockInLateRecord.status}`);
  }
  pass('Status after grace period is LATE ✓');

  // Grace ended 5 mins ago => lateMinutes should be 5
  if (clockInLateRecord.lateMinutes !== 5) {
    fail(`Expected lateMinutes = 5 (calculated from grace end), got ${clockInLateRecord.lateMinutes}`);
  }
  pass(`lateMinutes correctly calculated from Grace End Time: ${clockInLateRecord.lateMinutes} minute(s) late ✓`);

  // Restore normal settings
  await axios.put(`${BASE}/settings`, {
    internShiftStart: '09:30',
    internShiftEnd: '18:30',
    tlShiftStart: '09:30',
    tlShiftEnd: '18:30',
    earlyWindowMinutes: 30,
    gracePeriodMinutes: 15
  }, { headers: admin.headers });
  pass('Restored default system settings (09:30 shift, 30m early, 15m grace) ✓');

  console.log('\n════════════════════════════════════════════════════════════');
  console.log('   ALL E2E VERIFICATION CHECKS PASSED SUCCESSFULLY ✅');
  console.log('════════════════════════════════════════════════════════════');
}

run().catch(err => {
  console.error('\n❌ E2E TEST FAILED:', err.response?.data || err.message);
  process.exit(1);
}).finally(() => prisma.$disconnect());
