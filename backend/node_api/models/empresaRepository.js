import pool from '../database.js';

class EmpresaRepository {
  async create(empresaData) {
    const {
      user_id,
      nome,
      logo_url,
      setor,
      localizacao,
      sobre,
      site_url,
      tamanho_empresa
    } = empresaData;

    const query = `
      INSERT INTO empresas (
        user_id, nome, logo_url, setor, localizacao,
        sobre, site_url, tamanho_empresa
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(query, [
      user_id, nome, logo_url, setor, localizacao,
      sobre, site_url, tamanho_empresa
    ]);

    return result.rows[0];
  }

  async findByUserId(userId) {
    const query = 'SELECT * FROM empresas WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  async findById(id) {
    const query = 'SELECT * FROM empresas WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async update(id, empresaData) {
    const {
      nome,
      logo_url,
      setor,
      localizacao,
      sobre,
      site_url,
      tamanho_empresa
    } = empresaData;

    const query = `
      UPDATE empresas
      SET nome = $1, logo_url = $2, setor = $3, localizacao = $4,
          sobre = $5, site_url = $6, tamanho_empresa = $7,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;

    const result = await pool.query(query, [
      nome, logo_url, setor, localizacao, sobre, site_url, tamanho_empresa, id
    ]);

    return result.rows[0];
  }

  async delete(id) {
    const query = 'DELETE FROM empresas WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async findAll(filters = {}, pagination = {}) {
    const { search, setor, localizacao } = filters;
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (nome ILIKE $${paramIndex} OR sobre ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (setor) {
      whereClause += ` AND setor ILIKE $${paramIndex}`;
      params.push(`%${setor}%`);
      paramIndex++;
    }

    if (localizacao) {
      whereClause += ` AND localizacao ILIKE $${paramIndex}`;
      params.push(`%${localizacao}%`);
      paramIndex++;
    }

    params.push(limit, offset);

    const query = `
      SELECT * FROM empresas
      WHERE 1=1 ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM empresas
      WHERE 1=1 ${whereClause}
    `;

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    return {
      empresas: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    };
  }

  async getStats() {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN tamanho_empresa = 'startup' THEN 1 END) as startups,
        COUNT(CASE WHEN tamanho_empresa = 'pequena' THEN 1 END) as pequenas,
        COUNT(CASE WHEN tamanho_empresa = 'media' THEN 1 END) as medias,
        COUNT(CASE WHEN tamanho_empresa = 'grande' THEN 1 END) as grandes
      FROM empresas
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
}

export default new EmpresaRepository();