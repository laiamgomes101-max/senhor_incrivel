import pool from '../database.js';

export async function criarCandidatura(vagaId, candidatoId) {
  const res = await pool.query(
    'INSERT INTO candidaturas (vaga_id, candidato_id) VALUES ($1,$2) RETURNING *',
    [vagaId, candidatoId]
  );
  return res.rows[0];
}

export async function listarPorVaga(vagaId) {
  const res = await pool.query('SELECT * FROM candidaturas WHERE vaga_id=$1', [vagaId]);
  return res.rows;
}