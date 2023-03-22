import { DependencyInjectionContainer } from '@guarani/di';

import { Buffer } from 'buffer';
import { URL, URLSearchParams } from 'url';

import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Grant } from '../entities/grant.entity';
import { Session } from '../entities/session.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { ConsentRequiredException } from '../exceptions/consent-required.exception';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { InvalidScopeException } from '../exceptions/invalid-scope.exception';
import { LoginRequiredException } from '../exceptions/login-required.exception';
import { UnauthorizedClientException } from '../exceptions/unauthorized-client.exception';
import { UnsupportedResponseTypeException } from '../exceptions/unsupported-response-type.exception';
import { ScopeHandler } from '../handlers/scope.handler';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { ResponseModeInterface } from '../response-modes/response-mode.interface';
import { RESPONSE_MODE } from '../response-modes/response-mode.token';
import { ResponseTypeInterface } from '../response-types/response-type.interface';
import { RESPONSE_TYPE } from '../response-types/response-type.token';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { ConsentServiceInterface } from '../services/consent.service.interface';
import { CONSENT_SERVICE } from '../services/consent.service.token';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { AuthorizationEndpoint } from './authorization.endpoint';
import { Endpoint } from './endpoint.type';

describe('Authorization Endpoint', () => {
  let endpoint: AuthorizationEndpoint;

  const clientServiceMock = jest.mocked<ClientServiceInterface>({
    findOne: jest.fn(),
  });

  const sessionServiceMock = jest.mocked<SessionServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  const consentServiceMock = jest.mocked<ConsentServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  const grantServiceMock = jest.mocked<GrantServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    findOneByConsentChallenge: jest.fn(),
    findOneByLoginChallenge: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  const responseTypesMocks = [
    jest.mocked<ResponseTypeInterface>({ name: 'code', defaultResponseMode: 'query', handle: jest.fn() }),
    jest.mocked<ResponseTypeInterface>({ name: 'code id_token', defaultResponseMode: 'fragment', handle: jest.fn() }),
    jest.mocked<ResponseTypeInterface>({
      name: 'code id_token token',
      defaultResponseMode: 'fragment',
      handle: jest.fn(),
    }),
    jest.mocked<ResponseTypeInterface>({ name: 'code token', defaultResponseMode: 'fragment', handle: jest.fn() }),
    jest.mocked<ResponseTypeInterface>({ name: 'id_token', defaultResponseMode: 'fragment', handle: jest.fn() }),
    jest.mocked<ResponseTypeInterface>({ name: 'id_token token', defaultResponseMode: 'fragment', handle: jest.fn() }),
    jest.mocked<ResponseTypeInterface>({ name: 'token', defaultResponseMode: 'fragment', handle: jest.fn() }),
  ];

  const responseModesMocks = [
    jest.mocked<ResponseModeInterface>({ name: 'query', createHttpResponse: jest.fn() }),
    jest.mocked<ResponseModeInterface>({ name: 'fragment', createHttpResponse: jest.fn() }),
    jest.mocked<ResponseModeInterface>({ name: 'form_post', createHttpResponse: jest.fn() }),
  ];

  const settings = <Settings>{
    issuer: 'https://server.example.com',
    scopes: ['foo', 'bar', 'baz', 'qux'],
    userInteraction: { consentUrl: '/auth/consent', errorUrl: '/oauth/error', loginUrl: '/auth/login' },
  };

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<ClientServiceInterface>(CLIENT_SERVICE).toValue(clientServiceMock);
    container.bind<SessionServiceInterface>(SESSION_SERVICE).toValue(sessionServiceMock);
    container.bind<ConsentServiceInterface>(CONSENT_SERVICE).toValue(consentServiceMock);
    container.bind<GrantServiceInterface>(GRANT_SERVICE).toValue(grantServiceMock);
    container.bind(ScopeHandler).toSelf().asSingleton();
    container.bind(AuthorizationEndpoint).toSelf().asSingleton();

    responseTypesMocks.forEach((responseType) => {
      container.bind<ResponseTypeInterface>(RESPONSE_TYPE).toValue(responseType);
    });

    responseModesMocks.forEach((responseMode) => {
      container.bind<ResponseModeInterface>(RESPONSE_MODE).toValue(responseMode);
    });

    endpoint = container.resolve(AuthorizationEndpoint);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "authorization" as its name.', () => {
      expect(endpoint.name).toEqual<Endpoint>('authorization');
    });
  });

  describe('path', () => {
    it('should have "/oauth/authorize" as its default path.', () => {
      expect(endpoint.path).toEqual('/oauth/authorize');
    });
  });

  describe('httpMethods', () => {
    it('should have \'["GET"]\' as its supported http methods.', () => {
      expect(endpoint.httpMethods).toStrictEqual<HttpMethod[]>(['GET']);
    });
  });

  describe('consentUrl', () => {
    it('should be defined based on the provided user interaction.', () => {
      expect(endpoint['consentUrl']).toEqual('https://server.example.com/auth/consent');
    });
  });

  describe('errorUrl', () => {
    it('should be defined based on the provided user interaction.', () => {
      expect(endpoint['errorUrl']).toEqual('https://server.example.com/oauth/error');
    });
  });

  describe('loginUrl', () => {
    it('should be defined based on the provided user interaction.', () => {
      expect(endpoint['loginUrl']).toEqual('https://server.example.com/auth/login');
    });
  });

  describe('constructor', () => {
    it('should throw when not providing a user interaction object.', () => {
      expect(() => {
        return new AuthorizationEndpoint(
          <ScopeHandler>{},
          responseTypesMocks,
          responseModesMocks,
          <Settings>{},
          clientServiceMock,
          sessionServiceMock,
          consentServiceMock,
          grantServiceMock
        );
      }).toThrow(new TypeError('Missing User Interaction options.'));
    });
  });

  describe('handle()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = {
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        path: '/oauth/authorize',
        query: {
          response_type: 'code',
          client_id: 'client_id',
          redirect_uri: 'https://example.com/callback',
          scope: 'foo bar',
          state: 'client_state',
        },
      };
    });

    it('should return an error response when not providing a "response_type" parameter.', async () => {
      delete request.query.response_type;

      const error = new InvalidRequestException({
        description: 'Invalid parameter "response_type".',
        state: 'client_state',
      });

      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error response when not providing a "client_id" parameter.', async () => {
      delete request.query.client_id;

      const error = new InvalidRequestException({
        description: 'Invalid parameter "client_id".',
        state: 'client_state',
      });

      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error response when not providing a "redirect_uri" parameter.', async () => {
      delete request.query.redirect_uri;

      const error = new InvalidRequestException({
        description: 'Invalid parameter "redirect_uri".',
        state: 'client_state',
      });

      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error response when not providing a "scope" parameter.', async () => {
      delete request.query.scope;

      const error = new InvalidRequestException({ description: 'Invalid parameter "scope".', state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error response when a client is not found.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(null);

      const error = new InvalidClientException({ description: 'Invalid Client.', state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error response when requesting an unsupported response type.', async () => {
      request.query.response_type = 'unknown';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{ id: 'client_id' });

      const error = new UnsupportedResponseTypeException({
        description: 'Unsupported response_type "unknown".',
        state: 'client_state',
      });

      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error response when the client requests a response type that it is not allowed to request.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{ id: 'client_id', responseTypes: ['token'] });

      const error = new UnauthorizedClientException({
        description: 'This Client is not allowed to request the response_type "code".',
        state: 'client_state',
      });

      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error response when the client provides a redirect uri that it is not allowed to use.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://bad.example.com/callback'],
        responseTypes: ['code'],
      });

      const error = new AccessDeniedException({ description: 'Invalid Redirect URI.', state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error response when the client requests an unsupported scope.', async () => {
      request.query.scope = 'foo unknown bar';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      const error = new InvalidScopeException({ description: 'Unsupported scope "unknown".', state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error response when requesting an unsupported response mode.', async () => {
      request.query.response_mode = 'unknown';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      const error = new InvalidRequestException({
        description: 'Unsupported response_mode "unknown".',
        state: 'client_state',
      });

      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should throw when requesting an unsupported prompt.', async () => {
      request.query.prompt = 'unknown';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      const error = new InvalidRequestException({
        description: 'Unsupported prompt "unknown".',
        state: 'client_state',
      });

      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it.each(['consent none', 'login none', 'none consent', 'none login'])(
      'should return an error response when requesting an invalid "prompt" combination.',
      async (prompt) => {
        request.query.prompt = prompt;

        clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
          id: 'client_id',
          redirectUris: ['https://example.com/callback'],
          responseTypes: ['code'],
          scopes: ['foo', 'bar'],
        });

        const error = new InvalidRequestException({
          description: 'The prompt "none" must be used by itself.',
          state: 'client_state',
        });

        const parameters = new URLSearchParams(error.toJSON());

        await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
          body: Buffer.alloc(0),
          headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
          statusCode: 303,
        });
      }
    );

    it('should return an error response when the "prompt" is "none" and no grant is found at the cookies (session).', async () => {
      request.query.prompt = 'none';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      const error = new LoginRequiredException({ state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:session': null },
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should return a redirect response to the login page when no grant is found at the cookies (session).', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      grantServiceMock.create.mockResolvedValueOnce(<Grant>{ id: 'grant_id', loginChallenge: 'login_challenge' });

      const parameters = new URLSearchParams({ login_challenge: 'login_challenge' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:grant': 'grant_id', 'guarani:session': null },
        headers: { Location: `https://server.example.com/auth/login?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error response when the "prompt" is "none" and no grant is found at the storage (session).', async () => {
      request.query.prompt = 'none';
      request.cookies['guarani:grant'] = 'grant_id';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      grantServiceMock.findOne.mockResolvedValueOnce(null);

      const error = new LoginRequiredException({ state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:session': null },
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should return a redirect response to the login page when no grant is found at the storage (session).', async () => {
      request.cookies['guarani:grant'] = 'grant_id';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      grantServiceMock.findOne.mockResolvedValueOnce(null);
      grantServiceMock.create.mockResolvedValueOnce(<Grant>{ id: 'grant_id', loginChallenge: 'login_challenge' });

      const parameters = new URLSearchParams({ login_challenge: 'login_challenge' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:grant': 'grant_id', 'guarani:session': null },
        headers: { Location: `https://server.example.com/auth/login?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error response when the client is not the one that requested the grant (session).', async () => {
      request.cookies['guarani:grant'] = 'grant_id';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'other_client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      grantServiceMock.findOne.mockResolvedValueOnce(<Grant>{ id: 'grant_id', client: { id: 'client_id' } });

      const error = new InvalidRequestException({
        description: 'Mismatching Client Identifier.',
        state: 'client_state',
      });

      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:grant': null, 'guarani:session': null },
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
    });

    it('should return an error response when the grant is expired (session).', async () => {
      request.cookies['guarani:grant'] = 'old_grant_id';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      grantServiceMock.findOne.mockResolvedValueOnce(<Grant>{
        id: 'old_grant_id',
        expiresAt: new Date(Date.now() - 300000),
        client: { id: 'client_id' },
      });

      const error = new InvalidRequestException({ description: 'Expired Grant.', state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:grant': null, 'guarani:session': null },
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
    });

    it('should return an error response when the parameters of the request changed (session).', async () => {
      request.query.state = 'bad_client_state';
      request.cookies['guarani:grant'] = 'grant_id';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      grantServiceMock.findOne.mockResolvedValueOnce(<Grant>{
        id: 'grant_id',
        parameters: { ...request.query, state: 'client_state' },
        expiresAt: new Date(Date.now() + 300000),
        client: { id: 'client_id' },
      });

      const error = new InvalidRequestException({
        description: 'One or more parameters changed since the initial request.',
        state: 'bad_client_state',
      });

      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:grant': null, 'guarani:session': null },
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
    });

    it('should return an error response when the "prompt" is "none" and the grant has no session.', async () => {
      request.query.prompt = 'none';
      request.cookies['guarani:grant'] = 'grant_id';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      grantServiceMock.findOne.mockResolvedValueOnce(<Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: request.query,
        expiresAt: new Date(Date.now() + 300000),
        client: { id: 'client_id' },
      });

      const error = new LoginRequiredException({ state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:session': null },
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should return a redirect response to the login page when the grant has no session.', async () => {
      request.cookies['guarani:grant'] = 'grant_id';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      grantServiceMock.findOne.mockResolvedValueOnce(<Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: request.query,
        expiresAt: new Date(Date.now() + 300000),
        client: { id: 'client_id' },
      });

      const parameters = new URLSearchParams({ login_challenge: 'login_challenge' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:grant': 'grant_id', 'guarani:session': null },
        headers: { Location: `https://server.example.com/auth/login?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error response when the "prompt" is "none" and the session is expired.', async () => {
      request.query.prompt = 'none';
      request.cookies['guarani:grant'] = 'grant_id';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      grantServiceMock.findOne.mockResolvedValueOnce(<Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: request.query,
        expiresAt: new Date(Date.now() + 300000),
        client: { id: 'client_id' },
        session: {
          id: 'session_id',
          expiresAt: new Date(Date.now() - 300000),
        },
      });

      const error = new LoginRequiredException({ state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:session': null },
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
    });

    it('should return a redirect response to the login page when the session is expired.', async () => {
      request.cookies['guarani:grant'] = 'grant_id';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      grantServiceMock.findOne.mockResolvedValueOnce(<Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: request.query,
        expiresAt: new Date(Date.now() + 300000),
        client: { id: 'client_id' },
        session: {
          id: 'session_id',
          expiresAt: new Date(Date.now() - 300000),
        },
      });

      const parameters = new URLSearchParams({ login_challenge: 'login_challenge' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:grant': 'grant_id', 'guarani:session': null },
        headers: { Location: `https://server.example.com/auth/login?${parameters.toString()}` },
        statusCode: 303,
      });

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
    });

    it('should return a redirect response to the login page when the session is expired creating a new grant.', async () => {
      request.cookies['guarani:session'] = 'session_id';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{
        id: 'session_id',
        expiresAt: new Date(Date.now() - 300000),
      });

      grantServiceMock.create.mockResolvedValueOnce(<Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
      });

      const parameters = new URLSearchParams({ login_challenge: 'login_challenge' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:grant': 'grant_id', 'guarani:session': null },
        headers: { Location: `https://server.example.com/auth/login?${parameters.toString()}` },
        statusCode: 303,
      });

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should return a redirect response to the login page when the "prompt" is "login".', async () => {
      request.query.prompt = 'login';
      request.cookies['guarani:session'] = 'session_id';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{ id: 'session_id' });

      grantServiceMock.create.mockResolvedValueOnce(<Grant>{ id: 'grant_id', loginChallenge: 'login_challenge' });

      const parameters = new URLSearchParams({ login_challenge: 'login_challenge' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:grant': 'grant_id', 'guarani:session': null },
        headers: { Location: `https://server.example.com/auth/login?${parameters.toString()}` },
        statusCode: 303,
      });

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should return an error response when the "prompt" is "none" and no grant is found (consent).', async () => {
      request.query.prompt = 'none';
      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{ id: 'session_id', user: { id: 'user_id' } });
      consentServiceMock.findOne.mockResolvedValueOnce(null);
      grantServiceMock.findOne.mockResolvedValueOnce(null);

      const error = new ConsentRequiredException({ state: 'client_state' });

      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should return a redirect response to the consent page when no grant is found (consent).', async () => {
      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{ id: 'session_id', user: { id: 'user_id' } });
      consentServiceMock.findOne.mockResolvedValueOnce(null);
      grantServiceMock.findOne.mockResolvedValueOnce(null);

      grantServiceMock.create.mockResolvedValueOnce(<Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
      });

      const parameters = new URLSearchParams({ consent_challenge: 'consent_challenge' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:grant': 'grant_id', 'guarani:session': 'session_id' },
        headers: { Location: `https://server.example.com/auth/consent?${parameters.toString()}` },
        statusCode: 303,
      });

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should return an error response when the client is not the one that requested the grant (consent).', async () => {
      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const session = <Session>{ id: 'session_id', user: { id: 'user_id' } };

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'other_client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(null);
      grantServiceMock.findOne.mockResolvedValueOnce(<Grant>{ id: 'grant_id', client: { id: 'client_id' }, session });

      const error = new InvalidRequestException({
        description: 'Mismatching Client Identifier.',
        state: 'client_state',
      });

      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:grant': null, 'guarani:session': null },
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
    });

    it('should return an error response when the grant is expired (consent).', async () => {
      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'old_grant_id';

      const session = <Session>{ id: 'session_id', user: { id: 'user_id' } };

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(null);

      grantServiceMock.findOne.mockResolvedValueOnce(<Grant>{
        id: 'old_grant_id',
        expiresAt: new Date(Date.now() - 300000),
        client: { id: 'client_id' },
        session,
      });

      const error = new InvalidRequestException({ description: 'Expired Grant.', state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:grant': null, 'guarani:session': null },
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
    });

    it('should return an error response when the parameters of the request changed (consent).', async () => {
      request.query.state = 'bad_client_state';
      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const session = <Session>{ id: 'session_id', user: { id: 'user_id' } };

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(null);

      grantServiceMock.findOne.mockResolvedValueOnce(<Grant>{
        id: 'grant_id',
        parameters: { ...request.query, state: 'client_state' },
        expiresAt: new Date(Date.now() + 300000),
        client: { id: 'client_id' },
        session,
      });

      const error = new InvalidRequestException({
        description: 'One or more parameters changed since the initial request.',
        state: 'bad_client_state',
      });

      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:grant': null, 'guarani:session': null },
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
    });

    it('should return an error response when the "prompt" is "none" and the grant has no consent.', async () => {
      request.query.prompt = 'none';
      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const session = <Session>{ id: 'session_id', user: { id: 'user_id' } };

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(null);

      grantServiceMock.findOne.mockResolvedValueOnce(<Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
        parameters: request.query,
        expiresAt: new Date(Date.now() + 300000),
        client: { id: 'client_id' },
        session,
      });

      const error = new ConsentRequiredException({ state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should return a redirect response to the consent page when the grant has no consent.', async () => {
      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const session = <Session>{ id: 'session_id', user: { id: 'user_id' } };

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(null);

      grantServiceMock.findOne.mockResolvedValueOnce(<Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
        parameters: request.query,
        expiresAt: new Date(Date.now() + 300000),
        client: { id: 'client_id' },
        session,
      });

      const parameters = new URLSearchParams({ consent_challenge: 'consent_challenge' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:grant': 'grant_id', 'guarani:session': 'session_id' },
        headers: { Location: `https://server.example.com/auth/consent?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error when the "prompt" is "none" and the consent is expired.', async () => {
      request.query.prompt = 'none';
      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const session = <Session>{ id: 'session_id', user: { id: 'user_id' } };

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(null);

      grantServiceMock.findOne.mockResolvedValueOnce(<Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
        parameters: request.query,
        expiresAt: new Date(Date.now() + 300000),
        client: { id: 'client_id' },
        consent: { id: 'consent_id', expiresAt: new Date(Date.now() - 300000) },
      });

      const error = new ConsentRequiredException({ state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });

      expect(consentServiceMock.remove).toHaveBeenCalledTimes(1);
    });

    it('should return a redirect response to the consent page when the consent is expired.', async () => {
      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const session = <Session>{ id: 'session_id', user: { id: 'user_id' } };

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(null);

      grantServiceMock.findOne.mockResolvedValueOnce(<Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
        parameters: request.query,
        expiresAt: new Date(Date.now() + 300000),
        client: { id: 'client_id' },
        consent: { id: 'consent_id', expiresAt: new Date(Date.now() - 300000) },
      });

      const parameters = new URLSearchParams({ consent_challenge: 'consent_challenge' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:grant': 'grant_id', 'guarani:session': 'session_id' },
        headers: { Location: `https://server.example.com/auth/consent?${parameters.toString()}` },
        statusCode: 303,
      });

      expect(consentServiceMock.remove).toHaveBeenCalledTimes(1);
    });

    it('should return a redirect response to the consent page when the consent is expired creating a new grant.', async () => {
      request.cookies['guarani:session'] = 'session_id';

      const session = <Session>{ id: 'session_id', user: { id: 'user_id' } };

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(<Consent>{
        id: 'consent_id',
        expiresAt: new Date(Date.now() - 300000),
      });

      grantServiceMock.create.mockResolvedValueOnce(<Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
      });

      const parameters = new URLSearchParams({ consent_challenge: 'consent_challenge' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:grant': 'grant_id', 'guarani:session': 'session_id' },
        headers: { Location: `https://server.example.com/auth/consent?${parameters.toString()}` },
        statusCode: 303,
      });

      expect(consentServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.save).toHaveBeenCalledTimes(1);
    });

    it.todo(
      'should return a redirect response to the consent page when the "prompt" is "consent" and no grant is found (consent).'
    );

    it.todo('should return a redirect response to the consent page when the "prompt" is "consent".');

    it('should return a valid authorization response.', async () => {
      Reflect.set(settings, 'enableAuthorizationResponseIssuerIdentifier', true);

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:consent'] = 'consent_id';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{ id: 'session_id', user: { id: 'user_id' } });
      consentServiceMock.findOne.mockResolvedValueOnce(<Consent>{ id: 'consent_id' });

      responseTypesMocks
        .find((responseType) => responseType.name === 'code')!
        .handle.mockResolvedValueOnce({ code: 'code', state: 'client_state' });

      responseModesMocks
        .find((responseMode) => responseMode.name === 'query')!
        .createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
          const url = new URL(redirectUri);
          url.search = new URLSearchParams(parameters).toString();
          return new HttpResponse().redirect(url);
        });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: {
          Location: 'https://example.com/callback?code=code&state=client_state&iss=https%3A%2F%2Fserver.example.com',
        },
        statusCode: 303,
      });

      Reflect.deleteProperty(settings, 'enableAuthorizationResponseIssuerIdentifier');
    });

    it('should return a valid authorization response when the provided "response_type" is not in alphabetical order.', async () => {
      Reflect.set(settings, 'enableAuthorizationResponseIssuerIdentifier', true);

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:consent'] = 'consent_id';

      request.query.response_type = 'id_token code';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code', 'code id_token'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{ id: 'session_id', user: { id: 'user_id' } });
      consentServiceMock.findOne.mockResolvedValueOnce(<Consent>{ id: 'consent_id' });

      responseTypesMocks
        .find((responseType) => responseType.name === 'code id_token')!
        .handle.mockResolvedValueOnce({ code: 'code', state: 'client_state', id_token: 'id_token' });

      responseModesMocks
        .find((responseMode) => responseMode.name === 'fragment')!
        .createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
          const url = new URL(redirectUri);
          url.hash = new URLSearchParams(parameters).toString();
          return new HttpResponse().redirect(url);
        });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: {
          Location:
            'https://example.com/callback#code=code&state=client_state&id_token=id_token&iss=https%3A%2F%2Fserver.example.com',
        },
        statusCode: 303,
      });

      Reflect.deleteProperty(settings, 'enableAuthorizationResponseIssuerIdentifier');
    });
  });
});
