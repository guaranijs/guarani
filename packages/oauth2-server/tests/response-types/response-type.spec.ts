import { ClientEntity } from '../../lib/entities/client.entity';
import { InvalidScopeException } from '../../lib/exceptions/invalid-scope.exception';
import { MockResponseType } from './mocks/mock.response-type';

const responseType = new MockResponseType();

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

describe('Response Type', () => {
  describe('getAllowedScopes()', () => {
    it.each(invalidScopes)(
      'should reject when a Client requests a Scope it is not allowed to request.',
      (invalidScope) => {
        // @ts-expect-error Testing protected method.
        expect(() => responseType.getAllowedScopes(client, invalidScope)).toThrow(InvalidScopeException);
      }
    );

    it.each(scopes)('should return a list of the requested scopes.', (scope, expected) => {
      // @ts-expect-error Testing protected method.
      expect(responseType.getAllowedScopes(client, scope)).toEqual(expect.arrayContaining(expected));
    });
  });
});
