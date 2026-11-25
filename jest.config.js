const fs = require('node:fs');
const path = require('node:path');

/** @type {import('jest').Config} */
const ruleFolders = ['domain', 'services', 'session'];

const threshold = { lines: 90, branches: 90, functions: 90 };

// Constitution IV: every business-rule folder must stay at or above 90% coverage.
// Absolute paths so the per-folder thresholds also resolve on Windows. A folder gets
// its threshold as soon as it contains source files (an empty folder has no coverage
// data, which Jest would report as a failure).
const hasSource = (dir) => fs.existsSync(dir) && fs.readdirSync(dir, { recursive: true }).some((f) => String(f).endsWith('.ts'));
const perFolder = Object.fromEntries(
  ruleFolders
    .map((folder) => path.join(__dirname, 'src', folder))
    .filter(hasSource)
    .map((dir) => [dir + path.sep, threshold]),
);

module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    ...ruleFolders.map((folder) => `src/${folder}/**/*.ts`),
    '!src/services/expoCrypto.adapter.ts',
  ],
  coverageThreshold: { global: threshold, ...perFolder },
};
