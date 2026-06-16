


const { sequelize } = require('../database');


const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(async () => {

  console.log = jest.fn();
  console.error = jest.fn();


  process.env.NODE_ENV = 'test';
  process.env.DB_NAME = 'plataforma_curriculos_test';

  try {

    await sequelize.authenticate();
    console.log('Banco de teste conectado');
  } catch (error) {
    console.log('Erro ao conectar banco de teste:', error.message);
  }
});

afterAll(async () => {

  console.log = originalConsoleLog;
  console.error = originalConsoleError;


  if (sequelize) {
    await sequelize.close();
  }
});

beforeEach(async () => {

  try {
    await sequelize.sync({ force: true });
  } catch (error) {
    console.log('Erro ao limpar banco:', error.message);
  }
});