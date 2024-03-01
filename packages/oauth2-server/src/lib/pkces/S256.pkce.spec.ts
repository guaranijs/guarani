import { DependencyInjectionContainer } from '@guarani/di';

import { Logger } from '../logger/logger';
import { Pkce } from './pkce.type';
import { S256Pkce } from './S256.pkce';

jest.mock('../logger/logger');

describe('S256 PKCE', () => {
  let container: DependencyInjectionContainer;
  let pkce: S256Pkce;

  const loggerMock = jest.mocked(Logger.prototype);

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
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
