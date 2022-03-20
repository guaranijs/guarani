export default {
  bail: true,
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['packages/**/lib/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coverageReporters: ['json', 'lcov'],
  moduleFileExtensions: ['js', 'ts', 'node'],
  moduleNameMapper: {
    '@guarani/(.*)': ['<rootDir>/packages/$1'],
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.spec.ts'],
  transform: { '^.+\\.ts$': 'ts-jest' },
  transformIgnorePatterns: ['node_modules/'],
  verbose: true,
};
