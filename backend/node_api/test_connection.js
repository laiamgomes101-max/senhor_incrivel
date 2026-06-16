#!/usr/bin/env node

import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com a API...\n');


    const response = await axios.get(`${BASE_URL}/`);
    console.log('✅ API conectada!');
    console.log('📄 Resposta:', response.data);


    const testResponse = await axios.get(`${BASE_URL}/test`);
    console.log('✅ Endpoint de teste OK!');
    console.log('📄 Resposta:', testResponse.data);

    console.log('\n🎉 Conexão com a API estabelecida com sucesso!');
    console.log('🚀 O servidor está funcionando corretamente.');

  } catch (error) {
    console.error('❌ Erro ao conectar com a API:');
    console.error('📄 Erro:', error.response?.data || error.message);
    console.error('\n💡 Verifique se o servidor está rodando na porta 3001');
    process.exit(1);
  }
}

testConnection();