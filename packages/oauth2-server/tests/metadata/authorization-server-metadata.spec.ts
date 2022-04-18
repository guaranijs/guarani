import { AuthorizationServer } from '../../lib/authorization-server/authorization-server';
import { AuthorizationServerMetadata } from '../../lib/metadata/authorization-server-metadata';
import { getMetadata } from '../../lib/metadata/helpers/get-metadata';
import { MetadataToken } from '../../lib/metadata/metadata-token';
import { AuthorizationServerMetadataParameters } from '../../lib/metadata/types/authorization-server-metadata.parameters';

describe('Authorization Server Metadata decorator', () => {
  const params: AuthorizationServerMetadataParameters = {
    issuer: 'https://example.com',
    errorUrl: '/oauth2/error',
    scopes: ['foo', 'bar', 'baz'],
    clientAuthenticationMethods: [
      jest.fn(() => {
        return { name: 'none', authenticate: jest.fn(), hasBeenRequested: jest.fn() };
      }),
    ],
    endpoints: [
      jest.fn(() => {
        return { name: 'revocation', handle: jest.fn() };
      }),
    ],
    grantTypes: [
      jest.fn(() => {
        return { name: 'password', createTokenResponse: jest.fn() };
      }),
    ],
    responseTypes: [
      jest.fn(() => {
        return { name: 'code', defaultResponseMode: 'query', createAuthorizationResponse: jest.fn() };
      }),
    ],
    responseModes: [
      jest.fn(() => {
        return { name: 'query', createHttpResponse: jest.fn() };
      }),
    ],
    pkceMethods: [
      jest.fn(() => {
        return { name: 'plain', verify: jest.fn() };
      }),
    ],
  };

  Reflect.decorate([AuthorizationServerMetadata(params)], AuthorizationServer);

  it('should apply the metadata parameters into the Authorization Server constructor.', () => {
    expect(Reflect.getMetadataKeys(AuthorizationServer)).toEqual(
      expect.arrayContaining([
        MetadataToken.Issuer,
        MetadataToken.ErrorUrl,
        MetadataToken.Scopes,
        MetadataToken.ClientAuthentication,
        MetadataToken.Endpoints,
        MetadataToken.GrantTypes,
        MetadataToken.ResponseTypes,
        MetadataToken.ResponseModes,
        MetadataToken.PkceMethods,
      ])
    );

    const metadataEntries: [MetadataToken, any][] = [
      [MetadataToken.Issuer, params.issuer],
      [MetadataToken.ErrorUrl, params.errorUrl],
      [MetadataToken.Scopes, params.scopes],
      [MetadataToken.ClientAuthentication, params.clientAuthenticationMethods],
      [MetadataToken.Endpoints, params.endpoints],
      [MetadataToken.GrantTypes, params.grantTypes],
      [MetadataToken.ResponseTypes, params.responseTypes],
      [MetadataToken.ResponseModes, params.responseModes],
      [MetadataToken.PkceMethods, params.pkceMethods],
    ];

    metadataEntries.forEach(([key, value]) => expect(getMetadata(key, AuthorizationServer)).toBe(value));
  });
});
