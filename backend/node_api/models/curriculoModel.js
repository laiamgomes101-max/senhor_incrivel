import pool from '../database.js';

export async function criarCurriculo(usuarioId, texto) {
  const res = await pool.query(
    'INSERT INTO curriculos (usuario_id, texto_completo) VALUES ($1,$2) RETURNING *',
    [usuarioId, texto]
  );
  return res.rows[0];
}

export async function listarCurriculosUsuario(usuarioId) {
  const res = await pool.query('SELECT * FROM curriculos WHERE usuario_id=$1', [usuarioId]);
  return res.rows;
}