import vagaService from '../services/vagaService.js';

class VagaController {
  async createVaga(req, res) {
    try {

      if (req.user.tipo !== 'empresa') {
        return res.status(403).json({ error: 'Apenas empresas podem criar vagas' });
      }

      const vagaData = {
        ...req.body,
        empresa_id: req.user.empresa_id 
      };

      const vaga = await vagaService.createVaga(vagaData);
      res.status(201).json({
        message: 'Vaga criada com sucesso',
        data: vaga
      });
    } catch (error) {
      console.error('Erro ao criar vaga:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getVagas(req, res) {
    try {
      const filters = {
        ativa: req.query.ativa !== 'false',
        search: req.query.search,
        localizacao: req.query.localizacao,
        tipo_contrato: req.query.tipo_contrato,
        modalidade: req.query.modalidade,
        nivel: req.query.nivel
      };
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
      };

      const result = await vagaService.getVagas(filters, pagination);
      res.json({ data: result });
    } catch (error) {
      console.error('Erro ao buscar vagas:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getVagaById(req, res) {
    try {
      const { id } = req.params;
      const vaga = await vagaService.getVagaById(id);


      if (req.user && req.user.tipo === 'candidato') {
        await vagaService.incrementViews(id);
      }

      res.json({ data: vaga });
    } catch (error) {
      console.error('Erro ao buscar vaga:', error);
      res.status(404).json({ error: error.message });
    }
  }

  async getVagasByEmpresa(req, res) {
    try {
      const { empresaId } = req.params;
      const filters = {
        ativa: req.query.ativa !== 'false',
        search: req.query.search
      };

      const vagas = await vagaService.getVagasByEmpresa(empresaId, filters);
      res.json({ data: vagas });
    } catch (error) {
      console.error('Erro ao buscar vagas da empresa:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateVaga(req, res) {
    try {
      const { id } = req.params;


      const vaga = await vagaService.getVagaById(id);
      if (vaga.empresa_id !== req.user.empresa_id && req.user.tipo !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const updatedVaga = await vagaService.updateVaga(id, req.body);
      res.json({
        message: 'Vaga atualizada com sucesso',
        data: updatedVaga
      });
    } catch (error) {
      console.error('Erro ao atualizar vaga:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async deleteVaga(req, res) {
    try {
      const { id } = req.params;


      const vaga = await vagaService.getVagaById(id);
      if (vaga.empresa_id !== req.user.empresa_id && req.user.tipo !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      await vagaService.deleteVaga(id);
      res.json({ message: 'Vaga deletada com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar vaga:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getStats(req, res) {
    try {
      const { id } = req.params;


      const vaga = await vagaService.getVagaById(id);
      if (vaga.empresa_id !== req.user.empresa_id && req.user.tipo !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const stats = await vagaService.getVagaStats(id);
      res.json({ data: stats });
    } catch (error) {
      console.error('Erro ao buscar estatísticas da vaga:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new VagaController();