module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages', '<rootDir>/apps'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.spec.ts',
    '!**/*.test.ts',
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  moduleNameMapper: {
    '^@auth-template/core(.*)$': '<rootDir>/packages/core/src$1',
    '^@auth-template/nestjs-adapter(.*)$': '<rootDir>/packages/nestjs-adapter/src$1',
  },
};