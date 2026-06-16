import pool from '../database.js';

class CandidaturaRepository {
  async create(candidaturaData) {
    const { vaga_id, candidato_id, curriculo_id } = candidaturaData;

    const query = `
      INSERT INTO candidaturas (vaga_id, candidato_id, curriculo_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await pool.query(query, [vaga_id, candidato_id, curriculo_id]);
    return result.rows[0];
  }

  async findById(id) {
    const query = `
      SELECT c.*,
             v.titulo as vaga_titulo,
             cand.nome as candidato_nome,
             e.nome as empresa_nome
      FROM candidaturas c
      JOIN vagas v ON c.vaga_id = v.id
      JOIN candidatos cand ON c.candidato_id = cand.id
      JOIN empresas e ON v.empresa_id = e.id
      WHERE c.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async findByVaga(vagaId) {
    const query = `
      SELECT c.*, cand.nome as candidato_nome, cand.foto_url as candidato_foto,
             curr.arquivo_url as curriculo_url
      FROM candidaturas c
      JOIN candidatos cand ON c.candidato_id = cand.id
      LEFT JOIN curriculos curr ON c.curriculo_id = curr.id
      WHERE c.vaga_id = $1
      ORDER BY c.created_at DESC
    `;
    const result = await pool.query(query, [vagaId]);
    return result.rows;
  }

  async findByCandidato(candidatoId) {
    const query = `
      SELECT c.*, v.titulo as vaga_titulo, e.nome as empresa_nome,
             v.localizacao as vaga_localizacao
      FROM candidaturas c
      JOIN vagas v ON c.vaga_id = v.id
      JOIN empresas e ON v.empresa_id = e.id
      WHERE c.candidato_id = $1
      ORDER BY c.created_at DESC
    `;
    const result = await pool.query(query, [candidatoId]);
    return result.rows;
  }

  async updateStatus(id, statusData) {
    const { status, score_analise, feedback } = statusData;

    const query = `
      UPDATE candidaturas
      SET status = $1, score_analise = $2, feedback = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;

    const result = await pool.query(query, [status, score_analise, feedback, id]);
    return result.rows[0];
  }

  async delete(id) {
    const query = 'DELETE FROM candidaturas WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async exists(vagaId, candidatoId) {
    const query = 'SELECT id FROM candidaturas WHERE vaga_id = $1 AND candidato_id = $2';
    const result = await pool.query(query, [vagaId, candidatoId]);
    return result.rows.length > 0;
  }

  async findAll(filters = {}, pagination = {}) {
    const { vaga_id, candidato_id, status } = filters;
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];
    let paramIndex = 1;

    if (vaga_id) {
      whereClause += ` AND c.vaga_id = $${paramIndex}`;
      params.push(vaga_id);
      paramIndex++;
    }

    if (candidato_id) {
      whereClause += ` AND c.candidato_id = $${paramIndex}`;
      params.push(candidato_id);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    params.push(limit, offset);

    const query = `
      SELECT c.*,
             v.titulo as vaga_titulo,
             cand.nome as candidato_nome,
             e.nome as empresa_nome
      FROM candidaturas c
      JOIN vagas v ON c.vaga_id = v.id
      JOIN candidatos cand ON c.candidato_id = cand.id
      JOIN empresas e ON v.empresa_id = e.id
      WHERE 1=1 ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM candidaturas c
      WHERE 1=1 ${whereClause}
    `;

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    return {
      candidaturas: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    };
  }

  async getStats(vagaId) {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
        COUNT(CASE WHEN status = 'em_analise' THEN 1 END) as em_analise,
        COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados,
        COUNT(CASE WHEN status = 'rejeitado' THEN 1 END) as rejeitados
      FROM candidaturas
      WHERE vaga_id = $1
    `;
    const result = await pool.query(query, [vagaId]);
    return result.rows[0];
  }
}

export default new CandidaturaRepository();