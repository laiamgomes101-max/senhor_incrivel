import pool, { USER_TABLE } from '../database.js';

class UserRepository {
  async createUser(userData) {
    const { email, password_hash, nome, tipo } = userData;
    const dbType = process.env.DB_TYPE || 'mysql';

    const connection = await pool.getConnection();

    const executeQuery = async (sql, values = []) => {
      if (dbType === 'mysql') {
        const [result] = await connection.execute(sql, values);
        return result;
      }
      return await connection.run(sql, values);
    };

    const beginTransaction = async () => {
      if (dbType === 'mysql') {
        await connection.beginTransaction();
      } else {
        await connection.run('BEGIN TRANSACTION');
      }
    };

    const commitTransaction = async () => {
      if (dbType === 'mysql') {
        await connection.commit();
      } else {
        await connection.run('COMMIT');
      }
    };

    const rollbackTransaction = async () => {
      if (dbType === 'mysql') {
        await connection.rollback();
      } else {
        await connection.run('ROLLBACK');
      }
    };

    try {
      await beginTransaction();

      const query = `
        INSERT INTO ${USER_TABLE} (email, password_hash, tipo, created_at, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
      const values = [email, password_hash, tipo];
      const result = await executeQuery(query, values);

      const userId = result.insertId || result.lastID || null;
      if (!userId) {
        throw new Error('Falha ao criar usuário');
      }

      if (tipo === 'candidato') {
        const candidatoQuery = `
          INSERT INTO candidatos (user_id, nome, created_at, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
        await executeQuery(candidatoQuery, [userId, nome]);
      } else if (tipo === 'empresa') {
        const empresaQuery = `
          INSERT INTO empresas (user_id, nome, created_at, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
        await executeQuery(empresaQuery, [userId, nome]);
      }

      await commitTransaction();

      return {
        id: userId,
        email,
        tipo,
        nome
      };
    } catch (error) {
      try {
        await rollbackTransaction();
      } catch (rollbackError) {
        console.error('Erro ao reverter transação:', rollbackError);
      }
      throw error;
    } finally {
      if (dbType === 'mysql' && connection.release) {
        connection.release();
      }
    }
  }

  async getUserById(id) {

    const userQuery = `
      SELECT id, email, tipo, created_at, updated_at
      FROM ${USER_TABLE}
      WHERE id = ?
    `;
    const userResult = await pool.query(userQuery, [id]);
    const user = userResult.rows[0];

    if (!user) return null;


    let nome = null;
    if (user.tipo === 'candidato') {
      const candidatoQuery = `SELECT nome FROM candidatos WHERE user_id = ?`;
      const candidatoResult = await pool.query(candidatoQuery, [id]);
      nome = candidatoResult.rows[0]?.nome;
    } else if (user.tipo === 'empresa') {
      const empresaQuery = `SELECT nome FROM empresas WHERE user_id = ?`;
      const empresaResult = await pool.query(empresaQuery, [id]);
      nome = empresaResult.rows[0]?.nome;
    }

    return {
      ...user,
      nome
    };
  }

  async getUserByEmail(email) {

    const userQuery = `
      SELECT id, email, password_hash, tipo, created_at, updated_at
      FROM ${USER_TABLE}
      WHERE email = ?
    `;
    const userResult = await pool.query(userQuery, [email]);
    const user = userResult.rows[0];

    if (!user) return null;


    let nome = null;
    if (user.tipo === 'candidato') {
      const candidatoQuery = `SELECT nome FROM candidatos WHERE user_id = ?`;
      const candidatoResult = await pool.query(candidatoQuery, [user.id]);
      nome = candidatoResult.rows[0]?.nome;
    } else if (user.tipo === 'empresa') {
      const empresaQuery = `SELECT nome FROM empresas WHERE user_id = ?`;
      const empresaResult = await pool.query(empresaQuery, [user.id]);
      nome = empresaResult.rows[0]?.nome;
    }

    return {
      ...user,
      nome
    };
  }

  async getUsers(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const { tipo, search } = filters;

    const offset = (page - 1) * limit;


    let query = `
      SELECT
        u.id, u.email, u.tipo, u.created_at, u.updated_at,
        COALESCE(c.nome, e.nome) as nome
      FROM ${USER_TABLE} u
      LEFT JOIN candidatos c ON u.id = c.user_id AND u.tipo = 'candidato'
      LEFT JOIN empresas e ON u.id = e.user_id AND u.tipo = 'empresa'
      WHERE 1=1
    `;
    const values = [];

    if (tipo) {
      query += ` AND u.tipo = ?`;
      values.push(tipo);
    }

    if (search) {
      query += ` AND (u.email LIKE ? OR COALESCE(c.nome, e.nome) LIKE ?)`;
      values.push(`%${search}%`, `%${search}%`);
    }


    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${USER_TABLE} u
      LEFT JOIN candidatos c ON u.id = c.user_id AND u.tipo = 'candidato'
      LEFT JOIN empresas e ON u.id = e.user_id AND u.tipo = 'empresa'
      WHERE 1=1
      ${tipo ? 'AND u.tipo = ?' : ''}
      ${search ? 'AND (u.email LIKE ? OR COALESCE(c.nome, e.nome) LIKE ?)' : ''}
    `;
    const countValues = [];
    if (tipo) countValues.push(tipo);
    if (search) countValues.push(`%${search}%`, `%${search}%`);

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].total);


    query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    return {
      users: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getUserIdsByTipo(tipo) {
    const query = `SELECT id FROM ${USER_TABLE} WHERE tipo = ?`;
    const result = await pool.query(query, [tipo]);
    return result.rows.map((row) => row.id);
  }

  async updateUser(id, updateData) {
    const { nome, tipo } = updateData;
    const query = `
      UPDATE ${USER_TABLE}
      SET nome = ?, tipo = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const values = [nome, tipo, id];
    await pool.query(query, values);
    return await this.getUserById(id);
  }

  async deleteUser(id) {
    const query = `DELETE FROM ${USER_TABLE} WHERE id = ?`;
    await pool.query(query, [id]);
  }

  async updatePassword(id, newPassword) {
    const query = `
      UPDATE ${USER_TABLE}
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await pool.query(query, [newPassword, id]);
  }

  async getUserStats() {
    const query = `
      SELECT
        tipo,
        COUNT(*) as count
      FROM ${USER_TABLE}
      GROUP BY tipo
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

export default new UserRepository();