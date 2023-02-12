import { DependencyInjectionContainer } from '@guarani/di';

import { Buffer } from 'buffer';
import { URL, URLSearchParams } from 'url';

import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Session } from '../entities/session.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { InvalidScopeException } from '../exceptions/invalid-scope.exception';
import { UnauthorizedClientException } from '../exceptions/unauthorized-client.exception';
import { UnsupportedResponseTypeException } from '../exceptions/unsupported-response-type.exception';
import { ScopeHandler } from '../handlers/scope.handler';
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
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { AuthorizationEndpoint } from './authorization.endpoint';

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
      expect(endpoint.name).toBe('authorization');
    });
  });

  describe('path', () => {
    it('should have "/oauth/authorize" as its default path.', () => {
      expect(endpoint.path).toBe('/oauth/authorize');
    });
  });

  describe('httpMethods', () => {
    it('should have \'["GET"]\' as its supported http methods.', () => {
      expect(endpoint.httpMethods).toStrictEqual(['GET']);
    });
  });

  describe('consentUrl', () => {
    it('should be defined based on the provided user interaction.', () => {
      expect(endpoint['consentUrl']).toBe('https://server.example.com/auth/consent');
    });
  });

  describe('errorUrl', () => {
    it('should be defined based on the provided user interaction.', () => {
      expect(endpoint['errorUrl']).toBe('https://server.example.com/oauth/error');
    });
  });

  describe('loginUrl', () => {
    it('should be defined based on the provided user interaction.', () => {
      expect(endpoint['loginUrl']).toBe('https://server.example.com/auth/login');
    });
  });

  describe('constructor', () => {
    it('should throw when not providing a user interaction object.', () => {
      expect(() => new AuthorizationEndpoint(<any>{}, [], [], <any>{}, <any>{}, <any>{}, <any>{})).toThrow(TypeError);
    });
  });

  describe('handle()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = {
        body: {},
        cookies: { 'guarani:session': 'session_id', 'guarani:consent': 'consent_id' },
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

      const error = new InvalidRequestException({ description: 'Invalid parameter "response_type".' });
      const params = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error response when not providing a "client_id" parameter.', async () => {
      delete request.query.client_id;

      const error = new InvalidRequestException({ description: 'Invalid parameter "client_id".' });
      const params = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error response when not providing a "redirect_uri" parameter.', async () => {
      delete request.query.redirect_uri;

      const error = new InvalidRequestException({ description: 'Invalid parameter "redirect_uri".' });
      const params = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error response when not providing a "scope" parameter.', async () => {
      delete request.query.scope;

      const error = new InvalidRequestException({ description: 'Invalid parameter "scope".' });
      const params = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error response when a client is not found.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(null);

      const error = new InvalidClientException({ description: 'Invalid Client.' });
      const params = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error response when requesting an unsupported response type.', async () => {
      request.query.response_type = 'unknown';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{ id: 'client_id' });

      const error = new UnsupportedResponseTypeException({ description: 'Unsupported response_type "unknown".' });
      const params = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error response when the client requests a response type that it is not allowed to request.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{ id: 'client_id', responseTypes: ['token'] });

      const error = new UnauthorizedClientException({
        description: 'This Client is not allowed to request the response_type "code".',
      });

      const params = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error response when the client provides a redirect uri that it is not allowed to use.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://bad.example.com/callback'],
        responseTypes: ['code'],
      });

      const error = new AccessDeniedException({ description: 'Invalid Redirect URI.' });
      const params = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${params.toString()}` },
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

      const error = new InvalidScopeException({ description: 'Unsupported scope "unknown".' });
      const params = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${params.toString()}` },
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

      const error = new InvalidRequestException({ description: 'Unsupported response_mode "unknown".' });
      const params = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should return a redirect response to the login page when no session is found at the cookies.', async () => {
      delete request.cookies['guarani:session'];

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.create.mockResolvedValueOnce(<Session>{ id: 'session_id' });

      const params = new URLSearchParams({ login_challenge: 'session_id' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:session': 'session_id' },
        headers: { Location: `https://server.example.com/auth/login?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should return a redirect response to the login page when no session is found with the id at the cookies.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(null);
      sessionServiceMock.create.mockResolvedValueOnce(<Session>{ id: 'session_id' });

      const params = new URLSearchParams({ login_challenge: 'session_id' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:session': 'session_id' },
        headers: { Location: `https://server.example.com/auth/login?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should return a redirect response to the login page when the session is expired.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{
        id: 'session_id',
        expiresAt: new Date(Date.now() - 3600000),
      });

      sessionServiceMock.create.mockResolvedValueOnce(<Session>{ id: 'session_id' });

      const params = new URLSearchParams({ login_challenge: 'session_id' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:session': 'session_id' },
        headers: { Location: `https://server.example.com/auth/login?${params.toString()}` },
        statusCode: 303,
      });

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
    });

    it('should return a redirect response to the login page when the session does not have a user.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{ id: 'session_id', user: null });
      sessionServiceMock.create.mockResolvedValueOnce(<Session>{ id: 'session_id' });

      const params = new URLSearchParams({ login_challenge: 'session_id' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:session': 'session_id' },
        headers: { Location: `https://server.example.com/auth/login?${params.toString()}` },
        statusCode: 303,
      });

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
    });

    it('should return an error response when the parameters of the request and session do not match.', async () => {
      request.query.state = 'bad_client_state';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{
        id: 'session_id',
        parameters: { ...request.query, state: 'client_state' },
        user: { id: 'user_id' },
      });

      responseModesMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        const url = new URL(redirectUri);
        url.search = new URLSearchParams(parameters).toString();
        return new HttpResponse().redirect(url);
      });

      const error = new InvalidRequestException({
        description: 'One or more parameters changed since the initial request.',
      });

      const params = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://example.com/callback?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should return a redirect response to the consent page when no consent is found at the cookies.', async () => {
      delete request.cookies['guarani:consent'];

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{
        id: 'session_id',
        parameters: request.query,
        user: { id: 'user_id' },
      });

      consentServiceMock.create.mockResolvedValueOnce(<Consent>{ id: 'consent_id' });

      const params = new URLSearchParams({ consent_challenge: 'consent_id' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:consent': 'consent_id' },
        headers: { Location: `https://server.example.com/auth/consent?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should return a redirect response to the consent page when no consent is found with the id at the cookies.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{
        id: 'session_id',
        parameters: request.query,
        user: { id: 'user_id' },
      });

      consentServiceMock.findOne.mockResolvedValueOnce(null);
      consentServiceMock.create.mockResolvedValueOnce(<Consent>{ id: 'consent_id' });

      const params = new URLSearchParams({ consent_challenge: 'consent_id' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:consent': 'consent_id' },
        headers: { Location: `https://server.example.com/auth/consent?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should return a redirect response to the consent page when the consent is expired.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{
        id: 'session_id',
        parameters: request.query,
        user: { id: 'user_id' },
      });

      consentServiceMock.findOne.mockResolvedValueOnce(<Consent>{
        id: 'consent_id',
        expiresAt: new Date(Date.now() - 3600000),
      });

      consentServiceMock.create.mockResolvedValueOnce(<Consent>{ id: 'consent_id' });

      const params = new URLSearchParams({ consent_challenge: 'consent_id' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { 'guarani:consent': 'consent_id' },
        headers: { Location: `https://server.example.com/auth/consent?${params.toString()}` },
        statusCode: 303,
      });

      expect(consentServiceMock.remove).toHaveBeenCalledTimes(1);
    });

    it('should return an error response when the parameters of the request and consent do not match.', async () => {
      request.query.state = 'bad_client_state';

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{ id: 'session_id', user: { id: 'user_id' } });

      consentServiceMock.findOne.mockResolvedValueOnce(<Consent>{
        id: 'consent_id',
        parameters: { ...request.query, state: 'client_state' },
      });

      responseModesMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        const url = new URL(redirectUri);
        url.search = new URLSearchParams(parameters).toString();
        return new HttpResponse().redirect(url);
      });

      const error = new InvalidRequestException({
        description: 'One or more parameters changed since the initial request.',
      });

      const params = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://example.com/callback?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should return a valid authorization response.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{
        id: 'session_id',
        parameters: request.query,
        user: { id: 'user_id' },
      });

      consentServiceMock.findOne.mockResolvedValueOnce(<Consent>{ id: 'consent_id' });

      responseTypesMocks[0]!.handle.mockResolvedValueOnce({ code: 'code', state: request.query.state });

      responseModesMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        const url = new URL(redirectUri);
        url.search = new URLSearchParams(parameters).toString();
        return new HttpResponse().redirect(url);
      });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: 'https://example.com/callback?code=code&state=client_state' },
        statusCode: 303,
      });
    });
  });
});
