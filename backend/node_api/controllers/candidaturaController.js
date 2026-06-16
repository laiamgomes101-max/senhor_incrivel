import candidaturaService from '../services/candidaturaService.js';

class CandidaturaController {
  async createCandidatura(req, res) {
    try {

      if (req.user.tipo !== 'candidato') {
        return res.status(403).json({ error: 'Apenas candidatos podem se candidatar' });
      }

      const candidaturaData = {
        ...req.body,
        candidato_id: req.user.candidato_id 
      };

      const candidatura = await candidaturaService.createCandidatura(candidaturaData);
      res.status(201).json({
        message: 'Candidatura realizada com sucesso',
        data: candidatura
      });
    } catch (error) {
      console.error('Erro ao criar candidatura:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getCandidaturaById(req, res) {
    try {
      const { id } = req.params;
      const candidatura = await candidaturaService.getCandidaturaById(id);


      let hasPermission = false;
      if (req.user.tipo === 'candidato' && candidatura.candidato_id === req.user.candidato_id) {
        hasPermission = true;
      } else if (req.user.tipo === 'empresa') {

        const vaga = await require('../repositories/vagaRepository.js').default.getVagaById(candidatura.vaga_id);
        if (vaga.empresa_id === req.user.empresa_id) {
          hasPermission = true;
        }
      } else if (req.user.tipo === 'admin') {
        hasPermission = true;
      }

      if (!hasPermission) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      res.json({ data: candidatura });
    } catch (error) {
      console.error('Erro ao buscar candidatura:', error);
      res.status(404).json({ error: error.message });
    }
  }

  async getCandidaturasByVaga(req, res) {
    try {
      const { vagaId } = req.params;


      if (!['empresa', 'admin'].includes(req.user.tipo)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const candidaturas = await candidaturaService.getCandidaturasByVaga(vagaId, req.user.empresa_id);
      res.json({ data: candidaturas });
    } catch (error) {
      console.error('Erro ao buscar candidaturas da vaga:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getMyCandidaturas(req, res) {
    try {

      if (req.user.tipo !== 'candidato') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const candidaturas = await candidaturaService.getCandidaturasByCandidato(req.user.candidato_id);
      res.json({ data: candidaturas });
    } catch (error) {
      console.error('Erro ao buscar minhas candidaturas:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateCandidaturaStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, feedback } = req.body;


      if (!['empresa', 'admin'].includes(req.user.tipo)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const updatedCandidatura = await candidaturaService.updateCandidaturaStatus(
        id,
        status,
        req.user.empresa_id,
        feedback
      );

      res.json({
        message: 'Status da candidatura atualizado com sucesso',
        data: updatedCandidatura
      });
    } catch (error) {
      console.error('Erro ao atualizar status da candidatura:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async deleteCandidatura(req, res) {
    try {
      const { id } = req.params;

      await candidaturaService.deleteCandidatura(id, req.user.id, req.user.tipo);
      res.json({ message: 'Candidatura deletada com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar candidatura:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getCandidaturaStats(req, res) {
    try {
      const { vagaId } = req.params;


      if (!['empresa', 'admin'].includes(req.user.tipo)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const stats = await candidaturaService.getCandidaturaStats(vagaId, req.user.empresa_id);
      res.json({ data: stats });
    } catch (error) {
      console.error('Erro ao buscar estatísticas da candidatura:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCandidatoStats(req, res) {
    try {

      if (req.user.tipo !== 'candidato') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const stats = await candidaturaService.getCandidatoStats(req.user.candidato_id);
      res.json({ data: stats });
    } catch (error) {
      console.error('Erro ao buscar estatísticas do candidato:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCandidaturasByStatus(req, res) {
    try {
      const { vagaId, status } = req.params;


      if (!['empresa', 'admin'].includes(req.user.tipo)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const candidaturas = await candidaturaService.getCandidaturasByStatus(vagaId, status, req.user.empresa_id);
      res.json({ data: candidaturas });
    } catch (error) {
      console.error('Erro ao buscar candidaturas por status:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCandidaturasByDateRange(req, res) {
    try {
      const { vagaId } = req.params;
      const { startDate, endDate } = req.query;


      if (!['empresa', 'admin'].includes(req.user.tipo)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Parâmetros startDate e endDate são obrigatórios' });
      }

      const candidaturas = await candidaturaService.getCandidaturasByDateRange(
        vagaId,
        new Date(startDate),
        new Date(endDate),
        req.user.empresa_id
      );

      res.json({ data: candidaturas });
    } catch (error) {
      console.error('Erro ao buscar candidaturas por período:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new CandidaturaController();