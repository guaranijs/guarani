import { stringify as stringifyQs } from 'querystring';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';

import { EndSessionContext } from '../context/end-session-context';
import { Client } from '../entities/client.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { HttpRequest } from '../http/http.request';
import { HttpMethod } from '../http/http-method.type';
import { Logger } from '../logger/logger';
import { EndSessionRequest } from '../requests/end-session-request';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { EndSessionRequestValidator } from './end-session-request.validator';

jest.mock('../logger/logger');

const invalidHttpMethods: HttpMethod[] = ['DELETE', 'PUT'];

describe('End Session Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: EndSessionRequestValidator;

  const loggerMock = jest.mocked(Logger.prototype);

  const settings = <Settings>{ uiLocales: ['en', 'pt-BR'] };

  const clientServiceMock = jest.mocked<ClientServiceInterface>({
    findOne: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<ClientServiceInterface>(CLIENT_SERVICE).toValue(clientServiceMock);
    container.bind(EndSessionRequestValidator).toSelf().asSingleton();

    validator = container.resolve(EndSessionRequestValidator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('validate()', () => {
    let parameters: EndSessionRequest;

    const requestFactory = (data: Partial<EndSessionRequest> = {}): HttpRequest => {
      removeNullishValues<EndSessionRequest>(Object.assign(parameters, data));

      return new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        url: new URL(`https://server.example.com/oauth/end_session?${stringifyQs(parameters)}`),
      });
    };

    beforeEach(() => {
      parameters = {
        id_token_hint: 'id_token_hint',
        client_id: 'client_id',
        post_logout_redirect_uri: 'https://client.example.com/oauth/logout_callback',
        state: 'client_state',
        logout_hint: 'logout_hint',
        ui_locales: 'pt-BR en',
      };
    });

    it.each(invalidHttpMethods)('should throw when not using "get" or "post" http methods.', async (method) => {
      const request = new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method,
        url: new URL('https://server.example.com/oauth/end_session'),
      });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        TypeError,
        `Unsupported Http Method "${method}".`,
      );
    });

    it('should throw when not providing the parameter "id_token_hint".', async () => {
      const request = requestFactory({ id_token_hint: undefined });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "id_token_hint".',
      );
    });

    it('should throw when not providing the parameter "client_id".', async () => {
      const request = requestFactory({ client_id: undefined });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "client_id".',
      );
    });

    it('should throw when the client is not registered.', async () => {
      const request = requestFactory();
      clientServiceMock.findOne.mockResolvedValueOnce(null);
      await expect(validator.validate(request)).rejects.toThrowWithMessage(InvalidClientException, 'Invalid Client.');
    });

    it('should throw when providing an invalid redirect uri.', async () => {
      const request = requestFactory({ post_logout_redirect_uri: 'client.example.com/oauth/logout_callback' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "post_logout_redirect_uri".',
      );
    });

    it('should throw when the provided redirect uri has a fragment component.', async () => {
      const request = requestFactory({
        post_logout_redirect_uri: 'https://client.example.com/oauth/logout_callback#foo=bar',
      });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'The Post Logout Redirect URI MUST NOT have a fragment component.',
      );
    });

    it('should throw when the client has no registered post logout redirect uris.', async () => {
      const request = requestFactory();

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        postLogoutRedirectUris: null,
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Invalid Post Logout Redirect URI.',
      );
    });

    it('should throw when the client is not allowed to use the provided redirect uri.', async () => {
      const request = requestFactory();

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        postLogoutRedirectUris: ['https://client.example.org/oauth/logout_callback'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Invalid Post Logout Redirect URI.',
      );
    });

    it('should throw when requesting an unsupported ui locale.', async () => {
      const request = requestFactory({ ui_locales: 'unknown' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        postLogoutRedirectUris: ['https://client.example.com/oauth/logout_callback'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Unsupported UI Locale "unknown".',
      );
    });

    it('should throw when requesting a ui locale with no ui locales registered at the authorization server.', async () => {
      const settings = <Settings>{ uiLocales: <string[]>[] };

      container.delete<Settings>(SETTINGS);
      container.delete(EndSessionRequestValidator);

      container.bind<Settings>(SETTINGS).toValue(settings);
      container.bind(EndSessionRequestValidator).toSelf().asSingleton();

      validator = container.resolve(EndSessionRequestValidator);

      const request = requestFactory({ ui_locales: 'pt-BR' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        postLogoutRedirectUris: ['https://client.example.com/oauth/logout_callback'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Unsupported UI Locale "pt-BR".',
      );
    });

    it('should return an end session context.', async () => {
      const request = requestFactory();

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        postLogoutRedirectUris: ['https://client.example.com/oauth/logout_callback'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).resolves.toStrictEqual<EndSessionContext>({
        parameters,
        cookies: request.cookies,
        idTokenHint: 'id_token_hint',
        client,
        postLogoutRedirectUri: new URL('https://client.example.com/oauth/logout_callback'),
        state: 'client_state',
        logoutHint: 'logout_hint',
        uiLocales: ['pt-BR', 'en'],
      });
    });
  });
});
