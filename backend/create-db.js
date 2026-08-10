const mysql = require('mysql2/promise');

async function tryPasswords() {
  const passwords = ['root', '1234', '123456', 'admin', 'password', 'mysql', '12345'];
  for (let pwd of passwords) {
    try {
      const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: pwd });
      console.log('SUCCESS with password:', pwd);
      await conn.query('CREATE DATABASE IF NOT EXISTS clarity_crm;');
      console.log('Database clarity_crm created!');
      await conn.end();
      return;
    } catch (e) {
      if (e.code === 'ER_ACCESS_DENIED_ERROR') {
        console.log('Failed password:', pwd);
      } else {
        console.log('Error with', pwd, e.message);
      }
    }
  }
  console.log('ALL PASSWORDS FAILED');
}
tryPasswords();
