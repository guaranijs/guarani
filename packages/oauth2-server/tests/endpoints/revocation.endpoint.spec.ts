import { Attributes, Optional } from '@guarani/types';

import { OutgoingHttpHeaders } from 'http';

import { AuthorizationServerOptions } from '../../lib/authorization-server/options/authorization-server.options';
import { ClientAuthenticator } from '../../lib/client-authentication/client-authenticator';
import { RevocationEndpoint } from '../../lib/endpoints/revocation.endpoint';
import { AccessToken } from '../../lib/entities/access-token';
import { Client } from '../../lib/entities/client';
import { RefreshToken } from '../../lib/entities/refresh-token';
import { InvalidClientException } from '../../lib/exceptions/invalid-client.exception';
import { InvalidRequestException } from '../../lib/exceptions/invalid-request.exception';
import { UnsupportedTokenTypeException } from '../../lib/exceptions/unsupported-token-type.exception';
import { IGrantType } from '../../lib/grant-types/grant-type.interface';
import { HttpRequest } from '../../lib/http/http.request';
import { HttpResponse } from '../../lib/http/http.response';
import { IAccessTokenService } from '../../lib/services/access-token.service.interface';
import { IRefreshTokenService } from '../../lib/services/refresh-token.service.interface';
import { Endpoint } from '../../lib/types/endpoint';
import { HttpMethod } from '../../lib/types/http-method';

jest.mock('../../lib/client-authentication/client-authenticator');

const clients = <Client[]>[{ id: 'client_id' }, { id: 'id_client' }];

const refreshTokens = <RefreshToken[]>[
  {
    token: 'refresh_token',
    client: clients[0],
  },
];

const accessTokens = <AccessToken[]>[
  {
    token: 'access_token',
    client: clients[0],
  },
];

const clientAuthenticatorMock = jest.mocked(ClientAuthenticator.prototype, true);

const grantTypesMock: jest.Mocked<IGrantType>[] = [
  { name: 'authorization_code', handle: jest.fn() },
  { name: 'refresh_token', handle: jest.fn() },
];

const authorizationServerOptionsMock = <AuthorizationServerOptions>{
  enableAccessTokenRevocation: true,
};

const refreshTokenServiceMock: jest.Mocked<Partial<IRefreshTokenService>> = {
  findRefreshToken: jest.fn().mockImplementation(async (token: string): Promise<Optional<RefreshToken>> => {
    return refreshTokens.find((refreshToken) => refreshToken.token === token);
  }),
  revokeRefreshToken: jest.fn(),
};

const accessTokenServiceMock: jest.Mocked<Partial<IAccessTokenService>> = {
  findAccessToken: jest.fn().mockImplementation(async (token: string): Promise<Optional<AccessToken>> => {
    return accessTokens.find((accessToken) => accessToken.token === token);
  }),
  revokeAccessToken: jest.fn(),
};

const endpoint = new RevocationEndpoint(
  clientAuthenticatorMock,
  authorizationServerOptionsMock,
  <IRefreshTokenService>refreshTokenServiceMock,
  grantTypesMock,
  <IAccessTokenService>accessTokenServiceMock
);

describe('Revocation Endpoint', () => {
  describe('name', () => {
    it('should have "revocation" as its name.', () => {
      expect(endpoint.name).toBe<Endpoint>('revocation');
    });
  });

  describe('path', () => {
    it('should have "/oauth/revoke" as its default path.', () => {
      expect(endpoint.path).toBe('/oauth/revoke');
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
    it('should have only the type "refresh_token" when not supporting access token revocation.', () => {
      const opts = <AuthorizationServerOptions>{ enableAccessTokenRevocation: false };
      const endpoint = new RevocationEndpoint(<any>{}, opts, <any>{}, grantTypesMock, <any>{});
      expect(endpoint['supportedTokenTypeHints']).toEqual(['refresh_token']);
    });

    it('should have the types ["refresh_token", "access_token"] when supporting access token revocation.', () => {
      const opts = <AuthorizationServerOptions>{ enableAccessTokenRevocation: true };
      const endpoint = new RevocationEndpoint(<any>{}, opts, <any>{}, grantTypesMock, <any>{});
      expect(endpoint['supportedTokenTypeHints']).toEqual(['refresh_token', 'access_token']);
    });
  });

  describe('constructor', () => {
    it('should reject when the authorization server does not support refresh tokens.', () => {
      expect(() => new RevocationEndpoint(<any>{}, <any>{}, <any>{}, [], <any>{})).toThrow(Error);
      expect(() => new RevocationEndpoint(<any>{}, <any>{}, <any>{}, undefined, <any>{})).toThrow(Error);
    });

    it('should reject when enabling access token revocation without an access token service.', () => {
      const opts = <AuthorizationServerOptions>{ enableAccessTokenRevocation: true };
      expect(() => new RevocationEndpoint(<any>{}, opts, <any>{}, grantTypesMock)).toThrow();
    });
  });

  describe('handle()', () => {
    const request = new HttpRequest({ body: {}, headers: {}, method: 'post', query: {} });

    const defaultResponse = new HttpResponse().setHeaders(endpoint['headers']);

    const findAccessTokenSpy = jest.spyOn(accessTokenServiceMock, 'findAccessToken');
    const findRefreshTokenSpy = jest.spyOn(refreshTokenServiceMock, 'findRefreshToken');

    const revokeAccessTokenSpy = jest.spyOn(accessTokenServiceMock, 'revokeAccessToken');
    const revokeRefreshTokenSpy = jest.spyOn(refreshTokenServiceMock, 'revokeRefreshToken');

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

      expect(revokeAccessTokenSpy).not.toHaveBeenCalled();
      expect(revokeRefreshTokenSpy).not.toHaveBeenCalled();
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

      expect(revokeAccessTokenSpy).not.toHaveBeenCalled();
      expect(revokeRefreshTokenSpy).not.toHaveBeenCalled();
    });

    it('should search for a refresh token and then an access token when not providing a token_type_hint.', async () => {
      clientAuthenticatorMock.authenticate.mockResolvedValueOnce(clients[0]);

      await expect(endpoint.handle(request)).resolves.toMatchObject(defaultResponse);

      expect(findRefreshTokenSpy).toHaveBeenCalled();
      expect(findAccessTokenSpy).toHaveBeenCalled();

      const findRefreshTokenOrder = findRefreshTokenSpy.mock.invocationCallOrder[0];
      const findAccessTokenOrder = findAccessTokenSpy.mock.invocationCallOrder[0];

      expect(findRefreshTokenOrder).toBeGreaterThan(findAccessTokenOrder);

      expect(revokeRefreshTokenSpy).not.toHaveBeenCalled();
      expect(revokeAccessTokenSpy).not.toHaveBeenCalled();
    });

    it('should not revoke when the authorization server does not support access token revocation.', async () => {
      Reflect.set(authorizationServerOptionsMock, 'enableAccessTokenRevocation', false);

      request.body.token = 'access_token';
      clientAuthenticatorMock.authenticate.mockResolvedValueOnce(clients[0]);
      await expect(endpoint.handle(request)).resolves.toMatchObject(defaultResponse);

      Reflect.set(authorizationServerOptionsMock, 'enableAccessTokenRevocation', true);
    });

    it('should not revoke when the client is not the owner of the token.', async () => {
      request.body.token = 'access_token';

      clientAuthenticatorMock.authenticate.mockResolvedValueOnce(clients[1]);

      await expect(endpoint.handle(request)).resolves.toMatchObject(defaultResponse);

      expect(revokeAccessTokenSpy).not.toHaveBeenCalled();
      expect(revokeRefreshTokenSpy).not.toHaveBeenCalled();
    });

    it('should revoke an access token', async () => {
      request.body.token = 'access_token';

      clientAuthenticatorMock.authenticate.mockResolvedValueOnce(clients[0]);

      await expect(endpoint.handle(request)).resolves.toMatchObject(defaultResponse);

      expect(revokeAccessTokenSpy).toHaveBeenCalledTimes(1);
      expect(revokeRefreshTokenSpy).not.toHaveBeenCalled();
    });

    it('should revoke an refresh token', async () => {
      request.body.token = 'refresh_token';

      clientAuthenticatorMock.authenticate.mockResolvedValueOnce(clients[0]);

      await expect(endpoint.handle(request)).resolves.toMatchObject(defaultResponse);

      expect(revokeAccessTokenSpy).not.toHaveBeenCalled();
      expect(revokeRefreshTokenSpy).toHaveBeenCalledTimes(1);
    });
  });
});
