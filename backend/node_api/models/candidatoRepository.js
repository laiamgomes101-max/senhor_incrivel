import pool from '../database.js';

class CandidatoRepository {
  async create(candidatoData) {
    const {
      user_id,
      nome,
      foto_url,
      headline,
      localizacao,
      sobre,
      linkedin_url,
      github_url,
      portfolio_url
    } = candidatoData;

    const query = `
      INSERT INTO candidatos (
        user_id, nome, foto_url, headline, localizacao,
        sobre, linkedin_url, github_url, portfolio_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await pool.query(query, [
      user_id, nome, foto_url, headline, localizacao,
      sobre, linkedin_url, github_url, portfolio_url
    ]);

    return result.rows[0];
  }

  async findByUserId(userId) {
    const query = 'SELECT * FROM candidatos WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  async findById(id) {
    const query = 'SELECT * FROM candidatos WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async update(id, candidatoData) {
    const {
      nome,
      foto_url,
      headline,
      localizacao,
      sobre,
      linkedin_url,
      github_url,
      portfolio_url
    } = candidatoData;

    const query = `
      UPDATE candidatos
      SET nome = $1, foto_url = $2, headline = $3, localizacao = $4,
          sobre = $5, linkedin_url = $6, github_url = $7, portfolio_url = $8,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `;

    const result = await pool.query(query, [
      nome, foto_url, headline, localizacao, sobre,
      linkedin_url, github_url, portfolio_url, id
    ]);

    return result.rows[0];
  }

  async delete(id) {
    const query = 'DELETE FROM candidatos WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async findAll(filters = {}, pagination = {}) {
    const { search, localizacao } = filters;
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (nome ILIKE $${paramIndex} OR headline ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (localizacao) {
      whereClause += ` AND localizacao ILIKE $${paramIndex}`;
      params.push(`%${localizacao}%`);
      paramIndex++;
    }

    params.push(limit, offset);

    const query = `
      SELECT * FROM candidatos
      WHERE 1=1 ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM candidatos
      WHERE 1=1 ${whereClause}
    `;

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    return {
      candidatos: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    };
  }
}

export default new CandidatoRepository();