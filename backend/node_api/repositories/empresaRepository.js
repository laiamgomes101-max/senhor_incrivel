import pool from '../database.js';

class EmpresaRepository {
  async createEmpresa(empresaData) {
    const {
      usuario_id,
      nome,
      email,
      telefone,
      website,
      descricao,
      setor,
      tamanho,
      localizacao,
      linkedin,
      cultura_empresa
    } = empresaData;

    const query = `
      INSERT INTO empresas (
        usuario_id, nome, email, telefone, website, descricao,
        setor, tamanho, localizacao, linkedin, cultura_empresa,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      usuario_id, nome, email, telefone, website, descricao,
      setor, tamanho, localizacao, linkedin, cultura_empresa
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getEmpresaById(id) {
    const query = `
      SELECT e.*, u.email as usuario_email, u.nome as usuario_nome
      FROM empresas e
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE e.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async getEmpresaByUsuarioId(usuarioId) {
    const query = `
      SELECT e.*, u.email as usuario_email, u.nome as usuario_nome
      FROM empresas e
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE e.usuario_id = $1
    `;
    const result = await pool.query(query, [usuarioId]);
    return result.rows[0];
  }

  async getEmpresas(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const { search, setor, tamanho, localizacao } = filters;

    let query = `
      SELECT e.*, u.email as usuario_email, u.nome as usuario_nome
      FROM empresas e
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (e.nome ILIKE $${paramCount} OR e.descricao ILIKE $${paramCount})`;
      values.push(`%${search}%`);
    }

    if (setor) {
      paramCount++;
      query += ` AND e.setor = $${paramCount}`;
      values.push(setor);
    }

    if (tamanho) {
      paramCount++;
      query += ` AND e.tamanho = $${paramCount}`;
      values.push(tamanho);
    }

    if (localizacao) {
      paramCount++;
      query += ` AND e.localizacao ILIKE $${paramCount}`;
      values.push(`%${localizacao}%`);
    }


    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as subquery`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);


    query += ` ORDER BY e.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, (page - 1) * limit);

    const result = await pool.query(query, values);

    return {
      empresas: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async updateEmpresa(id, updateData) {
    const {
      nome, email, telefone, website, descricao, setor, tamanho,
      localizacao, linkedin, cultura_empresa, vagas_count
    } = updateData;

    const query = `
      UPDATE empresas
      SET
        nome = COALESCE($1, nome),
        email = COALESCE($2, email),
        telefone = COALESCE($3, telefone),
        website = COALESCE($4, website),
        descricao = COALESCE($5, descricao),
        setor = COALESCE($6, setor),
        tamanho = COALESCE($7, tamanho),
        localizacao = COALESCE($8, localizacao),
        linkedin = COALESCE($9, linkedin),
        cultura_empresa = COALESCE($10, cultura_empresa),
        vagas_count = COALESCE($11, vagas_count),
        updated_at = NOW()
      WHERE id = $12
      RETURNING *
    `;

    const values = [
      nome, email, telefone, website, descricao, setor, tamanho,
      localizacao, linkedin, cultura_empresa, vagas_count, id
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async deleteEmpresa(id) {
    const query = `DELETE FROM empresas WHERE id = $1`;
    await pool.query(query, [id]);
  }

  async incrementVagasCount(id) {
    const query = `
      UPDATE empresas
      SET vagas_count = vagas_count + 1, updated_at = NOW()
      WHERE id = $1
    `;
    await pool.query(query, [id]);
  }

  async decrementVagasCount(id) {
    const query = `
      UPDATE empresas
      SET vagas_count = GREATEST(vagas_count - 1, 0), updated_at = NOW()
      WHERE id = $1
    `;
    await pool.query(query, [id]);
  }

  async getEmpresaStats(id) {
    const query = `
      SELECT
        e.vagas_count,
        COUNT(v.id) as vagas_ativas,
        COUNT(CASE WHEN v.ativa = false THEN 1 END) as vagas_inativas,
        AVG(v.views_count) as media_views_por_vaga,
        SUM(v.candidaturas_count) as total_candidaturas
      FROM empresas e
      LEFT JOIN vagas v ON e.id = v.empresa_id
      WHERE e.id = $1
      GROUP BY e.id, e.vagas_count
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async getEmpresasBySetor(setor) {
    const query = `
      SELECT e.*, u.email as usuario_email, u.nome as usuario_nome
      FROM empresas e
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE e.setor = $1
      ORDER BY e.created_at DESC
    `;
    const result = await pool.query(query, [setor]);
    return result.rows;
  }

  async getEmpresasByTamanho(tamanho) {
    const query = `
      SELECT e.*, u.email as usuario_email, u.nome as usuario_nome
      FROM empresas e
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE e.tamanho = $1
      ORDER BY e.created_at DESC
    `;
    const result = await pool.query(query, [tamanho]);
    return result.rows;
  }
}

export default new EmpresaRepository();