const axios = require('axios');

async function testLogin() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      userId: 'Praveen.natarajan.in@gmail.com',
      password: '26092026'
    });
    console.log('✅ Login SUCCESSFUL!');
    console.log('User Role:', res.data.user.role);
    console.log('User Name:', res.data.user.name);
    console.log('Token received:', res.data.token ? 'YES' : 'NO');
  } catch (err) {
    console.error('❌ Login FAILED:', err.response?.data || err.message);
  }
}

testLogin();
