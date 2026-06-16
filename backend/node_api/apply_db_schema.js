#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyDatabaseSchema() {
  try {
    console.log('🔄 Aplicando esquema completo do banco de dados...');


    const sqlFilePath = path.join(__dirname, 'init_db_complete.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');


    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s.length > 0);

    console.log(`📄 Encontrados ${statements.length} statements SQL para executar`);


    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await pool.query(stmt);
        console.log(`✅ Statement ${i + 1}/${statements.length} executado com sucesso`);
      } catch (err) {

        if (err.code === '42P07' || 
            err.code === '42710' || 
            err.code === '23505' || 
            err.message.includes('already exists') ||
            err.message.includes('duplicate key')) {
          console.log(`⚠️  Statement ${i + 1} já existe, pulando...`);
        } else {
          console.error(`❌ Erro no statement ${i + 1}:`, err.message);
          console.error('Statement:', stmt.substring(0, 100) + '...');

        }
      }
    }

    console.log('🎉 Esquema do banco de dados aplicado com sucesso!');


    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('📋 Tabelas criadas:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (err) {
    console.error('❌ Erro ao aplicar esquema do banco:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}


if (import.meta.url === `file://${process.argv[1]}`) {
  applyDatabaseSchema();
}

export default applyDatabaseSchema;