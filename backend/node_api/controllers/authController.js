import authService from '../services/authService.js';

class AuthController {
  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        message: 'Usuário registrado com sucesso',
        data: result
      });
    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const result = await authService.login(req.body);
      res.json({
        message: 'Login realizado com sucesso',
        data: result
      });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(401).json({ error: error.message });
    }
  }

  async getCurrentUser(req, res) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      res.json({ data: user });
    } catch (error) {
      console.error('Erro ao buscar usuário atual:', error);
      res.status(404).json({ error: error.message });
    }
  }

  async refreshToken(req, res) {
    try {


      const user = await authService.getCurrentUser(req.user.id);
      const token = authService.generateToken(user);
      res.json({
        message: 'Token renovado',
        data: { token }
      });
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new AuthController();