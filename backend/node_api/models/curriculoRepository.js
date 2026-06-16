import pool from '../database.js';

class CurriculoRepository {
  async create(curriculoData) {
    const {
      candidato_id,
      experiencia,
      educacao,
      habilidades,
      idiomas,
      certificacoes,
      arquivo_url,
      arquivo_nome
    } = curriculoData;

    const query = `
      INSERT INTO curriculos (
        candidato_id, experiencia, educacao, habilidades,
        idiomas, certificacoes, arquivo_url, arquivo_nome
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(query, [
      candidato_id,
      JSON.stringify(experiencia),
      JSON.stringify(educacao),
      JSON.stringify(habilidades),
      JSON.stringify(idiomas),
      JSON.stringify(certificacoes),
      arquivo_url,
      arquivo_nome
    ]);

    return result.rows[0];
  }

  async findByCandidato(candidatoId) {
    const query = 'SELECT * FROM curriculos WHERE candidato_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [candidatoId]);
    return result.rows;
  }

  async findById(id) {
    const query = `
      SELECT c.*, cand.nome as candidato_nome
      FROM curriculos c
      JOIN candidatos cand ON c.candidato_id = cand.id
      WHERE c.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async update(id, curriculoData) {
    const {
      experiencia,
      educacao,
      habilidades,
      idiomas,
      certificacoes,
      arquivo_url,
      arquivo_nome
    } = curriculoData;

    const query = `
      UPDATE curriculos
      SET experiencia = $1, educacao = $2, habilidades = $3,
          idiomas = $4, certificacoes = $5, arquivo_url = $6,
          arquivo_nome = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;

    const result = await pool.query(query, [
      JSON.stringify(experiencia),
      JSON.stringify(educacao),
      JSON.stringify(habilidades),
      JSON.stringify(idiomas),
      JSON.stringify(certificacoes),
      arquivo_url,
      arquivo_nome,
      id
    ]);

    return result.rows[0];
  }

  async delete(id) {
    const query = 'DELETE FROM curriculos WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async findAll(filters = {}, pagination = {}) {
    const { candidato_id, search } = filters;
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];
    let paramIndex = 1;

    if (candidato_id) {
      whereClause += ` AND candidato_id = $${paramIndex}`;
      params.push(candidato_id);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (
        arquivo_nome ILIKE $${paramIndex} OR
        habilidades::text ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    params.push(limit, offset);

    const query = `
      SELECT c.*, cand.nome as candidato_nome
      FROM curriculos c
      JOIN candidatos cand ON c.candidato_id = cand.id
      WHERE 1=1 ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM curriculos c
      WHERE 1=1 ${whereClause}
    `;

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    return {
      curriculos: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    };
  }
}

export default new CurriculoRepository();