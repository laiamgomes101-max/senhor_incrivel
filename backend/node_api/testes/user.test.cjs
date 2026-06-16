const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth.js');
const pool = require('../../database.js');

// Configurar app de teste
const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

// Limpar banco de dados de teste antes de cada teste
beforeEach(async () => {
  try {
    await pool.query('DELETE FROM usuarios');
  } catch (error) {
    console.log('Erro ao limpar banco:', error.message);
  }
});

// Limpar banco após todos os testes
afterAll(async () => {
  try {
    await pool.query('DELETE FROM usuarios');
    await pool.end();
  } catch (error) {
    console.log('Erro ao fechar conexão:', error.message);
  }
});

describe('User Management Routes', () => {
  let adminToken;
  let userToken;

  beforeEach(async () => {
    // Criar usuário admin
    const adminData = {
      email: 'admin@example.com',
      password: 'Admin123!',
      nome: 'Admin Teste',
      tipo: 'admin'
    };

    const adminResponse = await request(app)
      .post('/auth/register')
      .send(adminData);

    adminToken = adminResponse.body.data.token;

    // Criar usuário comum
    const userData = {
      email: 'user@example.com',
      password: 'User123!',
      nome: 'Usuário Comum',
      tipo: 'candidato'
    };

    const userResponse = await request(app)
      .post('/auth/register')
      .send(userData);

    userToken = userResponse.body.data.token;
  });

  describe('GET /auth/users', () => {
    it('deve listar todos os usuários para admin', async () => {
      const response = await request(app)
        .get('/auth/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2); // admin + user
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('email');
      expect(response.body.data[0]).toHaveProperty('nome');
      expect(response.body.data[0]).toHaveProperty('tipo');
    });

    it('deve rejeitar listagem para usuário comum', async () => {
      const response = await request(app)
        .get('/auth/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Acesso negado. Apenas administradores podem acessar esta rota.');
    });

    it('deve rejeitar listagem sem token', async () => {
      const response = await request(app)
        .get('/auth/users')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /auth/users/stats', () => {
    it('deve retornar estatísticas de usuários para admin', async () => {
      const response = await request(app)
        .get('/auth/users/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('candidatos');
      expect(response.body.data).toHaveProperty('empresas');
      expect(response.body.data).toHaveProperty('admins');
      expect(typeof response.body.data.total).toBe('number');
      expect(typeof response.body.data.candidatos).toBe('number');
      expect(typeof response.body.data.empresas).toBe('number');
      expect(typeof response.body.data.admins).toBe('number');
    });

    it('deve rejeitar estatísticas para usuário comum', async () => {
      const response = await request(app)
        .get('/auth/users/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Acesso negado. Apenas administradores podem acessar esta rota.');
    });
  });

  describe('DELETE /auth/users/:id', () => {
    let userToDelete;

    beforeEach(async () => {
      // Criar usuário para deletar
      const deleteUserData = {
        email: 'delete@example.com',
        password: 'Delete123!',
        nome: 'Usuário Para Deletar',
        tipo: 'candidato'
      };

      const deleteResponse = await request(app)
        .post('/auth/register')
        .send(deleteUserData);

      userToDelete = deleteResponse.body.data.user;
    });

    it('deve deletar usuário para admin', async () => {
      const response = await request(app)
        .delete(`/auth/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Usuário deletado com sucesso');

      // Verificar se usuário foi realmente deletado
      const checkResponse = await request(app)
        .get('/auth/users')
        .set('Authorization', `Bearer ${adminToken}`);

      const deletedUser = checkResponse.body.data.find(u => u.id === userToDelete.id);
      expect(deletedUser).toBeUndefined();
    });

    it('deve rejeitar deleção para usuário comum', async () => {
      const response = await request(app)
        .delete(`/auth/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Acesso negado. Apenas administradores podem acessar esta rota.');
    });

    it('deve rejeitar deleção de usuário inexistente', async () => {
      const response = await request(app)
        .delete('/auth/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toBe('Usuário não encontrado');
    });
  });

  describe('PUT /auth/users/:id', () => {
    let userToUpdate;

    beforeEach(async () => {
      // Criar usuário para atualizar
      const updateUserData = {
        email: 'update@example.com',
        password: 'Update123!',
        nome: 'Usuário Para Atualizar',
        tipo: 'candidato'
      };

      const updateResponse = await request(app)
        .post('/auth/register')
        .send(updateUserData);

      userToUpdate = updateResponse.body.data.user;
    });

    it('deve atualizar usuário para admin', async () => {
      const updateData = {
        nome: 'Nome Atualizado',
        tipo: 'empresa'
      };

      const response = await request(app)
        .put(`/auth/users/${userToUpdate.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Usuário atualizado com sucesso');
      expect(response.body.data.nome).toBe(updateData.nome);
      expect(response.body.data.tipo).toBe(updateData.tipo);
    });

    it('deve rejeitar atualização para usuário comum', async () => {
      const updateData = {
        nome: 'Nome Atualizado'
      };

      const response = await request(app)
        .put(`/auth/users/${userToUpdate.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.error).toBe('Acesso negado. Apenas administradores podem acessar esta rota.');
    });

    it('deve rejeitar atualização de usuário inexistente', async () => {
      const updateData = {
        nome: 'Nome Atualizado'
      };

      const response = await request(app)
        .put('/auth/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.error).toBe('Usuário não encontrado');
    });
  });
});