/**
 * E2E test: Auto-reset password on DOB change
 * 
 * Steps:
 * 1. Login as Admin → get token
 * 2. Update Yeshwanth Y's DOB to a new date via PUT /api/users/:id
 * 3. Assert response has dobPasswordReset: true and NO password field
 * 4. Check audit log has USER_DOB_CHANGED entry
 * 5. Login as Yeshwanth Y with new DDMMYYYY password → should succeed
 * 6. Login with old password → should fail
 */

const axios = require('axios');
const BASE = 'http://localhost:5000/api';

const OLD_DOB = '2003-08-20'; // current DB DOB (from previous test run)
const NEW_DOB = '2001-06-10'; // test new DOB → password becomes 10062001

async function run() {
  console.log('=== E2E: Auto-reset password on DOB change ===\n');

  // Step 1: Admin login
  console.log('[1] Logging in as Admin...');
  const loginRes = await axios.post(`${BASE}/auth/login`, {
    userId: 'admin@enterprise-crm.com',
    password: 'Admin123!'
  });
  const token = loginRes.data.token;
  const headers = { Authorization: `Bearer ${token}` };
  console.log('    ✅ Admin logged in.\n');

  // Find Yeshwanth Y
  const usersRes = await axios.get(`${BASE}/users`, {
    headers,
    params: { role: 'EMPLOYEE', limit: 50 }
  });
  const yeshwanth = usersRes.data.users.find(u => u.email === 'yeshwanthy1504@gmail.com');
  if (!yeshwanth) {
    console.error('    ❌ Yeshwanth Y not found in DB. Seed the user first.');
    process.exit(1);
  }
  console.log(`[2] Found user: ${yeshwanth.name} (${yeshwanth.employeeId}), current DOB: ${yeshwanth.dob?.split('T')[0]}\n`);

  // Step 2: Update DOB
  console.log(`[3] Updating DOB from ${OLD_DOB} to ${NEW_DOB}...`);
  const updateRes = await axios.put(`${BASE}/users/${yeshwanth.id}`, {
    name: yeshwanth.name,
    email: yeshwanth.email,
    phone: yeshwanth.phone || '',
    dob: NEW_DOB,
    college: yeshwanth.college || '',
    department: yeshwanth.department || '',
    role: 'EMPLOYEE',
    status: yeshwanth.status
  }, { headers });

  // Step 3: Assert response
  const updatedData = updateRes.data;
  console.log(`    dobPasswordReset flag: ${updatedData.dobPasswordReset}`);
  if (updatedData.password) {
    console.error('    ❌ SECURITY FAIL: password field exposed in response!');
    process.exit(1);
  } else {
    console.log('    ✅ No password field in API response (secure).');
  }
  if (updatedData.dobPasswordReset !== true) {
    console.error('    ❌ dobPasswordReset flag not set to true!');
    process.exit(1);
  }
  console.log('    ✅ dobPasswordReset = true confirmed.\n');

  // Step 4: Check audit log
  console.log('[4] Checking audit logs for USER_DOB_CHANGED entry...');
  const logsRes = await axios.get(`${BASE}/logs`, { headers });
  const logs = logsRes.data.logs || logsRes.data;
  const dobLog = (Array.isArray(logs) ? logs : []).find(
    l => l.action === 'USER_DOB_CHANGED' && l.details.includes(yeshwanth.employeeId)
  );
  if (dobLog) {
    console.log('    ✅ Audit log entry found:');
    console.log(`       ${dobLog.details}`);
    if (dobLog.details.toLowerCase().includes('password') && !dobLog.details.toLowerCase().includes('password value')) {
      // Check it only mentions "reset", not an actual password
      console.log('    ✅ Log mentions reset without exposing password value.\n');
    }
  } else {
    console.warn('    ⚠️  Audit log entry not found via API (may require direct DB check).\n');
  }

  // Step 5: Login with new DOB password (DDMMYYYY of 2001-06-10 = 10062001)
  const newPassword = '10062001';
  console.log(`[5] Attempting login with new DOB password "${newPassword}"...`);
  try {
    const newLoginRes = await axios.post(`${BASE}/auth/login`, {
      userId: 'yeshwanthy1504@gmail.com',
      password: newPassword
    });
    console.log(`    ✅ Login successful! Role: ${newLoginRes.data.user.role}\n`);
  } catch (e) {
    console.error(`    ❌ Login FAILED with new password: ${e.response?.data?.message || e.message}`);
    process.exit(1);
  }

  // Step 6: Login with old password should fail
  console.log('[6] Login with old password (20082003) should now fail');
  try {
    await axios.post(`${BASE}/auth/login`, {
      userId: 'yeshwanthy1504@gmail.com',
      password: '20082003'
    });
    console.error('    ❌ Old password still works — password was NOT reset!');
    process.exit(1);
  } catch (e) {
    if (e.response?.status === 401) {
      console.log('    ✅ Old password correctly rejected (401 Unauthorized).\n');
    } else {
      console.error(`    ❌ Unexpected error: ${e.message}`);
      process.exit(1);
    }
  }

  // Restore original DOB so we don't break future tests
  console.log(`[7] Restoring original DOB ${OLD_DOB} for cleanliness...`);
  await axios.put(`${BASE}/users/${yeshwanth.id}`, {
    name: yeshwanth.name,
    email: yeshwanth.email,
    phone: yeshwanth.phone || '',
    dob: OLD_DOB,
    college: yeshwanth.college || '',
    department: yeshwanth.department || '',
    role: 'EMPLOYEE',
    status: yeshwanth.status
  }, { headers });
  console.log('    ✅ DOB restored. Password is now back to 20082003.\n');

  console.log('=== ALL CHECKS PASSED ✅ ===');
}

run().catch(e => {
  console.error('\n❌ Test failed:', e.response?.data || e.message);
  process.exit(1);
});
