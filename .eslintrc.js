module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    'react',
  ],
  rules: {
    'react/prop-types': 'off',
    'react/no-unknown-property': ['error', { ignore: ['object', 'args', 'intensity', 'position', 'rotation', 'transparent'] }],
    'no-unused-vars': ['error', { "argsIgnorePattern": "^_" }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};