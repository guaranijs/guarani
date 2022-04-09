import { S256Pkce } from '../../lib/pkce/s256.pkce';
import { SupportedPkce } from '../../lib/pkce/types/supported-pkce';

describe('S256 Proof Key for Code Exchange', () => {
  it('should have "S256" as its name.', () => {
    expect(new S256Pkce().name).toBe<SupportedPkce>('S256');
  });

  it('should return false when comparing a challenge to a different verifier.', () => {
    expect(new S256Pkce().verify('8xJ5XjIsh0YabzxJ4JiXxZyg1aNiRdKgDwjLxm7ul20', 'abc123')).toBe(false);
  });

  it('should return true when comparing a challenge to its verifier.', () => {
    expect(new S256Pkce().verify('8xJ5XjIsh0YabzxJ4JiXxZyg1aNiRdKgDwjLxm7ul20', 'abcxyz')).toBe(true);
  });
});
