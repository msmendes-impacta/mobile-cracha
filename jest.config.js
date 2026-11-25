/** @type {import('jest').Config} */
const ruleFolders = ['src/domain/**/*.ts', 'src/services/**/*.ts', 'src/session/**/*.ts'];

const threshold = { lines: 90, branches: 90, functions: 90 };

module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
  // Constitution IV: business-rule folders must stay at or above 90% coverage.
  collectCoverageFrom: [...ruleFolders, '!src/services/expoCrypto.adapter.ts'],
  coverageThreshold: {
    global: threshold,
    './src/domain/': threshold,
    './src/services/': threshold,
    './src/session/': threshold,
  },
};
