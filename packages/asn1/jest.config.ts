import { join } from 'path'

import baseConfig from '../../jest.config'

export default {
  ...baseConfig,
  rootDir: '../../',
  testMatch: [join(__dirname, 'tests/**/*.spec.ts')]
}
