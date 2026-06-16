import express from 'express';
import pool from '../database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();





router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.tipo;
    const stats = {};

    if (userType === 'candidato') {

      const candidatoId = await pool.query('SELECT id FROM candidatos WHERE user_id = $1', [userId]);
      if (candidatoId.rows.length === 0) {
        return res.status(404).json({ error: 'Perfil de candidato não encontrado' });
      }

      const candId = candidatoId.rows[0].id;


      const applicationsByStatus = await pool.query(`
        SELECT status, COUNT(*) as count
        FROM candidaturas
        WHERE candidato_id = $1
        GROUP BY status
      `, [candId]);
      stats.applicationsByStatus = applicationsByStatus.rows;


      const recentApplications = await pool.query(`
        SELECT COUNT(*) as count
        FROM candidaturas
        WHERE candidato_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
      `, [candId]);
      stats.recentApplications = parseInt(recentApplications.rows[0].count);


      const savedJobs = await pool.query(`
        SELECT COUNT(*) as count
        FROM vagas_salvas
        WHERE candidato_id = $1
      `, [candId]);
      stats.savedJobs = parseInt(savedJobs.rows[0].count);


      const curriculumViews = await pool.query(`
        SELECT COUNT(*) as count
        FROM curriculo_visualizacoes
        WHERE curriculo_id = (SELECT id FROM curriculos WHERE candidato_id = $1 LIMIT 1)
      `, [candId]);
      stats.curriculumViews = parseInt(curriculumViews.rows[0].count);

    } else if (userType === 'empresa') {

      const empresaId = await pool.query('SELECT id FROM empresas WHERE user_id = $1', [userId]);
      if (empresaId.rows.length === 0) {
        return res.status(404).json({ error: 'Perfil de empresa não encontrado' });
      }

      const empId = empresaId.rows[0].id;


      const activeJobs = await pool.query(`
        SELECT COUNT(*) as count
        FROM vagas
        WHERE empresa_id = $1 AND ativa = true
      `, [empId]);
      stats.activeJobs = parseInt(activeJobs.rows[0].count);


      const totalApplications = await pool.query(`
        SELECT COUNT(*) as count
        FROM candidaturas c
        JOIN vagas v ON c.vaga_id = v.id
        WHERE v.empresa_id = $1
      `, [empId]);
      stats.totalApplications = parseInt(totalApplications.rows[0].count);


      const applicationsByStatus = await pool.query(`
        SELECT c.status, COUNT(*) as count
        FROM candidaturas c
        JOIN vagas v ON c.vaga_id = v.id
        WHERE v.empresa_id = $1
        GROUP BY c.status
      `, [empId]);
      stats.applicationsByStatus = applicationsByStatus.rows;


      const recentJobs = await pool.query(`
        SELECT COUNT(*) as count
        FROM vagas
        WHERE empresa_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
      `, [empId]);
      stats.recentJobs = parseInt(recentJobs.rows[0].count);

    } else if (userType === 'admin') {

      const totalUsers = await pool.query('SELECT COUNT(*) as count FROM users');
      stats.totalUsers = parseInt(totalUsers.rows[0].count);

      const totalJobs = await pool.query('SELECT COUNT(*) as count FROM vagas WHERE ativa = true');
      stats.totalJobs = parseInt(totalJobs.rows[0].count);

      const totalApplications = await pool.query('SELECT COUNT(*) as count FROM candidaturas');
      stats.totalApplications = parseInt(totalApplications.rows[0].count);

      const totalPosts = await pool.query('SELECT COUNT(*) as count FROM posts');
      stats.totalPosts = parseInt(totalPosts.rows[0].count);
    }

    res.json({ stats });
  } catch (err) {
    console.error('Erro ao buscar estatísticas do dashboard:', err);
    res.status(500).json({ error: err.message });
  }
});





router.get('/gerais', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const stats = {};


    const usersByType = await pool.query(`
      SELECT tipo, COUNT(*) as count
      FROM users
      GROUP BY tipo
    `);
    stats.usersByType = usersByType.rows;


    const jobsByStatus = await pool.query(`
      SELECT ativa, COUNT(*) as count
      FROM vagas
      GROUP BY ativa
    `);
    stats.jobsByStatus = jobsByStatus.rows;


    const applicationsByStatus = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM candidaturas
      GROUP BY status
    `);
    stats.applicationsByStatus = applicationsByStatus.rows;


    const topSectors = await pool.query(`
      SELECT setor, COUNT(*) as count
      FROM empresas
      WHERE setor IS NOT NULL
      GROUP BY setor
      ORDER BY count DESC
      LIMIT 10
    `);
    stats.topSectors = topSectors.rows;


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


    const engagement = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM posts) as total_posts,
        (SELECT COUNT(*) FROM likes) as total_likes,
        (SELECT COUNT(*) FROM comentarios) as total_comments,
        (SELECT COUNT(*) FROM notificacoes WHERE lida = false) as unread_notifications
    `);
    stats.engagement = engagement.rows[0];

    res.json({ stats });
  } catch (err) {
    console.error('Erro ao buscar estatísticas gerais:', err);
    res.status(500).json({ error: err.message });
  }
});





router.get('/temporais', authenticate, requireRole('admin'), async (req, res) => {
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


    const postsByMonth = await pool.query(`
      SELECT
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as count
      FROM posts
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `);
    stats.postsByMonth = postsByMonth.rows;

    res.json({ stats });
  } catch (err) {
    console.error('Erro ao buscar estatísticas temporais:', err);
    res.status(500).json({ error: err.message });
  }
});





router.get('/empresa/:empresaId', authenticate, async (req, res) => {
  try {
    const { empresaId } = req.params;
    const userId = req.user.id;
    const userType = req.user.tipo;


    if (userType !== 'admin') {
      const empresaCheck = await pool.query('SELECT user_id FROM empresas WHERE id = $1', [empresaId]);
      if (empresaCheck.rows.length === 0 || empresaCheck.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
    }

    const stats = {};


    const empresaInfo = await pool.query(`
      SELECT nome, setor, created_at
      FROM empresas
      WHERE id = $1
    `, [empresaId]);
    stats.empresa = empresaInfo.rows[0];


    const activeJobs = await pool.query(`
      SELECT COUNT(*) as count
      FROM vagas
      WHERE empresa_id = $1 AND ativa = true
    `, [empresaId]);
    stats.activeJobs = parseInt(activeJobs.rows[0].count);


    const totalApplications = await pool.query(`
      SELECT COUNT(*) as count
      FROM candidaturas c
      JOIN vagas v ON c.vaga_id = v.id
      WHERE v.empresa_id = $1
    `, [empresaId]);
    stats.totalApplications = parseInt(totalApplications.rows[0].count);


    const applicationsByStatus = await pool.query(`
      SELECT c.status, COUNT(*) as count
      FROM candidaturas c
      JOIN vagas v ON c.vaga_id = v.id
      WHERE v.empresa_id = $1
      GROUP BY c.status
    `, [empresaId]);
    stats.applicationsByStatus = applicationsByStatus.rows;


    const popularJobs = await pool.query(`
      SELECT
        v.titulo,
        COUNT(c.id) as candidaturas_count
      FROM vagas v
      LEFT JOIN candidaturas c ON v.id = c.vaga_id
      WHERE v.empresa_id = $1
      GROUP BY v.id, v.titulo
      ORDER BY candidaturas_count DESC
      LIMIT 5
    `, [empresaId]);
    stats.popularJobs = popularJobs.rows;

    res.json({ stats });
  } catch (err) {
    console.error('Erro ao buscar estatísticas da empresa:', err);
    res.status(500).json({ error: err.message });
  }
});





router.get('/candidato/:candidatoId', authenticate, async (req, res) => {
  try {
    const { candidatoId } = req.params;
    const userId = req.user.id;
    const userType = req.user.tipo;


    if (userType !== 'admin') {
      const candidatoCheck = await pool.query('SELECT user_id FROM candidatos WHERE id = $1', [candidatoId]);
      if (candidatoCheck.rows.length === 0 || candidatoCheck.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
    }

    const stats = {};


    const candidatoInfo = await pool.query(`
      SELECT nome, headline, created_at
      FROM candidatos
      WHERE id = $1
    `, [candidatoId]);
    stats.candidato = candidatoInfo.rows[0];


    const applicationsByStatus = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM candidaturas
      WHERE candidato_id = $1
      GROUP BY status
    `, [candidatoId]);
    stats.applicationsByStatus = applicationsByStatus.rows;


    const savedJobs = await pool.query(`
      SELECT COUNT(*) as count
      FROM vagas_salvas
      WHERE candidato_id = $1
    `, [candidatoId]);
    stats.savedJobs = parseInt(savedJobs.rows[0].count);


    const curriculumViews = await pool.query(`
      SELECT COUNT(*) as count
      FROM curriculo_visualizacoes
      WHERE curriculo_id = (SELECT id FROM curriculos WHERE candidato_id = $1 LIMIT 1)
    `, [candidatoId]);
    stats.curriculumViews = parseInt(curriculumViews.rows[0].count);


    const recentApplications = await pool.query(`
      SELECT COUNT(*) as count
      FROM candidaturas
      WHERE candidato_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
    `, [candidatoId]);
    stats.recentApplications = parseInt(recentApplications.rows[0].count);

    res.json({ stats });
  } catch (err) {
    console.error('Erro ao buscar estatísticas do candidato:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;