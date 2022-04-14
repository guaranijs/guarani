import { OutgoingHttpHeaders } from 'http';
import { URL } from 'url';

import { ClientAuthentication } from '../../lib/client-authentication/client-authentication';
import { TokenEndpoint } from '../../lib/endpoints/token.endpoint';
import { SupportedEndpoint } from '../../lib/endpoints/types/supported-endpoint';
import { ClientEntity } from '../../lib/entities/client.entity';
import { InvalidClientException } from '../../lib/exceptions/invalid-client.exception';
import { InvalidRequestException } from '../../lib/exceptions/invalid-request.exception';
import { OAuth2ExceptionParams } from '../../lib/exceptions/oauth2.exception.params';
import { UnauthorizedClientException } from '../../lib/exceptions/unauthorized-client.exception';
import { UnsupportedGrantTypeException } from '../../lib/exceptions/unsupported-grant-type.exception';
import { GrantType } from '../../lib/grant-types/grant-type';
import { Request } from '../../lib/http/request';
import { Response } from '../../lib/http/response';
import { AccessTokenResponse } from '../../lib/types/access-token.response';

const client = <ClientEntity>{
  id: 'client_id',
  secret: 'client_secret',
  redirectUris: [new URL('https://example.com/callback')],
  authenticationMethod: 'client_secret_basic',
  grantTypes: ['authorization_code', 'refresh_token'],
  responseTypes: ['code'],
  scopes: ['foo', 'bar'],
};

const fakeAccessTokenResponse = <AccessTokenResponse>{
  access_token: 'access_token',
  token_type: 'Bearer',
  expires_in: 3600,
  scope: 'bar foo',
  refresh_token: 'refresh_token',
};

const clientAuthenticationMethodsMock = [
  { name: 'client_secret_basic', hasBeenRequested: jest.fn(), authenticate: jest.fn() },
  { name: 'client_secret_post', hasBeenRequested: jest.fn(), authenticate: jest.fn() },
  { name: 'none', hasBeenRequested: jest.fn(), authenticate: jest.fn() },
];

const grantTypes = [
  { name: 'authorization_code', createTokenResponse: jest.fn() },
  { name: 'client_credentials', createTokenResponse: jest.fn() },
];

const endpoint = new TokenEndpoint(<ClientAuthentication[]>clientAuthenticationMethodsMock, <GrantType[]>grantTypes);

describe('Token Endpoint', () => {
  describe('name', () => {
    it('should have "token" as its name.', () => {
      expect(endpoint.name).toBe<SupportedEndpoint>('token');
    });
  });

  describe('headers', () => {
    it('should have a default headers object for the HTTP Response.', () => {
      // @ts-expect-error Testing a private attribute.
      expect(endpoint.headers).toMatchObject<OutgoingHttpHeaders>({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      });
    });
  });

  describe('checkParameters()', () => {
    it('should reject not providing a "grant_type" parameter.', () => {
      // @ts-expect-error Testing a private method.
      expect(() => endpoint.checkParameters({})).toThrow(InvalidRequestException);
    });

    it('should not reject when providing a valid parameters object.', () => {
      // @ts-expect-error Testing a private method.
      expect(() => endpoint.checkParameters({ grant_type: 'authorization_code' })).not.toThrow();
    });
  });

  describe('getGrantType()', () => {
    it('should reject requesting an unsupported Grant Type.', () => {
      // @ts-expect-error Testing a private method; unsupported grant type.
      expect(() => endpoint.getGrantType('unknown')).toThrow(UnsupportedGrantTypeException);
    });

    it('should return the requested Grant Type.', () => {
      // @ts-expect-error Testing a private method.
      expect(endpoint.getGrantType('authorization_code')).toMatchObject(grantTypes[0]);
    });
  });

  describe('authenticateClient()', () => {
    let request: Request;

    beforeEach(() => {
      request = new Request({ body: {}, headers: {}, method: 'post', query: {} });
    });

    afterEach(() => {
      clientAuthenticationMethodsMock.forEach((method) => {
        method.hasBeenRequested.mockReset();
        method.authenticate.mockReset();
      });
    });

    it('should reject not using a Client Authentication Method.', () => {
      clientAuthenticationMethodsMock.forEach((method) => method.hasBeenRequested.mockReturnValue(false));

      // @ts-expect-error Testing a private method.
      expect(endpoint.authenticateClient(request)).rejects.toThrow(InvalidClientException);
    });

    it('should reject using multiple Client Authentication Methods.', () => {
      clientAuthenticationMethodsMock.forEach((method) => method.hasBeenRequested.mockReturnValue(true));

      // @ts-expect-error Testing a private method.
      expect(endpoint.authenticateClient(request)).rejects.toThrow(InvalidClientException);
    });

    it('should return an authenticated Client.', () => {
      clientAuthenticationMethodsMock[0].hasBeenRequested.mockReturnValue(true);
      clientAuthenticationMethodsMock[0].authenticate.mockReturnValue(client);

      // @ts-expect-error Testing a private method.
      expect(endpoint.authenticateClient(request)).resolves.toMatchObject(client);
    });
  });

  describe('checkClientGrantType()', () => {
    it('should reject when a Client requests a Grant Type that it is not allowed to request.', () => {
      // @ts-expect-error Testing a private method.
      expect(() => endpoint.checkClientGrantType(client, grantTypes[1])).toThrow(UnauthorizedClientException);
    });

    it('should not reject when a Client requests a Grant Type that it is allowed to request.', () => {
      // @ts-expect-error Testing a private method.
      expect(() => endpoint.checkClientGrantType(client, grantTypes[0])).not.toThrow();
    });
  });

  describe('handle()', () => {
    let request: Request;

    beforeEach(() => {
      request = new Request({ body: {}, headers: {}, method: 'post', query: {} });
    });

    afterEach(() => {
      grantTypes.forEach((grantType) => grantType.createTokenResponse.mockReset());
    });

    it('should return an error response when the Client requests an unsupported Grant Type.', () => {
      Reflect.set(request, 'body', { grant_type: 'unknown' });

      expect(endpoint.handle(request)).resolves.toMatchObject<Partial<Response>>({
        body: <OAuth2ExceptionParams>{
          error: 'unsupported_grant_type',
          error_description: 'Unsupported grant_type "unknown".',
        },
        headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' },
        statusCode: 400,
      });
    });

    it('should return an error response when the Client Authentication fails.', async () => {
      Reflect.set(request, 'body', { grant_type: 'authorization_code' });

      const spy = jest.spyOn<TokenEndpoint, any>(endpoint, 'authenticateClient').mockImplementation(async () => {
        throw new InvalidClientException({ error_description: 'Invalid Credentials.' }).setHeader(
          'WWW-Authenticate',
          'Basic'
        );
      });

      expect(endpoint.handle(request)).resolves.toMatchObject<Partial<Response>>({
        body: <OAuth2ExceptionParams>{ error: 'invalid_client', error_description: 'Invalid Credentials.' },
        headers: { 'WWW-Authenticate': 'Basic', 'Cache-Control': 'no-store', Pragma: 'no-cache' },
        statusCode: 401,
      });

      spy.mockRestore();
    });

    it('should return an error response when the Client requests a Grant Type it is not allowed to request.', () => {
      Reflect.set(request, 'body', { grant_type: 'client_credentials' });

      const spy = jest.spyOn<TokenEndpoint, any>(endpoint, 'authenticateClient').mockReturnValue(client);

      expect(endpoint.handle(request)).resolves.toMatchObject<Partial<Response>>({
        body: <OAuth2ExceptionParams>{
          error: 'unauthorized_client',
          error_description: 'This Client is not allowed to request the grant_type "client_credentials".',
        },
        headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' },
        statusCode: 400,
      });

      spy.mockRestore();
    });

    it('should return an Access Token Response.', async () => {
      Reflect.set(request, 'body', { grant_type: 'authorization_code' });

      const spyToken = jest.spyOn(grantTypes[0], 'createTokenResponse').mockReturnValue(fakeAccessTokenResponse);
      const spyAuth = jest.spyOn<TokenEndpoint, any>(endpoint, 'authenticateClient').mockReturnValue(client);

      // For some reason, using .resolves makes the mocked grantType return "undefined".
      const response = await endpoint.handle(request);

      expect(response).toMatchObject<Partial<Response>>({
        body: <AccessTokenResponse>{
          access_token: 'access_token',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'bar foo',
          refresh_token: 'refresh_token',
        },
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Pragma: 'no-cache' },
        statusCode: 200,
      });

      spyAuth.mockRestore();
      spyToken.mockRestore();
    });
  });
});
