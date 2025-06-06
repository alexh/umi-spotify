module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
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
    'no-unused-vars': ['warn', { "argsIgnorePattern": "^_" }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
