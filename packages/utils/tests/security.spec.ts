import { secretToken } from '../security'

describe('secretToken()', () => {
  it('should generate a 32 bytes long secret token.', async () => {
    expect(async () => await secretToken(-1)).rejects.toThrow()
    expect(async () => await secretToken(0)).rejects.toThrow()
    expect(async () => await secretToken(1.3)).rejects.toThrow()

    expect((await secretToken()).length).toBe(32)
    expect((await secretToken(32)).length).toBe(32)
    expect((await secretToken(16)).length).toBe(16)
  })
})
