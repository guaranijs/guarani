import { DependencyInjectionContainer } from '@guarani/di';

import { Pkce } from './pkce.type';
import { PlainPkce } from './plain.pkce';

describe('Plain PKCE', () => {
  let pkce: PlainPkce;

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind(PlainPkce).toSelf().asSingleton();

    pkce = container.resolve(PlainPkce);
  });

  it('should have "plain" as its name.', () => {
    expect(pkce.name).toEqual<Pkce>('plain');
  });

  it('should return false when comparing two different strings.', () => {
    expect(pkce.verify('abcxyz', 'abc123')).toBe(false);
  });

  it('should return true when comparing the same strings.', () => {
    expect(pkce.verify('abcxyz', 'abcxyz')).toBe(true);
  });
});
