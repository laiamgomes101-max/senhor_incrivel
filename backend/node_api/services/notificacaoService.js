import notificacaoRepository from '../repositories/notificacaoRepository.js';
import userRepository from '../repositories/userRepository.js';
import { createNotificacaoSchema, updateNotificacaoSchema } from '../validation/notificacaoValidation.js';

class NotificacaoService {
  async createNotificacao(notificacaoData) {

    const { error } = createNotificacaoSchema.validate(notificacaoData, { abortEarly: false });
    if (error) {
      throw new Error(error.details[0].message);
    }


    const usuario = await userRepository.getUserById(notificacaoData.usuario_id);
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }


    const notificacao = await notificacaoRepository.createNotificacao(notificacaoData);

    return notificacao;
  }

  async getNotificacaoById(id) {
    const notificacao = await notificacaoRepository.getNotificacaoById(id);
    if (!notificacao) {
      throw new Error('Notificação não encontrada');
    }
    return notificacao;
  }

  async getNotificacoesByUsuario(usuarioId, filters = {}) {
    return await notificacaoRepository.getNotificacoesByUsuario(usuarioId, filters);
  }

  async getNotificacoesNaoLidas(usuarioId) {
    return await notificacaoRepository.getNotificacoesNaoLidas(usuarioId);
  }

  async markAsRead(id, usuarioId) {

    const notificacao = await this.getNotificacaoById(id);
    if (notificacao.usuario_id !== usuarioId) {
      throw new Error('Acesso negado');
    }

    return await notificacaoRepository.markAsRead(id);
  }

  async markAllAsRead(usuarioId) {
    return await notificacaoRepository.markAllAsRead(usuarioId);
  }

  async deleteNotificacao(id, usuarioId) {

    const notificacao = await this.getNotificacaoById(id);
    if (notificacao.usuario_id !== usuarioId) {
      throw new Error('Acesso negado');
    }

    await notificacaoRepository.deleteNotificacao(id);
  }

  async getNotificacoesByTipo(tipo, usuarioId) {
    return await notificacaoRepository.getNotificacoesByTipo(tipo, usuarioId);
  }

  async getNotificacoesByDateRange(usuarioId, startDate, endDate) {
    return await notificacaoRepository.getNotificacoesByDateRange(usuarioId, startDate, endDate);
  }

  async getNotificacaoStats(usuarioId) {
    return await notificacaoRepository.getNotificacaoStats(usuarioId);
  }

  async createSystemNotification(tipo, titulo, mensagem, usuarioId = null, referenciaId = null, referenciaTipo = null) {
    const notificacaoData = {
      tipo,
      titulo,
      mensagem,
      usuario_id: usuarioId,
      referencia_id: referenciaId,
      referencia_tipo: referenciaTipo
    };

    return await this.createNotificacao(notificacaoData);
  }

  async createBulkNotifications(notificacoes) {
    const results = [];
    for (const notificacao of notificacoes) {
      try {
        const result = await this.createNotificacao(notificacao);
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error: error.message, data: notificacao });
      }
    }
    return results;
  }

  async archiveOldNotifications(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await notificacaoRepository.archiveOldNotifications(cutoffDate);
  }

  async getNotificacoesByReferencia(referenciaId, referenciaTipo) {
    return await notificacaoRepository.getNotificacoesByReferencia(referenciaId, referenciaTipo);
  }

  async updateNotificacao(id, updateData, usuarioId) {

    const { error } = updateNotificacaoSchema.validate(updateData, { abortEarly: false });
    if (error) {
      throw new Error(error.details[0].message);
    }


    const notificacao = await this.getNotificacaoById(id);
    if (notificacao.usuario_id !== usuarioId) {
      throw new Error('Acesso negado');
    }

    return await notificacaoRepository.updateNotificacao(id, updateData);
  }
}

export default new NotificacaoService();