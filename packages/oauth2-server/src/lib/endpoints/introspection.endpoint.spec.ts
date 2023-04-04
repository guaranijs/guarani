import { DependencyInjectionContainer } from '@guarani/di';

import { Buffer } from 'buffer';
import { OutgoingHttpHeaders } from 'http';

import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { UnsupportedTokenTypeException } from '../exceptions/unsupported-token-type.exception';
import { ClientAuthenticationHandler } from '../handlers/client-authentication.handler';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { IntrospectionRequest } from '../messages/introspection-request';
import { IntrospectionResponse } from '../messages/introspection-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { TokenTypeHint } from '../types/token-type-hint.type';
import { Endpoint } from './endpoint.type';
import { IntrospectionEndpoint } from './introspection.endpoint';

jest.mock('../handlers/client-authentication.handler');

describe('Introspection Endpoint', () => {
  let endpoint: IntrospectionEndpoint;

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  const refreshTokenServiceMock = jest.mocked<RefreshTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  const clientAuthenticationHandlerMock = jest.mocked(ClientAuthenticationHandler.prototype, true);

  const settings = <Settings>{ issuer: 'https://server.example.com', enableRefreshTokenIntrospection: true };

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind<RefreshTokenServiceInterface>(REFRESH_TOKEN_SERVICE).toValue(refreshTokenServiceMock);
    container.bind(ClientAuthenticationHandler).toValue(clientAuthenticationHandlerMock);
    container.bind(IntrospectionEndpoint).toSelf().asSingleton();

    endpoint = container.resolve(IntrospectionEndpoint);
  });

  describe('name', () => {
    it('should have "introspection" as its name.', () => {
      expect(endpoint.name).toEqual<Endpoint>('introspection');
    });
  });

  describe('path', () => {
    it('should have "/oauth/introspect" as its default path.', () => {
      expect(endpoint.path).toEqual('/oauth/introspect');
    });
  });

  describe('httpMethods', () => {
    it('should have \'["POST"]\' as its supported http methods.', () => {
      expect(endpoint.httpMethods).toStrictEqual<HttpMethod[]>(['POST']);
    });
  });

  describe('headers', () => {
    it('should have a default "headers" object for the http response.', () => {
      expect(endpoint['headers']).toStrictEqual<OutgoingHttpHeaders>({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      });
    });
  });

  describe('supportedTokenTypeHints', () => {
    it('should have only the type "access_token" when not supporting refresh token introspection.', () => {
      const opts = <Settings>{ enableRefreshTokenIntrospection: false };
      const endpoint = new IntrospectionEndpoint(
        clientAuthenticationHandlerMock,
        opts,
        accessTokenServiceMock,
        refreshTokenServiceMock
      );

      expect(endpoint['supportedTokenTypeHints']).toEqual<TokenTypeHint[]>(['access_token']);
    });

    it('should have the types ["access_token", "refresh_token"] when supporting refresh token introspection.', () => {
      const opts = <Settings>{ enableRefreshTokenIntrospection: true };
      const endpoint = new IntrospectionEndpoint(
        clientAuthenticationHandlerMock,
        opts,
        accessTokenServiceMock,
        refreshTokenServiceMock
      );

      expect(endpoint['supportedTokenTypeHints']).toEqual<TokenTypeHint[]>(['access_token', 'refresh_token']);
    });
  });

  describe('constructor', () => {
    it('should throw when enabling refresh token introspection without a refresh token service.', () => {
      const opts = <Settings>{ enableRefreshTokenIntrospection: true };

      expect(() => new IntrospectionEndpoint(clientAuthenticationHandlerMock, opts, accessTokenServiceMock)).toThrow(
        new Error('Cannot enable Refresh Token Introspection without a Refresh Token Service.')
      );
    });
  });

  describe('handle()', () => {
    let request: HttpRequest<IntrospectionRequest>;

    const defaultResponse = new HttpResponse()
      .setHeaders({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Pragma: 'no-cache' })
      .json({ active: false });

    beforeEach(() => {
      request = new HttpRequest<IntrospectionRequest>({
        body: { token: 'access_token' },
        cookies: {},
        headers: { authorization: 'Basic ' + Buffer.from('client_id:client_secret', 'utf8').toString('base64') },
        method: 'POST',
        path: '/oauth/introspect',
        query: {},
      });
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should return an error response when not providing a "token" parameter.', async () => {
      delete request.body.token;

      const error = new InvalidRequestException({ description: 'Invalid parameter "token".' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: { 'Content-Type': 'application/json', ...endpoint['headers'] },
        statusCode: 400,
      });
    });

    it('should return an error response when providing an unsupported "token_type_hint".', async () => {
      request.body.token_type_hint = 'unknown';

      const error = new UnsupportedTokenTypeException({ description: 'Unsupported token_type_hint "unknown".' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: { 'Content-Type': 'application/json', ...endpoint['headers'] },
        statusCode: 400,
      });
    });

    it('should return an error response when not using a client authentication method.', async () => {
      delete request.headers.authorization;

      const error = new InvalidClientException({ description: 'No Client Authentication Method detected.' });

      clientAuthenticationHandlerMock.authenticate.mockRejectedValueOnce(error);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: { 'Content-Type': 'application/json', ...endpoint['headers'] },
        statusCode: error.statusCode,
      });
    });

    it('should return an error response when using multiple client authentication methods.', async () => {
      Object.assign(request.body, { client_id: 'client_id', client_secret: 'client_secret' });

      const error = new InvalidClientException({
        description: 'Multiple Client Authentication Methods detected.',
      });

      clientAuthenticationHandlerMock.authenticate.mockRejectedValueOnce(error);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: { 'Content-Type': 'application/json', ...endpoint['headers'] },
        statusCode: error.statusCode,
      });
    });

    it("should return an error response when the provided secret does not match the client's one.", async () => {
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

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>(defaultResponse);

      expect(accessTokenServiceMock.findOne).toHaveBeenCalledTimes(1);
      expect(refreshTokenServiceMock.findOne).toHaveBeenCalledTimes(1);

      const findAccessTokenOrder = accessTokenServiceMock.findOne.mock.invocationCallOrder[0];
      const findRefreshTokenOrder = refreshTokenServiceMock.findOne.mock.invocationCallOrder[0];

      expect(findAccessTokenOrder).toBeLessThan(<number>findRefreshTokenOrder);
    });

    it('should search for a refresh token and then an access token when providing a "refresh_token" token_type_hint.', async () => {
      request.body.token_type_hint = 'refresh_token';

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(<Client>{ id: 'client_id' });

      accessTokenServiceMock.findOne.mockResolvedValueOnce(null);
      refreshTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>(defaultResponse);

      expect(accessTokenServiceMock.findOne).toHaveBeenCalledTimes(1);
      expect(refreshTokenServiceMock.findOne).toHaveBeenCalledTimes(1);

      const findAccessTokenOrder = accessTokenServiceMock.findOne.mock.invocationCallOrder[0];
      const findRefreshTokenOrder = refreshTokenServiceMock.findOne.mock.invocationCallOrder[0];

      expect(findRefreshTokenOrder).toBeLessThan(<number>findAccessTokenOrder);
    });

    it('should search for a refresh token and then an access token when not providing a token_type_hint.', async () => {
      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(<Client>{ id: 'client_id' });

      accessTokenServiceMock.findOne.mockResolvedValueOnce(null);
      refreshTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>(defaultResponse);

      expect(accessTokenServiceMock.findOne).toHaveBeenCalledTimes(1);
      expect(refreshTokenServiceMock.findOne).toHaveBeenCalledTimes(1);

      const findAccessTokenOrder = accessTokenServiceMock.findOne.mock.invocationCallOrder[0];
      const findRefreshTokenOrder = refreshTokenServiceMock.findOne.mock.invocationCallOrder[0];

      expect(findRefreshTokenOrder).toBeLessThan(<number>findAccessTokenOrder);
    });

    it('should return an inactive token response when the authorization server does not support refresh token introspection.', async () => {
      Reflect.set(settings, 'enableRefreshTokenIntrospection', false);

      request.body.token = 'refresh_token';

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(<Client>{ id: 'client_id' });

      accessTokenServiceMock.findOne.mockResolvedValueOnce(null);
      refreshTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>(defaultResponse);

      Reflect.set(settings, 'enableRefreshTokenIntrospection', true);
    });

    it('should return an inactive token response when the client is not the owner of the token.', async () => {
      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(<Client>{ id: 'client_id' });

      accessTokenServiceMock.findOne.mockResolvedValueOnce(<AccessToken>{
        handle: 'access_token',
        isRevoked: true,
        client: { id: 'another_client_id' },
      });

      refreshTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>(defaultResponse);
    });

    it('should return an inactive token response when the token is revoked.', async () => {
      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(<Client>{ id: 'client_id' });

      accessTokenServiceMock.findOne.mockResolvedValueOnce(<AccessToken>{
        handle: 'access_token',
        isRevoked: true,
        client: { id: 'client_id' },
      });

      refreshTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>(defaultResponse);
    });

    it('should return an inactive token response when the token is not yet valid.', async () => {
      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(<Client>{ id: 'client_id' });

      accessTokenServiceMock.findOne.mockResolvedValueOnce(<AccessToken>{
        handle: 'access_token',
        isRevoked: false,
        validAfter: new Date(Date.now() + 3600000),
        client: { id: 'client_id' },
      });

      refreshTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>(defaultResponse);
    });

    it('should return an inactive token response when the token is expired.', async () => {
      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(<Client>{ id: 'client_id' });

      accessTokenServiceMock.findOne.mockResolvedValueOnce(<AccessToken>{
        handle: 'access_token',
        isRevoked: false,
        validAfter: new Date(Date.now() - 7200000),
        expiresAt: new Date(Date.now() - 3600000),
        client: { id: 'client_id' },
      });

      refreshTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>(defaultResponse);
    });

    it('should return the metadata of the requested token.', async () => {
      const now = Date.now();

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(<Client>{ id: 'client_id' });

      accessTokenServiceMock.findOne.mockResolvedValueOnce(<AccessToken>{
        handle: 'access_token',
        scopes: ['foo', 'bar'],
        isRevoked: false,
        issuedAt: new Date(now - 3600000),
        validAfter: new Date(now - 3600000),
        expiresAt: new Date(now + 3600000),
        client: { id: 'client_id' },
        user: { id: 'user_id' },
      });

      refreshTokenServiceMock.findOne.mockResolvedValueOnce(null);

      const introspectionResponse = <IntrospectionResponse>{
        active: true,
        scope: 'foo bar',
        client_id: 'client_id',
        // username: undefined,
        token_type: 'Bearer',
        exp: Math.ceil((now + 3600000) / 1000),
        iat: Math.ceil((now - 3600000) / 1000),
        nbf: Math.ceil((now - 3600000) / 1000),
        sub: 'user_id',
        aud: 'client_id',
        iss: settings.issuer,
        // jti: undefined,
      };

      const response = await endpoint.handle(request);

      expect(response).toMatchObject<Partial<HttpResponse>>({
        body: Buffer.from(JSON.stringify(introspectionResponse), 'utf8'),
        headers: { 'Content-Type': 'application/json', ...endpoint['headers'] },
        statusCode: 200,
      });
    });
  });
});
