import { join } from 'path';

import baseConfig from '../../jest.config';

export default {
  ...baseConfig,
  setupFilesAfterEnv: [join(__dirname, 'jest.setup.ts')],
  rootDir: '../../',
  testMatch: [join(__dirname, 'tests/**/*.spec.ts')],
};
