const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

const API_BASE = 'http://localhost:5000/api';

async function generateFullQAProof() {
  console.log('================================================================');
  console.log('       LEAVE MANAGEMENT MODULE - QA EVIDENCE GENERATION         ');
  console.log('================================================================\n');

  // 1. Authenticate users
  const loginResIntern = await axios.post(`${API_BASE}/auth/login`, { email: 'somusuraj72@gmail.com', password: 'Password123!' });
  const internToken = loginResIntern.data.token;
  const internUser = loginResIntern.data.user;

  const loginResTL = await axios.post(`${API_BASE}/auth/login`, { email: 'praveen.natarajan.in@gmail.com', password: 'Password123!' });
  const tlToken = loginResTL.data.token;

  const loginResAdmin = await axios.post(`${API_BASE}/auth/login`, { email: 'admin@enterprise-crm.com', password: 'Password123!' });
  const adminToken = loginResAdmin.data.token;

  const loginResSuper = await axios.post(`${API_BASE}/auth/login`, { email: 'superadmin@enterprise-crm.com', password: 'Password123!' });
  const superToken = loginResSuper.data.token;

  console.log('1. API AUTHENTICATION TOKENS OBTAINED FOR ALL ROLES:');
  console.log(`   - INTERN: Token length ${internToken.length}`);
  console.log(`   - TEAM_LEADER: Token length ${tlToken.length}`);
  console.log(`   - ADMIN: Token length ${adminToken.length}`);
  console.log(`   - SUPER_ADMIN: Token length ${superToken.length}\n`);

  // 2. Initial Database Snapshot for Intern User
  const preUser = await prisma.user.findUnique({
    where: { id: internUser.id },
    select: { id: true, name: true, role: true, casualLeaveQuota: true, sickLeaveQuota: true, emergencyLeaveQuota: true }
  });
  console.log('2. PRE-TEST DATABASE USER QUOTA SNAPSHOT:');
  console.log(JSON.stringify(preUser, null, 2));

  // 3. API Test: GET /api/leaves/balances
  const preBalanceRes = await axios.get(`${API_BASE}/leaves/balances`, { headers: { Authorization: `Bearer ${internToken}` } });
  console.log('\n3. API RESPONSE: GET /api/leaves/balances (HTTP 200)');
  console.log(JSON.stringify(preBalanceRes.data, null, 2));

  // 4. API Test: POST /api/leaves (Intern applies for 2-day Emergency Leave)
  const postPayload = {
    startDate: '2026-12-10',
    endDate: '2026-12-11',
    leaveType: 'EMERGENCY',
    reason: 'Emergency Medical Visit for Family Member',
    contactPhone: '9876543210'
  };
  const createRes = await axios.post(`${API_BASE}/leaves`, postPayload, { headers: { Authorization: `Bearer ${internToken}` } });
  console.log('\n4. API REQUEST & RESPONSE: POST /api/leaves (HTTP 201 Created)');
  console.log('   Payload:', JSON.stringify(postPayload));
  console.log('   Response:', JSON.stringify(createRes.data, null, 2));
  const leaveId = createRes.data.id;

  // 5. API Test: PUT /api/leaves/:id/tl-approve (TL Step 1 Review)
  const tlPayload = { remarks: 'Recommended by Team Leader' };
  const tlRes = await axios.put(`${API_BASE}/leaves/${leaveId}/tl-approve`, tlPayload, { headers: { Authorization: `Bearer ${tlToken}` } });
  console.log('\n5. API REQUEST & RESPONSE: PUT /api/leaves/:id/tl-approve (HTTP 200 OK)');
  console.log('   Payload:', JSON.stringify(tlPayload));
  console.log('   Response:', JSON.stringify(tlRes.data, null, 2));

  // 6. API Test: PUT /api/leaves/:id/admin-approve (Admin Final Sanction & Attendance Auto-Sync)
  const adminPayload = { remarks: 'Sanctioned by Admin. Attendance auto-updated.' };
  const adminRes = await axios.put(`${API_BASE}/leaves/${leaveId}/admin-approve`, adminPayload, { headers: { Authorization: `Bearer ${adminToken}` } });
  console.log('\n6. API REQUEST & RESPONSE: PUT /api/leaves/:id/admin-approve (HTTP 200 OK)');
  console.log('   Payload:', JSON.stringify(adminPayload));
  console.log('   Response:', JSON.stringify(adminRes.data, null, 2));

  // 7. Post-Test Database Snapshot for Attendance Records
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      userId: internUser.id,
      date: { in: [new Date('2026-12-10T00:00:00.000Z'), new Date('2026-12-11T00:00:00.000Z')] }
    }
  });
  console.log('\n7. DATABASE VERIFICATION: AUTO-SYNCED ATTENDANCE RECORDS');
  console.log(JSON.stringify(attendanceRecords, null, 2));

  // 8. Post-Test Leave Balances
  const postBalanceRes = await axios.get(`${API_BASE}/leaves/balances`, { headers: { Authorization: `Bearer ${internToken}` } });
  console.log('\n8. POST-APPROVAL DATABASE LEAVE BALANCES (HTTP 200 OK)');
  console.log(JSON.stringify(postBalanceRes.data, null, 2));

  // 9. Database Verification: Notifications Triggered
  const notifications = await prisma.notification.findMany({
    where: { userId: internUser.id },
    orderBy: { createdAt: 'desc' },
    take: 3
  });
  console.log('\n9. DATABASE VERIFICATION: NOTIFICATIONS TRIGGERED FOR APPLICANT');
  console.log(JSON.stringify(notifications, null, 2));

  console.log('\n================================================================');
  console.log('       QA PROOF GENERATION COMPLETED SUCCESSFULLY               ');
  console.log('================================================================');
}

generateFullQAProof().catch(console.error).finally(() => prisma.$disconnect());
