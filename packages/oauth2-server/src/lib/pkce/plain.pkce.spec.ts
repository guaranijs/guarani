import { DependencyInjectionContainer } from '@guarani/di';

import { PkceMethod } from './pkce-method.type';
import { PlainPkce } from './plain.pkce';

describe('Plain PKCE Method', () => {
  let pkceMethod: PlainPkce;

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind(PlainPkce).toSelf().asSingleton();

    pkceMethod = container.resolve(PlainPkce);
  });

  it('should have "plain" as its name.', () => {
    expect(pkceMethod.name).toEqual<PkceMethod>('plain');
  });

  it('should return false when comparing two different strings.', () => {
    expect(pkceMethod.verify('abcxyz', 'abc123')).toBe(false);
  });

  it('should return true when comparing the same strings.', () => {
    expect(pkceMethod.verify('abcxyz', 'abcxyz')).toBe(true);
  });
});
