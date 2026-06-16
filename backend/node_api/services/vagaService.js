import vagaRepository from '../repositories/vagaRepository.js';
import empresaRepository from '../repositories/empresaRepository.js';
import userRepository from '../repositories/userRepository.js';
import notificacaoService from './notificacaoService.js';

class VagaService {
  async createVaga(vagaData) {

    const { error } = validate(vagaData, vagaValidation.create);
    if (error) {
      throw new Error(error.details[0].message);
    }


    const empresa = await empresaRepository.getEmpresaById(vagaData.empresa_id);
    if (!empresa) {
      throw new Error('Empresa não encontrada');
    }


    const vaga = await vagaRepository.createVaga(vagaData);


    await empresaRepository.incrementVagasCount(vagaData.empresa_id);
    await this.notifyCandidatesAboutNewVaga(vaga);

    return vaga;
  }

  async notifyCandidatesAboutNewVaga(vaga) {
    try {
      const candidateIds = await userRepository.getUserIdsByTipo('candidato');
      const notifications = candidateIds.map((candidateId) => ({
        usuario_id: candidateId,
        tipo: 'vaga',
        titulo: 'Nova vaga disponível',
        mensagem: `Nova vaga publicada: "${vaga.titulo}". Confira as oportunidades disponíveis.`,
        dados_adicionais: { vaga_id: vaga.id },
        lida: false
      }));

      await Promise.allSettled(
        notifications.map((notification) => notificacaoService.createNotificacao(notification))
      );
    } catch (error) {
      console.error('Erro ao notificar candidatos sobre nova vaga:', error);
    }
  }

  async getVagas(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;

    const result = await vagaRepository.getVagas(filters, {
      offset: (page - 1) * limit,
      limit: limit
    });

    return {
      vagas: result.vagas,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    };
  }

  async getVagaById(id) {
    const vaga = await vagaRepository.getVagaById(id);
    if (!vaga) {
      throw new Error('Vaga não encontrada');
    }
    return vaga;
  }

  async getVagasByEmpresa(empresaId, filters = {}) {

    const empresa = await empresaRepository.getEmpresaById(empresaId);
    if (!empresa) {
      throw new Error('Empresa não encontrada');
    }

    return await vagaRepository.getVagasByEmpresa(empresaId, filters);
  }

  async updateVaga(id, updateData) {

    const { error } = validate(updateData, vagaValidation.update);
    if (error) {
      throw new Error(error.details[0].message);
    }


    const existingVaga = await this.getVagaById(id);


    const updatedVaga = await vagaRepository.updateVaga(id, updateData);

    return updatedVaga;
  }

  async deleteVaga(id) {

    const vaga = await this.getVagaById(id);


    await vagaRepository.deleteVaga(id);


    await empresaRepository.decrementVagasCount(vaga.empresa_id);
  }

  async incrementViews(id) {
    await vagaRepository.incrementViews(id);
  }

  async getVagaStats(id) {

    await this.getVagaById(id);

    return await vagaRepository.getVagaStats(id);
  }

  async searchVagas(searchTerm, filters = {}) {
    return await vagaRepository.searchVagas(searchTerm, filters);
  }

  async getVagasByLocation(location, radius = 50) {
    return await vagaRepository.getVagasByLocation(location, radius);
  }

  async getVagasByTipoContrato(tipoContrato) {
    return await vagaRepository.getVagasByTipoContrato(tipoContrato);
  }

  async getVagasByModalidade(modalidade) {
    return await vagaRepository.getVagasByModalidade(modalidade);
  }

  async getVagasByNivel(nivel) {
    return await vagaRepository.getVagasByNivel(nivel);
  }
}

export default new VagaService();