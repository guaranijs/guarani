import { PlainPkce } from '../../lib/pkce/plain.pkce';
import { SupportedPkce } from '../../lib/pkce/types/supported-pkce';

describe('Plain Proof Key for Code Exchange', () => {
  it('should have "plain" as its name.', () => {
    expect(new PlainPkce().name).toBe<SupportedPkce>('plain');
  });

  it('should return false when comparing two different strings.', () => {
    expect(new PlainPkce().verify('abcxyz', 'abc123')).toBe(false);
  });

  it('should return true when comparing the same strings.', () => {
    expect(new PlainPkce().verify('abcxyz', 'abcxyz')).toBe(true);
  });
});
