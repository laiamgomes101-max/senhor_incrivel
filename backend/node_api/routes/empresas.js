import express from 'express';
import pool from '../database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nome, setor, localizacao, sobre, site_url FROM usuarios WHERE tipo = $1', ['empresa']);
    res.json({ empresas: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/me', authenticate, requireRole('empresa'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nome, setor, localizacao, sobre, site_url FROM usuarios WHERE id = $1', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Empresa não encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nome, setor, localizacao, sobre, site_url FROM usuarios WHERE id = $1 AND tipo = $2', [req.params.id, 'empresa']);
    if (rows.length === 0) return res.status(404).json({ error: 'Empresa não encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put('/me', authenticate, requireRole('empresa'), async (req, res) => {
  const { nome, setor, localizacao, sobre, site_url } = req.body;
  try {
    const updateCols = [];
    const values = [];
    let idx = 1;
    if (nome) { updateCols.push(`nome = $${idx++}`); values.push(nome); }
    if (setor) { updateCols.push(`setor = $${idx++}`); values.push(setor); }
    if (localizacao) { updateCols.push(`localizacao = $${idx++}`); values.push(localizacao); }
    if (sobre) { updateCols.push(`sobre = $${idx++}`); values.push(sobre); }
    if (site_url) { updateCols.push(`site_url = $${idx++}`); values.push(site_url); }
    if (values.length === 0) return res.json({ message: 'Nada para atualizar' });
    values.push(req.user.id);
    const query = `UPDATE usuarios SET ${updateCols.join(', ')} WHERE id = $${idx} RETURNING id, nome, setor, localizacao, sobre, site_url`;
    const { rows } = await pool.query(query, values);
    res.json({ message: 'Perfil atualizado', empresa: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;