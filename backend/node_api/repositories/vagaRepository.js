import pool from '../database.js';

class VagaRepository {
  async createVaga(vagaData) {
    const {
      empresa_id,
      titulo,
      descricao,
      requisitos,
      localizacao,
      tipo_contrato,
      modalidade,
      nivel,
      faixa_salarial,
      beneficios,
      tags,
      ativa = true
    } = vagaData;

    const query = `
      INSERT INTO vagas (
        empresa_id, titulo, descricao, requisitos, localizacao,
        tipo_contrato, modalidade, nivel, faixa_salarial, beneficios,
        tags, ativa, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      empresa_id, titulo, descricao, requisitos, localizacao,
      tipo_contrato, modalidade, nivel, faixa_salarial,
      JSON.stringify(beneficios), JSON.stringify(tags), ativa
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getVagaById(id) {
    const query = `
      SELECT v.*, e.nome as empresa_nome, e.email as empresa_email,
             e.setor as empresa_setor, e.tamanho as empresa_tamanho
      FROM vagas v
      JOIN empresas e ON v.empresa_id = e.id
      WHERE v.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async getVagas(filters = {}, pagination = {}) {
    const { offset = 0, limit = 10 } = pagination;
    const { ativa, search, localizacao, tipo_contrato, modalidade, nivel, empresa_id } = filters;

    let query = `
      SELECT v.*, e.nome as empresa_nome, e.email as empresa_email,
             e.setor as empresa_setor, e.tamanho as empresa_tamanho
      FROM vagas v
      JOIN empresas e ON v.empresa_id = e.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 0;

    if (ativa !== undefined) {
      paramCount++;
      query += ` AND v.ativa = $${paramCount}`;
      values.push(ativa);
    }

    if (empresa_id) {
      paramCount++;
      query += ` AND v.empresa_id = $${paramCount}`;
      values.push(empresa_id);
    }

    if (search) {
      paramCount++;
      query += ` AND (v.titulo ILIKE $${paramCount} OR v.descricao ILIKE $${paramCount} OR v.requisitos ILIKE $${paramCount})`;
      values.push(`%${search}%`);
    }

    if (localizacao) {
      paramCount++;
      query += ` AND v.localizacao ILIKE $${paramCount}`;
      values.push(`%${localizacao}%`);
    }

    if (tipo_contrato) {
      paramCount++;
      query += ` AND v.tipo_contrato = $${paramCount}`;
      values.push(tipo_contrato);
    }

    if (modalidade) {
      paramCount++;
      query += ` AND v.modalidade = $${paramCount}`;
      values.push(modalidade);
    }

    if (nivel) {
      paramCount++;
      query += ` AND v.nivel = $${paramCount}`;
      values.push(nivel);
    }


    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as subquery`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);


    query += ` ORDER BY v.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    return {
      vagas: result.rows,
      total
    };
  }

  async getVagasByEmpresa(empresaId, filters = {}) {
    const { ativa, search } = filters;

    let query = `
      SELECT v.*, e.nome as empresa_nome, e.email as empresa_email
      FROM vagas v
      JOIN empresas e ON v.empresa_id = e.id
      WHERE v.empresa_id = $1
    `;
    const values = [empresaId];
    let paramCount = 1;

    if (ativa !== undefined) {
      paramCount++;
      query += ` AND v.ativa = $${paramCount}`;
      values.push(ativa);
    }

    if (search) {
      paramCount++;
      query += ` AND (v.titulo ILIKE $${paramCount} OR v.descricao ILIKE $${paramCount})`;
      values.push(`%${search}%`);
    }

    query += ` ORDER BY v.created_at DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  async updateVaga(id, updateData) {
    const {
      titulo, descricao, requisitos, localizacao, tipo_contrato,
      modalidade, nivel, faixa_salarial, beneficios, tags, ativa
    } = updateData;

    const query = `
      UPDATE vagas
      SET
        titulo = COALESCE($1, titulo),
        descricao = COALESCE($2, descricao),
        requisitos = COALESCE($3, requisitos),
        localizacao = COALESCE($4, localizacao),
        tipo_contrato = COALESCE($5, tipo_contrato),
        modalidade = COALESCE($6, modalidade),
        nivel = COALESCE($7, nivel),
        faixa_salarial = COALESCE($8, faixa_salarial),
        beneficios = COALESCE($9, beneficios),
        tags = COALESCE($10, tags),
        ativa = COALESCE($11, ativa),
        updated_at = NOW()
      WHERE id = $12
      RETURNING *
    `;

    const values = [
      titulo, descricao, requisitos, localizacao, tipo_contrato,
      modalidade, nivel, faixa_salarial,
      beneficios ? JSON.stringify(beneficios) : null,
      tags ? JSON.stringify(tags) : null,
      ativa, id
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async deleteVaga(id) {
    const query = `DELETE FROM vagas WHERE id = $1`;
    await pool.query(query, [id]);
  }

  async incrementViews(id) {
    const query = `
      UPDATE vagas
      SET views_count = views_count + 1, updated_at = NOW()
      WHERE id = $1
    `;
    await pool.query(query, [id]);
  }

  async incrementCandidaturasCount(id) {
    const query = `
      UPDATE vagas
      SET candidaturas_count = candidaturas_count + 1, updated_at = NOW()
      WHERE id = $1
    `;
    await pool.query(query, [id]);
  }

  async decrementCandidaturasCount(id) {
    const query = `
      UPDATE vagas
      SET candidaturas_count = GREATEST(candidaturas_count - 1, 0), updated_at = NOW()
      WHERE id = $1
    `;
    await pool.query(query, [id]);
  }

  async getVagaStats(id) {
    const query = `
      SELECT
        v.views_count,
        v.candidaturas_count,
        COUNT(c.id) as candidaturas_ativas,
        AVG(CASE WHEN c.status = 'aprovada' THEN 1 ELSE 0 END) as taxa_aprovacao
      FROM vagas v
      LEFT JOIN candidaturas c ON v.id = c.vaga_id
      WHERE v.id = $1
      GROUP BY v.id, v.views_count, v.candidaturas_count
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async searchVagas(searchTerm, filters = {}) {
    const { limit = 20 } = filters;

    const query = `
      SELECT v.*, e.nome as empresa_nome, e.setor as empresa_setor,
             ts_rank_cd(to_tsvector('portuguese', v.titulo || ' ' || v.descricao || ' ' || v.requisitos), plainto_tsquery('portuguese', $1)) as rank
      FROM vagas v
      JOIN empresas e ON v.empresa_id = e.id
      WHERE v.ativa = true
        AND to_tsvector('portuguese', v.titulo || ' ' || v.descricao || ' ' || v.requisitos) @@ plainto_tsquery('portuguese', $1)
      ORDER BY rank DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [searchTerm, limit]);
    return result.rows;
  }

  async getVagasByLocation(location, radius = 50) {

    const query = `
      SELECT v.*, e.nome as empresa_nome, e.setor as empresa_setor
      FROM vagas v
      JOIN empresas e ON v.empresa_id = e.id
      WHERE v.ativa = true
        AND v.localizacao ILIKE $1
      ORDER BY v.created_at DESC
    `;

    const result = await pool.query(query, [`%${location}%`]);
    return result.rows;
  }

  async getVagasByTipoContrato(tipoContrato) {
    const query = `
      SELECT v.*, e.nome as empresa_nome, e.setor as empresa_setor
      FROM vagas v
      JOIN empresas e ON v.empresa_id = e.id
      WHERE v.ativa = true AND v.tipo_contrato = $1
      ORDER BY v.created_at DESC
    `;
    const result = await pool.query(query, [tipoContrato]);
    return result.rows;
  }

  async getVagasByModalidade(modalidade) {
    const query = `
      SELECT v.*, e.nome as empresa_nome, e.setor as empresa_setor
      FROM vagas v
      JOIN empresas e ON v.empresa_id = e.id
      WHERE v.ativa = true AND v.modalidade = $1
      ORDER BY v.created_at DESC
    `;
    const result = await pool.query(query, [modalidade]);
    return result.rows;
  }

  async getVagasByNivel(nivel) {
    const query = `
      SELECT v.*, e.nome as empresa_nome, e.setor as empresa_setor
      FROM vagas v
      JOIN empresas e ON v.empresa_id = e.id
      WHERE v.ativa = true AND v.nivel = $1
      ORDER BY v.created_at DESC
    `;
    const result = await pool.query(query, [nivel]);
    return result.rows;
  }
}

export default new VagaRepository();