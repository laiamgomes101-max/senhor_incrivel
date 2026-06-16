import pool from '../database.js';

class CurriculoRepository {
  async createCurriculo(curriculoData) {
    const {
      candidato_id,
      experiencia_profissional,
      formacao_academica,
      habilidades,
      idiomas,
      certificacoes,
      projetos,
      resumo_profissional,
      objetivos_carreira,
      disponibilidade,
      pretensao_salarial
    } = curriculoData;

    const query = `
      INSERT INTO curriculos (
        candidato_id, experiencia_profissional, formacao_academica,
        habilidades, idiomas, certificacoes, projetos,
        resumo_profissional, objetivos_carreira, disponibilidade,
        pretensao_salarial, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      candidato_id,
      JSON.stringify(experiencia_profissional),
      JSON.stringify(formacao_academica),
      JSON.stringify(habilidades),
      JSON.stringify(idiomas),
      JSON.stringify(certificacoes),
      JSON.stringify(projetos),
      resumo_profissional,
      objetivos_carreira,
      disponibilidade,
      pretensao_salarial
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getCurriculoById(id) {
    const query = `
      SELECT c.*, cand.nome as candidato_nome, cand.email as candidato_email,
             u.email as usuario_email
      FROM curriculos c
      JOIN candidatos cand ON c.candidato_id = cand.id
      JOIN usuarios u ON cand.usuario_id = u.id
      WHERE c.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async getCurriculoByCandidatoId(candidatoId) {
    const query = `
      SELECT c.*, cand.nome as candidato_nome, cand.email as candidato_email,
             u.email as usuario_email
      FROM curriculos c
      JOIN candidatos cand ON c.candidato_id = cand.id
      JOIN usuarios u ON cand.usuario_id = u.id
      WHERE c.candidato_id = $1
    `;
    const result = await pool.query(query, [candidatoId]);
    return result.rows[0];
  }

  async updateCurriculo(id, updateData) {
    const {
      experiencia_profissional, formacao_academica, habilidades, idiomas,
      certificacoes, projetos, resumo_profissional, objetivos_carreira,
      disponibilidade, pretensao_salarial
    } = updateData;

    const query = `
      UPDATE curriculos
      SET
        experiencia_profissional = COALESCE($1, experiencia_profissional),
        formacao_academica = COALESCE($2, formacao_academica),
        habilidades = COALESCE($3, habilidades),
        idiomas = COALESCE($4, idiomas),
        certificacoes = COALESCE($5, certificacoes),
        projetos = COALESCE($6, projetos),
        resumo_profissional = COALESCE($7, resumo_profissional),
        objetivos_carreira = COALESCE($8, objetivos_carreira),
        disponibilidade = COALESCE($9, disponibilidade),
        pretensao_salarial = COALESCE($10, pretensao_salarial),
        updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `;

    const values = [
      experiencia_profissional ? JSON.stringify(experiencia_profissional) : null,
      formacao_academica ? JSON.stringify(formacao_academica) : null,
      habilidades ? JSON.stringify(habilidades) : null,
      idiomas ? JSON.stringify(idiomas) : null,
      certificacoes ? JSON.stringify(certificacoes) : null,
      projetos ? JSON.stringify(projetos) : null,
      resumo_profissional,
      objetivos_carreira,
      disponibilidade,
      pretensao_salarial,
      id
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async deleteCurriculo(id) {
    const query = `DELETE FROM curriculos WHERE id = $1`;
    await pool.query(query, [id]);
  }

  async searchCurriculos(searchTerm, filters = {}) {
    const { limit = 20, experiencia, disponibilidade } = filters;

    let query = `
      SELECT c.*, cand.nome as candidato_nome, cand.localizacao,
             cand.experiencia as candidato_experiencia,
             ts_rank_cd(to_tsvector('portuguese',
               c.resumo_profissional || ' ' || c.objetivos_carreira
             ), plainto_tsquery('portuguese', $1)) as rank
      FROM curriculos c
      JOIN candidatos cand ON c.candidato_id = cand.id
      WHERE to_tsvector('portuguese',
              c.resumo_profissional || ' ' || c.objetivos_carreira
            ) @@ plainto_tsquery('portuguese', $1)
    `;

    const values = [searchTerm];
    let paramCount = 1;

    if (experiencia) {
      paramCount++;
      query += ` AND cand.experiencia = $${paramCount}`;
      values.push(experiencia);
    }

    if (disponibilidade) {
      paramCount++;
      query += ` AND c.disponibilidade = $${paramCount}`;
      values.push(disponibilidade);
    }

    query += ` ORDER BY rank DESC LIMIT $${paramCount + 1}`;
    values.push(limit);

    const result = await pool.query(query, values);
    return result.rows;
  }

  async getCurriculosBySkills(skills) {
    const query = `
      SELECT c.*, cand.nome as candidato_nome, cand.localizacao
      FROM curriculos c
      JOIN candidatos cand ON c.candidato_id = cand.id
      WHERE c.habilidades ?| $1
      ORDER BY c.updated_at DESC
    `;
    const result = await pool.query(query, [skills]);
    return result.rows;
  }

  async getCurriculosByLocation(location, radius = 50) {
    const query = `
      SELECT c.*, cand.nome as candidato_nome, cand.localizacao
      FROM curriculos c
      JOIN candidatos cand ON c.candidato_id = cand.id
      WHERE cand.localizacao ILIKE $1
      ORDER BY c.updated_at DESC
    `;
    const result = await pool.query(query, [`%${location}%`]);
    return result.rows;
  }

  async getCurriculosByExperienceLevel(level) {
    const query = `
      SELECT c.*, cand.nome as candidato_nome, cand.experiencia
      FROM curriculos c
      JOIN candidatos cand ON c.candidato_id = cand.id
      WHERE cand.experiencia = $1
      ORDER BY c.updated_at DESC
    `;
    const result = await pool.query(query, [level]);
    return result.rows;
  }

  async getCurriculosByEducationLevel(level) {
    const query = `
      SELECT c.*, cand.nome as candidato_nome
      FROM curriculos c
      JOIN candidatos cand ON c.candidato_id = cand.id
      WHERE c.formacao_academica @> $1
      ORDER BY c.updated_at DESC
    `;
    const result = await pool.query(query, [JSON.stringify([{ nivel: level }])]);
    return result.rows;
  }

  async getCurriculosByDisponibilidade(disponibilidade) {
    const query = `
      SELECT c.*, cand.nome as candidato_nome
      FROM curriculos c
      JOIN candidatos cand ON c.candidato_id = cand.id
      WHERE c.disponibilidade = $1
      ORDER BY c.updated_at DESC
    `;
    const result = await pool.query(query, [disponibilidade]);
    return result.rows;
  }

  async getCurriculosByPretensaoSalarial(min, max) {
    const query = `
      SELECT c.*, cand.nome as candidato_nome
      FROM curriculos c
      JOIN candidatos cand ON c.candidato_id = cand.id
      WHERE c.pretensao_salarial BETWEEN $1 AND $2
      ORDER BY c.pretensao_salarial ASC
    `;
    const result = await pool.query(query, [min, max]);
    return result.rows;
  }

  async getCurriculoStats(candidatoId) {
    const query = `
      SELECT
        c.updated_at as ultimo_update,
        COUNT(DISTINCT exp->>'empresa') as empresas_trabalhadas,
        COUNT(DISTINCT form->>'instituicao') as instituicoes_formacao,
        array_length(c.habilidades, 1) as total_habilidades,
        array_length(c.idiomas, 1) as total_idiomas
      FROM curriculos c
      WHERE c.candidato_id = $1
      GROUP BY c.id, c.updated_at, c.habilidades, c.idiomas
    `;
    const result = await pool.query(query, [candidatoId]);
    return result.rows[0] || {};
  }
}

export default new CurriculoRepository();