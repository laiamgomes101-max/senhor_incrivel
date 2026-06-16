import express from 'express';
import curriculoAnalysisController from '../controllers/curriculoAnalysisController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

/**
 * Análise de Currículo - Rotas
 */

// Analisar currículo de uma candidatura específica
router.post(
  '/candidatura/:candidaturaId/analisar',
  curriculoAnalysisController.analisarCurriculoCandidatura
);

// Obter histórico de análises de um candidato
router.get(
  '/candidatura/:candidaturaId/historico',
  curriculoAnalysisController.listarHistoricoAnalises
);

// Obter dados completos do candidato
router.get(
  '/candidatura/:candidaturaId/dados',
  curriculoAnalysisController.obterDadosCandidato
);

// Analisar candidato via Chat IA
router.post(
  '/candidatura/:candidaturaId/chat-ia',
  curriculoAnalysisController.analisarViaChatIA
);

// Listar todos os candidatos de uma vaga com análises
router.get(
  '/vaga/:vagaId/candidatos',
  curriculoAnalysisController.listarCandidatosVaga
);

// Comparar currículos de múltiplos candidatos
router.post(
  '/vaga/:vagaId/comparar',
  curriculoAnalysisController.compararCandidatos
);

export default router;
