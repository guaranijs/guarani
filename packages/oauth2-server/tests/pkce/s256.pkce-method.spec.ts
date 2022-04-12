import { S256PkceMethod } from '../../lib/pkce/s256.pkce-method';
import { SupportedPkceMethod } from '../../lib/pkce/types/supported-pkce-method';

describe('S256 PKCE Method', () => {
  it('should have "S256" as its name.', () => {
    expect(new S256PkceMethod().name).toBe<SupportedPkceMethod>('S256');
  });

  it('should return false when comparing a challenge to a different verifier.', () => {
    expect(new S256PkceMethod().verify('8xJ5XjIsh0YabzxJ4JiXxZyg1aNiRdKgDwjLxm7ul20', 'abc123')).toBe(false);
  });

  it('should return true when comparing a challenge to its verifier.', () => {
    expect(new S256PkceMethod().verify('8xJ5XjIsh0YabzxJ4JiXxZyg1aNiRdKgDwjLxm7ul20', 'abcxyz')).toBe(true);
  });
});
