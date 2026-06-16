/**
 * test_candidatura_analise.js
 * Testes de integração para candidatura com análise de currículo
 */

import fetch from 'node-fetch';

const API_URL = process.env.NODE_API_URL || 'http://localhost:3001';
const TESTS = [];
let passedTests = 0;
let failedTests = 0;

// Helper para fazer requisições
async function request(method, endpoint, body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();

  return {
    status: response.status,
    data,
    ok: response.ok
  };
}

// Teste 1: Verificar se rotas estão registradas
async function testRoutasRegistradas() {
  console.log('\n✅ Teste 1: Verificar rotas de análise');
  
  const endpoints = [
    '/api/curriculo-analysis/candidatura/1/analisar',
    '/api/curriculo-analysis/candidatura/1/dados',
    '/api/curriculo-analysis/candidatura/1/historico',
    '/api/curriculo-analysis/vaga/1/candidatos'
  ];

  for (const endpoint of endpoints) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    // Esperamos erro 401 (não autenticado) e não 404 (rota não existe)
    const routeExists = response.status !== 404;
    
    if (routeExists) {
      console.log(`  ✅ ${endpoint} existe`);
      passedTests++;
    } else {
      console.log(`  ❌ ${endpoint} NÃO ENCONTRADO`);
      failedTests++;
    }
  }
}

// Teste 2: Validar estrutura de resposta
async function testEstruturaCurriculoAnalysisPanel() {
  console.log('\n✅ Teste 2: Validar estrutura de CurriculoAnalysisPanel');
  
  try {
    // Verificar se arquivo existe (requer fs)
    const fs = await import('fs');
    const filePath = './frontend/src/components/CurriculoAnalysisPanel.jsx';
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      const checks = {
        'Importação de useState': content.includes('useState'),
        'API call com axios': content.includes('api.post'),
        'Botão de análise': content.includes('handleAnalizar'),
        'Chat com IA': content.includes('handlePerguntaIA'),
        'Exibição de score': content.includes('score'),
        'Pontos fortes': content.includes('pontos_fortes'),
        'Áreas de melhoria': content.includes('areas_melhoria')
      };

      Object.entries(checks).forEach(([check, result]) => {
        if (result) {
          console.log(`  ✅ ${check}`);
          passedTests++;
        } else {
          console.log(`  ❌ ${check}`);
          failedTests++;
        }
      });
    } else {
      console.log(`  ❌ Arquivo não encontrado: ${filePath}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`  ❌ Erro ao validar: ${error.message}`);
    failedTests++;
  }
}

// Teste 3: Validar integração em ChatPage
async function testIntegracaoChatPage() {
  console.log('\n✅ Teste 3: Validar integração em ChatPage');
  
  try {
    const fs = await import('fs');
    const filePath = './frontend/src/pages/ChatPage.jsx';
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      const checks = {
        'Importação de CurriculoAnalysisPanel': content.includes('CurriculoAnalysisPanel'),
        'Estado de candidaturaData': content.includes('setCandidaturaData'),
        'Renderização condicional': content.includes('candidaturaData && role === \'empresa\''),
        'Passagem de props': content.includes('candidaturaId={activeRoom.candidatura_id}')
      };

      Object.entries(checks).forEach(([check, result]) => {
        if (result) {
          console.log(`  ✅ ${check}`);
          passedTests++;
        } else {
          console.log(`  ❌ ${check}`);
          failedTests++;
        }
      });
    } else {
      console.log(`  ❌ Arquivo não encontrado: ${filePath}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`  ❌ Erro ao validar: ${error.message}`);
    failedTests++;
  }
}

// Teste 4: Validar CandidaturaFluxoService
async function testCandidaturaFluxoService() {
  console.log('\n✅ Teste 4: Validar CandidaturaFluxoService');
  
  try {
    const fs = await import('fs');
    const filePath = './backend/node_api/services/candidaturaFluxoService.js';
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      const checks = {
        'Método criarChatAutomatico': content.includes('criarChatAutomatico'),
        'Método buscarDadosCurriculo': content.includes('buscarDadosCurriculo'),
        'Método notificarEmpresaComCurriculo': content.includes('notificarEmpresaComCurriculo'),
        'Método processarCandidaturaComCurriculo': content.includes('processarCandidaturaComCurriculo'),
        'Método listarCandidatosComAnalises': content.includes('listarCandidatosComAnalises'),
        'Integração com pool de BD': content.includes('pool.query'),
        'Integração com notificações': content.includes('notificacaoService')
      };

      Object.entries(checks).forEach(([check, result]) => {
        if (result) {
          console.log(`  ✅ ${check}`);
          passedTests++;
        } else {
          console.log(`  ❌ ${check}`);
          failedTests++;
        }
      });
    } else {
      console.log(`  ❌ Arquivo não encontrado: ${filePath}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`  ❌ Erro ao validar: ${error.message}`);
    failedTests++;
  }
}

// Teste 5: Validar Controller
async function testCurriculoAnalysisController() {
  console.log('\n✅ Teste 5: Validar CurriculoAnalysisController');
  
  try {
    const fs = await import('fs');
    const filePath = './backend/node_api/controllers/curriculoAnalysisController.js';
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      const checks = {
        'Método analisarCurriculoCandidatura': content.includes('analisarCurriculoCandidatura'),
        'Método listarHistoricoAnalises': content.includes('listarHistoricoAnalises'),
        'Método listarCandidatosVaga': content.includes('listarCandidatosVaga'),
        'Método compararCandidatos': content.includes('compararCandidatos'),
        'Método analisarViaChatIA': content.includes('analisarViaChatIA'),
        'Chamada à API Flask': content.includes('axios.post'),
        'Tratamento de erros': content.includes('catch (error)')
      };

      Object.entries(checks).forEach(([check, result]) => {
        if (result) {
          console.log(`  ✅ ${check}`);
          passedTests++;
        } else {
          console.log(`  ❌ ${check}`);
          failedTests++;
        }
      });
    } else {
      console.log(`  ❌ Arquivo não encontrado: ${filePath}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`  ❌ Erro ao validar: ${error.message}`);
    failedTests++;
  }
}

// Teste 6: Validar Rotas
async function testCurriculoAnalysisRoutes() {
  console.log('\n✅ Teste 6: Validar CurriculoAnalysisRoutes');
  
  try {
    const fs = await import('fs');
    const filePath = './backend/node_api/routes/curriculoAnalysisRoutes.js';
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      const checks = {
        'Importação do controller': content.includes('curriculoAnalysisController'),
        'Rota POST analisar': content.includes('/candidatura/:candidaturaId/analisar'),
        'Rota GET historico': content.includes('/candidatura/:candidaturaId/historico'),
        'Rota GET dados': content.includes('/candidatura/:candidaturaId/dados'),
        'Rota POST chat-ia': content.includes('/candidatura/:candidaturaId/chat-ia'),
        'Rota GET candidatos': content.includes('/vaga/:vagaId/candidatos'),
        'Rota POST comparar': content.includes('/vaga/:vagaId/comparar'),
        'Middleware de autenticação': content.includes('authenticateToken')
      };

      Object.entries(checks).forEach(([check, result]) => {
        if (result) {
          console.log(`  ✅ ${check}`);
          passedTests++;
        } else {
          console.log(`  ❌ ${check}`);
          failedTests++;
        }
      });
    } else {
      console.log(`  ❌ Arquivo não encontrado: ${filePath}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`  ❌ Erro ao validar: ${error.message}`);
    failedTests++;
  }
}

// Teste 7: Validar integração em server.js
async function testIntegracaoServer() {
  console.log('\n✅ Teste 7: Validar integração em server.js');
  
  try {
    const fs = await import('fs');
    const filePath = './backend/node_api/server.js';
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      const checks = {
        'Importação curriculoAnalysisRoutes': content.includes('curriculoAnalysisRoutes'),
        'Registro da rota': content.includes('/api/curriculo-analysis')
      };

      Object.entries(checks).forEach(([check, result]) => {
        if (result) {
          console.log(`  ✅ ${check}`);
          passedTests++;
        } else {
          console.log(`  ❌ ${check}`);
          failedTests++;
        }
      });
    } else {
      console.log(`  ❌ Arquivo não encontrado: ${filePath}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`  ❌ Erro ao validar: ${error.message}`);
    failedTests++;
  }
}

// Teste 8: Validar integração em candidaturaService.js
async function testIntegracaoCandidaturaService() {
  console.log('\n✅ Teste 8: Validar integração em candidaturaService.js');
  
  try {
    const fs = await import('fs');
    const filePath = './backend/node_api/services/candidaturaService.js';
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      const checks = {
        'Importação candidaturaFluxoService': content.includes('candidaturaFluxoService'),
        'Chamada a processarCandidaturaComCurriculo': content.includes('processarCandidaturaComCurriculo')
      };

      Object.entries(checks).forEach(([check, result]) => {
        if (result) {
          console.log(`  ✅ ${check}`);
          passedTests++;
        } else {
          console.log(`  ❌ ${check}`);
          failedTests++;
        }
      });
    } else {
      console.log(`  ❌ Arquivo não encontrado: ${filePath}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`  ❌ Erro ao validar: ${error.message}`);
    failedTests++;
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('=====================================');
  console.log('🧪 TESTES DE INTEGRAÇÃO');
  console.log('Sistema de Análise de Currículo');
  console.log('=====================================');

  await testRoutasRegistradas();
  await testEstruturaCurriculoAnalysisPanel();
  await testIntegracaoChatPage();
  await testCandidaturaFluxoService();
  await testCurriculoAnalysisController();
  await testCurriculoAnalysisRoutes();
  await testIntegracaoServer();
  await testIntegracaoCandidaturaService();

  console.log('\n=====================================');
  console.log('📊 RESULTADO FINAL');
  console.log('=====================================');
  console.log(`✅ Testes Passaram: ${passedTests}`);
  console.log(`❌ Testes Falharam: ${failedTests}`);
  console.log(`📈 Taxa de Sucesso: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(2)}%`);
  console.log('=====================================\n');

  if (failedTests === 0) {
    console.log('🎉 TODOS OS TESTES PASSARAM! ✅');
  } else {
    console.log('⚠️  ALGUNS TESTES FALHARAM. REVISE!');
  }
}

// Executar
runAllTests().catch(console.error);
