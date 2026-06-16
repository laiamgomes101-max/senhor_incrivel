import userRepository from '../repositories/userRepository.js';
import candidatoRepository from '../repositories/candidatoRepository.js';
import empresaRepository from '../repositories/empresaRepository.js';

class UserService {
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    let profile = {
      id: user.id,
      email: user.email,
      tipo: user.tipo,
      nome: user.nome,
      created_at: user.created_at
    };


    if (user.tipo === 'candidato') {
      const candidato = await candidatoRepository.findByUserId(userId);
      if (candidato) {
        profile = { ...profile, ...candidato };
      }
    } else if (user.tipo === 'empresa') {
      const empresa = await empresaRepository.findByUserId(userId);
      if (empresa) {
        profile = { ...profile, ...empresa };
      }
    }

    return profile;
  }

  async updateProfile(userId, profileData) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }


    if (profileData.nome) {
      await userRepository.update(userId, { nome: profileData.nome });
    }


    if (user.tipo === 'candidato') {
      const candidatoData = {
        foto_url: profileData.foto_url,
        headline: profileData.headline,
        localizacao: profileData.localizacao,
        sobre: profileData.sobre,
        linkedin_url: profileData.linkedin_url,
        github_url: profileData.github_url,
        portfolio_url: profileData.portfolio_url
      };

      const candidato = await candidatoRepository.findByUserId(userId);
      if (candidato) {
        await candidatoRepository.update(candidato.id, candidatoData);
      } else {
        await candidatoRepository.create({ ...candidatoData, user_id: userId, nome: profileData.nome });
      }
    } else if (user.tipo === 'empresa') {
      const empresaData = {
        nome: profileData.nome,
        logo_url: profileData.logo_url,
        setor: profileData.setor,
        localizacao: profileData.localizacao,
        sobre: profileData.sobre,
        site_url: profileData.site_url,
        tamanho_empresa: profileData.tamanho_empresa
      };

      const empresa = await empresaRepository.findByUserId(userId);
      if (empresa) {
        await empresaRepository.update(empresa.id, empresaData);
      } else {
        await empresaRepository.create({ ...empresaData, user_id: userId });
      }
    }

    return await this.getProfile(userId);
  }

  async getUsers(filters = {}, pagination = {}) {
    return await userRepository.findAll(filters, pagination);
  }

  async getUserById(userId) {
    return await this.getProfile(userId);
  }

  async deleteUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }


    await userRepository.delete(userId);
    return { message: 'Usuário deletado com sucesso' };
  }

  async getStats() {
    const result = await userRepository.findAll();
    const users = result.users;

    const stats = {
      total: users.length,
      candidatos: users.filter(u => u.tipo === 'candidato').length,
      empresas: users.filter(u => u.tipo === 'empresa').length,
      admins: users.filter(u => u.tipo === 'admin').length
    };

    return stats;
  }
}

export default new UserService();