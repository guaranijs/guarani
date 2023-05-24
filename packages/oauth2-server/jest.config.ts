import path from 'path';

export default {
  displayName: '@guarani/oauth2-server',
  preset: '../../jest.preset.js',
  globals: {},
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFilesAfterEnv: [path.join(__dirname, 'jest.setup.ts')],
  coverageDirectory: '../../coverage/packages/oauth2-server',
};
