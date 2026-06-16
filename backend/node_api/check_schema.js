#!/usr/bin/env node

import pool from './database.js';

async function checkSchema() {
  try {
    console.log('📋 Verificando estrutura das tabelas...\n');


    const usuariosSchema = await pool.query('PRAGMA table_info(usuarios)');
    console.log('📄 Tabela usuarios:');
    usuariosSchema.rows.forEach(col => {
      console.log(`  - ${col.name}: ${col.type}`);
    });


    const candidatosSchema = await pool.query('PRAGMA table_info(candidatos)');
    console.log('\n📄 Tabela candidatos:');
    candidatosSchema.rows.forEach(col => {
      console.log(`  - ${col.name}: ${col.type}`);
    });


    const empresasSchema = await pool.query('PRAGMA table_info(empresas)');
    console.log('\n📄 Tabela empresas:');
    empresasSchema.rows.forEach(col => {
      console.log(`  - ${col.name}: ${col.type}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();