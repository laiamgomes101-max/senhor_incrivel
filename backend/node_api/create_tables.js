#!/usr/bin/env node

import pool from './database.js';

async function createEssentialTables() {
  try {
    console.log(' Criando tabelas essenciais...\n');


    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conteudo TEXT NOT NULL,
        imagem_url TEXT,
        tipo_autor TEXT NOT NULL,
        autor_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log(' Tabela posts criada');


    await pool.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      )
    `);
    console.log(' Tabela likes criada');


    await pool.query(`
      CREATE TABLE IF NOT EXISTS comentarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        conteudo TEXT NOT NULL,
        autor_id INTEGER NOT NULL,
        tipo_autor TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log(' Tabela comentarios criada');

    console.log('\n🎉 Tabelas essenciais criadas com sucesso!');

  } catch (error) {
    console.error(' Erro ao criar tabelas:', error);
  } finally {
    process.exit(0);
  }
}

createEssentialTables();