import { Security } from '../lib'

describe('secretToken()', () => {
  it('should generate a 32 bytes long secret token.', () => {
    expect(Security.secretToken(32).length).toBe(32)
  })
})
