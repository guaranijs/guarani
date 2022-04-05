import { secretToken } from '../lib/security';

describe('secretToken()', () => {
  it('should fail when passing an invalid length.', async () => {
    expect(async () => await secretToken(-1)).rejects.toThrow();
    expect(async () => await secretToken(0)).rejects.toThrow();
    expect(async () => await secretToken(1.3)).rejects.toThrow();
  });

  it('should generate a secret token.', async () => {
    expect((await secretToken()).length).toBe(32);
    expect((await secretToken(32)).length).toBe(32);
    expect((await secretToken(16)).length).toBe(16);
  });
});
