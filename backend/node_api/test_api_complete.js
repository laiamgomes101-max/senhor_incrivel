#!/usr/bin/env node

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const BASE_URL = 'http://localhost:3001';
const FLASK_URL = 'http://localhost:5000';


let adminToken = '';
let empresaToken = '';
let candidatoToken = '';


let adminId = '';
let empresaId = '';
let candidatoId = '';
let vagaId = '';
let postId = '';

async function makeRequest(method, url, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {}
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

async function testAuth() {
  console.log('\n🔐 Testando Autenticação...');


  console.log('  📝 Registrando admin...');
  const adminRegister = await makeRequest('POST', '/api/auth/register', {
    email: 'admin@teste.com',
    password: 'admin123',
    tipo: 'admin'
  });

  if (adminRegister.success) {
    console.log('  ✅ Admin registrado');
  } else {
    console.log('  ⚠️  Admin já existe ou erro:', adminRegister.error);
  }


  console.log('  🔑 Fazendo login admin...');
  const adminLogin = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@teste.com',
    password: 'admin123'
  });

  if (adminLogin.success) {
    adminToken = adminLogin.data.token;
    adminId = adminLogin.data.user.id;
    console.log('  ✅ Login admin OK');
  } else {
    console.log('  ❌ Login admin falhou:', adminLogin.error);
    return false;
  }


  console.log('  📝 Registrando empresa...');
  const empresaRegister = await makeRequest('POST', '/api/auth/register', {
    email: 'empresa@teste.com',
    password: 'empresa123',
    tipo: 'empresa'
  });

  if (empresaRegister.success) {
    console.log('  ✅ Empresa registrada');
  }


  const empresaLogin = await makeRequest('POST', '/api/auth/login', {
    email: 'empresa@teste.com',
    password: 'empresa123'
  });

  if (empresaLogin.success) {
    empresaToken = empresaLogin.data.token;
    empresaId = empresaLogin.data.user.id;
    console.log('  ✅ Login empresa OK');
  }


  console.log('  📝 Registrando candidato...');
  const candidatoRegister = await makeRequest('POST', '/api/auth/register', {
    email: 'candidato@teste.com',
    password: 'candidato123',
    tipo: 'candidato'
  });

  if (candidatoRegister.success) {
    console.log('  ✅ Candidato registrado');
  }


  const candidatoLogin = await makeRequest('POST', '/api/auth/login', {
    email: 'candidato@teste.com',
    password: 'candidato123'
  });

  if (candidatoLogin.success) {
    candidatoToken = candidatoLogin.data.token;
    candidatoId = candidatoLogin.data.user.id;
    console.log('  ✅ Login candidato OK');
  }

  return true;
}

async function testEmpresas() {
  console.log('\n🏢 Testando Empresas...');


  const empresaUpdate = await makeRequest('PUT', '/api/empresas/perfil', {
    nome: 'Empresa Teste LTDA',
    setor: 'Tecnologia',
    descricao: 'Empresa de tecnologia para testes',
    website: 'https://empresa-teste.com',
    localizacao: 'São Paulo, SP'
  }, empresaToken);

  if (empresaUpdate.success) {
    console.log('  ✅ Perfil da empresa atualizado');
  } else {
    console.log('  ❌ Erro ao atualizar empresa:', empresaUpdate.error);
  }


  const empresaProfile = await makeRequest('GET', '/api/empresas/perfil', null, empresaToken);
  if (empresaProfile.success) {
    console.log('  ✅ Perfil da empresa obtido');
  }
}

async function testVagas() {
  console.log('\n💼 Testando Vagas...');


  const vagaCreate = await makeRequest('POST', '/api/vagas', {
    titulo: 'Desenvolvedor Full Stack',
    descricao: 'Vaga para desenvolvedor full stack sênior',
    requisitos: 'Experiência com React, Node.js, PostgreSQL',
    beneficios: 'Vale refeição, plano de saúde, home office',
    salario_min: 8000,
    salario_max: 12000,
    tipo_contrato: 'CLT',
    modalidade: 'Remoto',
    localizacao: 'São Paulo, SP',
    tags: ['React', 'Node.js', 'PostgreSQL']
  }, empresaToken);

  if (vagaCreate.success) {
    vagaId = vagaCreate.data.vaga.id;
    console.log('  ✅ Vaga criada');
  } else {
    console.log('  ❌ Erro ao criar vaga:', vagaCreate.error);
  }


  const vagasList = await makeRequest('GET', '/api/vagas');
  if (vagasList.success) {
    console.log(`  ✅ Vagas listadas: ${vagasList.data.vagas?.length || 0} vagas`);
  }


  if (vagaId) {
    const vagaDetail = await makeRequest('GET', `/api/vagas/${vagaId}`);
    if (vagaDetail.success) {
      console.log('  ✅ Detalhes da vaga obtidos');
    }
  }
}

async function testCandidaturas() {
  console.log('\n📄 Testando Candidaturas...');

  if (!vagaId) {
    console.log('  ⚠️  Pulando testes de candidatura (vaga não criada)');
    return;
  }


  const candidatura = await makeRequest('POST', `/api/candidaturas/${vagaId}`, {
    mensagem: 'Estou interessado nesta vaga pois tenho experiência sólida em desenvolvimento full stack.'
  }, candidatoToken);

  if (candidatura.success) {
    console.log('  ✅ Candidatura enviada');
  } else {
    console.log('  ❌ Erro na candidatura:', candidatura.error);
  }


  const candidaturasEmpresa = await makeRequest('GET', '/api/candidaturas/empresa', null, empresaToken);
  if (candidaturasEmpresa.success) {
    console.log(`  ✅ Candidaturas da empresa: ${candidaturasEmpresa.data.candidaturas?.length || 0}`);
  }


  const candidaturasCandidato = await makeRequest('GET', '/api/candidaturas', null, candidatoToken);
  if (candidaturasCandidato.success) {
    console.log(`  ✅ Candidaturas do candidato: ${candidaturasCandidato.data.candidaturas?.length || 0}`);
  }
}

async function testPosts() {
  console.log('\n📝 Testando Posts...');


  const postCreate = await makeRequest('POST', '/api/posts', {
    conteudo: 'Estamos contratando! Venha fazer parte do nosso time de tecnologia. #Vagas #Tech'
  }, empresaToken);

  if (postCreate.success) {
    postId = postCreate.data.post.id;
    console.log('  ✅ Post criado');
  } else {
    console.log('  ❌ Erro ao criar post:', postCreate.error);
  }


  const postsList = await makeRequest('GET', '/api/posts');
  if (postsList.success) {
    console.log(`  ✅ Posts listados: ${postsList.data.posts?.length || 0} posts`);
  }


  if (postId) {
    const postLike = await makeRequest('POST', `/api/posts/${postId}/like`, {}, candidatoToken);
    if (postLike.success) {
      console.log('  ✅ Post curtido');
    }


    const postComment = await makeRequest('POST', `/api/posts/${postId}/comentario`, {
      conteudo: 'Que oportunidade incrível! Vou me candidatar.'
    }, candidatoToken);

    if (postComment.success) {
      console.log('  ✅ Comentário adicionado');
    }
  }
}

async function testNotificacoes() {
  console.log('\n🔔 Testando Notificações...');


  const notificacoesList = await makeRequest('GET', '/api/notificacoes', null, candidatoToken);
  if (notificacoesList.success) {
    console.log(`  ✅ Notificações: ${notificacoesList.data.notificacoes?.length || 0}`);
  }


  const notificacoesCount = await makeRequest('GET', '/api/notificacoes/count', null, candidatoToken);
  if (notificacoesCount.success) {
    console.log(`  ✅ Notificações não lidas: ${notificacoesCount.data.unread_count}`);
  }
}

async function testAdmin() {
  console.log('\n👑 Testando Admin...');


  const adminDashboard = await makeRequest('GET', '/api/admin/dashboard', null, adminToken);
  if (adminDashboard.success) {
    console.log('  ✅ Dashboard admin OK');
  }


  const adminUsers = await makeRequest('GET', '/api/admin/usuarios', null, adminToken);
  if (adminUsers.success) {
    console.log(`  ✅ Usuários listados: ${adminUsers.data.usuarios?.length || 0}`);
  }


  const adminStats = await makeRequest('GET', '/api/admin/estatisticas', null, adminToken);
  if (adminStats.success) {
    console.log('  ✅ Estatísticas admin OK');
  }
}

async function testEstatisticas() {
  console.log('\n📊 Testando Estatísticas...');


  const candidatoStats = await makeRequest('GET', '/api/estatisticas/dashboard', null, candidatoToken);
  if (candidatoStats.success) {
    console.log('  ✅ Estatísticas candidato OK');
  }


  const empresaStats = await makeRequest('GET', '/api/estatisticas/dashboard', null, empresaToken);
  if (empresaStats.success) {
    console.log('  ✅ Estatísticas empresa OK');
  }


  const geralStats = await makeRequest('GET', '/api/estatisticas/gerais', null, adminToken);
  if (geralStats.success) {
    console.log('  ✅ Estatísticas gerais OK');
  }
}

async function testFlaskIntegration() {
  console.log('\n🤖 Testando Integração Flask...');

  try {

    const iaResponse = await axios.post(`${FLASK_URL}/api/ia/curriculum-analyzer`, {
      text: 'Desenvolvedor com 5 anos de experiência em React, Node.js e Python.'
    });

    if (iaResponse.status === 200) {
      console.log('  ✅ IA de currículo OK');
    }
  } catch (error) {
    console.log('  ⚠️  Flask não está rodando ou erro na IA:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando testes completos da API...\n');

  try {

    const authOk = await testAuth();
    if (!authOk) {
      console.log('❌ Testes interrompidos - autenticação falhou');
      return;
    }


    await testEmpresas();
    await testVagas();
    await testCandidaturas();
    await testPosts();
    await testNotificacoes();
    await testAdmin();
    await testEstatisticas();
    await testFlaskIntegration();

    console.log('\n🎉 Todos os testes foram executados!');
    console.log('\n📋 Resumo:');
    console.log(`  Admin Token: ${adminToken.substring(0, 20)}...`);
    console.log(`  Empresa Token: ${empresaToken.substring(0, 20)}...`);
    console.log(`  Candidato Token: ${candidatoToken.substring(0, 20)}...`);

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}


if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export default runAllTests;