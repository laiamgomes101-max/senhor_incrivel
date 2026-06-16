import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';


dotenv.config();


const dbConfig = {
  type: process.env.DB_TYPE || 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'plataforma_curriculos'
};

let db;
export let USER_TABLE = 'users';

async function initializeDatabase() {
  const dbType = process.env.DB_TYPE || 'mysql';

  if (dbType === 'mysql') {

    db = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: true,
      connectionLimit: 20,
      queueLimit: 0,
      charset: 'utf8mb4'
    });


    try {
      const connection = await db.getConnection();
      console.log('Conectado ao MySQL com sucesso');
      await ensureMySqlSchema(connection);
      // detect which users table exists (users vs usuarios)
      try {
        const [usersRows] = await connection.query("SHOW TABLES LIKE 'users'");
        if (usersRows && usersRows.length) {
          USER_TABLE = 'users';
        } else {
          const [usuariosRows] = await connection.query("SHOW TABLES LIKE 'usuarios'");
          if (usuariosRows && usuariosRows.length) {
            USER_TABLE = 'usuarios';
          }
        }
        console.log('Using user table:', USER_TABLE);
      } catch (err) {
        console.warn('Could not detect users table name, defaulting to users', err?.message || err);
      }
      connection.release();
    } catch (error) {
      console.error('Erro na conexão com MySQL:', error);
      throw error;
    }

  } else {

    const dbPath = process.env.DB_PATH || './database.db';

    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
      mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
    });


    const poolSize = parseInt(process.env.DB_POOL_SIZE) || 10;
    const connectionTimeout = parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000;


    await db.exec('PRAGMA journal_mode = WAL;');
    await db.exec('PRAGMA synchronous = NORMAL;');
    await db.exec('PRAGMA cache_size = 10000;');
    await db.exec('PRAGMA temp_store = MEMORY;');
    await db.exec('PRAGMA mmap_size = 268435456;'); 

    console.log('Conectado ao SQLite com optimizations');
  }
}

async function ensureMySqlSchema(connection) {
  async function ensureColumn(table, column, definition) {
    const [rows] = await connection.query('SHOW COLUMNS FROM ?? LIKE ?', [table, column]);
    if (!rows.length) {
      console.log(`Adicionando coluna ausente ${table}.${column}`);
      await connection.query(`ALTER TABLE ?? ADD COLUMN ?? ${definition}`, [table, column]);
    }
  }

  try {
    await ensureColumn('users', 'created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    await ensureColumn('users', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    await ensureColumn('candidatos', 'created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    await ensureColumn('candidatos', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    await ensureColumn('empresas', 'created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    await ensureColumn('empresas', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
  } catch (error) {
    console.error('Erro ao garantir schema MySQL:', error);
  }
}

let dbInitialized = false;

async function initializeWithRetries(retries = 5, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await initializeDatabase();
      dbInitialized = true;
      console.log('Database initialized successfully');
      return;
    } catch (err) {
      console.error(`Tentativa ${attempt} de ${retries} falhou ao conectar ao DB:`, err?.message || err);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, delayMs));
      } else {
        console.error('Todas as tentativas de conectar ao banco falharam.');
        process.exit(1);
      }
    }
  }
}

initializeWithRetries();


const pool = {
  getConnection: async () => {
    if (!dbInitialized || !db) {
      throw new Error('Database not initialized. Please ensure initializeDatabase() has completed.');
    }
    return db;
  },
  query: async (sql, params = []) => {
    try {
      if (!dbInitialized || !db) {
        throw new Error('Database not initialized. Please ensure initializeDatabase() has completed.');
      }

      const dbType = process.env.DB_TYPE || 'mysql';

      if (dbType === 'mysql') {
        const [rows] = await db.execute(sql, params);
        return { rows: rows || [] };
      } else {
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
          const rows = await db.all(sql, params);
          return { rows: rows || [] };
        } else {
          const result = await db.run(sql, params);
          return {
            rowCount: result?.changes || 0,
            rows: [],
            lastID: result?.lastID || null
          };
        }
      }
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }
};

export default pool;