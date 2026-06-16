import candidaturaRepository from '../repositories/candidaturaRepository.js';
import vagaRepository from '../repositories/vagaRepository.js';
import curriculoRepository from '../repositories/curriculoRepository.js';
import candidatoRepository from '../repositories/candidatoRepository.js';
import candidaturaFluxoService from './candidaturaFluxoService.js';
import notificacaoService from './notificacaoService.js';
import { validate } from '../validation.js';
import { candidaturaValidation } from '../validation.js';

class CandidaturaService {
  async createCandidatura(candidaturaData) {

    const { error } = validate(candidaturaData, candidaturaValidation.create);
    if (error) {
      throw new Error(error.details[0].message);
    }


    const vaga = await vagaRepository.getVagaById(candidaturaData.vaga_id);
    if (!vaga) {
      throw new Error('Vaga não encontrada');
    }
    if (!vaga.ativa) {
      throw new Error('Esta vaga não está mais ativa');
    }


    const candidato = await candidatoRepository.getCandidatoById(candidaturaData.candidato_id);
    if (!candidato) {
      throw new Error('Candidato não encontrado');
    }


    const curriculo = await curriculoRepository.getCurriculoByCandidatoId(candidaturaData.candidato_id);
    if (!curriculo) {
      throw new Error('É necessário ter um currículo cadastrado para se candidatar');
    }


    const existingCandidatura = await candidaturaRepository.getCandidaturaByVagaAndCandidato(
      candidaturaData.vaga_id,
      candidaturaData.candidato_id
    );
    if (existingCandidatura) {
      throw new Error('Você já se candidatou a esta vaga');
    }


    const candidatura = await candidaturaRepository.createCandidatura(candidaturaData);


    await vagaRepository.incrementCandidaturasCount(candidaturaData.vaga_id);


    await candidatoRepository.incrementCandidaturasCount(candidaturaData.candidato_id);

    // Processa fluxo de candidatura com análise de currículo
    try {
      await candidaturaFluxoService.processarCandidaturaComCurriculo(
        candidatura,
        vaga,
        candidato
      );
    } catch (error) {
      console.error('Erro ao processar fluxo de candidatura:', error);
      // Não falha a candidatura se o chat não for criado
    }

    return candidatura;
  }

  async getCandidaturaById(id) {
    const candidatura = await candidaturaRepository.getCandidaturaById(id);
    if (!candidatura) {
      throw new Error('Candidatura não encontrada');
    }
    return candidatura;
  }

  async getCandidaturasByVaga(vagaId, empresaId) {

    const vaga = await vagaRepository.getVagaById(vagaId);
    if (!vaga) {
      throw new Error('Vaga não encontrada');
    }
    if (vaga.empresa_id !== empresaId) {
      throw new Error('Acesso negado');
    }

    return await candidaturaRepository.getCandidaturasByVaga(vagaId);
  }

  async getCandidaturasByCandidato(candidatoId) {
    return await candidaturaRepository.getCandidaturasByCandidato(candidatoId);
  }

  async updateCandidaturaStatus(id, status, empresaId, feedback = null) {

    const { error } = validate({ status }, candidaturaValidation.updateStatus);
    if (error) {
      throw new Error(error.details[0].message);
    }


    const candidatura = await this.getCandidaturaById(id);


    const vaga = await vagaRepository.getVagaById(candidatura.vaga_id);
    if (vaga.empresa_id !== empresaId) {
      throw new Error('Acesso negado');
    }


    const updateData = { status };
    if (feedback) {
      updateData.feedback = feedback;
    }
    updateData.data_atualizacao_status = new Date();

    const updatedCandidatura = await candidaturaRepository.updateCandidatura(id, updateData);


    try {
      const candidato = await candidatoRepository.getCandidatoById(candidatura.candidato_id);
      let titulo, mensagem;

      switch (status) {
        case 'aprovada':
          titulo = 'Candidatura aprovada!';
          mensagem = `Parabéns! Sua candidatura para "${vaga.titulo}" foi aprovada.`;
          break;
        case 'rejeitada':
          titulo = 'Candidatura não selecionada';
          mensagem = `Infelizmente sua candidatura para "${vaga.titulo}" não foi selecionada.`;
          if (feedback) {
            mensagem += ` Feedback: ${feedback}`;
          }
          break;
        case 'em_analise':
          titulo = 'Candidatura em análise';
          mensagem = `Sua candidatura para "${vaga.titulo}" está sendo analisada.`;
          break;
        default:
          titulo = 'Status da candidatura atualizado';
          mensagem = `O status da sua candidatura para "${vaga.titulo}" foi atualizado para: ${status}`;
      }

      await notificacaoService.createNotificacao({
        tipo: 'status_candidatura',
        titulo,
        mensagem,
        usuario_id: candidatura.candidato_id,
        referencia_id: id,
        referencia_tipo: 'candidatura'
      });
    } catch (error) {
      console.error('Erro ao criar notificação:', error);

    }

    return updatedCandidatura;
  }

  async deleteCandidatura(id, userId, userType) {

    const candidatura = await this.getCandidaturaById(id);


    let hasPermission = false;
    if (userType === 'candidato' && candidatura.candidato_id === userId) {
      hasPermission = true;
    } else if (userType === 'empresa') {
      const vaga = await vagaRepository.getVagaById(candidatura.vaga_id);
      if (vaga.empresa_id === userId) {
        hasPermission = true;
      }
    } else if (userType === 'admin') {
      hasPermission = true;
    }

    if (!hasPermission) {
      throw new Error('Acesso negado');
    }


    await candidaturaRepository.deleteCandidatura(id);


    await vagaRepository.decrementCandidaturasCount(candidatura.vaga_id);
    await candidatoRepository.decrementCandidaturasCount(candidatura.candidato_id);
  }

  async getCandidaturaStats(vagaId, empresaId) {

    const vaga = await vagaRepository.getVagaById(vagaId);
    if (!vaga) {
      throw new Error('Vaga não encontrada');
    }
    if (vaga.empresa_id !== empresaId) {
      throw new Error('Acesso negado');
    }

    return await candidaturaRepository.getCandidaturaStats(vagaId);
  }

  async getCandidatoStats(candidatoId) {
    return await candidaturaRepository.getCandidatoStats(candidatoId);
  }

  async getCandidaturasByStatus(vagaId, status, empresaId) {

    const vaga = await vagaRepository.getVagaById(vagaId);
    if (!vaga) {
      throw new Error('Vaga não encontrada');
    }
    if (vaga.empresa_id !== empresaId) {
      throw new Error('Acesso negado');
    }

    return await candidaturaRepository.getCandidaturasByStatus(vagaId, status);
  }

  async getCandidaturasByDateRange(vagaId, startDate, endDate, empresaId) {

    const vaga = await vagaRepository.getVagaById(vagaId);
    if (!vaga) {
      throw new Error('Vaga não encontrada');
    }
    if (vaga.empresa_id !== empresaId) {
      throw new Error('Acesso negado');
    }

    return await candidaturaRepository.getCandidaturasByDateRange(vagaId, startDate, endDate);
  }
}

export default new CandidaturaService();