import path from 'path';

export default {
  displayName: '@guarani/oauth2-server',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFilesAfterEnv: ['reflect-metadata', 'jest-extended/all', path.join(__dirname, 'jest.setup.ts')],
};
