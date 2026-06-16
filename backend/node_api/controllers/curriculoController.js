import curriculoService from '../services/curriculoService.js';

class CurriculoController {
  async createCurriculo(req, res) {
    try {

      if (req.user.tipo !== 'candidato') {
        return res.status(403).json({ error: 'Apenas candidatos podem criar currículos' });
      }

      const curriculoData = {
        ...req.body,
        candidato_id: req.user.candidato_id 
      };

      const curriculo = await curriculoService.createCurriculo(curriculoData);
      res.status(201).json({
        message: 'Currículo criado com sucesso',
        data: curriculo
      });
    } catch (error) {
      console.error('Erro ao criar currículo:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getCurriculoById(req, res) {
    try {
      const { id } = req.params;
      const curriculo = await curriculoService.getCurriculoById(id);
      res.json({ data: curriculo });
    } catch (error) {
      console.error('Erro ao buscar currículo:', error);
      res.status(404).json({ error: error.message });
    }
  }

  async getMyCurriculo(req, res) {
    try {

      if (req.user.tipo !== 'candidato') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const curriculo = await curriculoService.getCurriculoByCandidatoId(req.user.candidato_id);
      res.json({ data: curriculo });
    } catch (error) {
      console.error('Erro ao buscar currículo:', error);
      res.status(404).json({ error: error.message });
    }
  }

  async updateCurriculo(req, res) {
    try {
      const { id } = req.params;


      if (req.user.tipo !== 'candidato') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const updatedCurriculo = await curriculoService.updateCurriculo(id, req.body, req.user.candidato_id);
      res.json({
        message: 'Currículo atualizado com sucesso',
        data: updatedCurriculo
      });
    } catch (error) {
      console.error('Erro ao atualizar currículo:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async deleteCurriculo(req, res) {
    try {
      const { id } = req.params;


      if (req.user.tipo !== 'candidato') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      await curriculoService.deleteCurriculo(id, req.user.candidato_id);
      res.json({ message: 'Currículo deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar currículo:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async searchCurriculos(req, res) {
    try {

      if (!['empresa', 'admin'].includes(req.user.tipo)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { q: searchTerm, ...filters } = req.query;
      const curriculos = await curriculoService.searchCurriculos(searchTerm, filters);
      res.json({ data: curriculos });
    } catch (error) {
      console.error('Erro ao buscar currículos:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCurriculosBySkills(req, res) {
    try {

      if (!['empresa', 'admin'].includes(req.user.tipo)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { skills } = req.query;
      if (!skills) {
        return res.status(400).json({ error: 'Parâmetro skills é obrigatório' });
      }

      const skillsArray = Array.isArray(skills) ? skills : skills.split(',');
      const curriculos = await curriculoService.getCurriculosBySkills(skillsArray);
      res.json({ data: curriculos });
    } catch (error) {
      console.error('Erro ao buscar currículos por habilidades:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCurriculosByLocation(req, res) {
    try {

      if (!['empresa', 'admin'].includes(req.user.tipo)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { location, radius = 50 } = req.query;
      if (!location) {
        return res.status(400).json({ error: 'Parâmetro location é obrigatório' });
      }

      const curriculos = await curriculoService.getCurriculosByLocation(location, parseInt(radius));
      res.json({ data: curriculos });
    } catch (error) {
      console.error('Erro ao buscar currículos por localização:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCurriculosByExperienceLevel(req, res) {
    try {

      if (!['empresa', 'admin'].includes(req.user.tipo)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { level } = req.query;
      if (!level) {
        return res.status(400).json({ error: 'Parâmetro level é obrigatório' });
      }

      const curriculos = await curriculoService.getCurriculosByExperienceLevel(level);
      res.json({ data: curriculos });
    } catch (error) {
      console.error('Erro ao buscar currículos por nível de experiência:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCurriculosByEducationLevel(req, res) {
    try {

      if (!['empresa', 'admin'].includes(req.user.tipo)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { level } = req.query;
      if (!level) {
        return res.status(400).json({ error: 'Parâmetro level é obrigatório' });
      }

      const curriculos = await curriculoService.getCurriculosByEducationLevel(level);
      res.json({ data: curriculos });
    } catch (error) {
      console.error('Erro ao buscar currículos por nível de educação:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCurriculosByDisponibilidade(req, res) {
    try {

      if (!['empresa', 'admin'].includes(req.user.tipo)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { disponibilidade } = req.query;
      if (!disponibilidade) {
        return res.status(400).json({ error: 'Parâmetro disponibilidade é obrigatório' });
      }

      const curriculos = await curriculoService.getCurriculosByDisponibilidade(disponibilidade);
      res.json({ data: curriculos });
    } catch (error) {
      console.error('Erro ao buscar currículos por disponibilidade:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCurriculosByPretensaoSalarial(req, res) {
    try {

      if (!['empresa', 'admin'].includes(req.user.tipo)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { min, max } = req.query;
      if (!min || !max) {
        return res.status(400).json({ error: 'Parâmetros min e max são obrigatórios' });
      }

      const curriculos = await curriculoService.getCurriculosByPretensaoSalarial(parseFloat(min), parseFloat(max));
      res.json({ data: curriculos });
    } catch (error) {
      console.error('Erro ao buscar currículos por pretensão salarial:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCurriculoStats(req, res) {
    try {

      if (req.user.tipo !== 'candidato') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const stats = await curriculoService.getCurriculoStats(req.user.candidato_id);
      res.json({ data: stats });
    } catch (error) {
      console.error('Erro ao buscar estatísticas do currículo:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new CurriculoController();