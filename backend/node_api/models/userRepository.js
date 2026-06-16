import pool from '../database.js';

class UserRepository {
  async create(userData) {
    const { email, password_hash, tipo, nome } = userData;
    const query = `
      INSERT INTO users (email, password_hash, tipo, nome)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, tipo, nome, created_at
    `;
    const result = await pool.query(query, [email, password_hash, tipo, nome]);
    return result.rows[0];
  }

  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  async findById(id) {
    const query = 'SELECT id, email, tipo, nome, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async update(id, userData) {
    const { nome } = userData;
    const query = `
      UPDATE users
      SET nome = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email, tipo, nome, updated_at
    `;
    const result = await pool.query(query, [nome, id]);
    return result.rows[0];
  }

  async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async findAll(filters = {}, pagination = {}) {
    const { tipo, search } = filters;
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];
    let paramIndex = 1;

    if (tipo) {
      whereClause += ` AND tipo = $${paramIndex}`;
      params.push(tipo);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (nome ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    params.push(limit, offset);

    const query = `
      SELECT id, email, tipo, nome, created_at
      FROM users
      WHERE 1=1 ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      WHERE 1=1 ${whereClause}
    `;

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    return {
      users: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    };
  }
}

export default new UserRepository();