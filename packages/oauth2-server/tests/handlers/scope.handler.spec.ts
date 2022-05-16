import { AuthorizationServerOptions } from '../../lib/authorization-server/options/authorization-server.options';
import { Client } from '../../lib/entities/client';
import { InvalidScopeException } from '../../lib/exceptions/invalid-scope.exception';
import { ScopeHandler } from '../../lib/handlers/scope.handler';

const client = <Client>{ scopes: ['foo', 'bar'] };

const authorizationServerOptionsMock = <AuthorizationServerOptions>{
  scopes: ['foo', 'bar', 'baz', 'qux'],
};

const scopeHandler = new ScopeHandler(authorizationServerOptionsMock);

describe('Scope Handler', () => {
  describe('checkRequestedScope()', () => {
    it('should not reject when not requesting any scope.', () => {
      expect(() => scopeHandler.checkRequestedScope()).not.toThrow();
    });

    it('should reject when requesting an unsupported Scope.', () => {
      expect(() => scopeHandler.checkRequestedScope('foo unknown qux')).toThrow(InvalidScopeException);
    });

    it.each(['foo', 'bar baz', 'foo bar baz', 'foo baz bar'])(
      'should not reject when requesting supported scopes.',
      (scope) => {
        expect(() => scopeHandler.checkRequestedScope(scope)).not.toThrow();
      }
    );
  });

  describe('getAllowedScopes()', () => {
    it('should return the default scopes of the client when a scope is not requested.', () => {
      expect(scopeHandler.getAllowedScopes(client)).toEqual(expect.arrayContaining(['foo', 'bar']));
    });

    it("should return the requested scope from the client's allowed scopes.", () => {
      expect(scopeHandler.getAllowedScopes(client, 'foo')).toEqual(expect.arrayContaining(['foo']));
      expect(scopeHandler.getAllowedScopes(client, 'foo bar')).toEqual(expect.arrayContaining(['foo', 'bar']));
    });

    it('should restrict the requested scope to the one allowed to the client.', () => {
      expect(scopeHandler.getAllowedScopes(client, 'qux bar')).toEqual(expect.arrayContaining(['bar']));
      expect(scopeHandler.getAllowedScopes(client, 'bar qux foo')).toEqual(expect.arrayContaining(['bar', 'foo']));
    });
  });
});
