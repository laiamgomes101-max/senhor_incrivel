import pool from './database.js';

(async () => {
  try {
    const res = await pool.query('SHOW CREATE TABLE candidatos');
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Schema debug error:', err);
  }
})();
