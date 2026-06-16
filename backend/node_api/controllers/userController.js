import userService from '../services/userService.js';

class UserController {
  async getProfile(req, res) {
    try {
      const profile = await userService.getProfile(req.user.id);
      res.json({ data: profile });
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      res.status(404).json({ error: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const profile = await userService.updateProfile(req.user.id, req.body);
      res.json({
        message: 'Perfil atualizado com sucesso',
        data: profile
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getUsers(req, res) {
    try {
      const filters = {
        tipo: req.query.tipo,
        search: req.query.search
      };
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
      };

      const result = await userService.getUsers(filters, pagination);
      res.json({ data: result });
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      res.json({ data: user });
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(404).json({ error: error.message });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;


      if (req.user.tipo !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const result = await userService.deleteUser(id);
      res.json(result);
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getStats(req, res) {
    try {

      if (req.user.tipo !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const stats = await userService.getStats();
      res.json({ data: stats });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new UserController();