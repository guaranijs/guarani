import { PlainPkceMethod } from '../../lib/pkce/plain.pkce-method';
import { PkceMethod } from '../../lib/types/pkce-method';

const pkceMethod = new PlainPkceMethod();

describe('Plain PKCE Method', () => {
  it('should have "plain" as its name.', () => {
    expect(pkceMethod.name).toBe<PkceMethod>('plain');
  });

  it('should return false when comparing two different strings.', () => {
    expect(pkceMethod.verify('abcxyz', 'abc123')).toBe(false);
  });

  it('should return true when comparing the same strings.', () => {
    expect(pkceMethod.verify('abcxyz', 'abcxyz')).toBe(true);
  });
});
