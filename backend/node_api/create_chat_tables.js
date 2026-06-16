#!/usr/bin/env node

import pool from './database.js';

const dbType = process.env.DB_TYPE || 'mysql';
const isMysql = dbType === 'mysql';

const idColumn = isMysql ? 'BIGINT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
const bigintType = isMysql ? 'BIGINT' : 'INTEGER';
const timestampColumn = 'DATETIME DEFAULT CURRENT_TIMESTAMP';

async function createTables() {
  try {
    console.log('Criando tabelas de chat...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id ${idColumn},
        room_key TEXT NOT NULL UNIQUE,
        room_type TEXT NOT NULL,
        candidatura_id ${bigintType},
        vaga_id ${bigintType},
        empresa_id ${bigintType} NOT NULL,
        candidato_id ${bigintType} NOT NULL,
        status TEXT NOT NULL DEFAULT 'ativa',
        created_at ${timestampColumn},
        updated_at ${timestampColumn}
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_participants (
        id ${idColumn},
        chat_room_id ${bigintType} NOT NULL,
        user_id ${bigintType} NOT NULL,
        role TEXT NOT NULL,
        joined_at ${timestampColumn}
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id ${idColumn},
        chat_room_id ${bigintType} NOT NULL,
        sender_id ${bigintType} NOT NULL,
        recipient_id ${bigintType} NOT NULL,
        content TEXT NOT NULL,
        message_type TEXT NOT NULL DEFAULT 'text',
        status TEXT NOT NULL DEFAULT 'sent',
        created_at ${timestampColumn},
        read_at DATETIME NULL
      )
    `);

    console.log('Tabelas de chat criadas com sucesso.');
  } catch (error) {
    console.error('Erro ao criar tabelas de chat:', error);
  } finally {
    process.exit(0);
  }
}

createTables();
