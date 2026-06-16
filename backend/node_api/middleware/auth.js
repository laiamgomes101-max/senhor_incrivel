import jwt from 'jsonwebtoken';
import pool, { USER_TABLE } from '../database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';




export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);

    const dbType = (process.env.DB_TYPE || 'mysql').toLowerCase();
    const table = USER_TABLE || 'users';
    const userQuery = dbType === 'postgres' || dbType === 'postgresql'
      ? `SELECT id, email, tipo FROM ${table} WHERE id = $1`
      : `SELECT id, email, tipo FROM ${table} WHERE id = ?`;
    const result = await pool.query(userQuery, [payload.id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário inválido' });
    }

    // build user object and fetch `nome` from candidatos/empresas if present
    const user = { ...result.rows[0] };
    try {
      if (user.tipo === 'candidato') {
        const nomeQuery = dbType === 'postgres' || dbType === 'postgresql'
          ? 'SELECT nome FROM candidatos WHERE user_id = $1'
          : 'SELECT nome FROM candidatos WHERE user_id = ?';
        const nomeRes = await pool.query(nomeQuery, [user.id]);
        user.nome = nomeRes.rows[0]?.nome || null;
      } else if (user.tipo === 'empresa') {
        const nomeQuery = dbType === 'postgres' || dbType === 'postgresql'
          ? 'SELECT nome FROM empresas WHERE user_id = $1'
          : 'SELECT nome FROM empresas WHERE user_id = ?';
        const nomeRes = await pool.query(nomeQuery, [user.id]);
        user.nome = nomeRes.rows[0]?.nome || null;
      } else {
        user.nome = null;
      }
    } catch (err) {
      console.warn('Erro ao buscar nome do usuário:', err?.message || err);
      user.nome = null;
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('JWT verify error:', err && err.message, 'tokenPreview:', (typeof token === 'string' ? token.slice(0,20) + '...' : token));
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}




export const authenticateToken = authenticate;




export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    if (req.user.tipo !== role) {
      return res.status(403).json({ error: `Apenas ${role}s podem acessar este recurso` });
    }
    next();
  };
}


export function errorHandler(err, req, res, next) {
  console.error('Erro:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Erro interno do servidor',
    devMessage: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}