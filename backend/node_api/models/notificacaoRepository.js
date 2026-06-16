import pool from '../database.js';

class NotificacaoRepository {
  async create(notificacaoData) {
    const { user_id, titulo, mensagem, tipo, referencia_id, referencia_tipo } = notificacaoData;

    const query = `
      INSERT INTO notificacoes (user_id, titulo, mensagem, tipo, referencia_id, referencia_tipo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      user_id, titulo, mensagem, tipo, referencia_id, referencia_tipo
    ]);

    return result.rows[0];
  }

  async findByUser(userId, filters = {}) {
    const { lida, tipo } = filters;

    let whereClause = 'user_id = $1';
    let params = [userId];

    if (lida !== undefined) {
      whereClause += ' AND lida = $2';
      params.push(lida);
    }

    if (tipo) {
      whereClause += ' AND tipo = $3';
      params.push(tipo);
    }

    const query = `
      SELECT * FROM notificacoes
      WHERE ${whereClause}
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async findById(id) {
    const query = 'SELECT * FROM notificacoes WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async markAsRead(id, userId) {
    const query = `
      UPDATE notificacoes
      SET lida = true
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }

  async markMultipleAsRead(ids, userId) {
    const query = `
      UPDATE notificacoes
      SET lida = true
      WHERE id = ANY($1) AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [ids, userId]);
    return result.rows;
  }

  async delete(id, userId) {
    const query = 'DELETE FROM notificacoes WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }

  async getUnreadCount(userId) {
    const query = 'SELECT COUNT(*) as count FROM notificacoes WHERE user_id = $1 AND lida = false';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  async findAll(filters = {}, pagination = {}) {
    const { user_id, tipo, lida } = filters;
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];
    let paramIndex = 1;

    if (user_id) {
      whereClause += ` AND user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }

    if (tipo) {
      whereClause += ` AND tipo = $${paramIndex}`;
      params.push(tipo);
      paramIndex++;
    }

    if (lida !== undefined) {
      whereClause += ` AND lida = $${paramIndex}`;
      params.push(lida);
      paramIndex++;
    }

    params.push(limit, offset);

    const query = `
      SELECT * FROM notificacoes
      WHERE 1=1 ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM notificacoes
      WHERE 1=1 ${whereClause}
    `;

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    return {
      notificacoes: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    };
  }


  async notifyCandidatura(candidatoId, vagaId, empresaNome) {
    const titulo = 'Nova candidatura recebida';
    const mensagem = `Você recebeu uma nova candidatura para a vaga "${vagaId}".`;


    const empresaQuery = 'SELECT user_id FROM vagas v JOIN empresas e ON v.empresa_id = e.id WHERE v.id = $1';
    const empresaResult = await pool.query(empresaQuery, [vagaId]);

    if (empresaResult.rows.length > 0) {
      await this.create({
        user_id: empresaResult.rows[0].user_id,
        titulo,
        mensagem,
        tipo: 'candidatura',
        referencia_id: candidatoId,
        referencia_tipo: 'candidatura'
      });
    }
  }

  async notifyStatusChange(candidaturaId, candidatoId, vagaTitulo, novoStatus) {
    const titulo = 'Status da candidatura atualizado';
    const mensagem = `O status da sua candidatura para "${vagaTitulo}" foi alterado para: ${novoStatus}.`;

    await this.create({
      user_id: candidatoId,
      titulo,
      mensagem,
      tipo: 'candidatura',
      referencia_id: candidaturaId,
      referencia_tipo: 'candidatura'
    });
  }
}

export default new NotificacaoRepository();