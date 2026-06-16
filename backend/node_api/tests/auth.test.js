


const request = require('supertest');
const app = require('../server');
const bcrypt = require('bcrypt');

describe('Autenticação API', () => {
  let testUser = {
    email: 'test@example.com',
    password: 'password123',
    nome: 'Test User'
  };

  let authToken = '';

  beforeAll(async () => {


  });

  describe('POST /api/auth/register', () => {
    test('Deve registrar novo usuário com sucesso', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('Deve rejeitar email duplicado', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Email já cadastrado');
    });

    test('Deve rejeitar email inválido', async () => {
      const invalidUser = { ...testUser, email: 'email-invalido' };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('Deve rejeitar senha curta', async () => {
      const invalidUser = { ...testUser, password: '123' };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    test('Deve fazer login com credenciais válidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(typeof response.body.token).toBe('string');

      authToken = response.body.token;
    });

    test('Deve rejeitar email não encontrado', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'naoexiste@example.com',
          password: testUser.password
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Credenciais inválidas');
    });

    test('Deve rejeitar senha incorreta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'senha-incorreta'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Credenciais inválidas');
    });

    test('Deve rejeitar campos vazios', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: '',
          password: ''
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/profile', () => {
    test('Deve retornar perfil do usuário autenticado', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('Deve rejeitar acesso sem token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('Deve rejeitar token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    test('Deve fazer logout com sucesso', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });
});

describe('Middleware de Autenticação', () => {
  test('Deve validar token JWT corretamente', async () => {

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    const token = loginResponse.body.token;


    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('user');
  });

  test('Deve rejeitar token expirado', async () => {

    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDAsInVzZXJJZCI6MX0.invalid';

    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });
});