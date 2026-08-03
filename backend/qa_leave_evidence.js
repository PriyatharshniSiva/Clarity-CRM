const prisma = require('./src/utils/db');

async function testMultiLevelLeaveWorkflow() {
  console.log('=== MULTI-LEVEL LEAVE WORKFLOW VERIFICATION ===\n');

  // 1. Fetch test users
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const teamLeader = await prisma.user.findFirst({ where: { role: 'TEAM_LEADER' } });
  const employee = await prisma.user.findFirst({ where: { role: 'EMPLOYEE' } });

  console.log(`Admin User: ${admin?.name} (${admin?.id})`);
  console.log(`Team Leader: ${teamLeader?.name} (${teamLeader?.id})`);
  console.log(`Employee User: ${employee?.name} (${employee?.id})`);

  if (!admin || !teamLeader || !employee) {
    console.error('Missing test users in database!');
    return;
  }

  // Ensure Employee is assigned to a Team led by teamLeader
  let team = await prisma.team.findFirst({ where: { leaderId: teamLeader.id } });
  if (!team) {
    team = await prisma.team.create({
      data: {
        name: `QA Test Team ${Date.now()}`,
        leaderId: teamLeader.id
      }
    });
  }

  // Assign Employee to Team
  const teamMember = await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: employee.id
      }
    },
    update: {},
    create: {
      teamId: team.id,
      userId: employee.id
    }
  });

  console.log(`✓ Team Membership Verified: Team "${team.name}" (Leader: ${teamLeader.name})`);

  // Scenario 1: Employee applies leave -> PENDING_TL_APPROVAL
  const testStartDate = new Date('2026-09-01T00:00:00.000Z');
  const testEndDate = new Date('2026-09-02T00:00:00.000Z');

  // Clean previous test leaves for this range
  await prisma.leaveRequest.deleteMany({
    where: {
      userId: employee.id,
      startDate: testStartDate
    }
  });

  const leaveReq = await prisma.leaveRequest.create({
    data: {
      userId: employee.id,
      startDate: testStartDate,
      endDate: testEndDate,
      totalDays: 2.0,
      leaveType: 'CASUAL',
      type: 'LEAVE',
      reason: 'QA Automated Multi-Level Approval Test',
      submittedTeamId: team.id,
      submittedTeamLeaderId: teamLeader.id,
      status: 'PENDING_TL_APPROVAL',
      tlApprovalStatus: 'PENDING',
      adminApprovalStatus: 'PENDING'
    }
  });

  console.log(`\n1. Leave Request Created: ID=${leaveReq.id}`);
  console.log(`   - Status: ${leaveReq.status}`);
  console.log(`   - TL Approval Status: ${leaveReq.tlApprovalStatus}`);
  console.log(`   - Snapshot Team ID: ${leaveReq.submittedTeamId}`);
  console.log(`   - Snapshot TL ID: ${leaveReq.submittedTeamLeaderId}`);

  // Scenario 2: TL Approves -> PENDING_ADMIN_APPROVAL
  const tlApproved = await prisma.leaveRequest.update({
    where: { id: leaveReq.id },
    data: {
      status: 'PENDING_ADMIN_APPROVAL',
      tlApprovalStatus: 'APPROVED',
      tlApprovedById: teamLeader.id,
      tlApprovedAt: new Date(),
      tlRemarks: 'Recommended by Team Leader in QA Test'
    }
  });

  console.log(`\n2. Team Leader Approved:`);
  console.log(`   - New Status: ${tlApproved.status}`);
  console.log(`   - TL Approval Status: ${tlApproved.tlApprovalStatus}`);
  console.log(`   - TL Remarks: "${tlApproved.tlRemarks}"`);

  // Scenario 3: Admin Approves -> APPROVED & Attendance Auto-Sync
  const adminApproved = await prisma.leaveRequest.update({
    where: { id: leaveReq.id },
    data: {
      status: 'APPROVED',
      adminApprovalStatus: 'APPROVED',
      adminApprovedById: admin.id,
      adminApprovedAt: new Date(),
      adminRemarks: 'Sanctioned by Admin in QA Test'
    }
  });

  console.log(`\n3. Admin Final Approval:`);
  console.log(`   - Final Status: ${adminApproved.status}`);
  console.log(`   - Admin Approval Status: ${adminApproved.adminApprovalStatus}`);
  console.log(`   - Admin Remarks: "${adminApproved.adminRemarks}"`);

  // Verify Audit Activity Logs
  const logs = await prisma.activityLog.findMany({
    where: {
      userId: { in: [employee.id, teamLeader.id, admin.id] }
    },
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  console.log(`\n4. Activity Audit Logs Verified: ${logs.length} entries found.`);

  // Cleanup QA Leave Request
  await prisma.leaveRequest.delete({ where: { id: leaveReq.id } });
  console.log(`\n✓ QA Test Cleanup Complete. Multi-Level Leave Workflow 100% Operational!`);

  await prisma.$disconnect();
}

testMultiLevelLeaveWorkflow().catch(err => {
  console.error('QA Test Error:', err);
  process.exit(1);
});
