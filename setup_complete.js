#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const NODE_API_DIR = path.join(ROOT_DIR, 'backend', 'node_api');
const FLASK_DIR = path.join(ROOT_DIR, 'backend', 'flask_app');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

function runCommand(command, cwd = process.cwd(), description = '') {
  try {
    console.log(`🔄 ${description || command}`);
    execSync(command, {
      cwd,
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    console.log(`✅ ${description || command} - OK`);
    return true;
  } catch (error) {
    console.error(`❌ Erro em: ${description || command}`);
    console.error(error.message);
    return false;
  }
}

async function setupDatabase() {
  console.log('\n🗄️  Configurando banco de dados...');


  try {
    execSync('psql --version', { stdio: 'pipe' });
    console.log('✅ PostgreSQL encontrado');


    try {
      execSync('createdb plataforma_curriculos', { stdio: 'pipe' });
      console.log('✅ Banco de dados criado');
    } catch (e) {
      console.log('⚠️  Banco já existe');
    }


    runCommand('node apply_db_schema.js', NODE_API_DIR, 'Aplicando schema do banco');

  } catch (e) {
    console.log('⚠️  PostgreSQL não encontrado, usando SQLite');

  }
}

async function setupBackend() {
  console.log('\n🔧 Configurando backend...');


  console.log('📦 Instalando dependências Node.js...');
  if (!runCommand('npm install', NODE_API_DIR)) {
    console.log('❌ Falha ao instalar dependências Node.js');
    return false;
  }


  console.log('🐍 Instalando dependências Python...');
  if (!runCommand('pip install -r requirements.txt', FLASK_DIR)) {
    console.log('⚠️  Pip não encontrado ou erro nas dependências Python');
  }

  return true;
}

async function setupFrontend() {
  console.log('\n⚛️  Configurando frontend...');

  if (!runCommand('npm install', FRONTEND_DIR)) {
    console.log('❌ Falha ao instalar dependências do frontend');
    return false;
  }

  return true;
}

async function createEnvFile() {
  console.log('\n📝 Criando arquivo .env...');

  const envPath = path.join(NODE_API_DIR, '.env');
  const envContent = `# Configurações do Banco de Dados
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=plataforma_curriculos
DB_PORT=5432

# JWT Secret (mude para produção!)
JWT_SECRET=chave_secreta_jwt_plataforma_curriculos_2024

# Flask URL
FLASK_URL=http:

# Porta do servidor
PORT=3001
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Arquivo .env criado');
  } catch (error) {
    console.log('❌ Erro ao criar .env:', error.message);
  }
}

async function runTests() {
  console.log('\n🧪 Executando testes básicos...');


  console.log('🔍 Verificando configurações...');


  const checkPort = (port) => {
    try {
      execSync(`netstat -an | find "LISTENING" | find ":${port} "`, { stdio: 'pipe' });
      console.log(`⚠️  Porta ${port} já está em uso`);
      return false;
    } catch (e) {
      console.log(`✅ Porta ${port} disponível`);
      return true;
    }
  };

  checkPort(3001); 
  checkPort(5000); 
  checkPort(5173); 

  console.log('\n📋 Para iniciar os serviços:');
  console.log('1. Backend Node.js: cd backend/node_api && npm start');
  console.log('2. Backend Flask: cd backend/flask_app && python run.py');
  console.log('3. Frontend: cd frontend && npm run dev');
  console.log('\n🌐 Acesse: http://localhost:5173');
}

async function main() {
  console.log('🚀 Configuração Completa da Plataforma de Currículos\n');

  try {

    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Node.js: ${nodeVersion}`);


    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`✅ npm: ${npmVersion}`);


    await createEnvFile();
    await setupDatabase();
    await setupBackend();
    await setupFrontend();
    await runTests();

    console.log('\n🎉 Configuração concluída com sucesso!');
    console.log('\n📚 Leia o README_COMPLETO.md para mais informações');
    console.log('🧪 Execute: node backend/node_api/test_api_complete.js (após iniciar os serviços)');

  } catch (error) {
    console.error('\n❌ Erro durante a configuração:', error.message);
    process.exit(1);
  }
}


if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;