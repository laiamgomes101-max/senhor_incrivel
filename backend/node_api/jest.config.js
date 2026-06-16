module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests*.test.js'],
  collectCoverageFrom: [
    '<rootDir>*.js',
    '!<rootDir>/node_modules