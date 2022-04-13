import { URL } from 'url';

import { ClientEntity } from '../lib/entities/client.entity';
import { InvalidScopeException } from '../lib/exceptions/invalid-scope.exception';
import { getAllowedScopes } from '../lib/utils';

describe('getAllowedScopes()', () => {
  const client = <ClientEntity>{
    id: 'client_id',
    scopes: ['foo', 'bar', 'baz'],
    authenticationMethod: 'none',
    responseTypes: ['token'],
    grantTypes: ['implicit'],
    redirectUris: [new URL('https://example.com/callback')],
  };

  const invalidScopes: string[] = ['qux', 'foo qux'];

  const scopes: [string, string[]][] = [
    ['foo', ['foo']],
    ['bar baz', ['bar', 'baz']],
    ['foo bar baz', ['foo', 'bar', 'baz']],
    ['foo baz bar', ['foo', 'baz', 'bar']],
  ];

  it.each(invalidScopes)(
    'should reject when a Client requests a Scope it is not allowed to request.',
    (invalidScope) => {
      expect(() => getAllowedScopes(client, invalidScope)).toThrow(InvalidScopeException);
    }
  );

  it.each(scopes)('should return a list of the requested scopes.', (scope, expected) => {
    expect(getAllowedScopes(client, scope)).toEqual(expect.arrayContaining(expected));
  });
});
