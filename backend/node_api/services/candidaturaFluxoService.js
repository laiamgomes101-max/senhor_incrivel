import pool from '../database.js';
import notificacaoService from './notificacaoService.js';
import axios from 'axios';

/**
 * Serviço que orquestra todo o fluxo de candidatura com análise de currículo
 * - Cria chat automático
 * - Busca dados do currículo na API Flask
 * - Notifica empresa com metadata
 */

class CandidaturaFluxoService {
  /**
   * Cria sala de chat automática quando candidato se candidata
   */
  async criarChatAutomatico(candidatura, vaga, candidato) {
    try {
      const roomKey = `candidatura:${candidatura.id}`;
      
      // Verifica se chat já existe
      const existing = await pool.query(
        'SELECT * FROM chat_rooms WHERE candidatura_id = $1',
        [candidatura.id]
      );
      
      if (existing.rows.length > 0) {
        return existing.rows[0];
      }

      // Cria nova sala de chat vinculada à candidatura
      const result = await pool.query(
        `INSERT INTO chat_rooms
          (room_key, room_type, candidatura_id, vaga_id, empresa_id, candidato_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [roomKey, 'candidatura', candidatura.id, vaga.id, vaga.empresa_id, candidato.id, 'ativa']
      );

      const room = result.rows[0];

      // Adiciona participantes
      await pool.query(
        'INSERT INTO chat_participants (chat_room_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [room.id, vaga.empresa_id, 'empresa']
      );

      await pool.query(
        'INSERT INTO chat_participants (chat_room_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [room.id, candidato.id, 'candidato']
      );

      // Envia mensagem de boas-vindas no chat
      await this.enviarMensagemBoasVindas(room.id, vaga, candidato);

      return room;
    } catch (error) {
      console.error('Erro ao criar chat automático:', error);
      throw error;
    }
  }

  /**
   * Envia mensagem automática de boas-vindas com informações do candidato
   */
  async enviarMensagemBoasVindas(roomId, vaga, candidato) {
    try {
      const mensagem = `👋 Olá! ${candidato.nome} se candidatou à vaga de "${vaga.titulo}". 
Você pode analisar o currículo clicando no botão "Analisar Currículo" abaixo ou digitando uma pergunta sobre o candidato.`;

      await pool.query(
        `INSERT INTO chat_messages 
          (chat_room_id, sender_id, recipient_id, content, message_type, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [roomId, null, vaga.empresa_id, mensagem, 'system', 'sent']
      );
    } catch (error) {
      console.error('Erro ao enviar mensagem de boas-vindas:', error);
    }
  }

  /**
   * Busca dados do currículo na API Flask e retorna metadados
   */
  async buscarDadosCurriculo(candidatoId) {
    try {
      const flaskUrl = process.env.FLASK_API_URL || 'http://localhost:5000';
      
      const response = await axios.get(
        `${flaskUrl}/api/candidatos/${candidatoId}/curriculos`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.FLASK_API_TOKEN || ''}`
          }
        }
      );

      if (response.data && response.data.data && response.data.data.length > 0) {
        return response.data.data[0]; // Retorna currículo mais recente
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar currículo na API Flask:', error);
      return null;
    }
  }

  /**
   * Cria notificação para empresa com metadata do currículo
   */
  async notificarEmpresaComCurriculo(candidatura, vaga, candidato, curriculo = null) {
    try {
      let metadata = {
        candidatura_id: candidatura.id,
        vaga_id: vaga.id,
        vaga_titulo: vaga.titulo,
        candidato_nome: candidato.nome,
        candidato_email: candidato.email,
        tem_curriculo: !!curriculo,
        arquivo_url: curriculo?.arquivo_url || null,
        habilidades: curriculo?.habilidades || [],
        experiencia: curriculo?.experiencia || [],
        localizacao: candidato.localizacao || null
      };

      // Adiciona análise anterior se existir
      if (curriculo?.id) {
        try {
          const flaskUrl = process.env.FLASK_API_URL || 'http://localhost:5000';
          const analiseResponse = await axios.get(
            `${flaskUrl}/api/candidatos/${candidato.id}/analise`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.FLASK_API_TOKEN || ''}`
              }
            }
          );
          
          if (analiseResponse.data?.data) {
            metadata.analise_resumida = {
              score: analiseResponse.data.data.score,
              pontos_fortes: analiseResponse.data.data.pontos_fortes?.slice(0, 3),
              areas_melhoria: analiseResponse.data.data.areas_melhoria?.slice(0, 3)
            };
          }
        } catch (err) {
          console.warn('Não foi possível buscar análise prévia:', err.message);
        }
      }

      await notificacaoService.createNotificacao({
        tipo: 'nova_candidatura_com_curriculum',
        titulo: '📄 Nova candidatura com currículo',
        mensagem: `${candidato.nome} se candidatou à vaga "${vaga.titulo}" com currículo anexado`,
        usuario_id: vaga.empresa_id,
        referencia_id: candidatura.id,
        referencia_tipo: 'candidatura',
        metadata: JSON.stringify(metadata),
        link: `/candidaturas/${candidatura.id}/chat`
      });
    } catch (error) {
      console.error('Erro ao notificar empresa:', error);
    }
  }

  /**
   * Orquestra todo o fluxo de candidatura com análise
   */
  async processarCandidaturaComCurriculo(candidaturaData, vaga, candidato) {
    try {
      // 1. Busca dados do currículo na API Flask
      const curriculo = await this.buscarDadosCurriculo(candidato.id);

      // 2. Cria chat automático
      const chatRoom = await this.criarChatAutomatico(candidaturaData, vaga, candidato);

      // 3. Notifica empresa com metadados
      await this.notificarEmpresaComCurriculo(candidaturaData, vaga, candidato, curriculo);

      return {
        candidatura: candidaturaData,
        chatRoom,
        curriculo
      };
    } catch (error) {
      console.error('Erro ao processar candidatura com currículo:', error);
      throw error;
    }
  }

  /**
   * Retorna todos os candidatos de uma vaga com suas análises
   */
  async listarCandidatosComAnalises(vagaId, empresaId) {
    try {
      const query = `
        SELECT 
          ca.id,
          ca.status,
          ca.created_at,
          cand.nome as candidato_nome,
          cand.email as candidato_email,
          cand.telefone,
          cand.localizacao,
          curriculo.id as curriculo_id,
          curriculo.arquivo_url,
          curriculo.habilidades,
          curriculo.experiencia,
          cr.id as chat_room_id,
          cr.status as chat_status
        FROM candidaturas ca
        JOIN candidatos cand ON ca.candidato_id = cand.id
        JOIN vagas v ON ca.vaga_id = v.id
        LEFT JOIN curriculos curriculo ON cand.id = curriculo.candidato_id
        LEFT JOIN chat_rooms cr ON ca.id = cr.candidatura_id
        WHERE ca.vaga_id = $1 AND v.empresa_id = $2
        ORDER BY ca.created_at DESC
      `;

      const result = await pool.query(query, [vagaId, empresaId]);
      return result.rows;
    } catch (error) {
      console.error('Erro ao listar candidatos com análises:', error);
      throw error;
    }
  }

  /**
   * Retorna histórico de análises de um candidato na vaga
   */
  async listarAnalisesCandidato(candidaturaId) {
    try {
      const query = `
        SELECT 
          ca.id,
          ca.status,
          ca.created_at,
          ca.feedback,
          cand.nome as candidato_nome,
          curriculo.arquivo_url,
          cr.id as chat_room_id,
          (SELECT COUNT(*) FROM chat_messages WHERE chat_room_id = cr.id) as total_mensagens
        FROM candidaturas ca
        JOIN candidatos cand ON ca.candidato_id = cand.id
        LEFT JOIN curriculos curriculo ON cand.id = curriculo.candidato_id
        LEFT JOIN chat_rooms cr ON ca.id = cr.candidatura_id
        WHERE ca.id = $1
      `;

      const result = await pool.query(query, [candidaturaId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao listar análises do candidato:', error);
      throw error;
    }
  }
}

export default new CandidaturaFluxoService();
