import path from 'path';

export default {
  displayName: '@guarani/oauth2-server',
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFilesAfterEnv: [path.join(__dirname, 'jest.setup.ts')],
  coverageDirectory: '../../coverage/packages/oauth2-server',
};
