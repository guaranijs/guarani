import { DependencyInjectionContainer } from '@guarani/di';

import { S256Pkce } from './S256.pkce';
import { Pkce } from './pkce.type';

describe('S256 PKCE', () => {
  let container: DependencyInjectionContainer;
  let pkce: S256Pkce;

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(S256Pkce).toSelf().asSingleton();

    pkce = container.resolve(S256Pkce);
  });

  describe('name', () => {
    it('should have "S256" as its value.', () => {
      expect(pkce.name).toEqual<Pkce>('S256');
    });
  });

  describe('verify()', () => {
    it('should return false when comparing a challenge to a different verifier.', () => {
      expect(pkce.verify('8xJ5XjIsh0YabzxJ4JiXxZyg1aNiRdKgDwjLxm7ul20', 'abc123')).toBeFalse();
    });

    it('should return true when comparing a challenge to its verifier.', () => {
      expect(pkce.verify('8xJ5XjIsh0YabzxJ4JiXxZyg1aNiRdKgDwjLxm7ul20', 'abcxyz')).toBeTrue();
    });
  });
});
