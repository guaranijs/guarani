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
import { InteractionHandler } from '../handlers/interaction.handler';
import { ScopeHandler } from '../handlers/scope.handler';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { AuthorizationRequest } from '../messages/authorization-request';
import { ResponseModeInterface } from '../response-modes/response-mode.interface';
import { RESPONSE_MODE } from '../response-modes/response-mode.token';
import { ResponseTypeInterface } from '../response-types/response-type.interface';
import { RESPONSE_TYPE } from '../response-types/response-type.token';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { AuthorizationEndpoint } from './authorization.endpoint';
import { Endpoint } from './endpoint.type';

jest.mock('../handlers/interaction.handler');

describe('Authorization Endpoint', () => {
  let endpoint: AuthorizationEndpoint;

  const interactionHandlerMock = jest.mocked(InteractionHandler.prototype, true);

  const clientServiceMock = jest.mocked<ClientServiceInterface>({
    findOne: jest.fn(),
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

    container.bind(ScopeHandler).toSelf().asSingleton();
    container.bind(InteractionHandler).toValue(interactionHandlerMock);

    responseTypesMocks.forEach((responseType) => {
      container.bind<ResponseTypeInterface>(RESPONSE_TYPE).toValue(responseType);
    });

    responseModesMocks.forEach((responseMode) => {
      container.bind<ResponseModeInterface>(RESPONSE_MODE).toValue(responseMode);
    });

    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<ClientServiceInterface>(CLIENT_SERVICE).toValue(clientServiceMock);
    container.bind<GrantServiceInterface>(GRANT_SERVICE).toValue(grantServiceMock);
    container.bind(AuthorizationEndpoint).toSelf().asSingleton();

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

  describe('constructor', () => {
    it('should throw when not providing a user interaction object.', () => {
      expect(() => {
        return new AuthorizationEndpoint(
          <ScopeHandler>{},
          <InteractionHandler>{},
          responseTypesMocks,
          responseModesMocks,
          <Settings>{},
          clientServiceMock,
          grantServiceMock
        );
      }).toThrow(new TypeError('Missing User Interaction options.'));
    });
  });

  describe('handle()', () => {
    let request: HttpRequest<AuthorizationRequest>;

    beforeEach(() => {
      request = new HttpRequest<AuthorizationRequest>({
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
      });
    });

    it('should return an error response when providing an invalid "state" parameter.', async () => {
      request.query.state = 123;

      const error = new InvalidRequestException({ description: 'Invalid parameter "state".' });
      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });
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

    it('should return an error response when providing an invalid "response_mode" parameter.', async () => {
      request.query.response_mode = 123;

      const error = new InvalidRequestException({
        description: 'Invalid parameter "response_mode".',
        state: 'client_state',
      });

      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error response when providing an invalid "nonce" parameter.', async () => {
      request.query.nonce = 123;

      const error = new InvalidRequestException({ description: 'Invalid parameter "nonce".', state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error response when providing an invalid "prompt" parameter.', async () => {
      request.query.prompt = 123;

      const error = new InvalidRequestException({ description: 'Invalid parameter "prompt".', state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it('should return an error response when providing an invalid "display" parameter.', async () => {
      request.query.display = 123;

      const error = new InvalidRequestException({ description: 'Invalid parameter "display".', state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${parameters.toString()}` },
        statusCode: 303,
      });
    });

    it.each<any>([null, 'abc'])(
      'should return an error response when providing an invalid "max_age" parameter.',
      async (maxAge) => {
        request.query.max_age = maxAge;

        const error = new InvalidRequestException({
          description: 'Invalid parameter "max_age".',
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

    it('should return a valid authorization response.', async () => {
      Reflect.set(settings, 'enableAuthorizationResponseIssuerIdentifier', true);

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:consent'] = 'consent_id';

      interactionHandlerMock.getEntitiesOrHttpResponse.mockResolvedValueOnce([
        null,
        <Session>{ id: 'session_id' },
        <Consent>{ id: 'consent_id' },
      ]);

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar'],
      });

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

      interactionHandlerMock.getEntitiesOrHttpResponse.mockResolvedValueOnce([
        null,
        <Session>{ id: 'session_id' },
        <Consent>{ id: 'consent_id' },
      ]);

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        redirectUris: ['https://example.com/callback'],
        responseTypes: ['code', 'code id_token'],
        scopes: ['foo', 'bar'],
      });

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
