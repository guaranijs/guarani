import { DependencyInjectionContainer } from '@guarani/di';
import { Buffer } from 'buffer';
import { URL } from 'url';
import { LogoutContext } from '../context/logout.context';
import { Client } from '../entities/client.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { HttpRequest } from '../http/http.request';
import { LogoutRequest } from '../requests/logout-request';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { LogoutRequestValidator } from './logout-request.validator';

const invalidStates: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidIdTokenHints: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidClientIds: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidPostLogoutRedirectUris: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidLogoutHints: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidUiLocales: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];

describe('Logout Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: LogoutRequestValidator;

  const settings = <Settings>{ uiLocales: ['en', 'pt-BR'] };

  const clientServiceMock = jest.mocked<ClientServiceInterface>({
    findOne: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<ClientServiceInterface>(CLIENT_SERVICE).toValue(clientServiceMock);
    container.bind(LogoutRequestValidator).toSelf().asSingleton();

    validator = container.resolve(LogoutRequestValidator);
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
        path: '/oauth/logout',
        query: <LogoutRequest>{
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

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "state".' })
      );
    });

    it.each(invalidIdTokenHints)(
      'should throw when providing an invalid "id_token_hint" parameter.',
      async (idTokenHint) => {
        request.query.id_token_hint = idTokenHint;

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidRequestException({ description: 'Invalid parameter "id_token_hint".', state: 'client_state' })
        );
      }
    );

    it.each(invalidClientIds)('should throw when providing an invalid "client_id" parameter.', async (clientId) => {
      request.query.client_id = clientId;

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "client_id".', state: 'client_state' })
      );
    });

    it('should throw when the client is not registered.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidClientException({ description: 'Invalid Client.', state: 'client_state' })
      );
    });

    it.each(invalidPostLogoutRedirectUris)(
      'should throw when providing an invalid "post_logout_redirect_uri" parameter.',
      async (redirectUri) => {
        request.query.post_logout_redirect_uri = redirectUri;

        const client = <Client>{ id: 'client_id' };

        clientServiceMock.findOne.mockResolvedValueOnce(client);

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidRequestException({
            description: 'Invalid parameter "post_logout_redirect_uri".',
            state: 'client_state',
          })
        );
      }
    );

    it('should throw when providing an invalid redirect uri.', async () => {
      request.query.post_logout_redirect_uri = 'client.example.com/oauth/logout-callback';

      const client = <Client>{ id: 'client_id' };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({
          description: 'Invalid parameter "post_logout_redirect_uri".',
          state: 'client_state',
        })
      );
    });

    it('should throw when the provided redirect uri has a fragment component.', async () => {
      request.query.post_logout_redirect_uri = 'https://client.example.com/oauth/logout-callback#foo=bar';

      const client = <Client>{ id: 'client_id' };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({
          description: 'The Post Logout Redirect URI MUST NOT have a fragment component.',
          state: 'client_state',
        })
      );
    });

    it('should throw when the client is not allowed to use the provided redirect uri.', async () => {
      const client = <Client>{
        id: 'client_id',
        postLogoutRedirectUris: ['https://client.example.org/oauth/logout-callback'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrow(
        new AccessDeniedException({ description: 'Invalid Post Logout Redirect URI.', state: 'client_state' })
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

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidRequestException({ description: 'Invalid parameter "logout_hint".', state: 'client_state' })
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

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "ui_locales".', state: 'client_state' })
      );
    });

    it('should throw when requesting an unsupported ui locale.', async () => {
      request.query.ui_locales = 'unknown';

      const client = <Client>{
        id: 'client_id',
        postLogoutRedirectUris: ['https://client.example.com/oauth/logout-callback'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Unsupported UI Locale "unknown".', state: 'client_state' })
      );
    });

    it('should throw when requesting a ui locale with no ui locales registered at the authorization server.', async () => {
      const settings = <Settings>{ uiLocales: <string[]>[] };

      container.delete<Settings>(SETTINGS);
      container.delete(LogoutRequestValidator);

      container.bind<Settings>(SETTINGS).toValue(settings);
      container.bind(LogoutRequestValidator).toSelf().asSingleton();

      validator = container.resolve(LogoutRequestValidator);

      request.query.ui_locales = 'pt-BR';

      const client = <Client>{
        id: 'client_id',
        postLogoutRedirectUris: ['https://client.example.com/oauth/logout-callback'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Unsupported UI Locale "pt-BR".', state: 'client_state' })
      );
    });

    it('should return a logout context.', async () => {
      const client = <Client>{
        id: 'client_id',
        postLogoutRedirectUris: ['https://client.example.com/oauth/logout-callback'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).resolves.toStrictEqual<LogoutContext>({
        parameters: <LogoutRequest>request.query,
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
