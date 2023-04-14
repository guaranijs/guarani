import { DependencyInjectionContainer } from '@guarani/di';

import { Client } from '../entities/client.entity';
import { InvalidScopeException } from '../exceptions/invalid-scope.exception';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { ScopeHandler } from './scope.handler';

describe('Scope Handler', () => {
  let container: DependencyInjectionContainer;
  let scopeHandler: ScopeHandler;

  const client = <Client>{ scopes: ['foo', 'bar'] };
  const settings = <Settings>{ scopes: ['foo', 'bar', 'baz', 'qux'] };

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind(ScopeHandler).toSelf().asSingleton();

    scopeHandler = container.resolve(ScopeHandler);
  });

  describe('checkRequestedScope()', () => {
    it('should not throw when not requesting any scope.', () => {
      expect(() => scopeHandler.checkRequestedScope(undefined)).not.toThrow();
    });

    it('should throw when requesting an unsupported Scope.', () => {
      expect(() => scopeHandler.checkRequestedScope('foo unknown qux')).toThrow(
        new InvalidScopeException({ description: 'Unsupported scope "unknown".' })
      );
    });

    it.each(['foo', 'bar baz', 'foo bar baz', 'foo baz bar'])(
      'should not throw when requesting supported scopes.',
      (scope) => {
        expect(() => scopeHandler.checkRequestedScope(scope)).not.toThrow();
      }
    );
  });

  describe('getAllowedScopes()', () => {
    it('should return the default scopes of the client when a scope is not requested.', () => {
      expect(scopeHandler.getAllowedScopes(client, undefined)).toEqual(expect.arrayContaining(['foo', 'bar']));
    });

    it("should return the requested scope from the client's allowed scopes.", () => {
      expect(scopeHandler.getAllowedScopes(client, 'foo')).toEqual(expect.arrayContaining(['foo']));
      expect(scopeHandler.getAllowedScopes(client, 'foo bar')).toEqual(expect.arrayContaining(['foo', 'bar']));
    });

    it('should restrict the requested scope to the ones allowed to the client.', () => {
      expect(scopeHandler.getAllowedScopes(client, 'qux bar')).toEqual(expect.arrayContaining(['bar']));
      expect(scopeHandler.getAllowedScopes(client, 'bar qux foo')).toEqual(expect.arrayContaining(['bar', 'foo']));
    });
  });
});
