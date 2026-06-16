import express from 'express';
import pool from '../database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();





router.get('/dashboard', authenticate, requireRole('admin'), async (req, res) => {
  try {

    const stats = {};


    const usersByType = await pool.query(`
      SELECT tipo, COUNT(*) as count
      FROM users
      GROUP BY tipo
    `);
    stats.usersByType = usersByType.rows;


    const activeJobs = await pool.query(`
      SELECT COUNT(*) as count FROM vagas WHERE ativa = true
    `);
    stats.activeJobs = parseInt(activeJobs.rows[0].count);


    const applicationsByStatus = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM candidaturas
      GROUP BY status
    `);
    stats.applicationsByStatus = applicationsByStatus.rows;


    const last30Days = await pool.query(`
      SELECT
        COUNT(DISTINCT u.id) as new_users,
        COUNT(DISTINCT v.id) as new_jobs,
        COUNT(DISTINCT c.id) as new_applications
      FROM users u
      FULL OUTER JOIN vagas v ON v.created_at >= NOW() - INTERVAL '30 days'
      FULL OUTER JOIN candidaturas c ON c.created_at >= NOW() - INTERVAL '30 days'
      WHERE u.created_at >= NOW() - INTERVAL '30 days'
    `);
    stats.last30Days = last30Days.rows[0];

    res.json({ stats });
  } catch (err) {
    console.error('Erro no dashboard admin:', err);
    res.status(500).json({ error: err.message });
  }
});





router.get('/usuarios', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let whereClause = '';
    let params = [limit, offset];

    if (search) {
      whereClause = `WHERE u.email ILIKE $3 OR
                        CASE WHEN u.tipo = 'candidato' THEN c.nome
                             WHEN u.tipo = 'empresa' THEN e.nome
                             ELSE '' END ILIKE $3`;
      params = [limit, offset, `%${search}%`];
    }

    const query = `
      SELECT
        u.id, u.email, u.tipo, u.created_at,
        CASE WHEN u.tipo = 'candidato' THEN c.nome
             WHEN u.tipo = 'empresa' THEN e.nome
             ELSE 'Admin' END as nome,
        CASE WHEN u.tipo = 'candidato' THEN c.headline
             WHEN u.tipo = 'empresa' THEN e.setor
             ELSE '' END as info_adicional
      FROM users u
      LEFT JOIN candidatos c ON u.id = c.user_id
      LEFT JOIN empresas e ON u.id = e.user_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, params);


    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN candidatos c ON u.id = c.user_id
      LEFT JOIN empresas e ON u.id = e.user_id
      ${whereClause.replace('$3', '$1')}
    `;
    const countParams = search ? [`%${search}%`] : [];
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      usuarios: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    res.status(500).json({ error: err.message });
  }
});





router.put('/usuarios/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, tipo, nome } = req.body;


    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }


    if (email || tipo) {
      let updateFields = [];
      let params = [];
      let paramCount = 1;

      if (email) {
        updateFields.push(`email = $${paramCount++}`);
        params.push(email);
      }
      if (tipo) {
        updateFields.push(`tipo = $${paramCount++}`);
        params.push(tipo);
      }

      params.push(id);
      await pool.query(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
        params
      );
    }


    if (nome) {
      const user = userCheck.rows[0];
      if (user.tipo === 'candidato') {
        await pool.query('UPDATE candidatos SET nome = $1 WHERE user_id = $2', [nome, id]);
      } else if (user.tipo === 'empresa') {
        await pool.query('UPDATE empresas SET nome = $1 WHERE user_id = $2', [nome, id]);
      }
    }

    res.json({ message: 'Usuário atualizado com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    res.status(500).json({ error: err.message });
  }
});





router.delete('/usuarios/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;


    const adminCount = await pool.query("SELECT COUNT(*) as count FROM users WHERE tipo = 'admin'");
    const userCheck = await pool.query('SELECT tipo FROM users WHERE id = $1', [id]);

    if (userCheck.rows[0].tipo === 'admin' && parseInt(adminCount.rows[0].count) <= 1) {
      return res.status(400).json({ error: 'Não é possível deletar o último administrador' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar usuário:', err);
    res.status(500).json({ error: err.message });
  }
});





router.get('/estatisticas', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const stats = {};


    const usersByMonth = await pool.query(`
      SELECT
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `);
    stats.usersByMonth = usersByMonth.rows;


    const jobsByMonth = await pool.query(`
      SELECT
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as count
      FROM vagas
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `);
    stats.jobsByMonth = jobsByMonth.rows;


    const applicationsByMonth = await pool.query(`
      SELECT
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as count
      FROM candidaturas
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `);
    stats.applicationsByMonth = applicationsByMonth.rows;


    const topCompanies = await pool.query(`
      SELECT
        e.nome,
        COUNT(c.id) as candidaturas_count
      FROM empresas e
      JOIN vagas v ON e.id = v.empresa_id
      JOIN candidaturas c ON v.id = c.vaga_id
      GROUP BY e.id, e.nome
      ORDER BY candidaturas_count DESC
      LIMIT 10
    `);
    stats.topCompanies = topCompanies.rows;


    const salaryRanges = await pool.query(`
      SELECT
        CASE
          WHEN salario_max < 3000 THEN 'Até R$ 3.000'
          WHEN salario_max < 5000 THEN 'R$ 3.000 - R$ 5.000'
          WHEN salario_max < 8000 THEN 'R$ 5.000 - R$ 8.000'
          WHEN salario_max < 12000 THEN 'R$ 8.000 - R$ 12.000'
          ELSE 'Acima de R$ 12.000'
        END as range,
        COUNT(*) as count
      FROM vagas
      WHERE salario_max IS NOT NULL AND ativa = true
      GROUP BY range
      ORDER BY count DESC
    `);
    stats.salaryRanges = salaryRanges.rows;

    res.json({ stats });
  } catch (err) {
    console.error('Erro ao buscar estatísticas:', err);
    res.status(500).json({ error: err.message });
  }
});





router.post('/usuarios/:id/bloquear', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;



    await pool.query(`
      INSERT INTO audit_logs (user_id, acao, tabela, registro_id, dados_novos)
      VALUES ($1, 'bloquear_usuario', 'users', $2, '{"acao": "bloquear"}')
    `, [req.user.id, id]);

    res.json({ message: 'Usuário bloqueado com sucesso' });
  } catch (err) {
    console.error('Erro ao bloquear usuário:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;