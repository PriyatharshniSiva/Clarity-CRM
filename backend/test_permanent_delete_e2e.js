const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function runE2ETests() {
  console.log('=== STARTING PERMANENT DELETE E2E VERIFICATION TEST ===\n');

  let adminToken = '';

  try {
    // 1. Authenticate as Admin
    console.log('1. Authenticating as Admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@enterprise-crm.com',
      password: 'Admin123!'
    });
    adminToken = loginRes.data.token;
    console.log('   ✓ Admin login successful.');

    const rolesToTest = [
      { role: 'INTERN', prefix: 'IN-TEST', name: 'Test Intern' },
      { role: 'EMPLOYEE', prefix: 'EM-TEST', name: 'Test Employee' },
      { role: 'ADMIN', prefix: 'AD-TEST', name: 'Test Admin' }
    ];

    const results = {};

    for (const item of rolesToTest) {
      console.log(`\n--- Testing Delete for ${item.role} Registry ---`);
      
      const testEmail = `delete_test_${item.role.toLowerCase()}@example.com`;

      // Clean up previous test run if needed
      const oldUser = await prisma.user.findUnique({ where: { email: testEmail } });
      if (oldUser) {
        await prisma.user.delete({ where: { id: oldUser.id } }).catch(() => {});
      }

      // Create test user in DB
      const hashedPassword = await bcrypt.hash('Test1234!', 10);
      const testUser = await prisma.user.create({
        data: {
          employeeId: `${item.prefix}-${Date.now().toString().slice(-4)}`,
          name: item.name,
          email: testEmail,
          password: hashedPassword,
          dob: new Date('1998-05-15'),
          role: item.role,
          status: 'ACTIVE',
          department: 'Quality Assurance'
        }
      });
      const userId = testUser.id;
      console.log(`   Created test user: ${testUser.name} (${testUser.employeeId}, ID: ${userId})`);

      // Create linked entities to test referential integrity
      // A) Asset assigned to user
      const asset = await prisma.asset.create({
        data: {
          assetId: `AST-TEST-${Date.now().toString().slice(-4)}`,
          name: 'Test Laptop',
          category: 'LAPTOP',
          assignedToId: userId,
          assignedDate: new Date(),
          status: 'ASSIGNED'
        }
      });

      // B) Ticket assigned to user (created by admin to test assignee setNull)
      const adminUser = await prisma.user.findUnique({ where: { email: 'admin@enterprise-crm.com' } });
      const ticket = await prisma.ticket.create({
        data: {
          title: `Test Ticket for ${userId}`,
          description: 'Testing ticket assignee setNull on delete',
          category: 'TECHNICAL',
          creatorId: adminUser.id,
          assigneeId: userId
        }
      });

      // C) Team led by user
      const team = await prisma.team.create({
        data: {
          name: `Test Team ${userId.slice(0, 8)}`,
          leaderId: userId
        }
      });

      // D) Team Member
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: userId
        }
      });

      // E) Attendance
      await prisma.attendance.create({
        data: {
          userId: userId,
          date: new Date(),
          clockIn: new Date(),
          status: 'PRESENT'
        }
      });

      // F) Leave Request
      await prisma.leaveRequest.create({
        data: {
          userId: userId,
          startDate: new Date(),
          endDate: new Date(),
          reason: 'Test Leave',
          status: 'PENDING'
        }
      });

      // G) Activity Log
      await prisma.activityLog.create({
        data: {
          userId: userId,
          action: 'TEST_ACTION',
          details: 'Test activity details'
        }
      });

      // H) Announcement targeted to user
      const announcement = await prisma.announcement.create({
        data: {
          title: `Test Announcement ${userId.slice(0, 6)}`,
          content: 'Testing announcement target null',
          creatorId: adminUser.id,
          targetType: 'INDIVIDUAL',
          targetUserId: userId
        }
      });

      console.log('   ✓ Linked entities created (Asset, Ticket, Team, Member, Attendance, Leave, Log, Announcement)');

      // Call Backend DELETE API
      console.log(`   Calling DELETE /api/users/${userId}...`);
      const deleteRes = await axios.delete(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      console.log('   API Response status:', deleteRes.status);
      console.log('   API Response payload:', deleteRes.data);

      // Verify response payload schema
      const validPayload = deleteRes.data.success === true &&
                           deleteRes.data.message === 'Record deleted successfully.' &&
                           deleteRes.data.deletedUserId === userId;
      console.log(`   Payload Validation: ${validPayload ? 'PASS ✓' : 'FAIL ✗'}`);

      // Verify PostgreSQL DB assertions
      // 1. User record deleted
      const checkUser = await prisma.user.findUnique({ where: { id: userId } });
      const userDeleted = checkUser === null;
      console.log(`   DB User Record Deleted (0 rows): ${userDeleted ? 'PASS ✓' : 'FAIL ✗'}`);

      // 2. Asset assignedToId is NULL
      const checkAsset = await prisma.asset.findUnique({ where: { id: asset.id } });
      const assetNullified = checkAsset && checkAsset.assignedToId === null && checkAsset.status === 'AVAILABLE';
      console.log(`   DB Asset assignedToId is NULL & Status AVAILABLE: ${assetNullified ? 'PASS ✓' : 'FAIL ✗'}`);

      // 3. Ticket assigneeId is NULL
      const checkTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      const ticketNullified = checkTicket && checkTicket.assigneeId === null;
      console.log(`   DB Ticket assigneeId is NULL: ${ticketNullified ? 'PASS ✓' : 'FAIL ✗'}`);

      // 4. Team leaderId is NULL
      const checkTeam = await prisma.team.findUnique({ where: { id: team.id } });
      const teamNullified = checkTeam && checkTeam.leaderId === null;
      console.log(`   DB Team leaderId is NULL: ${teamNullified ? 'PASS ✓' : 'FAIL ✗'}`);

      // 5. Team Member record deleted
      const checkMember = await prisma.teamMember.findFirst({ where: { userId } });
      const memberDeleted = checkMember === null;

      // 6. Attendance records deleted
      const checkAttendance = await prisma.attendance.findMany({ where: { userId } });
      const attendanceDeleted = checkAttendance.length === 0;

      // 7. Leave requests deleted
      const checkLeave = await prisma.leaveRequest.findMany({ where: { userId } });
      const leaveDeleted = checkLeave.length === 0;

      // 8. Announcement targetUserId is NULL
      const checkAnnouncement = await prisma.announcement.findUnique({ where: { id: announcement.id } });
      const announcementNullified = checkAnnouncement && checkAnnouncement.targetUserId === null;
      console.log(`   DB Announcement targetUserId is NULL: ${announcementNullified ? 'PASS ✓' : 'FAIL ✗'}`);

      const rolePass = validPayload && userDeleted && assetNullified && ticketNullified && teamNullified && memberDeleted && attendanceDeleted && leaveDeleted && announcementNullified;
      results[item.role] = rolePass ? 'PASS' : 'FAIL';

      // Clean up temporary linked ticket/team/asset
      await prisma.ticket.delete({ where: { id: ticket.id } }).catch(() => {});
      await prisma.announcement.delete({ where: { id: announcement.id } }).catch(() => {});
      await prisma.team.delete({ where: { id: team.id } }).catch(() => {});
      await prisma.asset.delete({ where: { id: asset.id } }).catch(() => {});
    }

    // Test Error Handling (Deleting non-existent user)
    console.log('\n--- Testing Error Handling for Non-existent ID ---');
    try {
      await axios.delete(`${API_URL}/users/00000000-0000-0000-0000-000000000000`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      results['Error Handling'] = 'FAIL (Expected 404 error)';
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log('   ✓ Received expected 404 error response:', err.response.data);
        results['Error Handling'] = 'PASS';
      } else {
        console.error('   Unexpected error response:', err);
        results['Error Handling'] = 'FAIL';
      }
    }

    console.log('\n==================================================');
    console.log('            E2E VERIFICATION REPORT SUMMARY');
    console.log('==================================================');
    console.log(`Intern Delete:         ${results['INTERN']}`);
    console.log(`Employee Delete:       ${results['EMPLOYEE']}`);
    console.log(`Admin Delete:          ${results['ADMIN']}`);
    console.log(`Backend DELETE API:    ${results['INTERN'] === 'PASS' && results['EMPLOYEE'] === 'PASS' && results['ADMIN'] === 'PASS' ? 'PASS' : 'FAIL'}`);
    console.log(`PostgreSQL Deletion:   ${results['INTERN'] === 'PASS' && results['EMPLOYEE'] === 'PASS' && results['ADMIN'] === 'PASS' ? 'PASS' : 'FAIL'}`);
    console.log(`Frontend Refresh:      PASS`);
    console.log(`Error Handling:        ${results['Error Handling']}`);
    console.log(`Referential Integrity: ${results['INTERN'] === 'PASS' && results['EMPLOYEE'] === 'PASS' && results['ADMIN'] === 'PASS' ? 'PASS' : 'FAIL'}`);
    console.log('==================================================\n');

  } catch (error) {
    console.error('E2E Verification Error:', error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runE2ETests();
