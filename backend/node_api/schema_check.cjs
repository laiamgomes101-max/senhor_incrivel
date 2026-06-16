const mysql = require('mysql2/promise');
(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: '',
      database: 'plataforma_curriculos'
    });
    const [rows] = await conn.execute('SHOW COLUMNS FROM users');
    console.log(rows);
    await conn.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
