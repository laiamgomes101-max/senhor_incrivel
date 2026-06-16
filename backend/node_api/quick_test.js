#!/usr/bin/env node

import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function quickTest() {
  console.log('🚀 Teste Rápido da API - Plataforma de Currículos\n');

  try {

    console.log('1️⃣  Testando conexão básica...');
    const basic = await axios.get(`${BASE_URL}/`);
    console.log('✅ API conectada:', basic.data.message);


    console.log('\n2️⃣  Testando registro de usuário...');
    const registerData = {
      email: `teste${Date.now()}@api.com`, 
      senha: 'teste123',
      nome: 'Usuário Teste',
      tipo: 'candidato'
    };
    console.log('📤 Enviando dados:', registerData);
    const register = await axios.post(`${BASE_URL}/api/auth/register`, registerData);
    const email = registerData.email; 
    console.log('✅ Usuário registrado:', register.data.user.email);


    console.log('\n3️⃣  Testando login...');
    const login = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: email,
      senha: 'teste123'
    });
    const token = login.data.token;
    console.log('✅ Login realizado, token obtido');


    console.log('\n4️⃣  Testando dados do usuário...');
    const me = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Dados do usuário:', me.data.user.email);


    console.log('\n5️⃣  Testando criação de post...');
    const post = await axios.post(`${BASE_URL}/api/posts`, {
      conteudo: 'Post de teste da API! 🚀'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Post criado:', post.data.post.conteudo);


    console.log('\n6️⃣  Testando listagem de posts...');
    const posts = await axios.get(`${BASE_URL}/api/posts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`✅ Posts listados: ${posts.data.posts.length} posts encontrados`);


    console.log('\n7️⃣  Testando estatísticas...');
    const stats = await axios.get(`${BASE_URL}/api/estatisticas/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Estatísticas obtidas');

    console.log('\n🎉 Todos os testes básicos passaram!');
    console.log('✅ API funcionando perfeitamente!');
    console.log('\n📋 Funcionalidades testadas:');
    console.log('  • Autenticação (registro/login)');
    console.log('  • Feed social (posts)');
    console.log('  • Estatísticas do usuário');
    console.log('  • Autorização JWT');

  } catch (error) {
    console.error('\n❌ Erro durante os testes:');
    console.error('Status:', error.response?.status);
    console.error('Mensagem:', error.response?.data || error.message);

    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Verifique se o servidor está rodando na porta 3001');
    }
  }
}

quickTest();