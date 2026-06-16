#!/usr/bin/env node

import pool from './database.js';

async function checkTables() {
  try {
    const res = await pool.query('SELECT name FROM sqlite_master WHERE type="table"');
    console.log('📋 Tabelas no banco:');
    res.rows.forEach(row => {
      console.log(`  - ${row.name}`);
    });

    if (res.rows.length === 0) {
      console.log('❌ Nenhuma tabela encontrada! Aplicando schema...');

      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          tipo TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS candidatos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id),
          nome TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS empresas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id),
          nome TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Schema básico aplicado!');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

checkTables();