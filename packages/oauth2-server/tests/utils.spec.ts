import { Client } from '../lib/entities/client';
import { InvalidScopeException } from '../lib/exceptions/invalid-scope.exception';
import { checkRequestedScope } from '../lib/utils';

describe('checkRequestedScope()', () => {
  const client: Client = {
    id: 'client_id',
    secret: null,
    scopes: ['foo', 'bar', 'baz'],
    authenticationMethod: 'none',
    responseTypes: ['token'],
    grantTypes: ['implicit'],
    redirectUris: ['https://example.com/callback'],
  };

  const invalidClientScopes: string[] = ['qux', 'foo qux'];

  const scopes: string[] = ['foo', 'bar baz', 'foo bar baz', 'foo baz bar'];

  // This is defined at jest.setup.ts
  it('should reject when requesting an unsupported Scope.', () => {
    expect(() => checkRequestedScope(client, 'foo unknown qux')).toThrow(InvalidScopeException);
  });

  it.each(invalidClientScopes)(
    'should reject when a Client requests a Scope it is not allowed to request.',
    (invalidScope) => {
      expect(() => checkRequestedScope(client, invalidScope)).toThrow(InvalidScopeException);
    }
  );

  it.each(scopes)('should return a list of the requested scopes.', (scope) => {
    expect(checkRequestedScope(client, scope)).toEqual(expect.arrayContaining(scope.split(' ')));
  });
});
