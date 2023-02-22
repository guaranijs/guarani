import { DependencyInjectionContainer } from '@guarani/di';

import { Buffer } from 'buffer';
import { URL, URLSearchParams } from 'url';

import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Grant } from '../entities/grant.entity';
import { Session } from '../entities/session.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { InvalidScopeException } from '../exceptions/invalid-scope.exception';
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
    jest.mocked<ResponseTypeInterface>({ name: 'token', defaultResponseMode: 'fragment', handle: jest.fn() }),
  ];

  const responseModesMocks = [
    jest.mocked<ResponseModeInterface>({ name: 'query', createHttpResponse: jest.fn() }),
    jest.mocked<ResponseModeInterface>({ name: 'fragment', createHttpResponse: jest.fn() }),
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

    it('should return a redirect response to the login page when no grant is found at the cookies (session).', async () => {
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

    it('should return a redirect response to the login page when no grant is found at the storage (session).', async () => {
      Reflect.set(request.cookies, 'guarani:grant', 'grant_id');

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(null);
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
      Reflect.set(request.cookies, 'guarani:grant', 'grant_id');

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'other_client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(null);

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
      Reflect.set(request.cookies, 'guarani:grant', 'old_grant_id');

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(null);

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
      Reflect.set(request.query, 'state', 'bad_client_state');
      Reflect.set(request.cookies, 'guarani:grant', 'grant_id');

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(null);

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

    it('should return a redirect response to the login page when the grant has no session.', async () => {
      Reflect.set(request.cookies, 'guarani:grant', 'grant_id');

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(null);

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

    it('should return a redirect response to the login page when the session is expired.', async () => {
      Reflect.set(request.cookies, 'guarani:session', 'session_id');
      Reflect.set(request.cookies, 'guarani:grant', 'grant_id');

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(null);

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

      grantServiceMock.create.mockResolvedValueOnce(<Grant>{ id: 'grant_id', loginChallenge: 'login_challenge' });

      const parameters = new URLSearchParams({ login_challenge: 'login_challenge' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:grant': 'grant_id', 'guarani:session': null },
        headers: { Location: `https://server.example.com/auth/login?${parameters.toString()}` },
        statusCode: 303,
      });

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
    });

    it('should return a redirect response to the consent page when no grant is found (consent).', async () => {
      Reflect.set(request.cookies, 'guarani:session', 'session_id');
      Reflect.set(request.cookies, 'guarani:grant', 'grant_id');

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
        cookies: { 'guarani:grant': 'grant_id', 'guarani:session': 'session_id', 'guarani:consent': null },
        headers: { Location: `https://server.example.com/auth/consent?${parameters.toString()}` },
        statusCode: 303,
      });

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should return an error response when the client is not the one that requested the grant (consent).', async () => {
      Reflect.set(request.cookies, 'guarani:session', 'session_id');
      Reflect.set(request.cookies, 'guarani:grant', 'grant_id');

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
        cookies: { 'guarani:grant': null, 'guarani:session': null, 'guarani:consent': null },
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
    });

    it('should return an error response when the grant is expired (consent).', async () => {
      Reflect.set(request.cookies, 'guarani:session', 'session_id');
      Reflect.set(request.cookies, 'guarani:grant', 'old_grant_id');

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
        cookies: { 'guarani:grant': null, 'guarani:session': null, 'guarani:consent': null },
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
    });

    it('should return an error response when the parameters of the request changed (consent).', async () => {
      Reflect.set(request.query, 'state', 'bad_client_state');
      Reflect.set(request.cookies, 'guarani:session', 'session_id');
      Reflect.set(request.cookies, 'guarani:grant', 'grant_id');

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
        cookies: { 'guarani:grant': null, 'guarani:session': null, 'guarani:consent': null },
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
    });

    it('should return a redirect response to the consent page when the grant has no consent.', async () => {
      Reflect.set(request.cookies, 'guarani:session', 'session_id');
      Reflect.set(request.cookies, 'guarani:grant', 'grant_id');

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
        cookies: { 'guarani:grant': 'grant_id', 'guarani:session': 'session_id', 'guarani:consent': null },
        headers: { Location: `https://server.example.com/auth/consent?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should return a redirect response to the consent page when the consent is expired.', async () => {
      Reflect.set(request.cookies, 'guarani:session', 'session_id');
      Reflect.set(request.cookies, 'guarani:grant', 'grant_id');

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
        cookies: { 'guarani:grant': 'grant_id', 'guarani:session': 'session_id', 'guarani:consent': null },
        headers: { Location: `https://server.example.com/auth/consent?${parameters.toString()}` },
        statusCode: 303,
      });

      expect(consentServiceMock.remove).toHaveBeenCalledTimes(1);
    });

    it('should return a valid authorization response.', async () => {
      Reflect.set(settings, 'enableAuthorizationResponseIssuerIdentifier', true);

      Reflect.set(request.cookies, 'guarani:session', 'session_id');
      Reflect.set(request.cookies, 'guarani:consent', 'consent_id');

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{ id: 'session_id', user: { id: 'user_id' } });
      consentServiceMock.findOne.mockResolvedValueOnce(<Consent>{ id: 'consent_id' });

      responseTypesMocks[0]!.handle.mockResolvedValueOnce({ code: 'code', state: 'client_state' });

      responseModesMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
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
  });
});
