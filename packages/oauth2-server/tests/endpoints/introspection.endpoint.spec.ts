import { Attributes, Optional } from '@guarani/types';

import { OutgoingHttpHeaders } from 'http';

import { AuthorizationServerOptions } from '../../lib/authorization-server/options/authorization-server.options';
import { ClientAuthenticator } from '../../lib/client-authentication/client-authenticator';
import { IntrospectionEndpoint } from '../../lib/endpoints/introspection.endpoint';
import { AccessToken } from '../../lib/entities/access-token';
import { Client } from '../../lib/entities/client';
import { RefreshToken } from '../../lib/entities/refresh-token';
import { User } from '../../lib/entities/user';
import { InvalidClientException } from '../../lib/exceptions/invalid-client.exception';
import { InvalidRequestException } from '../../lib/exceptions/invalid-request.exception';
import { UnsupportedTokenTypeException } from '../../lib/exceptions/unsupported-token-type.exception';
import { HttpRequest } from '../../lib/http/http.request';
import { HttpResponse } from '../../lib/http/http.response';
import { IntrospectionResponse } from '../../lib/models/introspection-response';
import { IAccessTokenService } from '../../lib/services/access-token.service.interface';
import { IRefreshTokenService } from '../../lib/services/refresh-token.service.interface';
import { Endpoint } from '../../lib/types/endpoint';
import { HttpMethod } from '../../lib/types/http-method';

jest.mock('../../lib/client-authentication/client-authenticator');

const now = Date.now();

const clients = <Client[]>[{ id: 'client_id' }, { id: 'id_client' }];

const users = <User[]>[{ id: 'user_id' }, { id: 'id_user' }];

const refreshTokens = <RefreshToken[]>[
  {
    token: 'refresh_token',
    scopes: ['foo', 'bar'],
    isRevoked: false,
    issuedAt: new Date(now - 15000),
    validAfter: new Date(now - 15000),
    expiresAt: new Date(now + 3600000),
    client: clients[0],
    user: users[0],
  },
];

const accessTokens = <AccessToken[]>[
  {
    token: 'access_token',
    tokenType: 'Bearer',
    scopes: ['foo', 'bar'],
    isRevoked: false,
    issuedAt: new Date(now - 15000),
    validAfter: new Date(now - 15000),
    expiresAt: new Date(now + 3600000),
    client: clients[0],
    user: users[0],
  },
];

const clientAuthenticatorMock = jest.mocked(ClientAuthenticator.prototype, true);

const authorizationServerOptionsMock = <AuthorizationServerOptions>{
  issuer: 'https://server.example.com',
  enableRefreshTokenIntrospection: true,
};

const refreshTokenServiceMock: jest.Mocked<Partial<IRefreshTokenService>> = {
  findRefreshToken: jest.fn().mockImplementation(async (token: string): Promise<Optional<RefreshToken>> => {
    return refreshTokens.find((refreshToken) => refreshToken.token === token);
  }),
};

const accessTokenServiceMock: jest.Mocked<Partial<IAccessTokenService>> = {
  findAccessToken: jest.fn().mockImplementation(async (token: string): Promise<Optional<AccessToken>> => {
    return accessTokens.find((accessToken) => accessToken.token === token);
  }),
};

const endpoint = new IntrospectionEndpoint(
  clientAuthenticatorMock,
  authorizationServerOptionsMock,
  <IAccessTokenService>accessTokenServiceMock,
  <IRefreshTokenService>refreshTokenServiceMock
);

describe('Introspection Endpoint', () => {
  describe('name', () => {
    it('should have "introspection" as its name.', () => {
      expect(endpoint.name).toBe<Endpoint>('introspection');
    });
  });

  describe('path', () => {
    it('should have "/oauth/introspect" as its default path.', () => {
      expect(endpoint.path).toBe('/oauth/introspect');
    });
  });

  describe('methods', () => {
    it('should have "[\'post\']" as its methods.', () => {
      expect(endpoint.methods).toStrictEqual<HttpMethod[]>(['post']);
    });
  });

  describe('headers', () => {
    it('should have a default "headers" object for the http response.', () => {
      expect(endpoint['headers']).toMatchObject<OutgoingHttpHeaders>({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      });
    });
  });

  describe('supportedTokenTypeHints', () => {
    it('should have only the type "access_token" when not supporting refresh token introspection.', () => {
      const opts = <AuthorizationServerOptions>{ enableRefreshTokenIntrospection: false };
      const endpoint = new IntrospectionEndpoint(<any>{}, opts, <any>{}, <any>{});
      expect(endpoint['supportedTokenTypeHints']).toEqual(['access_token']);
    });

    it('should have the types ["access_token", "refresh_token"] when supporting refresh token introspection.', () => {
      const opts = <AuthorizationServerOptions>{ enableRefreshTokenIntrospection: true };
      const endpoint = new IntrospectionEndpoint(<any>{}, opts, <any>{}, <any>{});
      expect(endpoint['supportedTokenTypeHints']).toEqual(['access_token', 'refresh_token']);
    });
  });

  describe('constructor', () => {
    it('should reject when enabling refresh token introspection without a refresh token service.', () => {
      const opts = <AuthorizationServerOptions>{ enableRefreshTokenIntrospection: true };
      expect(() => new IntrospectionEndpoint(<any>{}, opts, <any>{})).toThrow();
    });
  });

  describe('handle()', () => {
    const request = new HttpRequest({ body: {}, headers: {}, method: 'post', query: {} });

    const defaultResponse = new HttpResponse()
      .setHeaders(endpoint['headers'])
      .json(IntrospectionEndpoint['INACTIVE_TOKEN']);

    const findAccessTokenSpy = jest.spyOn(accessTokenServiceMock, 'findAccessToken');
    const findRefreshTokenSpy = jest.spyOn(refreshTokenServiceMock, 'findRefreshToken');

    beforeEach(() => {
      Reflect.set(request, 'body', { token: 'token' });
    });

    it('should reject not providing a "token" parameter.', async () => {
      delete request.body.token;

      const error = new InvalidRequestException('Invalid parameter "token".');

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: endpoint['headers'],
        statusCode: 400,
      });
    });

    it('should reject providing an unsupported "token_type_hint".', async () => {
      request.body.token_type_hint = 'unknown';

      const error = new UnsupportedTokenTypeException('Unsupported token_type_hint "unknown".');

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: endpoint['headers'],
        statusCode: 400,
      });
    });

    it('should reject not using a client authentication method.', async () => {
      const error = new InvalidClientException('No Client Authentication Method detected.');

      clientAuthenticatorMock.authenticate.mockRejectedValueOnce(error);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: endpoint['headers'],
        statusCode: error.statusCode,
      });
    });

    it('should reject using multiple client authentication methods.', async () => {
      const error = new InvalidClientException('Multiple Client Authentication Methods detected.');

      clientAuthenticatorMock.authenticate.mockRejectedValueOnce(error);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: endpoint['headers'],
        statusCode: error.statusCode,
      });
    });

    it("should reject when the provided secret does not match the client's one.", async () => {
      const error = new InvalidClientException('Invalid Credentials.').setHeaders({
        'WWW-Authenticate': 'Basic',
      });

      clientAuthenticatorMock.authenticate.mockRejectedValueOnce(error);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: { ...endpoint['headers'], ...error.headers },
        statusCode: error.statusCode,
      });
    });

    it('should search for an access token and then a refresh token when providing an "access_token" token_type_hint.', async () => {
      request.body.token_type_hint = 'access_token';

      clientAuthenticatorMock.authenticate.mockResolvedValueOnce(clients[0]);

      await expect(endpoint.handle(request)).resolves.toMatchObject(defaultResponse);

      expect(findAccessTokenSpy).toHaveBeenCalled();
      expect(findRefreshTokenSpy).toHaveBeenCalled();

      const findAccessTokenOrder = findAccessTokenSpy.mock.invocationCallOrder[0];
      const findRefreshTokenOrder = findRefreshTokenSpy.mock.invocationCallOrder[0];

      expect(findAccessTokenOrder).toBeLessThan(findRefreshTokenOrder);
    });

    it('should search for a refresh token and then an access token when providing a "refresh_token" token_type_hint.', async () => {
      request.body.token_type_hint = 'refresh_token';

      clientAuthenticatorMock.authenticate.mockResolvedValueOnce(clients[0]);

      await expect(endpoint.handle(request)).resolves.toMatchObject(defaultResponse);

      expect(findAccessTokenSpy).toHaveBeenCalled();
      expect(findRefreshTokenSpy).toHaveBeenCalled();

      const findAccessTokenOrder = findAccessTokenSpy.mock.invocationCallOrder[0];
      const findRefreshTokenOrder = findRefreshTokenSpy.mock.invocationCallOrder[0];

      expect(findAccessTokenOrder).toBeGreaterThan(findRefreshTokenOrder);
    });

    it('should search for a refresh token and then an access token when not providing a token_type_hint.', async () => {
      clientAuthenticatorMock.authenticate.mockResolvedValueOnce(clients[0]);

      await expect(endpoint.handle(request)).resolves.toMatchObject(defaultResponse);

      expect(findAccessTokenSpy).toHaveBeenCalled();
      expect(findRefreshTokenSpy).toHaveBeenCalled();

      const findAccessTokenOrder = findAccessTokenSpy.mock.invocationCallOrder[0];
      const findRefreshTokenOrder = findRefreshTokenSpy.mock.invocationCallOrder[0];

      expect(findAccessTokenOrder).toBeGreaterThan(findRefreshTokenOrder);
    });

    it('should return an inactive token response when the authorization server does not support refresh token introspection.', async () => {
      Reflect.set(authorizationServerOptionsMock, 'enableRefreshTokenIntrospection', false);

      request.body.token = 'refresh_token';
      clientAuthenticatorMock.authenticate.mockResolvedValueOnce(clients[0]);
      await expect(endpoint.handle(request)).resolves.toMatchObject(defaultResponse);

      Reflect.set(authorizationServerOptionsMock, 'enableRefreshTokenIntrospection', true);
    });

    it('should return an inactive token response when the client is not the owner of the token.', async () => {
      request.body.token = 'access_token';
      clientAuthenticatorMock.authenticate.mockResolvedValueOnce(clients[1]);
      await expect(endpoint.handle(request)).resolves.toMatchObject(defaultResponse);
    });

    it('should return an inactive token response when the token is revoked.', async () => {
      request.body.token = 'access_token';

      clientAuthenticatorMock.authenticate.mockResolvedValueOnce(clients[0]);

      accessTokens[0].isRevoked = true;
      await expect(endpoint.handle(request)).resolves.toMatchObject(defaultResponse);
      accessTokens[0].isRevoked = false;
    });

    it('should return an inactive token response when the token is not yet valid.', async () => {
      const oldValidAfter = accessTokens[0].validAfter;

      request.body.token = 'access_token';

      clientAuthenticatorMock.authenticate.mockResolvedValueOnce(clients[0]);

      accessTokens[0].validAfter = new Date(Date.now() + 30000);
      await expect(endpoint.handle(request)).resolves.toMatchObject(defaultResponse);
      accessTokens[0].validAfter = oldValidAfter;
    });

    it('should return an inactive token response when the token is expired.', async () => {
      const oldExpiresAt = accessTokens[0].expiresAt;

      request.body.token = 'access_token';

      clientAuthenticatorMock.authenticate.mockResolvedValueOnce(clients[0]);

      accessTokens[0].expiresAt = new Date(Date.now() - 30000);
      await expect(endpoint.handle(request)).resolves.toMatchObject(defaultResponse);
      accessTokens[0].expiresAt = oldExpiresAt;
    });

    it('should return the metadata of the requested token.', async () => {
      request.body.token = 'access_token';

      clientAuthenticatorMock.authenticate.mockResolvedValueOnce(clients[0]);

      const introspectionResponse = <IntrospectionResponse>{
        active: true,
        scope: 'foo bar',
        client_id: clients[0].id,
        // username: ,
        token_type: 'Bearer',
        exp: Math.ceil((now + 3600000) / 1000),
        iat: Math.ceil((now - 15000) / 1000),
        nbf: Math.ceil((now - 15000) / 1000),
        sub: users[0].id,
        aud: clients[0].id,
        iss: authorizationServerOptionsMock.issuer,
        // jti: ,
      };

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.from(JSON.stringify(introspectionResponse), 'utf8'),
        headers: endpoint['headers'],
        statusCode: 200,
      });
    });
  });
});
