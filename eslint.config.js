// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'coverage/*', '.expo/*'],
  },
  {
    // Tooling config files run in Node (CommonJS).
    files: ['*.config.js'],
    languageOptions: {
      globals: { __dirname: 'readonly', require: 'readonly', module: 'writable' },
    },
  },
  {
    // Constitution I: no logging in app code (no PII or secrets can leak to logs).
    files: ['src/**/*.{ts,tsx}', 'App.tsx'],
    rules: {
      'no-console': 'error',
    },
  },
]);
