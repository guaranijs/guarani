import { Buffer } from 'buffer';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';

import { EndSessionContext } from '../context/end-session-context';
import { Client } from '../entities/client.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { HttpRequest } from '../http/http.request';
import { EndSessionRequest } from '../requests/end-session-request';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { EndSessionRequestValidator } from './end-session-request.validator';

const invalidStates: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidIdTokenHints: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidClientIds: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidPostLogoutRedirectUris: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidLogoutHints: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidUiLocales: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];

describe('End Session Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: EndSessionRequestValidator;

  const settings = <Settings>{ uiLocales: ['en', 'pt-BR'] };

  const clientServiceMock = jest.mocked<ClientServiceInterface>({
    findOne: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<ClientServiceInterface>(CLIENT_SERVICE).toValue(clientServiceMock);
    container.bind(EndSessionRequestValidator).toSelf().asSingleton();

    validator = container.resolve(EndSessionRequestValidator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('validate()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        path: '/oauth/end_session',
        query: <EndSessionRequest>{
          id_token_hint: 'id_token_hint',
          client_id: 'client_id',
          post_logout_redirect_uri: 'https://client.example.com/oauth/logout-callback',
          state: 'client_state',
          logout_hint: 'logout_hint',
          ui_locales: 'pt-BR en',
        },
      });
    });

    it.each(invalidStates)('should throw when providing an invalid "state" parameter.', async (state) => {
      request.query.state = state;

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "state".'
      );
    });

    it.each(invalidIdTokenHints)(
      'should throw when providing an invalid "id_token_hint" parameter.',
      async (idTokenHint) => {
        request.query.id_token_hint = idTokenHint;

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidRequestException,
          'Invalid parameter "id_token_hint".'
        );
      }
    );

    it.each(invalidClientIds)('should throw when providing an invalid "client_id" parameter.', async (clientId) => {
      request.query.client_id = clientId;

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "client_id".'
      );
    });

    it('should throw when the client is not registered.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(null);
      await expect(validator.validate(request)).rejects.toThrowWithMessage(InvalidClientException, 'Invalid Client.');
    });

    it.each(invalidPostLogoutRedirectUris)(
      'should throw when providing an invalid "post_logout_redirect_uri" parameter.',
      async (redirectUri) => {
        request.query.post_logout_redirect_uri = redirectUri;

        const client = <Client>{ id: 'client_id' };

        clientServiceMock.findOne.mockResolvedValueOnce(client);

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidRequestException,
          'Invalid parameter "post_logout_redirect_uri".'
        );
      }
    );

    it('should throw when providing an invalid redirect uri.', async () => {
      request.query.post_logout_redirect_uri = 'client.example.com/oauth/logout-callback';

      const client = <Client>{ id: 'client_id' };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "post_logout_redirect_uri".'
      );
    });

    it('should throw when the provided redirect uri has a fragment component.', async () => {
      request.query.post_logout_redirect_uri = 'https://client.example.com/oauth/logout-callback#foo=bar';

      const client = <Client>{ id: 'client_id' };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'The Post Logout Redirect URI MUST NOT have a fragment component.'
      );
    });

    it('should throw when the client is not allowed to use the provided redirect uri.', async () => {
      const client = <Client>{
        id: 'client_id',
        postLogoutRedirectUris: ['https://client.example.org/oauth/logout-callback'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Invalid Post Logout Redirect URI.'
      );
    });

    it.each(invalidLogoutHints)(
      'should throw when providing an invalid "logout_hint" parameter.',
      async (logoutHint) => {
        request.query.logout_hint = logoutHint;

        const client = <Client>{
          id: 'client_id',
          postLogoutRedirectUris: ['https://client.example.com/oauth/logout-callback'],
        };

        clientServiceMock.findOne.mockResolvedValueOnce(client);

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidRequestException,
          'Invalid parameter "logout_hint".'
        );
      }
    );

    it.each(invalidUiLocales)('should throw when providing an invalid "ui_locales" parameter.', async (uiLocales) => {
      request.query.ui_locales = uiLocales;

      const client = <Client>{
        id: 'client_id',
        postLogoutRedirectUris: ['https://client.example.com/oauth/logout-callback'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "ui_locales".'
      );
    });

    it('should throw when requesting an unsupported ui locale.', async () => {
      request.query.ui_locales = 'unknown';

      const client = <Client>{
        id: 'client_id',
        postLogoutRedirectUris: ['https://client.example.com/oauth/logout-callback'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Unsupported UI Locale "unknown".'
      );
    });

    it('should throw when requesting a ui locale with no ui locales registered at the authorization server.', async () => {
      const settings = <Settings>{ uiLocales: <string[]>[] };

      container.delete<Settings>(SETTINGS);
      container.delete(EndSessionRequestValidator);

      container.bind<Settings>(SETTINGS).toValue(settings);
      container.bind(EndSessionRequestValidator).toSelf().asSingleton();

      validator = container.resolve(EndSessionRequestValidator);

      request.query.ui_locales = 'pt-BR';

      const client = <Client>{
        id: 'client_id',
        postLogoutRedirectUris: ['https://client.example.com/oauth/logout-callback'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Unsupported UI Locale "pt-BR".'
      );
    });

    it('should return an end session context.', async () => {
      const client = <Client>{
        id: 'client_id',
        postLogoutRedirectUris: ['https://client.example.com/oauth/logout-callback'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).resolves.toStrictEqual<EndSessionContext>({
        parameters: request.query as EndSessionRequest,
        cookies: request.cookies,
        idTokenHint: 'id_token_hint',
        client,
        postLogoutRedirectUri: new URL('https://client.example.com/oauth/logout-callback'),
        state: 'client_state',
        logoutHint: 'logout_hint',
        uiLocales: ['pt-BR', 'en'],
      });
    });
  });
});
