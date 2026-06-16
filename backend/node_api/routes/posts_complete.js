import express from 'express';
import pool from '../database.js';
import { authenticate } from '../middleware/auth.js';
import { criarNotificacao } from './notificacoes_complete.js';

const router = express.Router();





router.get('/', authenticate, async (req, res) => {
  try {
    console.log('Iniciando busca de posts...');
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const tipo = req.query.tipo; 

    let whereClause = '';
    let params = [userId, limit, offset];

    if (tipo) {
      whereClause = 'AND p.tipo_autor = ?';
      params.push(tipo);
    }

    const query = `
      SELECT
        p.id,
        p.conteudo,
        p.imagem_url,
        p.tipo_autor,
        p.autor_id,
        p.created_at,
        p.updated_at,
        'Sistema' as autor_nome,
        NULL as autor_avatar,
        0 as likes_count,
        0 as comments_count,
        0 as liked_by_user,
        NULL as autor_detalhes
      FROM posts p
      ORDER BY p.created_at DESC
      LIMIT 20 OFFSET 0
    `;

    const result = await pool.query(query);


    const countQuery = `SELECT COUNT(*) as total FROM posts p`;
    const countParams = [];
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      posts: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (err) {
    console.error('Erro ao buscar posts:', err);
    res.status(500).json({ error: err.message });
  }
});





router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;


    const postQuery = `
      SELECT
        p.id,
        p.conteudo,
        p.imagem_url,
        p.tipo_autor,
        p.autor_id,
        p.created_at,
        p.updated_at,
        CASE
          WHEN p.tipo_autor = 'empresa' THEN e.nome
          WHEN p.tipo_autor = 'candidato' THEN c.nome
          ELSE 'Sistema'
        END as autor_nome,
        CASE
          WHEN p.tipo_autor = 'empresa' THEN e.logo_url
          WHEN p.tipo_autor = 'candidato' THEN c.foto_perfil
          ELSE NULL
        END as autor_avatar,
        COALESCE(l.likes_count, 0) as likes_count,
        COALESCE(cm.comments_count, 0) as comments_count,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as liked_by_user
      FROM posts p
      LEFT JOIN (
        SELECT post_id, COUNT(*) as likes_count
        FROM likes
        GROUP BY post_id
      ) l ON p.id = l.post_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as comments_count
        FROM comentarios
        GROUP BY post_id
      ) cm ON p.id = cm.post_id
      LEFT JOIN empresas e ON p.tipo_autor = 'empresa' AND p.autor_id = e.user_id
      LEFT JOIN candidatos c ON p.tipo_autor = 'candidato' AND p.autor_id = c.user_id
      WHERE p.id = ?
    `;

    const postResult = await pool.query(postQuery, [id, userId]);

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post não encontrado' });
    }


    const commentsQuery = `
      SELECT
        cm.id,
        cm.conteudo,
        cm.created_at,
        cm.autor_id,
        cm.tipo_autor,
        CASE
          WHEN cm.tipo_autor = 'empresa' THEN e.nome
          WHEN cm.tipo_autor = 'candidato' THEN c.nome
          ELSE 'Sistema'
        END as autor_nome,
        CASE
          WHEN cm.tipo_autor = 'empresa' THEN e.logo_url
          WHEN cm.tipo_autor = 'candidato' THEN c.foto_perfil
          ELSE NULL
        END as autor_avatar
      FROM comentarios cm
      LEFT JOIN empresas e ON cm.tipo_autor = 'empresa' AND cm.autor_id = e.user_id
      LEFT JOIN candidatos c ON cm.tipo_autor = 'candidato' AND cm.autor_id = c.user_id
      WHERE cm.post_id = ?
      ORDER BY cm.created_at ASC
    `;

    const commentsResult = await pool.query(commentsQuery, [id]);

    res.json({
      post: postResult.rows[0],
      comentarios: commentsResult.rows
    });
  } catch (err) {
    console.error('Erro ao buscar post:', err);
    res.status(500).json({ error: err.message });
  }
});





router.post('/', authenticate, async (req, res) => {
  try {
    const { conteudo, imagem_url } = req.body;
    const userId = req.user.id;
    const tipoAutor = req.user.tipo;

    if (!conteudo || conteudo.trim().length === 0) {
      return res.status(400).json({ error: 'Conteúdo é obrigatório' });
    }

    const result = await pool.query(`
      INSERT INTO posts (conteudo, imagem_url, tipo_autor, autor_id)
      VALUES (?, ?, ?, ?)
      RETURNING *
    `, [conteudo.trim(), imagem_url, tipoAutor, userId]);

    res.status(201).json({ post: result.rows[0] });
  } catch (err) {
    console.error('Erro ao criar post:', err);
    res.status(500).json({ error: err.message });
  }
});





router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { conteudo, imagem_url } = req.body;
    const userId = req.user.id;


    const postCheck = await pool.query(
      'SELECT * FROM posts WHERE id = ? AND autor_id = ?',
      [id, userId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Post não encontrado ou não autorizado' });
    }

    if (!conteudo || conteudo.trim().length === 0) {
      return res.status(400).json({ error: 'Conteúdo é obrigatório' });
    }

    const result = await pool.query(`
      UPDATE posts
      SET conteudo = ?, imagem_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND autor_id = ?
      RETURNING *
    `, [conteudo.trim(), imagem_url, id, userId]);

    res.json({ post: result.rows[0] });
  } catch (err) {
    console.error('Erro ao atualizar post:', err);
    res.status(500).json({ error: err.message });
  }
});





router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;


    let whereClause = 'id = ? AND autor_id = ?';
    let params = [id, userId];

    if (req.user.tipo === 'admin') {
      whereClause = 'id = ?';
      params = [id];
    }

    const result = await pool.query(
      `DELETE FROM posts WHERE ${whereClause} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post não encontrado ou não autorizado' });
    }

    res.json({ message: 'Post deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar post:', err);
    res.status(500).json({ error: err.message });
  }
});





router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;


    const existingLike = await pool.query(
      'SELECT * FROM likes WHERE post_id = ? AND user_id = ?',
      [id, userId]
    );

    if (existingLike.rows.length > 0) {

      await pool.query(
        'DELETE FROM likes WHERE post_id = ? AND user_id = ?',
        [id, userId]
      );
      res.json({ message: 'Post descurtido', liked: false });
    } else {

      await pool.query(
        'INSERT INTO likes (post_id, user_id) VALUES (?, ?)',
        [id, userId]
      );
      res.json({ message: 'Post curtido', liked: true });
    }
  } catch (err) {
    console.error('Erro ao curtir post:', err);
    res.status(500).json({ error: err.message });
  }
});





router.post('/:id/comentario', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { conteudo } = req.body;
    const userId = req.user.id;
    const tipoAutor = req.user.tipo;

    if (!conteudo || conteudo.trim().length === 0) {
      return res.status(400).json({ error: 'Conteúdo do comentário é obrigatório' });
    }


    const postCheck = await pool.query('SELECT * FROM posts WHERE id = ?', [id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post não encontrado' });
    }

    const result = await pool.query(`
      INSERT INTO comentarios (post_id, conteudo, autor_id, tipo_autor)
      VALUES (?, ?, ?, ?)
      RETURNING *
    `, [id, conteudo.trim(), userId, tipoAutor]);


    const post = postCheck.rows[0];
    if (post.autor_id !== userId) {
      await criarNotificacao(
        post.autor_id,
        'Novo comentário',
        `Alguém comentou no seu post: "${conteudo.substring(0, 50)}${conteudo.length > 50 ? '...' : ''}"`,
        'mensagem',
        { post_id: id, comentario_id: result.rows[0].id }
      );
    }

    res.status(201).json({ comentario: result.rows[0] });
  } catch (err) {
    console.error('Erro ao adicionar comentário:', err);
    res.status(500).json({ error: err.message });
  }
});





router.delete('/:postId/comentario/:commentId', authenticate, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.id;


    let whereClause = 'id = $1 AND autor_id = $2';
    let params = [commentId, userId];

    if (req.user.tipo === 'admin') {
      whereClause = 'id = $1';
      params = [commentId];
    }

    const result = await pool.query(
      `DELETE FROM comentarios WHERE ${whereClause} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comentário não encontrado ou não autorizado' });
    }

    res.json({ message: 'Comentário deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar comentário:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;