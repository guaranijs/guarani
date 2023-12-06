import { DependencyInjectionContainer } from '@guarani/di';

import { Client } from '../entities/client.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidScopeException } from '../exceptions/invalid-scope.exception';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { ScopeHandler } from './scope.handler';

describe('Scope Handler', () => {
  let container: DependencyInjectionContainer;
  let handler: ScopeHandler;

  const settings = <Settings>{ scopes: ['foo', 'bar', 'baz', 'qux'] };

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind(ScopeHandler).toSelf().asSingleton();

    handler = container.resolve(ScopeHandler);
  });

  describe('checkRequestedScope()', () => {
    it('should throw when requesting an unsupported scope.', () => {
      expect(() => handler.checkRequestedScope('foo unknown qux')).toThrowWithMessage(
        InvalidScopeException,
        'Unsupported scope "unknown".',
      );
    });

    it('should not throw when not requesting any scope.', () => {
      expect(() => handler.checkRequestedScope(null)).not.toThrow();
    });

    it.each(['foo', 'bar baz', 'foo bar baz', 'foo baz bar'])(
      'should not throw when requesting supported scopes.',
      (scope) => {
        expect(() => handler.checkRequestedScope(scope)).not.toThrow();
      },
    );
  });

  describe('getAllowedScopes()', () => {
    it('should return the default scopes of the client when a scope is not requested.', () => {
      const client = <Client>{ scopes: ['foo', 'bar'] };
      expect(handler.getAllowedScopes(client, null)).toEqual(['foo', 'bar']);
    });

    it("should throw when the client requests a scope it's not allowed to.", () => {
      const client = <Client>{ scopes: ['foo', 'bar'] };

      expect(() => handler.getAllowedScopes(client, 'foo qux')).toThrowWithMessage(
        AccessDeniedException,
        'The Client is not allowed to request the scope "qux".',
      );
    });

    it('should return the scope requested by the client.', () => {
      const client = <Client>{ scopes: ['foo', 'bar'] };

      expect(handler.getAllowedScopes(client, 'foo')).toEqual(['foo']);
      expect(handler.getAllowedScopes(client, 'foo bar')).toEqual(['foo', 'bar']);
    });
  });
});
