import { DependencyInjectionContainer } from '@guarani/di';

import { Buffer } from 'buffer';
import { OutgoingHttpHeaders } from 'http';

import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { UnsupportedTokenTypeException } from '../exceptions/unsupported-token-type.exception';
import { GrantTypeInterface } from '../grant-types/grant-type.interface';
import { GRANT_TYPE } from '../grant-types/grant-type.token';
import { ClientAuthenticationHandler } from '../handlers/client-authentication.handler';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { RevocationEndpoint } from './revocation.endpoint';

jest.mock('../handlers/client-authentication.handler');

describe('Revocation Endpoint', () => {
  let endpoint: RevocationEndpoint;

  const refreshTokenServiceMock = jest.mocked<RefreshTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  const grantTypesMocks = [
    jest.mocked<GrantTypeInterface>({ name: 'authorization_code', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'refresh_token', handle: jest.fn() }),
  ];

  const clientAuthenticationHandlerMock = jest.mocked(ClientAuthenticationHandler.prototype, true);

  const settings = <Settings>{ enableAccessTokenRevocation: true };

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<RefreshTokenServiceInterface>(REFRESH_TOKEN_SERVICE).toValue(refreshTokenServiceMock);
    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);

    grantTypesMocks.forEach((grantType) => container.bind<GrantTypeInterface>(GRANT_TYPE).toValue(grantType));

    container.bind(ClientAuthenticationHandler).toValue(clientAuthenticationHandlerMock);
    container.bind(RevocationEndpoint).toSelf().asSingleton();

    endpoint = container.resolve(RevocationEndpoint);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "revocation" as its name.', () => {
      expect(endpoint.name).toBe('revocation');
    });
  });

  describe('path', () => {
    it('should have "/oauth/revoke" as its default path.', () => {
      expect(endpoint.path).toBe('/oauth/revoke');
    });
  });

  describe('httpMethods', () => {
    it('should have \'["POST"]\' as its supported http methods.', () => {
      expect(endpoint.httpMethods).toStrictEqual(['POST']);
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
      const opts = <Settings>{ enableAccessTokenRevocation: false };
      const endpoint = new RevocationEndpoint(<any>{}, opts, <any>{}, <any>{}, grantTypesMocks);

      expect(endpoint['supportedTokenTypeHints']).toEqual(['refresh_token']);
    });

    it('should have the types ["refresh_token", "access_token"] when supporting access token revocation.', () => {
      const opts = <Settings>{ enableAccessTokenRevocation: true };
      const endpoint = new RevocationEndpoint(<any>{}, opts, <any>{}, <any>{}, grantTypesMocks);

      expect(endpoint['supportedTokenTypeHints']).toEqual(['refresh_token', 'access_token']);
    });
  });

  describe('constructor', () => {
    it('should reject when the authorization server does not support refresh tokens.', () => {
      expect(() => new RevocationEndpoint(<any>{}, <any>{}, <any>{}, <any>{}, [])).toThrow(Error);
      expect(() => new RevocationEndpoint(<any>{}, <any>{}, <any>{}, undefined, <any>{})).toThrow(Error);
    });

    it('should reject when enabling access token revocation without an access token service.', () => {
      const opts = <Settings>{ enableAccessTokenRevocation: true };

      expect(() => new RevocationEndpoint(<any>{}, opts, <any>{}, undefined, grantTypesMocks)).toThrow();
    });
  });

  describe('handle()', () => {
    let request: HttpRequest;

    const defaultResponse = new HttpResponse().setHeaders({ 'Cache-Control': 'no-store', Pragma: 'no-cache' });

    beforeEach(() => {
      request = {
        body: { token: 'access_token' },
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/revoke',
        query: {},
      };
    });

    it('should reject not providing a "token" parameter.', async () => {
      delete request.body.token;

      const error = new InvalidRequestException({ description: 'Invalid parameter "token".' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: { 'Content-Type': 'application/json', ...endpoint['headers'] },
        statusCode: 400,
      });
    });

    it('should reject providing an unsupported "token_type_hint".', async () => {
      request.body.token_type_hint = 'unknown';

      const error = new UnsupportedTokenTypeException({ description: 'Unsupported token_type_hint "unknown".' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: { 'Content-Type': 'application/json', ...endpoint['headers'] },
        statusCode: 400,
      });
    });

    it('should reject not using a client authentication method.', async () => {
      const error = new InvalidClientException({ description: 'No Client Authentication Method detected.' });

      clientAuthenticationHandlerMock.authenticate.mockRejectedValueOnce(error);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: { 'Content-Type': 'application/json', ...endpoint['headers'] },
        statusCode: error.statusCode,
      });
    });

    it('should reject using multiple client authentication methods.', async () => {
      const error = new InvalidClientException({ description: 'Multiple Client Authentication Methods detected.' });

      clientAuthenticationHandlerMock.authenticate.mockRejectedValueOnce(error);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: { 'Content-Type': 'application/json', ...endpoint['headers'] },
        statusCode: error.statusCode,
      });
    });

    it("should reject when the provided secret does not match the client's one.", async () => {
      const error = new InvalidClientException({ description: 'Invalid Credentials.' }).setHeaders({
        'WWW-Authenticate': 'Basic',
      });

      clientAuthenticationHandlerMock.authenticate.mockRejectedValueOnce(error);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: { 'Content-Type': 'application/json', ...endpoint['headers'], ...error.headers },
        statusCode: error.statusCode,
      });
    });

    it('should search for an access token and then a refresh token when providing an "access_token" token_type_hint.', async () => {
      request.body.token_type_hint = 'access_token';

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(<Client>{ id: 'client_id' });

      accessTokenServiceMock.findOne.mockResolvedValueOnce(null);
      refreshTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(endpoint.handle(request)).resolves.toMatchObject(defaultResponse);

      expect(accessTokenServiceMock.findOne).toHaveBeenCalledTimes(1);
      expect(refreshTokenServiceMock.findOne).toHaveBeenCalledTimes(1);

      const findAccessTokenOrder = accessTokenServiceMock.findOne.mock.invocationCallOrder[0];
      const findRefreshTokenOrder = refreshTokenServiceMock.findOne.mock.invocationCallOrder[0];

      expect(findAccessTokenOrder).toBeLessThan(<number>findRefreshTokenOrder);

      expect(accessTokenServiceMock.revoke).not.toHaveBeenCalled();
      expect(refreshTokenServiceMock.revoke).not.toHaveBeenCalled();
    });

    it('should search for a refresh token and then an access token when providing a "refresh_token" token_type_hint.', async () => {
      request.body.token_type_hint = 'refresh_token';

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(<Client>{ id: 'client_id' });

      accessTokenServiceMock.findOne.mockResolvedValueOnce(null);
      refreshTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(endpoint.handle(request)).resolves.toMatchObject(defaultResponse);

      expect(accessTokenServiceMock.findOne).toHaveBeenCalledTimes(1);
      expect(refreshTokenServiceMock.findOne).toHaveBeenCalledTimes(1);

      const findAccessTokenOrder = accessTokenServiceMock.findOne.mock.invocationCallOrder[0];
      const findRefreshTokenOrder = refreshTokenServiceMock.findOne.mock.invocationCallOrder[0];

      expect(findRefreshTokenOrder).toBeLessThan(<number>findAccessTokenOrder);

      expect(accessTokenServiceMock.revoke).not.toHaveBeenCalled();
      expect(refreshTokenServiceMock.revoke).not.toHaveBeenCalled();
    });

    it('should search for a refresh token and then an access token when not providing a token_type_hint.', async () => {
      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(<Client>{ id: 'client_id' });

      accessTokenServiceMock.findOne.mockResolvedValueOnce(null);
      refreshTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(endpoint.handle(request)).resolves.toMatchObject(defaultResponse);

      expect(refreshTokenServiceMock.findOne).toHaveBeenCalledTimes(1);
      expect(accessTokenServiceMock.findOne).toHaveBeenCalledTimes(1);

      const findRefreshTokenOrder = refreshTokenServiceMock.findOne.mock.invocationCallOrder[0];
      const findAccessTokenOrder = accessTokenServiceMock.findOne.mock.invocationCallOrder[0];

      expect(findRefreshTokenOrder).toBeGreaterThan(<number>findAccessTokenOrder);

      expect(refreshTokenServiceMock.revoke).not.toHaveBeenCalled();
      expect(accessTokenServiceMock.revoke).not.toHaveBeenCalled();
    });

    it('should not revoke when the authorization server does not support access token revocation.', async () => {
      Reflect.set(settings, 'enableAccessTokenRevocation', false);

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(<Client>{ id: 'client_id' });

      accessTokenServiceMock.findOne.mockResolvedValueOnce(null);
      refreshTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(endpoint.handle(request)).resolves.toMatchObject(defaultResponse);

      Reflect.set(settings, 'enableAccessTokenRevocation', true);
    });

    it('should not revoke when the client is not the owner of the token.', async () => {
      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(<Client>{ id: 'client_id' });

      accessTokenServiceMock.findOne.mockResolvedValueOnce(<AccessToken>{
        handle: 'access_token',
        client: { id: 'another_client_id' },
      });

      refreshTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(endpoint.handle(request)).resolves.toMatchObject(defaultResponse);

      expect(accessTokenServiceMock.revoke).not.toHaveBeenCalled();
      expect(refreshTokenServiceMock.revoke).not.toHaveBeenCalled();
    });

    it('should revoke an access token', async () => {
      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(<Client>{ id: 'client_id' });

      accessTokenServiceMock.findOne.mockResolvedValueOnce(<AccessToken>{
        handle: 'access_token',
        client: { id: 'client_id' },
      });

      refreshTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(endpoint.handle(request)).resolves.toMatchObject(defaultResponse);

      expect(accessTokenServiceMock.revoke).toHaveBeenCalledTimes(1);
      expect(refreshTokenServiceMock.revoke).not.toHaveBeenCalled();
    });

    it('should revoke a refresh token', async () => {
      request.body.token = 'refresh_token';

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(<Client>{ id: 'client_id' });

      accessTokenServiceMock.findOne.mockResolvedValueOnce(null);

      refreshTokenServiceMock.findOne.mockResolvedValueOnce(<RefreshToken>{
        handle: 'refresh_token',
        client: { id: 'client_id' },
      });

      await expect(endpoint.handle(request)).resolves.toMatchObject(defaultResponse);

      expect(accessTokenServiceMock.revoke).not.toHaveBeenCalled();
      expect(refreshTokenServiceMock.revoke).toHaveBeenCalledTimes(1);
    });
  });
});
