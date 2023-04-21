import { DependencyInjectionContainer } from '@guarani/di';

import { URLSearchParams } from 'url';

import { Consent } from '../entities/consent.entity';
import { Session } from '../entities/session.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { UnsupportedResponseTypeException } from '../exceptions/unsupported-response-type.exception';
import { InteractionHandler } from '../handlers/interaction.handler';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { AuthorizationRequestValidator } from '../validators/authorization/authorization-request.validator';
import { AuthorizationEndpoint } from './authorization.endpoint';
import { Endpoint } from './endpoint.type';

jest.mock('../handlers/interaction.handler');
jest.mock('../validators/authorization/authorization-request.validator');

describe('Authorization Endpoint', () => {
  let container: DependencyInjectionContainer;
  let endpoint: AuthorizationEndpoint;

  const interactionHandlerMock = jest.mocked(InteractionHandler.prototype, true);

  const settings = <Settings>{
    issuer: 'https://server.example.com',
    scopes: ['foo', 'bar', 'baz', 'qux'],
    userInteraction: { consentUrl: '/auth/consent', errorUrl: '/oauth/error', loginUrl: '/auth/login' },
  };

  const grantServiceMock = jest.mocked<GrantServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    findOneByConsentChallenge: jest.fn(),
    findOneByLoginChallenge: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  const validatorsMocks = [jest.mocked(AuthorizationRequestValidator.prototype, true)];

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(InteractionHandler).toValue(interactionHandlerMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<GrantServiceInterface>(GRANT_SERVICE).toValue(grantServiceMock);

    validatorsMocks.forEach((validatorMock) => {
      container.bind(AuthorizationRequestValidator).toValue(validatorMock);
    });

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
      const settings = <Settings>{ issuer: 'https://server.example.com', scopes: ['foo', 'bar', 'baz', 'qux'] };

      container.delete<Settings>(SETTINGS);
      container.delete(AuthorizationEndpoint);

      container.bind<Settings>(SETTINGS).toValue(settings);
      container.bind(AuthorizationEndpoint).toSelf().asSingleton();

      expect(() => container.resolve(AuthorizationEndpoint)).toThrow(
        new TypeError('Missing User Interaction options.')
      );
    });
  });

  describe('handle()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
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

    it('should return an error response when not providing a "response_type" parameter.', async () => {
      delete request.query.response_type;

      const error = new InvalidRequestException({
        description: 'Invalid parameter "response_type".',
        state: 'client_state',
      });

      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toStrictEqual(
        new HttpResponse().redirect(`https://server.example.com/oauth/error?${parameters.toString()}`)
      );
    });

    it('should return an error response when requesting an unsupported response type.', async () => {
      request.query.response_type = 'unknown';

      const error = new UnsupportedResponseTypeException({
        description: 'Unsupported response_type "unknown".',
        state: 'client_state',
      });

      const parameters = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toStrictEqual(
        new HttpResponse().redirect(`https://server.example.com/oauth/error?${parameters.toString()}`)
      );
    });

    it('should return a valid authorization response.', async () => {
      Reflect.set(settings, 'enableAuthorizationResponseIssuerIdentifier', true);

      Object.assign(request.cookies, {
        'guarani:session': 'session_id',
        'guarani:consent': 'consent_id',
      });

      interactionHandlerMock.getEntitiesOrHttpResponse.mockResolvedValueOnce([
        null,
        <Session>{ id: 'session_id' },
        <Consent>{ id: 'consent_id' },
      ]);

      await expect(endpoint.handle(request)).resolves.toStrictEqual(
        new HttpResponse().redirect(
          'https://example.com/callback?code=code&state=client_state&iss=https%3A%2F%2Fserver.example.com'
        )
      );

      Reflect.deleteProperty(settings, 'enableAuthorizationResponseIssuerIdentifier');
    });

    it('should return a valid authorization response when the provided "response_type" is not in alphabetical order.', async () => {
      Reflect.set(settings, 'enableAuthorizationResponseIssuerIdentifier', true);

      Object.assign(request, {
        cookies: { 'guarani:session': 'session_id', 'guarani:consent': 'consent_id' },
        query: { response_type: 'id_token code' },
      });

      interactionHandlerMock.getEntitiesOrHttpResponse.mockResolvedValueOnce([
        null,
        <Session>{ id: 'session_id' },
        <Consent>{ id: 'consent_id' },
      ]);

      await expect(endpoint.handle(request)).resolves.toStrictEqual(
        new HttpResponse().redirect(
          'https://example.com/callback#code=code&state=client_state&id_token=id_token&iss=https%3A%2F%2Fserver.example.com'
        )
      );

      Reflect.deleteProperty(settings, 'enableAuthorizationResponseIssuerIdentifier');
    });
  });
});
