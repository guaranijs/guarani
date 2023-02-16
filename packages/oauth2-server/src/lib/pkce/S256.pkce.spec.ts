import { DependencyInjectionContainer } from '@guarani/di';

import { PkceMethod } from './pkce-method.type';
import { S256Pkce } from './S256.pkce';

describe('S256 PKCE Method', () => {
  let pkceMethod: S256Pkce;

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind(S256Pkce).toSelf().asSingleton();

    pkceMethod = container.resolve(S256Pkce);
  });

  it('should have "S256" as its name.', () => {
    expect(pkceMethod.name).toEqual<PkceMethod>('S256');
  });

  it('should return false when comparing a challenge to a different verifier.', () => {
    expect(pkceMethod.verify('8xJ5XjIsh0YabzxJ4JiXxZyg1aNiRdKgDwjLxm7ul20', 'abc123')).toBe(false);
  });

  it('should return true when comparing a challenge to its verifier.', () => {
    expect(pkceMethod.verify('8xJ5XjIsh0YabzxJ4JiXxZyg1aNiRdKgDwjLxm7ul20', 'abcxyz')).toBe(true);
  });
});
