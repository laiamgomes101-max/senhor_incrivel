


const request = require('supertest');
const app = require('../server');

describe('Currículos API', () => {
  let authToken = '';
  let testUser = {
    email: 'curriculo@example.com',
    password: 'password123',
    nome: 'Curriculo Test User',
    tipo: 'candidato'
  };

  beforeAll(async () => {

    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    authToken = loginResponse.body.token;
  });

  describe('POST /api/curriculos/upload', () => {
    test('Deve fazer upload de currículo com sucesso', async () => {
      const response = await request(app)
        .post('/api/curriculos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('mock pdf content'), 'curriculo.pdf')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('curriculo');
    });

    test('Deve rejeitar upload sem arquivo', async () => {
      const response = await request(app)
        .post('/api/curriculos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('Deve rejeitar upload sem autenticação', async () => {
      const response = await request(app)
        .post('/api/curriculos/upload')
        .attach('file', Buffer.from('mock pdf content'), 'curriculo.pdf')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('Deve rejeitar arquivo inválido', async () => {
      const response = await request(app)
        .post('/api/curriculos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake exe content'), 'virus.exe')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/curriculos', () => {
    test('Deve listar currículos do usuário', async () => {
      const response = await request(app)
        .get('/api/curriculos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('curriculos');
      expect(Array.isArray(response.body.curriculos)).toBe(true);
    });

    test('Deve rejeitar acesso sem autenticação', async () => {
      const response = await request(app)
        .get('/api/curriculos')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/curriculos/:id', () => {
    test('Deve atualizar currículo existente', async () => {

      const createResponse = await request(app)
        .post('/api/curriculos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('mock pdf content'), 'curriculo.pdf');

      const curriculoId = createResponse.body.curriculo.id;


      const updateData = {
        titulo: 'Desenvolvedor Senior',
        resumo: 'Experiência em desenvolvimento web'
      };

      const response = await request(app)
        .put(`/api/curriculos/${curriculoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('curriculo');
      expect(response.body.curriculo.titulo).toBe(updateData.titulo);
    });

    test('Deve rejeitar atualização de currículo de outro usuário', async () => {
      const response = await request(app)
        .put('/api/curriculos/999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ titulo: 'Novo título' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/curriculos/:id', () => {
    test('Deve deletar currículo existente', async () => {

      const createResponse = await request(app)
        .post('/api/curriculos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('mock pdf content'), 'curriculo.pdf');

      const curriculoId = createResponse.body.curriculo.id;


      const response = await request(app)
        .delete(`/api/curriculos/${curriculoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    test('Deve rejeitar deleção de currículo inexistente', async () => {
      const response = await request(app)
        .delete('/api/curriculos/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});

describe('Vagas API', () => {
  let companyToken = '';
  let testCompany = {
    email: 'company@example.com',
    password: 'password123',
    nome: 'Test Company',
    tipo: 'empresa'
  };

  beforeAll(async () => {

    await request(app)
      .post('/api/auth/register')
      .send(testCompany);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testCompany.email,
        password: testCompany.password
      });

    companyToken = loginResponse.body.token;
  });

  describe('POST /api/vagas', () => {
    test('Deve criar nova vaga', async () => {
      const vagaData = {
        titulo: 'Desenvolvedor Full Stack',
        descricao: 'Vaga para desenvolvedor experiente',
        requisitos: ['JavaScript', 'React', 'Node.js'],
        salario: 8000,
        localizacao: 'Remoto',
        tipo_contrato: 'CLT'
      };

      const response = await request(app)
        .post('/api/vagas')
        .set('Authorization', `Bearer ${companyToken}`)
        .send(vagaData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('vaga');
      expect(response.body.vaga.titulo).toBe(vagaData.titulo);
    });

    test('Deve rejeitar criação por candidato', async () => {
      const candidateToken = 'candidate-token'; 

      const vagaData = {
        titulo: 'Vaga Inválida',
        descricao: 'Descrição'
      };

      const response = await request(app)
        .post('/api/vagas')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send(vagaData)
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    test('Deve rejeitar dados inválidos', async () => {
      const invalidVaga = {
        titulo: '', 
        descricao: 'Descrição'
      };

      const response = await request(app)
        .post('/api/vagas')
        .set('Authorization', `Bearer ${companyToken}`)
        .send(invalidVaga)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/vagas', () => {
    test('Deve listar vagas disponíveis', async () => {
      const response = await request(app)
        .get('/api/vagas')
        .expect(200);

      expect(response.body).toHaveProperty('vagas');
      expect(Array.isArray(response.body.vagas)).toBe(true);
    });

    test('Deve filtrar vagas por localização', async () => {
      const response = await request(app)
        .get('/api/vagas?localizacao=Remoto')
        .expect(200);

      expect(response.body).toHaveProperty('vagas');
    });
  });
});