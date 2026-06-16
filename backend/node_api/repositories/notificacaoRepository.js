import pool from '../database.js';

class NotificacaoRepository {
  async createNotificacao(notificacaoData) {
    const {
      usuario_id,
      tipo,
      titulo,
      mensagem,
      dados_adicionais,
      lida,
      data_envio
    } = notificacaoData;

    const query = `
      INSERT INTO notificacoes (
        usuario_id, tipo, titulo, mensagem, dados_adicionais,
        lida, data_envio, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      usuario_id,
      tipo,
      titulo,
      mensagem,
      dados_adicionais ? JSON.stringify(dados_adicionais) : null,
      lida || false,
      data_envio || new Date()
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getNotificacaoById(id) {
    const query = `
      SELECT n.*, u.nome as usuario_nome, u.email as usuario_email,
             u.role as usuario_role
      FROM notificacoes n
      JOIN usuarios u ON n.usuario_id = u.id
      WHERE n.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async getNotificacoesByUsuarioId(usuarioId, filters = {}) {
    const { lida, tipo, limit = 50, offset = 0 } = filters;

    let query = `
      SELECT n.*, u.nome as usuario_nome, u.email as usuario_email
      FROM notificacoes n
      JOIN usuarios u ON n.usuario_id = u.id
      WHERE n.usuario_id = $1
    `;

    const values = [usuarioId];
    let paramCount = 1;

    if (lida !== undefined) {
      paramCount++;
      query += ` AND n.lida = $${paramCount}`;
      values.push(lida);
    }

    if (tipo) {
      paramCount++;
      query += ` AND n.tipo = $${paramCount}`;
      values.push(tipo);
    }

    query += ` ORDER BY n.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  async getNotificacoesNaoLidasByUsuarioId(usuarioId, limit = 20) {
    const query = `
      SELECT n.*, u.nome as usuario_nome, u.email as usuario_email
      FROM notificacoes n
      JOIN usuarios u ON n.usuario_id = u.id
      WHERE n.usuario_id = $1 AND n.lida = false
      ORDER BY n.created_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [usuarioId, limit]);
    return result.rows;
  }

  async marcarComoLida(id, usuarioId) {
    const query = `
      UPDATE notificacoes
      SET lida = true, updated_at = NOW()
      WHERE id = $1 AND usuario_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [id, usuarioId]);
    return result.rows[0];
  }

  async marcarTodasComoLidas(usuarioId) {
    const query = `
      UPDATE notificacoes
      SET lida = true, updated_at = NOW()
      WHERE usuario_id = $1 AND lida = false
      RETURNING *
    `;
    const result = await pool.query(query, [usuarioId]);
    return result.rows;
  }

  async updateNotificacao(id, updateData) {
    const { titulo, mensagem, dados_adicionais, lida } = updateData;

    const query = `
      UPDATE notificacoes
      SET
        titulo = COALESCE($1, titulo),
        mensagem = COALESCE($2, mensagem),
        dados_adicionais = COALESCE($3, dados_adicionais),
        lida = COALESCE($4, lida),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;

    const values = [
      titulo,
      mensagem,
      dados_adicionais ? JSON.stringify(dados_adicionais) : null,
      lida,
      id
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async deleteNotificacao(id) {
    const query = `DELETE FROM notificacoes WHERE id = $1`;
    await pool.query(query, [id]);
  }

  async deleteNotificacoesAntigas(dias = 30) {
    const query = `
      DELETE FROM notificacoes
      WHERE created_at < NOW() - INTERVAL '${dias} days'
      AND lida = true
    `;
    const result = await pool.query(query);
    return result.rowCount;
  }

  async getNotificacoesByTipo(tipo, limit = 100) {
    const query = `
      SELECT n.*, u.nome as usuario_nome, u.email as usuario_email
      FROM notificacoes n
      JOIN usuarios u ON n.usuario_id = u.id
      WHERE n.tipo = $1
      ORDER BY n.created_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [tipo, limit]);
    return result.rows;
  }

  async getNotificacaoStats(usuarioId = null) {
    let query;
    let values = [];

    if (usuarioId) {
      query = `
        SELECT
          COUNT(*) as total_notificacoes,
          COUNT(CASE WHEN lida = false THEN 1 END) as nao_lidas,
          COUNT(CASE WHEN tipo = 'candidatura' THEN 1 END) as candidaturas,
          COUNT(CASE WHEN tipo = 'vaga' THEN 1 END) as vagas,
          COUNT(CASE WHEN tipo = 'sistema' THEN 1 END) as sistema,
          COUNT(CASE WHEN tipo = 'mensagem' THEN 1 END) as mensagens
        FROM notificacoes
        WHERE usuario_id = $1
      `;
      values = [usuarioId];
    } else {
      query = `
        SELECT
          COUNT(*) as total_notificacoes,
          COUNT(CASE WHEN lida = false THEN 1 END) as nao_lidas,
          COUNT(CASE WHEN tipo = 'candidatura' THEN 1 END) as candidaturas,
          COUNT(CASE WHEN tipo = 'vaga' THEN 1 END) as vagas,
          COUNT(CASE WHEN tipo = 'sistema' THEN 1 END) as sistema,
          COUNT(CASE WHEN tipo = 'mensagem' THEN 1 END) as mensagens
        FROM notificacoes
      `;
    }

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getNotificacoesRecentes(limit = 20) {
    const query = `
      SELECT n.*, u.nome as usuario_nome, u.email as usuario_email
      FROM notificacoes n
      JOIN usuarios u ON n.usuario_id = u.id
      ORDER BY n.created_at DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  async createNotificacaoBulk(notificacoes) {
    if (!notificacoes.length) return [];

    const values = [];
    const placeholders = [];

    notificacoes.forEach((notificacao, index) => {
      const offset = index * 7;
      placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`);
      values.push(
        notificacao.usuario_id,
        notificacao.tipo,
        notificacao.titulo,
        notificacao.mensagem,
        notificacao.dados_adicionais ? JSON.stringify(notificacao.dados_adicionais) : null,
        notificacao.lida || false,
        notificacao.data_envio || new Date()
      );
    });

    const query = `
      INSERT INTO notificacoes (
        usuario_id, tipo, titulo, mensagem, dados_adicionais, lida, data_envio
      ) VALUES ${placeholders.join(', ')}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  async getNotificacoesByDateRange(startDate, endDate, usuarioId = null) {
    let query = `
      SELECT n.*, u.nome as usuario_nome, u.email as usuario_email
      FROM notificacoes n
      JOIN usuarios u ON n.usuario_id = u.id
      WHERE n.created_at BETWEEN $1 AND $2
    `;

    const values = [startDate, endDate];

    if (usuarioId) {
      query += ` AND n.usuario_id = $3`;
      values.push(usuarioId);
    }

    query += ` ORDER BY n.created_at DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  async searchNotificacoes(searchTerm, usuarioId = null, limit = 50) {
    let query = `
      SELECT n.*, u.nome as usuario_nome, u.email as usuario_email
      FROM notificacoes n
      JOIN usuarios u ON n.usuario_id = u.id
      WHERE (n.titulo ILIKE $1 OR n.mensagem ILIKE $1)
    `;

    const values = [`%${searchTerm}%`];

    if (usuarioId) {
      query += ` AND n.usuario_id = $2`;
      values.push(usuarioId);
    }

    query += ` ORDER BY n.created_at DESC LIMIT $${values.length + 1}`;
    values.push(limit);

    const result = await pool.query(query, values);
    return result.rows;
  }
}

export default new NotificacaoRepository();