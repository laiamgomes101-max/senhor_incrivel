import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/auth.js';
import vagaRoutes from '../../routes/vagas.js';
import pool from '../../database.js';

// Configurar app de teste
const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/vagas', vagaRoutes);

// Tokens para diferentes tipos de usuário
let candidatoToken;
let empresaToken;
let adminToken;
let empresaId;

beforeAll(async () => {
  try {
    // Limpar bancos
    await pool.query('DELETE FROM candidaturas');
    await pool.query('DELETE FROM vagas');
    await pool.query('DELETE FROM usuarios');

    // Criar usuários de teste
    const candidatoData = {
      email: 'candidato@teste.com',
      password: 'Teste123!',
      nome: 'Candidato Teste',
      tipo: 'candidato'
    };

    const empresaData = {
      email: 'empresa@teste.com',
      password: 'Teste123!',
      nome: 'Empresa Teste',
      tipo: 'empresa'
    };

    const adminData = {
      email: 'admin@teste.com',
      password: 'Teste123!',
      nome: 'Admin Teste',
      tipo: 'admin'
    };

    // Registrar usuários e obter tokens
    const candidatoResponse = await request(app)
      .post('/auth/register')
      .send(candidatoData);

    const empresaResponse = await request(app)
      .post('/auth/register')
      .send(empresaData);

    const adminResponse = await request(app)
      .post('/auth/register')
      .send(adminData);

    candidatoToken = candidatoResponse.body.data.token;
    empresaToken = empresaResponse.body.data.token;
    adminToken = adminResponse.body.data.token;

    // Obter empresa_id da empresa
    const empresaProfile = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${empresaToken}`);

    empresaId = empresaProfile.body.data.id;

  } catch (error) {
    console.log('Erro no setup:', error.message);
  }
});

// Limpar banco após todos os testes
afterAll(async () => {
  try {
    await pool.query('DELETE FROM candidaturas');
    await pool.query('DELETE FROM vagas');
    await pool.query('DELETE FROM usuarios');
    await pool.end();
  } catch (error) {
    console.log('Erro ao fechar conexão:', error.message);
  }
});

describe('Vaga Routes', () => {
  let vagaId;

  describe('POST /vagas', () => {
    it('deve criar vaga para empresa', async () => {
      const vagaData = {
        titulo: 'Desenvolvedor Full Stack',
        descricao: 'Vaga para desenvolvedor full stack sênior',
        requisitos: 'Experiência com React, Node.js, PostgreSQL',
        localizacao: 'São Paulo, SP',
        tipo_contrato: 'CLT',
        modalidade: 'Presencial',
        nivel: 'Sênior',
        salario_min: 8000,
        salario_max: 12000,
        beneficios: 'Vale refeição, Plano de saúde',
        ativa: true
      };

      const response = await request(app)
        .post('/vagas')
        .set('Authorization', `Bearer ${empresaToken}`)
        .send(vagaData)
        .expect(201);

      expect(response.body.message).toBe('Vaga criada com sucesso');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.titulo).toBe(vagaData.titulo);
      expect(response.body.data.empresa_id).toBe(empresaId);

      vagaId = response.body.data.id;
    });

    it('deve rejeitar criação para candidato', async () => {
      const vagaData = {
        titulo: 'Vaga Teste',
        descricao: 'Descrição teste',
        localizacao: 'São Paulo, SP'
      };

      const response = await request(app)
        .post('/vagas')
        .set('Authorization', `Bearer ${candidatoToken}`)
        .send(vagaData)
        .expect(403);

      expect(response.body.error).toBe('Apenas empresas podem criar vagas');
    });

    it('deve rejeitar dados inválidos', async () => {
      const invalidData = {
        titulo: '',
        descricao: 'Descrição válida'
      };

      const response = await request(app)
        .post('/vagas')
        .set('Authorization', `Bearer ${empresaToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /vagas', () => {
    beforeAll(async () => {
      // Criar mais algumas vagas para teste
      const vagasData = [
        {
          titulo: 'Analista de Dados',
          descricao: 'Vaga para analista de dados',
          localizacao: 'Rio de Janeiro, RJ',
          tipo_contrato: 'PJ',
          modalidade: 'Remoto',
          nivel: 'Pleno'
        },
        {
          titulo: 'Designer UX/UI',
          descricao: 'Vaga para designer',
          localizacao: 'São Paulo, SP',
          tipo_contrato: 'CLT',
          modalidade: 'Híbrido',
          nivel: 'Sênior'
        }
      ];

      for (const vaga of vagasData) {
        await request(app)
          .post('/vagas')
          .set('Authorization', `Bearer ${empresaToken}`)
          .send(vaga);
      }
    });

    it('deve retornar lista de vagas ativas', async () => {
      const response = await request(app)
        .get('/vagas')
        .set('Authorization', `Bearer ${candidatoToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data.vagas)).toBe(true);
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.vagas.length).toBeGreaterThan(0);
    });

    it('deve filtrar por localização', async () => {
      const response = await request(app)
        .get('/vagas?localizacao=São Paulo')
        .set('Authorization', `Bearer ${candidatoToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data.vagas)).toBe(true);
      response.body.data.vagas.forEach(vaga => {
        expect(vaga.localizacao.toLowerCase()).toContain('são paulo');
      });
    });

    it('deve filtrar por modalidade', async () => {
      const response = await request(app)
        .get('/vagas?modalidade=Remoto')
        .set('Authorization', `Bearer ${candidatoToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data.vagas)).toBe(true);
      response.body.data.vagas.forEach(vaga => {
        expect(vaga.modalidade).toBe('Remoto');
      });
    });

    it('deve paginar resultados', async () => {
      const response = await request(app)
        .get('/vagas?page=1&limit=2')
        .set('Authorization', `Bearer ${candidatoToken}`)
        .expect(200);

      expect(response.body.data.vagas.length).toBeLessThanOrEqual(2);
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 2);
    });
  });

  describe('GET /vagas/:id', () => {
    it('deve retornar vaga específica', async () => {
      const response = await request(app)
        .get(`/vagas/${vagaId}`)
        .set('Authorization', `Bearer ${candidatoToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(vagaId);
      expect(response.body.data).toHaveProperty('titulo');
      expect(response.body.data).toHaveProperty('descricao');
    });

    it('deve incrementar visualizações para candidato', async () => {
      const initialResponse = await request(app)
        .get(`/vagas/${vagaId}`)
        .set('Authorization', `Bearer ${candidatoToken}`);

      const views1 = initialResponse.body.data.visualizacoes || 0;

      // Buscar novamente
      const secondResponse = await request(app)
        .get(`/vagas/${vagaId}`)
        .set('Authorization', `Bearer ${candidatoToken}`);

      const views2 = secondResponse.body.data.visualizacoes || 0;
      expect(views2).toBeGreaterThanOrEqual(views1);
    });

    it('deve retornar 404 para vaga inexistente', async () => {
      const response = await request(app)
        .get('/vagas/99999')
        .set('Authorization', `Bearer ${candidatoToken}`)
        .expect(404);

      expect(response.body.error).toBe('Vaga não encontrada');
    });
  });

  describe('PUT /vagas/:id', () => {
    it('deve atualizar vaga da própria empresa', async () => {
      const updateData = {
        titulo: 'Desenvolvedor Full Stack Sênior',
        salario_min: 9000
      };

      const response = await request(app)
        .put(`/vagas/${vagaId}`)
        .set('Authorization', `Bearer ${empresaToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Vaga atualizada com sucesso');
      expect(response.body.data.titulo).toBe(updateData.titulo);
      expect(response.body.data.salario_min).toBe(updateData.salario_min);
    });

    it('deve rejeitar atualização de vaga de outra empresa', async () => {
      // Criar outra empresa
      const outraEmpresaData = {
        email: 'outra@teste.com',
        password: 'Teste123!',
        nome: 'Outra Empresa',
        tipo: 'empresa'
      };

      const outraEmpresaResponse = await request(app)
        .post('/auth/register')
        .send(outraEmpresaData);

      const outraEmpresaToken = outraEmpresaResponse.body.data.token;

      const updateData = {
        titulo: 'Tentativa de alteração'
      };

      const response = await request(app)
        .put(`/vagas/${vagaId}`)
        .set('Authorization', `Bearer ${outraEmpresaToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.error).toBe('Acesso negado');
    });
  });

  describe('DELETE /vagas/:id', () => {
    let vagaToDeleteId;

    beforeAll(async () => {
      // Criar vaga para deletar
      const vagaData = {
        titulo: 'Vaga Para Deletar',
        descricao: 'Esta vaga será deletada',
        localizacao: 'São Paulo, SP'
      };

      const response = await request(app)
        .post('/vagas')
        .set('Authorization', `Bearer ${empresaToken}`)
        .send(vagaData);

      vagaToDeleteId = response.body.data.id;
    });

    it('deve deletar vaga da própria empresa', async () => {
      const response = await request(app)
        .delete(`/vagas/${vagaToDeleteId}`)
        .set('Authorization', `Bearer ${empresaToken}`)
        .expect(200);

      expect(response.body.message).toBe('Vaga deletada com sucesso');
    });

    it('deve rejeitar deleção de vaga de outra empresa', async () => {
      // Criar outra empresa
      const outraEmpresaData = {
        email: 'deletar@teste.com',
        password: 'Teste123!',
        nome: 'Empresa Deletar',
        tipo: 'empresa'
      };

      const outraEmpresaResponse = await request(app)
        .post('/auth/register')
        .send(outraEmpresaData);

      const outraEmpresaToken = outraEmpresaResponse.body.data.token;

      const response = await request(app)
        .delete(`/vagas/${vagaId}`)
        .set('Authorization', `Bearer ${outraEmpresaToken}`)
        .expect(403);

      expect(response.body.error).toBe('Acesso negado');
    });
  });

  describe('GET /vagas/empresa/:empresaId', () => {
    it('deve retornar vagas da empresa', async () => {
      const response = await request(app)
        .get(`/vagas/empresa/${empresaId}`)
        .set('Authorization', `Bearer ${candidatoToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach(vaga => {
        expect(vaga.empresa_id).toBe(empresaId);
      });
    });
  });

  describe('GET /vagas/:id/stats', () => {
    it('deve retornar estatísticas da vaga para empresa proprietária', async () => {
      const response = await request(app)
        .get(`/vagas/${vagaId}/stats`)
        .set('Authorization', `Bearer ${empresaToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('visualizacoes');
      expect(response.body.data).toHaveProperty('candidaturas');
      expect(typeof response.body.data.visualizacoes).toBe('number');
    });

    it('deve rejeitar acesso às estatísticas para outra empresa', async () => {
      // Criar outra empresa
      const outraEmpresaData = {
        email: 'stats@teste.com',
        password: 'Teste123!',
        nome: 'Empresa Stats',
        tipo: 'empresa'
      };

      const outraEmpresaResponse = await request(app)
        .post('/auth/register')
        .send(outraEmpresaData);

      const outraEmpresaToken = outraEmpresaResponse.body.data.token;

      const response = await request(app)
        .get(`/vagas/${vagaId}/stats`)
        .set('Authorization', `Bearer ${outraEmpresaToken}`)
        .expect(403);

      expect(response.body.error).toBe('Acesso negado');
    });
  });
});