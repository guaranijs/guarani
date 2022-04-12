import { PlainPkceMethod } from '../../lib/pkce/plain.pkce-method';
import { SupportedPkceMethod } from '../../lib/pkce/types/supported-pkce-method';

describe('Plain PKCE Method', () => {
  it('should have "plain" as its name.', () => {
    expect(new PlainPkceMethod().name).toBe<SupportedPkceMethod>('plain');
  });

  it('should return false when comparing two different strings.', () => {
    expect(new PlainPkceMethod().verify('abcxyz', 'abc123')).toBe(false);
  });

  it('should return true when comparing the same strings.', () => {
    expect(new PlainPkceMethod().verify('abcxyz', 'abcxyz')).toBe(true);
  });
});
