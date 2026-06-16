import express from 'express';
import pool from '../database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();





router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const unreadOnly = req.query.unread_only === 'true';

    let whereClause = 'WHERE n.user_id = $1';
    let params = [userId];

    if (unreadOnly) {
      whereClause += ' AND n.lida = false';
    }

    const query = `
      SELECT
        n.id,
        n.titulo,
        n.mensagem,
        n.tipo,
        n.lida,
        n.created_at,
        n.dados_adicionais,
        CASE
          WHEN n.tipo = 'candidatura' THEN json_build_object('vaga_id', n.dados_adicionais->>'vaga_id', 'empresa_nome', n.dados_adicionais->>'empresa_nome')
          WHEN n.tipo = 'mensagem' THEN json_build_object('remetente_id', n.dados_adicionais->>'remetente_id', 'remetente_nome', n.dados_adicionais->>'remetente_nome')
          WHEN n.tipo = 'sistema' THEN n.dados_adicionais
          ELSE n.dados_adicionais
        END as dados_formatados
      FROM notificacoes n
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);
    const result = await pool.query(query, params);


    const countQuery = `
      SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE lida = false) as unread_count
      FROM notificacoes
      WHERE user_id = $1 ${unreadOnly ? 'AND lida = false' : ''}
    `;
    const countResult = await pool.query(countQuery, [userId]);

    res.json({
      notificacoes: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        unread_count: parseInt(countResult.rows[0].unread_count),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (err) {
    console.error('Erro ao buscar notificações:', err);
    res.status(500).json({ error: err.message });
  }
});





router.put('/:id/lida', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'UPDATE notificacoes SET lida = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    res.json({ message: 'Notificação marcada como lida', notificacao: result.rows[0] });
  } catch (err) {
    console.error('Erro ao marcar notificação como lida:', err);
    res.status(500).json({ error: err.message });
  }
});





router.put('/lidas', authenticate, async (req, res) => {
  try {
    const { ids } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Lista de IDs inválida' });
    }

    const result = await pool.query(
      'UPDATE notificacoes SET lida = true WHERE id = ANY($1) AND user_id = $2 RETURNING *',
      [ids, userId]
    );

    res.json({
      message: `${result.rows.length} notificações marcadas como lidas`,
      notificacoes: result.rows
    });
  } catch (err) {
    console.error('Erro ao marcar notificações como lidas:', err);
    res.status(500).json({ error: err.message });
  }
});





router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM notificacoes WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    res.json({ message: 'Notificação deletada com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar notificação:', err);
    res.status(500).json({ error: err.message });
  }
});





router.post('/', authenticate, async (req, res) => {
  try {
    const { user_id, titulo, mensagem, tipo, dados_adicionais } = req.body;



    if (req.user.tipo !== 'admin' && req.user.id !== user_id) {
      return res.status(403).json({ error: 'Permissão negada' });
    }

    const result = await pool.query(`
      INSERT INTO notificacoes (user_id, titulo, mensagem, tipo, dados_adicionais)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [user_id, titulo, mensagem, tipo, JSON.stringify(dados_adicionais || {})]);

    res.status(201).json({ notificacao: result.rows[0] });
  } catch (err) {
    console.error('Erro ao criar notificação:', err);
    res.status(500).json({ error: err.message });
  }
});





router.get('/count', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notificacoes WHERE user_id = $1 AND lida = false',
      [userId]
    );

    res.json({ unread_count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('Erro ao contar notificações:', err);
    res.status(500).json({ error: err.message });
  }
});




export const criarNotificacao = async (userId, titulo, mensagem, tipo, dadosAdicionais = {}) => {
  try {
    await pool.query(`
      INSERT INTO notificacoes (user_id, titulo, mensagem, tipo, dados_adicionais)
      VALUES ($1, $2, $3, $4, $5)
    `, [userId, titulo, mensagem, tipo, JSON.stringify(dadosAdicionais)]);
  } catch (err) {
    console.error('Erro ao criar notificação:', err);
  }
};

export default router;