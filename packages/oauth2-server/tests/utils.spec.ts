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

  const invalidClientScopes: string[] = ['qux', 'foo qux'];

  const scopes: string[] = ['foo', 'bar baz', 'foo bar baz', 'foo baz bar'];

  // This is defined at jest.setup.ts
  it('should reject when requesting an unsupported Scope.', () => {
    expect(() => getAllowedScopes(client, 'foo unknown qux')).toThrow(InvalidScopeException);
  });

  it.each(invalidClientScopes)(
    'should reject when a Client requests a Scope it is not allowed to request.',
    (invalidScope) => {
      expect(() => getAllowedScopes(client, invalidScope)).toThrow(InvalidScopeException);
    }
  );

  it.each(scopes)('should return a list of the requested scopes.', (scope) => {
    expect(getAllowedScopes(client, scope)).toEqual(expect.arrayContaining(scope.split(' ')));
  });
});
