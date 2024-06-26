import { DependencyInjectionContainer } from '@guarani/di';

import { Logger } from '../logger/logger';
import { Pkce } from './pkce.type';
import { PlainPkce } from './plain.pkce';

jest.mock('../logger/logger');

describe('Plain PKCE', () => {
  let container: DependencyInjectionContainer;
  let pkce: PlainPkce;

  const loggerMock = jest.mocked(Logger.prototype);

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
    container.bind(PlainPkce).toSelf().asSingleton();

    pkce = container.resolve(PlainPkce);
  });

  describe('name', () => {
    it('should have "plain" as its value.', () => {
      expect(pkce.name).toEqual<Pkce>('plain');
    });
  });

  describe('verify()', () => {
    it('should return false when comparing two different strings.', () => {
      expect(pkce.verify('abcxyz', 'abc123')).toBeFalse();
    });

    it('should return true when comparing the same strings.', () => {
      expect(pkce.verify('abcxyz', 'abcxyz')).toBeTrue();
    });
  });
});
