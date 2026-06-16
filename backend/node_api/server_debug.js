
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './database.js';


dotenv.config();


const app = express();
const server = createServer(app);


app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());


app.get('/', (req, res) => {
  res.json({
    message: 'Servidor Node.js Debug rodando!',
    status: 'ok',
    version: '1.0'
  });
});


if (!process.env.DB_USER) {
  setTimeout(async () => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const sql = fs.readFileSync(path.resolve(path.dirname('./server_debug.js'), 'init_db_sqlite.sql'), 'utf8');

      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--'));

      console.log('Encontradas', statements.length, 'statements SQL');

      for (const statement of statements) {
        await pool.query(statement + ';');
      }
      console.log('Esquema SQLite inicializado');
    } catch (e) {
      console.error('Falha ao inicializar esquema SQLite:', e);
    }
  }, 2000);
}


const PORT = process.env.NODE_PORT || 3001;
server.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`Servidor Node.js rodando na porta ${PORT}`);
  console.log(`=================================`);
});