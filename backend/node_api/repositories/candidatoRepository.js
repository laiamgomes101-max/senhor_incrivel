import pool from '../database.js';

class CandidatoRepository {
  async createCandidato(candidatoData) {
    const {
      usuario_id,
      nome,
      email,
      telefone,
      localizacao,
      experiencia,
      habilidades,
      pretensao_salarial,
      disponibilidade,
      linkedin,
      portfolio,
      resumo
    } = candidatoData;

    const query = `
      INSERT INTO candidatos (
        usuario_id, nome, email, telefone, localizacao, experiencia,
        habilidades, pretensao_salarial, disponibilidade, linkedin,
        portfolio, resumo, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      usuario_id, nome, email, telefone, localizacao, experiencia,
      JSON.stringify(habilidades), pretensao_salarial, disponibilidade,
      linkedin, portfolio, resumo
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getCandidatoById(id) {
    const query = `
      SELECT c.*, u.email as usuario_email, u.nome as usuario_nome
      FROM candidatos c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async getCandidatoByUsuarioId(usuarioId) {
    const query = `
      SELECT c.*, u.email as usuario_email, u.nome as usuario_nome
      FROM candidatos c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.usuario_id = $1
    `;
    const result = await pool.query(query, [usuarioId]);
    return result.rows[0];
  }

  async getCandidatos(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const { search, localizacao, experiencia, disponibilidade, habilidades } = filters;

    let query = `
      SELECT c.*, u.email as usuario_email, u.nome as usuario_nome
      FROM candidatos c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (c.nome ILIKE $${paramCount} OR c.resumo ILIKE $${paramCount})`;
      values.push(`%${search}%`);
    }

    if (localizacao) {
      paramCount++;
      query += ` AND c.localizacao ILIKE $${paramCount}`;
      values.push(`%${localizacao}%`);
    }

    if (experiencia) {
      paramCount++;
      query += ` AND c.experiencia = $${paramCount}`;
      values.push(experiencia);
    }

    if (disponibilidade) {
      paramCount++;
      query += ` AND c.disponibilidade = $${paramCount}`;
      values.push(disponibilidade);
    }

    if (habilidades && habilidades.length > 0) {
      paramCount++;
      query += ` AND c.habilidades ?| $${paramCount}`;
      values.push(habilidades);
    }


    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as subquery`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);


    query += ` ORDER BY c.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, (page - 1) * limit);

    const result = await pool.query(query, values);

    return {
      candidatos: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async updateCandidato(id, updateData) {
    const {
      nome, email, telefone, localizacao, experiencia, habilidades,
      pretensao_salarial, disponibilidade, linkedin, portfolio, resumo,
      tem_curriculo, ultimo_curriculo_atualizado, candidaturas_count
    } = updateData;

    const query = `
      UPDATE candidatos
      SET
        nome = COALESCE($1, nome),
        email = COALESCE($2, email),
        telefone = COALESCE($3, telefone),
        localizacao = COALESCE($4, localizacao),
        experiencia = COALESCE($5, experiencia),
        habilidades = COALESCE($6, habilidades),
        pretensao_salarial = COALESCE($7, pretensao_salarial),
        disponibilidade = COALESCE($8, disponibilidade),
        linkedin = COALESCE($9, linkedin),
        portfolio = COALESCE($10, portfolio),
        resumo = COALESCE($11, resumo),
        tem_curriculo = COALESCE($12, tem_curriculo),
        ultimo_curriculo_atualizado = COALESCE($13, ultimo_curriculo_atualizado),
        candidaturas_count = COALESCE($14, candidaturas_count),
        updated_at = NOW()
      WHERE id = $15
      RETURNING *
    `;

    const values = [
      nome, email, telefone, localizacao, experiencia,
      habilidades ? JSON.stringify(habilidades) : null,
      pretensao_salarial, disponibilidade, linkedin, portfolio, resumo,
      tem_curriculo, ultimo_curriculo_atualizado, candidaturas_count, id
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async deleteCandidato(id) {
    const query = `DELETE FROM candidatos WHERE id = $1`;
    await pool.query(query, [id]);
  }

  async incrementCandidaturasCount(id) {
    const query = `
      UPDATE candidatos
      SET candidaturas_count = candidaturas_count + 1, updated_at = NOW()
      WHERE id = $1
    `;
    await pool.query(query, [id]);
  }

  async decrementCandidaturasCount(id) {
    const query = `
      UPDATE candidatos
      SET candidaturas_count = GREATEST(candidaturas_count - 1, 0), updated_at = NOW()
      WHERE id = $1
    `;
    await pool.query(query, [id]);
  }

  async getCandidatoStats(id) {
    const query = `
      SELECT
        c.candidaturas_count,
        COUNT(cv.id) as curriculos_count,
        MAX(cv.created_at) as ultimo_curriculo
      FROM candidatos c
      LEFT JOIN curriculos cv ON c.id = cv.candidato_id
      WHERE c.id = $1
      GROUP BY c.id, c.candidaturas_count
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

export default new CandidatoRepository();