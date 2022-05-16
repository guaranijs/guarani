import { S256PkceMethod } from '../../lib/pkce/s256.pkce-method';
import { PkceMethod } from '../../lib/types/pkce-method';

const pkceMethod = new S256PkceMethod();

describe('S256 PKCE Method', () => {
  it('should have "S256" as its name.', () => {
    expect(pkceMethod.name).toBe<PkceMethod>('S256');
  });

  it('should return false when comparing a challenge to a different verifier.', () => {
    expect(pkceMethod.verify('8xJ5XjIsh0YabzxJ4JiXxZyg1aNiRdKgDwjLxm7ul20', 'abc123')).toBe(false);
  });

  it('should return true when comparing a challenge to its verifier.', () => {
    expect(pkceMethod.verify('8xJ5XjIsh0YabzxJ4JiXxZyg1aNiRdKgDwjLxm7ul20', 'abcxyz')).toBe(true);
  });
});
