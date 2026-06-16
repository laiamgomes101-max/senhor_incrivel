import pool from '../database.js';

export async function criarUsuario(email, senha, tipo) {
  const result = await pool.query(
    'INSERT INTO usuarios (email, senha, tipo) VALUES ($1,$2,$3) RETURNING *',
    [email, senha, tipo]
  );
  return result.rows[0];
}

export async function buscarPorEmail(email) {
  const res = await pool.query('SELECT * FROM usuarios WHERE email=$1', [email]);
  return res.rows[0];
}

export async function buscarPorId(id) {
  const res = await pool.query('SELECT * FROM usuarios WHERE id=$1', [id]);
  return res.rows[0];
}