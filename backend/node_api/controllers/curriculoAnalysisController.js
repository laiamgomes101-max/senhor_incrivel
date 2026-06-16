import candidaturaFluxoService from '../services/candidaturaFluxoService.js';
import axios from 'axios';

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';
const FLASK_API_TOKEN = process.env.FLASK_API_TOKEN || '';

class CurriculoAnalysisController {
  /**
   * Analisar currículo de um candidato em uma candidatura
   * POST /api/curriculo-analysis/candidatura/:candidaturaId
   */
  async analisarCurriculoCandidatura(req, res) {
    try {
      const { candidaturaId } = req.params;
      const userId = req.user?.id;

      // Busca dados da candidatura
      const candidaturaData = await candidaturaFluxoService.listarAnalisesCandidato(candidaturaId);

      if (!candidaturaData) {
        return res.status(404).json({ error: 'Candidatura não encontrada' });
      }

      // Verifica permissão: apenas a empresa dona da vaga pode analisar
      // Isso será validado pelo middleware de autorização

      // Se tiver currículo, envia para análise na API Flask
      if (candidaturaData.arquivo_url) {
        try {
          const analiseResponse = await axios.post(
            `${FLASK_API_URL}/api/analise/curriculum`,
            {
              arquivo_url: candidaturaData.arquivo_url,
              candidato_nome: candidaturaData.candidato_nome
            },
            {
              headers: {
                'Authorization': `Bearer ${FLASK_API_TOKEN}`,
                'Content-Type': 'application/json'
              }
            }
          );

          return res.json({
            data: {
              candidatura_id: candidaturaId,
              candidato_nome: candidaturaData.candidato_nome,
              analise: analiseResponse.data.data || analiseResponse.data,
              chat_room_id: candidaturaData.chat_room_id
            }
          });
        } catch (flaskError) {
          console.error('Erro ao chamar API Flask:', flaskError);
          return res.status(500).json({
            error: 'Erro ao analisar currículo',
            details: flaskError.message
          });
        }
      }

      return res.status(400).json({ error: 'Candidato não possui currículo anexado' });
    } catch (error) {
      console.error('Erro ao analisar currículo:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Listar análises anteriores de um candidato
   * GET /api/curriculo-analysis/candidatura/:candidaturaId/historico
   */
  async listarHistoricoAnalises(req, res) {
    try {
      const { candidaturaId } = req.params;

      const analises = await candidaturaFluxoService.listarAnalisesCandidato(candidaturaId);

      if (!analises) {
        return res.status(404).json({ error: 'Candidatura não encontrada' });
      }

      res.json({
        data: {
          candidatura_id: candidaturaId,
          candidato_nome: analises.candidato_nome,
          total_mensagens: analises.total_mensagens,
          status: analises.status,
          data_candidatura: analises.created_at
        }
      });
    } catch (error) {
      console.error('Erro ao listar histórico:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Listar todos os candidatos de uma vaga com suas análises
   * GET /api/curriculo-analysis/vaga/:vagaId/candidatos
   */
  async listarCandidatosVaga(req, res) {
    try {
      const { vagaId } = req.params;
      const empresaId = req.user?.empresa_id;

      if (!empresaId) {
        return res.status(403).json({ error: 'Acesso negado. Apenas empresas podem acessar.' });
      }

      const candidatos = await candidaturaFluxoService.listarCandidatosComAnalises(
        vagaId,
        empresaId
      );

      res.json({
        data: {
          vaga_id: vagaId,
          total_candidatos: candidatos.length,
          candidatos: candidatos.map(c => ({
            candidatura_id: c.id,
            candidato_nome: c.candidato_nome,
            email: c.candidato_email,
            telefone: c.telefone,
            localizacao: c.localizacao,
            status: c.status,
            tem_curriculo: !!c.arquivo_url,
            habilidades: c.habilidades || [],
            experiencia: c.experiencia || [],
            chat_room_id: c.chat_room_id,
            data_candidatura: c.created_at
          }))
        }
      });
    } catch (error) {
      console.error('Erro ao listar candidatos:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Comparar currículos de múltiplos candidatos
   * POST /api/curriculo-analysis/vaga/:vagaId/comparar
   */
  async compararCandidatos(req, res) {
    try {
      const { vagaId } = req.params;
      const { candidatura_ids } = req.body;
      const empresaId = req.user?.empresa_id;

      if (!empresaId) {
        return res.status(403).json({ error: 'Acesso negado. Apenas empresas podem acessar.' });
      }

      if (!Array.isArray(candidatura_ids) || candidatura_ids.length === 0) {
        return res.status(400).json({ error: 'É necessário fornecer pelo menos uma candidatura' });
      }

      // Busca dados dos candidatos para comparação
      const candidatos = await Promise.all(
        candidatura_ids.map(id => candidaturaFluxoService.listarAnalisesCandidato(id))
      );

      // Remove nulos
      const candidatosValidos = candidatos.filter(c => c !== null);

      if (candidatosValidos.length === 0) {
        return res.status(404).json({ error: 'Nenhum candidato encontrado' });
      }

      try {
        // Envia para API Flask para análise comparativa
        const comparacaoResponse = await axios.post(
          `${FLASK_API_URL}/api/analise/comparar`,
          {
            candidatos: candidatosValidos.map(c => ({
              candidatura_id: c.id,
              nome: c.candidato_nome,
              arquivo_url: c.arquivo_url,
              habilidades: c.habilidades || [],
              experiencia: c.experiencia || []
            }))
          },
          {
            headers: {
              'Authorization': `Bearer ${FLASK_API_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

        return res.json({
          data: {
            vaga_id: vagaId,
            total_candidatos: candidatosValidos.length,
            comparacao: comparacaoResponse.data.data || comparacaoResponse.data
          }
        });
      } catch (flaskError) {
        console.error('Erro ao chamar API Flask para comparação:', flaskError);
        
        // Retorna comparação básica se Flask falhar
        return res.json({
          data: {
            vaga_id: vagaId,
            total_candidatos: candidatosValidos.length,
            candidatos: candidatosValidos.map(c => ({
              candidatura_id: c.id,
              nome: c.candidato_nome,
              email: c.candidato_email,
              status: c.status
            })),
            aviso: 'Análise detalhada não disponível no momento'
          }
        });
      }
    } catch (error) {
      console.error('Erro ao comparar candidatos:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Analisar candidato via chat IA
   * POST /api/curriculo-analysis/candidatura/:candidaturaId/chat-ia
   */
  async analisarViaChatIA(req, res) {
    try {
      const { candidaturaId } = req.params;
      const { pergunta } = req.body;

      if (!pergunta || pergunta.trim().length === 0) {
        return res.status(400).json({ error: 'Pergunta é obrigatória' });
      }

      const analises = await candidaturaFluxoService.listarAnalisesCandidato(candidaturaId);

      if (!analises) {
        return res.status(404).json({ error: 'Candidatura não encontrada' });
      }

      // Envia pergunta para chat IA na API Flask
      try {
        const iaResponse = await axios.post(
          `${FLASK_API_URL}/api/ia/chat`,
          {
            message: pergunta,
            funcao: 'analise_candidato',
            contexto: {
              candidato_nome: analises.candidato_nome,
              arquivo_url: analises.arquivo_url
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${FLASK_API_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

        return res.json({
          data: {
            candidatura_id: candidaturaId,
            pergunta,
            resposta: iaResponse.data.response || iaResponse.data,
            chat_room_id: analises.chat_room_id
          }
        });
      } catch (flaskError) {
        console.error('Erro ao chamar Chat IA:', flaskError);
        return res.status(500).json({
          error: 'Erro ao processar pergunta',
          details: flaskError.message
        });
      }
    } catch (error) {
      console.error('Erro ao analisar via chat:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obter dados completos de um candidato para visualização no chat
   * GET /api/curriculo-analysis/candidatura/:candidaturaId/dados
   */
  async obterDadosCandidato(req, res) {
    try {
      const { candidaturaId } = req.params;

      const dados = await candidaturaFluxoService.listarAnalisesCandidato(candidaturaId);

      if (!dados) {
        return res.status(404).json({ error: 'Candidatura não encontrada' });
      }

      res.json({
        data: {
          candidatura_id: dados.id,
          candidato_nome: dados.candidato_nome,
          status: dados.status,
          feedback: dados.feedback,
          arquivo_url: dados.arquivo_url,
          total_mensagens: dados.total_mensagens,
          chat_room_id: dados.chat_room_id,
          data_candidatura: dados.created_at
        }
      });
    } catch (error) {
      console.error('Erro ao obter dados:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new CurriculoAnalysisController();
