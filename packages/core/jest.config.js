/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  roots: ['<rootDir>/src'],

  testMatch: ['**/__tests__/**/*.spec.ts', '**/*.test.ts'],

  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json', // مهم جدًا
      useESM: true, // لو انت شغال ESM imports
    },
  },

  moduleFileExtensions: ['ts', 'js', 'json'],

  extensionsToTreatAsEsm: ['.ts'], // لو شغال imports بصيغة ESM
};
