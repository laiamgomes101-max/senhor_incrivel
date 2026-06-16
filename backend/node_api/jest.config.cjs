module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/?(*.)+(spec|test).(js|cjs)'
  ],
  testTimeout: 10000,
  collectCoverageFrom: [
    'routes/**/*.js',
    'controllers/**/*.js',
    'utils/**/*.js',
    'models/**/*.js',
    '!**/node_modules/**',
    '!**/testes/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/testes/setup.js'],
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  }
};