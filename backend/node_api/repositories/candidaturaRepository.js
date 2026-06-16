import pool from '../database.js';

class CandidaturaRepository {
  async createCandidatura(candidaturaData) {
    const {
      candidato_id,
      vaga_id,
      status,
      mensagem_candidato,
      data_aplicacao
    } = candidaturaData;

    const query = `
      INSERT INTO candidaturas (
        candidato_id, vaga_id, status, mensagem_candidato,
        data_aplicacao, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      candidato_id,
      vaga_id,
      status || 'pendente',
      mensagem_candidato,
      data_aplicacao || new Date()
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getCandidaturaById(id) {
    const query = `
      SELECT ca.*, cand.nome as candidato_nome, cand.email as candidato_email,
             v.titulo as vaga_titulo, v.empresa_id,
             emp.nome as empresa_nome, emp.email as empresa_email
      FROM candidaturas ca
      JOIN candidatos cand ON ca.candidato_id = cand.id
      JOIN vagas v ON ca.vaga_id = v.id
      JOIN empresas emp ON v.empresa_id = emp.id
      WHERE ca.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async getCandidaturasByCandidatoId(candidatoId, filters = {}) {
    const { status, limit = 20, offset = 0 } = filters;

    let query = `
      SELECT ca.*, v.titulo as vaga_titulo, v.localizacao as vaga_localizacao,
             v.tipo_contrato, v.salario_min, v.salario_max,
             emp.nome as empresa_nome, emp.setor
      FROM candidaturas ca
      JOIN vagas v ON ca.vaga_id = v.id
      JOIN empresas emp ON v.empresa_id = emp.id
      WHERE ca.candidato_id = $1
    `;

    const values = [candidatoId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND ca.status = $${paramCount}`;
      values.push(status);
    }

    query += ` ORDER BY ca.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  async getCandidaturasByVagaId(vagaId, filters = {}) {
    const { status, limit = 50, offset = 0 } = filters;

    let query = `
      SELECT ca.*, cand.nome as candidato_nome, cand.email as candidato_email,
             cand.telefone, cand.localizacao as candidato_localizacao,
             cand.experiencia, cand.linkedin, cand.portfolio,
             cur.resumo_profissional, cur.habilidades
      FROM candidaturas ca
      JOIN candidatos cand ON ca.candidato_id = cand.id
      LEFT JOIN curriculos cur ON cand.id = cur.candidato_id
      WHERE ca.vaga_id = $1
    `;

    const values = [vagaId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND ca.status = $${paramCount}`;
      values.push(status);
    }

    query += ` ORDER BY ca.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  async getCandidaturasByEmpresaId(empresaId, filters = {}) {
    const { status, vaga_id, limit = 50, offset = 0 } = filters;

    let query = `
      SELECT ca.*, cand.nome as candidato_nome, cand.email as candidato_email,
             v.titulo as vaga_titulo, v.id as vaga_id
      FROM candidaturas ca
      JOIN candidatos cand ON ca.candidato_id = cand.id
      JOIN vagas v ON ca.vaga_id = v.id
      WHERE v.empresa_id = $1
    `;

    const values = [empresaId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND ca.status = $${paramCount}`;
      values.push(status);
    }

    if (vaga_id) {
      paramCount++;
      query += ` AND ca.vaga_id = $${paramCount}`;
      values.push(vaga_id);
    }

    query += ` ORDER BY ca.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  async updateCandidaturaStatus(id, status, observacao = null) {
    const query = `
      UPDATE candidaturas
      SET status = $1, observacao = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [status, observacao, id]);
    return result.rows[0];
  }

  async updateCandidatura(id, updateData) {
    const { status, mensagem_candidato, observacao } = updateData;

    const query = `
      UPDATE candidaturas
      SET
        status = COALESCE($1, status),
        mensagem_candidato = COALESCE($2, mensagem_candidato),
        observacao = COALESCE($3, observacao),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;

    const values = [status, mensagem_candidato, observacao, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async deleteCandidatura(id) {
    const query = `DELETE FROM candidaturas WHERE id = $1`;
    await pool.query(query, [id]);
  }

  async checkExistingCandidatura(candidatoId, vagaId) {
    const query = `
      SELECT id, status FROM candidaturas
      WHERE candidato_id = $1 AND vaga_id = $2
    `;
    const result = await pool.query(query, [candidatoId, vagaId]);
    return result.rows[0];
  }

  async getCandidaturaStats(empresaId = null, candidatoId = null) {
    let query;
    let values = [];

    if (empresaId) {
      query = `
        SELECT
          COUNT(*) as total_candidaturas,
          COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
          COUNT(CASE WHEN status = 'em_analise' THEN 1 END) as em_analise,
          COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados,
          COUNT(CASE WHEN status = 'rejeitado' THEN 1 END) as rejeitados,
          COUNT(CASE WHEN status = 'entrevista' THEN 1 END) as entrevistas
        FROM candidaturas ca
        JOIN vagas v ON ca.vaga_id = v.id
        WHERE v.empresa_id = $1
      `;
      values = [empresaId];
    } else if (candidatoId) {
      query = `
        SELECT
          COUNT(*) as total_candidaturas,
          COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
          COUNT(CASE WHEN status = 'em_analise' THEN 1 END) as em_analise,
          COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados,
          COUNT(CASE WHEN status = 'rejeitado' THEN 1 END) as rejeitados,
          COUNT(CASE WHEN status = 'entrevista' THEN 1 END) as entrevistas
        FROM candidaturas
        WHERE candidato_id = $1
      `;
      values = [candidatoId];
    } else {
      query = `
        SELECT
          COUNT(*) as total_candidaturas,
          COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
          COUNT(CASE WHEN status = 'em_analise' THEN 1 END) as em_analise,
          COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados,
          COUNT(CASE WHEN status = 'rejeitado' THEN 1 END) as rejeitados,
          COUNT(CASE WHEN status = 'entrevista' THEN 1 END) as entrevistas
        FROM candidaturas
      `;
    }

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getCandidaturasByStatus(status, limit = 50) {
    const query = `
      SELECT ca.*, cand.nome as candidato_nome, v.titulo as vaga_titulo,
             emp.nome as empresa_nome
      FROM candidaturas ca
      JOIN candidatos cand ON ca.candidato_id = cand.id
      JOIN vagas v ON ca.vaga_id = v.id
      JOIN empresas emp ON v.empresa_id = emp.id
      WHERE ca.status = $1
      ORDER BY ca.updated_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [status, limit]);
    return result.rows;
  }

  async getCandidaturasRecentes(limit = 20) {
    const query = `
      SELECT ca.*, cand.nome as candidato_nome, v.titulo as vaga_titulo,
             emp.nome as empresa_nome
      FROM candidaturas ca
      JOIN candidatos cand ON ca.candidato_id = cand.id
      JOIN vagas v ON ca.vaga_id = v.id
      JOIN empresas emp ON v.empresa_id = emp.id
      ORDER BY ca.created_at DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  async getCandidaturasByDateRange(startDate, endDate, empresaId = null) {
    let query = `
      SELECT ca.*, cand.nome as candidato_nome, v.titulo as vaga_titulo,
             emp.nome as empresa_nome
      FROM candidaturas ca
      JOIN candidatos cand ON ca.candidato_id = cand.id
      JOIN vagas v ON ca.vaga_id = v.id
      JOIN empresas emp ON v.empresa_id = emp.id
      WHERE ca.created_at BETWEEN $1 AND $2
    `;

    const values = [startDate, endDate];

    if (empresaId) {
      query += ` AND v.empresa_id = $3`;
      values.push(empresaId);
    }

    query += ` ORDER BY ca.created_at DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }
}

export default new CandidaturaRepository();