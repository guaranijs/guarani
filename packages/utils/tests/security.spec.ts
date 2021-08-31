import { secretToken } from '../lib/security'

describe('secretToken()', () => {
  it('should generate a 32 bytes long secret token.', async () => {
    expect((await secretToken(32)).length).toBe(32)
  })
})
