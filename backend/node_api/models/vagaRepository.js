import pool from '../database.js';

class VagaRepository {
  async create(vagaData) {
    const {
      empresa_id,
      titulo,
      descricao,
      requisitos,
      beneficios,
      tipo_contrato,
      localizacao,
      modalidade,
      salario_min,
      salario_max,
      nivel
    } = vagaData;

    const query = `
      INSERT INTO vagas (
        empresa_id, titulo, descricao, requisitos, beneficios,
        tipo_contrato, localizacao, modalidade, salario_min, salario_max, nivel
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await pool.query(query, [
      empresa_id, titulo, descricao, JSON.stringify(requisitos), JSON.stringify(beneficios),
      tipo_contrato, localizacao, modalidade, salario_min, salario_max, nivel
    ]);

    return result.rows[0];
  }

  async findById(id) {
    const query = `
      SELECT v.*, e.nome as empresa_nome, e.logo_url as empresa_logo
      FROM vagas v
      JOIN empresas e ON v.empresa_id = e.id
      WHERE v.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async findByEmpresa(empresaId, filters = {}) {
    const { ativa = true, search } = filters;

    let whereClause = 'empresa_id = $1';
    let params = [empresaId];

    if (ativa !== undefined) {
      whereClause += ' AND ativa = $2';
      params.push(ativa);
    }

    if (search) {
      whereClause += ' AND (titulo ILIKE $3 OR descricao ILIKE $3)';
      params.push(`%${search}%`);
    }

    const query = `
      SELECT * FROM vagas
      WHERE ${whereClause}
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async findAll(filters = {}, pagination = {}) {
    const { ativa = true, search, localizacao, tipo_contrato, modalidade, nivel } = filters;
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    let whereClause = 'ativa = $1';
    let params = [ativa];
    let paramIndex = 2;

    if (search) {
      whereClause += ` AND (titulo ILIKE $${paramIndex} OR descricao ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (localizacao) {
      whereClause += ` AND localizacao ILIKE $${paramIndex}`;
      params.push(`%${localizacao}%`);
      paramIndex++;
    }

    if (tipo_contrato) {
      whereClause += ` AND tipo_contrato = $${paramIndex}`;
      params.push(tipo_contrato);
      paramIndex++;
    }

    if (modalidade) {
      whereClause += ` AND modalidade = $${paramIndex}`;
      params.push(modalidade);
      paramIndex++;
    }

    if (nivel) {
      whereClause += ` AND nivel = $${paramIndex}`;
      params.push(nivel);
      paramIndex++;
    }

    params.push(limit, offset);

    const query = `
      SELECT v.*, e.nome as empresa_nome, e.logo_url as empresa_logo
      FROM vagas v
      JOIN empresas e ON v.empresa_id = e.id
      WHERE ${whereClause}
      ORDER BY v.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM vagas v
      WHERE ${whereClause}
    `;

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    return {
      vagas: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    };
  }

  async update(id, vagaData) {
    const {
      titulo,
      descricao,
      requisitos,
      beneficios,
      tipo_contrato,
      localizacao,
      modalidade,
      salario_min,
      salario_max,
      nivel,
      ativa
    } = vagaData;

    const query = `
      UPDATE vagas
      SET titulo = $1, descricao = $2, requisitos = $3, beneficios = $4,
          tipo_contrato = $5, localizacao = $6, modalidade = $7,
          salario_min = $8, salario_max = $9, nivel = $10, ativa = $11,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `;

    const result = await pool.query(query, [
      titulo, descricao, JSON.stringify(requisitos), JSON.stringify(beneficios),
      tipo_contrato, localizacao, modalidade, salario_min, salario_max, nivel, ativa, id
    ]);

    return result.rows[0];
  }

  async incrementViews(id) {
    const query = 'UPDATE vagas SET views = views + 1 WHERE id = $1';
    await pool.query(query, [id]);
  }

  async delete(id) {
    const query = 'DELETE FROM vagas WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

export default new VagaRepository();