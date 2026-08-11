const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_BASE = 'http://localhost:5000/api';

async function runE2ETests() {
  console.log('--- STARTING REGISTRIES END-TO-END VERIFICATION ---');
  let failures = 0;

  try {
    // 1. Direct PostgreSQL Verification
    console.log('\n[1/5] Verifying PostgreSQL User Records directly...');
    const employeesCount = await prisma.user.count({ where: { role: 'EMPLOYEE' } });
    const teamLeadersCount = await prisma.user.count({ where: { role: 'TEAM_LEADER' } });
    const adminsCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    console.log(`- Database records -> Employees: ${employeesCount}, Team Leaders: ${teamLeadersCount}, Admins: ${adminsCount}`);
    
    if (employeesCount < 1 || (teamLeadersCount + adminsCount) < 1) {
      console.error('❌ Database verification failed: insufficient records found!');
      failures++;
    } else {
      console.log('✔ PostgreSQL Database Verification: PASS');
    }

    // 2. Login to acquire Bearer token
    console.log('\n[2/5] Authenticating as System Admin...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@enterprise-crm.com',
      password: 'Admin123!'
    });
    const token = loginRes.data?.token;
    if (!token) throw new Error('Failed to acquire token from login API');
    console.log('✔ Admin Authentication: PASS');

    const headers = { Authorization: `Bearer ${token}` };

    // 3. Employee Registry API Verification
    console.log('\n[3/5] Testing Employee Registry API (GET /api/users?role=EMPLOYEE)...');
    const empRes = await axios.get(`${API_BASE}/users?page=1&role=EMPLOYEE&limit=15`, { headers });
    console.log(`- Status: ${empRes.status}`);
    console.log(`- Fetched Users Count: ${empRes.data.users.length}`);
    console.log(`- Meta TotalCount: ${empRes.data.meta.totalCount}`);
    if (empRes.status === 200 && Array.isArray(empRes.data.users) && empRes.data.users.length > 0) {
      console.log('✔ Employee Registry API: PASS');
    } else {
      console.error('❌ Employee Registry API: FAIL');
      failures++;
    }

    // 4. Admin Registry API Verification (TEAM_LEADER,ADMIN)
    console.log('\n[4/5] Testing Admin Registry API (GET /api/users?role=TEAM_LEADER,ADMIN)...');
    const adminRes = await axios.get(`${API_BASE}/users?page=1&role=TEAM_LEADER,ADMIN&limit=15`, { headers });
    console.log(`- Status: ${adminRes.status}`);
    console.log(`- Fetched Admins & Team Leaders Count: ${adminRes.data.users.length}`);
    console.log(`- Meta TotalCount: ${adminRes.data.meta.totalCount}`);
    const rolesInResponse = [...new Set(adminRes.data.users.map(u => u.role))];
    console.log(`- Roles returned: ${rolesInResponse.join(', ')}`);
    if (adminRes.status === 200 && Array.isArray(adminRes.data.users) && adminRes.data.users.length > 0) {
      console.log('✔ Admin Registry API: PASS');
    } else {
      console.error('❌ Admin Registry API: FAIL');
      failures++;
    }

    // 5. Search & Status Filter Verification
    console.log('\n[5/5] Testing Search and Status Filter...');
    const searchRes = await axios.get(`${API_BASE}/users?page=1&role=EMPLOYEE&search=Divya&status=ACTIVE`, { headers });
    console.log(`- Search "Divya" Status: ${searchRes.status}, Results: ${searchRes.data.users.length}`);
    if (searchRes.status === 200 && searchRes.data.users.some(u => u.name.includes('Divya'))) {
      console.log('✔ Search & Status Filter API: PASS');
    } else {
      console.error('❌ Search & Status Filter API: FAIL');
      failures++;
    }

    console.log('\n==================================================');
    if (failures === 0) {
      console.log('🎉 ALL END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY!');
    } else {
      console.error(`💥 E2E VERIFICATION COMPLETED WITH ${failures} FAILURE(S)`);
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 E2E verification threw an error:', err.response?.data || err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runE2ETests();
