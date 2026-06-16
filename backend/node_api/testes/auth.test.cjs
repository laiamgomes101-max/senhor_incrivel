const request = require('supertest');

// URL base da API (usar servidor de desenvolvimento ou teste)
const BASE_URL = process.env.NODE_ENV === 'test' ? 'http://localhost:3001' : 'http://localhost:3001';

describe('Auth API Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      const userData = {
        email: 'teste@example.com',
        password: 'Teste123!',
        nome: 'Usuário Teste',
        tipo: 'candidato'
      };

      const response = await request(BASE_URL)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('Usuário registrado com sucesso');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.nome).toBe(userData.nome);
      expect(response.body.data.user.tipo).toBe(userData.tipo);
    });

    it('deve rejeitar registro com email já existente', async () => {
      const userData = {
        email: 'teste2@example.com',
        password: 'Teste123!',
        nome: 'Usuário Teste 2',
        tipo: 'candidato'
      };

      // Primeiro registro
      await request(BASE_URL)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Segundo registro com mesmo email
      const response = await request(BASE_URL)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Email já cadastrado');
    });

    it('deve rejeitar senha fraca', async () => {
      const userData = {
        email: 'teste3@example.com',
        password: '123',
        nome: 'Usuário Teste 3',
        tipo: 'candidato'
      };

      const response = await request(BASE_URL)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toContain('Senha fraca');
    });

    it('deve rejeitar dados inválidos', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Teste123!',
        nome: '',
        tipo: 'invalid'
      };

      const response = await request(BASE_URL)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Criar usuário para teste de login
      const userData = {
        email: 'login@example.com',
        password: 'Teste123!',
        nome: 'Usuário Login',
        tipo: 'candidato'
      };

      await request(BASE_URL)
        .post('/api/auth/register')
        .send(userData);
    });

    it('deve fazer login com credenciais válidas', async () => {
      const credentials = {
        email: 'login@example.com',
        password: 'Teste123!'
      };

      const response = await request(BASE_URL)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body.message).toBe('Login realizado com sucesso');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(credentials.email);
    });

    it('deve rejeitar login com email inexistente', async () => {
      const credentials = {
        email: 'naoexiste@example.com',
        password: 'Teste123!'
      };

      const response = await request(BASE_URL)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.error).toBe('Email ou senha inválidos');
    });

    it('deve rejeitar login com senha incorreta', async () => {
      const credentials = {
        email: 'login@example.com',
        password: 'SenhaErrada123!'
      };

      const response = await request(BASE_URL)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.error).toBe('Email ou senha inválidos');
    });
  });

  describe('GET /api/auth/me', () => {
    let token;

    beforeAll(async () => {
      // Registrar e fazer login para obter token
      const userData = {
        email: 'me@example.com',
        password: 'Teste123!',
        nome: 'Usuário Me',
        tipo: 'candidato'
      };

      const registerResponse = await request(BASE_URL)
        .post('/api/auth/register')
        .send(userData);

      token = registerResponse.body.data.token;
    });

    it('deve retornar dados do usuário atual com token válido', async () => {
      const response = await request(BASE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe('me@example.com');
      expect(response.body.data.nome).toBe('Usuário Me');
      expect(response.body.data.tipo).toBe('candidato');
    });

    it('deve rejeitar acesso sem token', async () => {
      const response = await request(BASE_URL)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('deve rejeitar token inválido', async () => {
      const response = await request(BASE_URL)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    let token;

    beforeAll(async () => {
      // Registrar e fazer login para obter token
      const userData = {
        email: 'refresh@example.com',
        password: 'Teste123!',
        nome: 'Usuário Refresh',
        tipo: 'candidato'
      };

      const registerResponse = await request(BASE_URL)
        .post('/api/auth/register')
        .send(userData);

      token = registerResponse.body.data.token;
    });

    it('deve renovar token com token válido', async () => {
      const response = await request(BASE_URL)
        .post('/api/auth/refresh-token')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe('Token renovado');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.token).not.toBe(token); // Token deve ser diferente
    });

    it('deve rejeitar renovação sem token', async () => {
      const response = await request(BASE_URL)
        .post('/api/auth/refresh-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
