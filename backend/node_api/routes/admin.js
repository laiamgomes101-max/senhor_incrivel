import express from 'express';
import pool from '../database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();


router.use(authenticate, requireRole('admin'));


router.get('/usuarios', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nome, email, tipo, criado_em FROM usuarios');
    res.json({ usuarios: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/usuarios/:id/bloquear', async (req, res) => {
  try {
    await pool.query('UPDATE usuarios SET tipo = $1 WHERE id=$2', ['bloqueado', req.params.id]);
    res.json({ message: 'Usuário bloqueado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/empresas', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM usuarios WHERE tipo='empresa'");
    res.json({ empresas: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/empresas/:id/aprovar', async (req, res) => {
  try {
    await pool.query("UPDATE usuarios SET tipo='empresa' WHERE id=$1", [req.params.id]);
    res.json({ message: 'Empresa aprovada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/vagas', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM vagas');
    res.json({ vagas: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/vagas/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM vagas WHERE id=$1', [req.params.id]);
    res.json({ message: 'Vaga removida' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/stats', async (req, res) => {
  try {
    const usuarios = await pool.query('SELECT COUNT(*) FROM usuarios');
    const empresas = await pool.query("SELECT COUNT(*) FROM usuarios WHERE tipo='empresa'");
    const vagas = await pool.query('SELECT COUNT(*) FROM vagas');
    res.json({
      totalUsuarios: usuarios.rows[0].count,
      totalEmpresas: empresas.rows[0].count,
      totalVagas: vagas.rows[0].count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;