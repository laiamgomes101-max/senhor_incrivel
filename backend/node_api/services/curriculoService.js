import curriculoRepository from '../repositories/curriculoRepository.js';
import candidatoRepository from '../repositories/candidatoRepository.js';
import { createCurriculoSchema, updateCurriculoSchema } from '../validation/curriculoValidation.js';

class CurriculoService {
  async createCurriculo(curriculoData) {

    const { error } = createCurriculoSchema.validate(curriculoData);
    if (error) {
      throw new Error(error.details[0].message);
    }


    const candidato = await candidatoRepository.getCandidatoById(curriculoData.candidato_id);
    if (!candidato) {
      throw new Error('Candidato não encontrado');
    }


    const existingCurriculo = await curriculoRepository.getCurriculoByCandidatoId(curriculoData.candidato_id);
    if (existingCurriculo) {
      throw new Error('Já existe um currículo para este candidato');
    }


    const curriculo = await curriculoRepository.createCurriculo(curriculoData);


    await candidatoRepository.updateCandidato(curriculoData.candidato_id, {
      tem_curriculo: true,
      ultimo_curriculo_atualizado: new Date()
    });

    return curriculo;
  }

  async getCurriculoById(id) {
    const curriculo = await curriculoRepository.getCurriculoById(id);
    if (!curriculo) {
      throw new Error('Currículo não encontrado');
    }
    return curriculo;
  }

  async getCurriculoByCandidatoId(candidatoId) {

    const candidato = await candidatoRepository.getCandidatoById(candidatoId);
    if (!candidato) {
      throw new Error('Candidato não encontrado');
    }

    const curriculo = await curriculoRepository.getCurriculoByCandidatoId(candidatoId);
    if (!curriculo) {
      throw new Error('Currículo não encontrado');
    }
    return curriculo;
  }

  async updateCurriculo(id, updateData, candidatoId) {

    const { error } = updateCurriculoSchema.validate(updateData);
    if (error) {
      throw new Error(error.details[0].message);
    }


    const curriculo = await this.getCurriculoById(id);
    if (curriculo.candidato_id !== candidatoId) {
      throw new Error('Acesso negado');
    }


    const updatedCurriculo = await curriculoRepository.updateCurriculo(id, updateData);


    await candidatoRepository.updateCandidato(candidatoId, {
      ultimo_curriculo_atualizado: new Date()
    });

    return updatedCurriculo;
  }

  async deleteCurriculo(id, candidatoId) {

    const curriculo = await this.getCurriculoById(id);
    if (curriculo.candidato_id !== candidatoId) {
      throw new Error('Acesso negado');
    }


    await curriculoRepository.deleteCurriculo(id);


    await candidatoRepository.updateCandidato(candidatoId, {
      tem_curriculo: false,
      ultimo_curriculo_atualizado: null
    });
  }

  async searchCurriculos(searchTerm, filters = {}) {
    return await curriculoRepository.searchCurriculos(searchTerm, filters);
  }

  async getCurriculosBySkills(skills) {
    return await curriculoRepository.getCurriculosBySkills(skills);
  }

  async getCurriculosByLocation(location, radius = 50) {
    return await curriculoRepository.getCurriculosByLocation(location, radius);
  }

  async getCurriculosByExperienceLevel(level) {
    return await curriculoRepository.getCurriculosByExperienceLevel(level);
  }

  async getCurriculosByEducationLevel(level) {
    return await curriculoRepository.getCurriculosByEducationLevel(level);
  }

  async getCurriculosByDisponibilidade(disponibilidade) {
    return await curriculoRepository.getCurriculosByDisponibilidade(disponibilidade);
  }

  async getCurriculosByPretensaoSalarial(min, max) {
    return await curriculoRepository.getCurriculosByPretensaoSalarial(min, max);
  }

  async getCurriculoStats(candidatoId) {

    const candidato = await candidatoRepository.getCandidatoById(candidatoId);
    if (!candidato) {
      throw new Error('Candidato não encontrado');
    }

    return await curriculoRepository.getCurriculoStats(candidatoId);
  }
}

export default new CurriculoService();