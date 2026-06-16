import pool from '../database.js';

function parseVaga(row) {
  if (row.requisitos && typeof row.requisitos === 'string') {
    try {
      row.requisitos = JSON.parse(row.requisitos);
    } catch (e) {

      if (row.requisitos.startsWith('[')) {
        try { row.requisitos = JSON.parse(row.requisitos.replace(/\[object Object\]/g,'""')); } catch{};
      }
    }
  }
  if (!Array.isArray(row.requisitos)) row.requisitos = [];
  return row;
}

export async function criarVaga(empresaId, titulo, descricao, requisitos) {
  const res = await pool.query(
    'INSERT INTO vagas (empresa_id, titulo, descricao, requisitos) VALUES ($1,$2,$3,$4) RETURNING *',
    [empresaId, titulo, descricao, JSON.stringify(requisitos || [])]
  );
  return parseVaga(res.rows[0]);
}

export async function listarVagas() {
  const res = await pool.query('SELECT * FROM vagas');
  return res.rows.map(parseVaga);
}

export async function obterVaga(id) {
  const res = await pool.query('SELECT * FROM vagas WHERE id=$1', [id]);
  return res.rows[0] ? parseVaga(res.rows[0]) : undefined;
}

export async function atualizarVaga(id, updates) {
  const sets = [];
  const values = [];
  let idx = 1;
  for (const key of ['titulo','descricao','requisitos','tipo_contrato','ativa']) {
    if (updates[key] !== undefined) {
      sets.push(`${key}=$${idx++}`);
      if (key === 'requisitos') {
        values.push(JSON.stringify(updates[key]));
      } else {
        values.push(updates[key]);
      }
    }
  }
  if (sets.length === 0) return await obterVaga(id);
  values.push(id);
  const query = `UPDATE vagas SET ${sets.join(',')} WHERE id=$${idx} RETURNING *`;
  const res = await pool.query(query, values);
  return parseVaga(res.rows[0]);
}