import { Buffer } from 'buffer';
import { URL } from 'url';

import { AuthorizationContext } from '../../context/authorization/authorization.context';
import { DisplayInterface } from '../../displays/display.interface';
import { Client } from '../../entities/client.entity';
import { AccessDeniedException } from '../../exceptions/access-denied.exception';
import { InvalidClientException } from '../../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { InvalidScopeException } from '../../exceptions/invalid-scope.exception';
import { UnauthorizedClientException } from '../../exceptions/unauthorized-client.exception';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { AuthorizationRequest } from '../../requests/authorization/authorization-request';
import { ResponseModeInterface } from '../../response-modes/response-mode.interface';
import { ResponseTypeInterface } from '../../response-types/response-type.interface';
import { ClientServiceInterface } from '../../services/client.service.interface';
import { Settings } from '../../settings/settings';
import { AuthorizationRequestValidator } from './authorization-request.validator';

jest.mock('../../handlers/scope.handler');

const invalidStates: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidClientIds: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidRedirectUris: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidScopes: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidResponseModes: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidNonces: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidPrompts: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidDisplays: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidMaxAges: any[] = [
  null,
  true,
  1,
  1.2,
  1n,
  Symbol('a'),
  Buffer,
  () => 1,
  {},
  [],
  '',
  'a',
  '0x12',
  '07',
  '-1',
  '-0x12',
  '-07',
];
const invalidLoginHints: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidIdTokenHints: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidUiLocales: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidAcrValues: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];

describe('Authorization Request Validator', () => {
  let validator: AuthorizationRequestValidator<AuthorizationRequest, AuthorizationContext<AuthorizationRequest>>;

  const scopeHandlerMock = jest.mocked(ScopeHandler.prototype, true);

  const settings = <Settings>{ uiLocales: ['en', 'pt-BR'], acrValues: ['urn:guarani:acr:1fa', 'urn:guarani:acr:2fa'] };

  const clientServiceMock = jest.mocked<ClientServiceInterface>({
    findOne: jest.fn(),
  });

  const responseModesMocks = [
    jest.mocked<ResponseModeInterface>({
      name: 'form_post',
      createHttpResponse: jest.fn(),
    }),
    jest.mocked<ResponseModeInterface>({
      name: 'fragment',
      createHttpResponse: jest.fn(),
    }),
    jest.mocked<ResponseModeInterface>({
      name: 'query',
      createHttpResponse: jest.fn(),
    }),
  ];

  const responseTypesMocks = [
    jest.mocked<ResponseTypeInterface>({
      name: 'code',
      defaultResponseMode: 'query',
      handle: jest.fn(),
    }),
    jest.mocked<ResponseTypeInterface>({
      name: 'code id_token',
      defaultResponseMode: 'fragment',
      handle: jest.fn(),
    }),
    jest.mocked<ResponseTypeInterface>({
      name: 'code id_token token',
      defaultResponseMode: 'fragment',
      handle: jest.fn(),
    }),
    jest.mocked<ResponseTypeInterface>({
      name: 'code token',
      defaultResponseMode: 'fragment',
      handle: jest.fn(),
    }),
    jest.mocked<ResponseTypeInterface>({
      name: 'id_token',
      defaultResponseMode: 'fragment',
      handle: jest.fn(),
    }),
    jest.mocked<ResponseTypeInterface>({
      name: 'id_token token',
      defaultResponseMode: 'fragment',
      handle: jest.fn(),
    }),
    jest.mocked<ResponseTypeInterface>({
      name: 'token',
      defaultResponseMode: 'fragment',
      handle: jest.fn(),
    }),
  ];

  const displaysMocks = [
    jest.mocked<DisplayInterface>({ name: 'page', createHttpResponse: jest.fn() }),
    jest.mocked<DisplayInterface>({ name: 'popup', createHttpResponse: jest.fn() }),
    jest.mocked<DisplayInterface>({ name: 'touch', createHttpResponse: jest.fn() }),
    jest.mocked<DisplayInterface>({ name: 'page', createHttpResponse: jest.fn() }),
  ];

  beforeEach(() => {
    validator = Reflect.construct(AuthorizationRequestValidator, [
      scopeHandlerMock,
      settings,
      clientServiceMock,
      responseModesMocks,
      responseTypesMocks,
      displaysMocks,
    ]);
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
        path: '/oauth/authorize',
        query: <AuthorizationRequest>{
          response_type: 'code',
          client_id: 'client_id',
          redirect_uri: 'https://client.example.com/oauth/callback',
          scope: 'foo bar baz',
          state: 'client_state',
          response_mode: 'form_post',
          nonce: 'client_nonce',
          prompt: 'consent',
          display: 'popup',
          max_age: '300',
          login_hint: 'login_hint',
          id_token_hint: 'id_token_hint',
          ui_locales: 'pt-BR en',
          acr_values: 'urn:guarani:acr:2fa urn:guarani:acr:1fa',
        },
      });
    });

    it.each(invalidStates)('should throw when providing an invalid "state" parameter.', async (state) => {
      request.query.state = state;

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "state".' })
      );
    });

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

    it('should throw when the client is not allowed to request the provided "response_type".', async () => {
      const client = <Client>{ id: 'client_id', responseTypes: ['id_token'] };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrow(
        new UnauthorizedClientException({
          description: 'This Client is not allowed to request the response_type "code".',
          state: 'client_state',
        })
      );
    });

    it.each(invalidRedirectUris)(
      'should throw when providing an invalid "redirect_uri" parameter.',
      async (redirectUri) => {
        request.query.redirect_uri = redirectUri;

        const client = <Client>{ id: 'client_id', responseTypes: ['code'] };

        clientServiceMock.findOne.mockResolvedValueOnce(client);

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidRequestException({ description: 'Invalid parameter "redirect_uri".', state: 'client_state' })
        );
      }
    );

    it('should throw when providing an invalid redirect uri.', async () => {
      request.query.redirect_uri = 'client.example.com/oauth/callback';

      const client = <Client>{ id: 'client_id', responseTypes: ['code'] };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "redirect_uri".', state: 'client_state' })
      );
    });

    it('should throw when the provided redirect uri has a fragment component.', async () => {
      request.query.redirect_uri = 'https://client.example.com/oauth/callback#foo=bar';

      const client = <Client>{ id: 'client_id', responseTypes: ['code'] };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({
          description: 'The Redirect URI MUST NOT have a fragment component.',
          state: 'client_state',
        })
      );
    });

    it('should throw when the client is not allowed to use the provided redirect uri.', async () => {
      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.org/oauth/callback'],
        responseTypes: ['code'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrow(
        new AccessDeniedException({ description: 'Invalid Redirect URI.', state: 'client_state' })
      );
    });

    it.each(invalidScopes)('should throw when providing an invalid "scope" parameter.', async (scope) => {
      request.query.scope = scope;

      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "scope".', state: 'client_state' })
      );
    });

    it('should throw when requesting an unsupported scope.', async () => {
      request.query.scope = 'foo bar baz qux unknown';

      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
      };

      const error = new InvalidScopeException({ description: 'Unsupported scope "unknown".', state: 'client_state' });

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.checkRequestedScope.mockImplementationOnce(() => {
        throw error;
      });

      await expect(validator.validate(request)).rejects.toThrow(error);
    });

    it('should throw when the client is not allowed to request the provided scope.', async () => {
      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'qux'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrow(
        new AccessDeniedException({
          description: 'The Client is not allowed to request the scope "baz".',
          state: 'client_state',
        })
      );
    });

    it.each(invalidResponseModes)(
      'should throw when providing an invalid "response_mode" parameter.',
      async (responseMode) => {
        request.query.response_mode = responseMode;

        const client = <Client>{
          id: 'client_id',
          redirectUris: ['https://client.example.com/oauth/callback'],
          responseTypes: ['code'],
          scopes: ['foo', 'bar', 'baz', 'qux'],
        };

        clientServiceMock.findOne.mockResolvedValueOnce(client);
        scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidRequestException({ description: 'Invalid parameter "response_mode".', state: 'client_state' })
        );
      }
    );

    it('should throw when requesting an unsupported response mode.', async () => {
      request.query.response_mode = 'unknown';

      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Unsupported response_mode "unknown".', state: 'client_state' })
      );
    });

    it.each(invalidNonces)('should throw when providing an invalid "nonce" parameter.', async (nonce) => {
      request.query.nonce = nonce;

      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "nonce".', state: 'client_state' })
      );
    });

    it.each(invalidPrompts)('should throw when providing an invalid "prompt" parameter.', async (prompt) => {
      request.query.prompt = prompt;

      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "prompt".', state: 'client_state' })
      );
    });

    it('should throw when requesting an unsupported prompt.', async () => {
      request.query.prompt = 'unknown';

      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Unsupported prompt "unknown".', state: 'client_state' })
      );
    });

    it('should throw when requesting the prompt "none" together with another prompt.', async () => {
      request.query.prompt = 'none login consent';

      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'The prompt "none" must be used by itself.', state: 'client_state' })
      );
    });

    it('should throw when requesting the prompts "create" and "login" together.', async () => {
      request.query.prompt = 'create login';

      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({
          description: 'The prompts "create" and "login" cannot be used together.',
          state: 'client_state',
        })
      );
    });

    it('should throw when requesting the prompts "create" and "select_account" together.', async () => {
      request.query.prompt = 'create select_account';

      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({
          description: 'The prompts "create" and "select_account" cannot be used together.',
          state: 'client_state',
        })
      );
    });

    it('should throw when requesting the prompts "login" and "select_account" together.', async () => {
      request.query.prompt = 'login select_account';

      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({
          description: 'The prompts "login" and "select_account" cannot be used together.',
          state: 'client_state',
        })
      );
    });

    it.each(invalidDisplays)('should throw when providing an invalid "display" parameter.', async (display) => {
      request.query.display = display;

      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "display".', state: 'client_state' })
      );
    });

    it('should throw when requesting an unsupported display.', async () => {
      request.query.display = 'unknown';

      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Unsupported display "unknown".', state: 'client_state' })
      );
    });

    it.each(invalidMaxAges)('should throw when providing an invalid "max_age" parameter.', async (maxAge) => {
      request.query.max_age = maxAge;

      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "max_age".', state: 'client_state' })
      );
    });

    it.each(invalidLoginHints)('should throw when providing an invalid "login_hint" parameter.', async (loginHint) => {
      request.query.login_hint = loginHint;

      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "login_hint".', state: 'client_state' })
      );
    });

    it.each(invalidIdTokenHints)(
      'should throw when providing an invalid "id_token_hint" parameter.',
      async (idTokenHint) => {
        request.query.id_token_hint = idTokenHint;

        const client = <Client>{
          id: 'client_id',
          redirectUris: ['https://client.example.com/oauth/callback'],
          responseTypes: ['code'],
          scopes: ['foo', 'bar', 'baz', 'qux'],
        };

        clientServiceMock.findOne.mockResolvedValueOnce(client);
        scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidRequestException({ description: 'Invalid parameter "id_token_hint".', state: 'client_state' })
        );
      }
    );

    it.each(invalidUiLocales)('should throw when providing an invalid "ui_locales" parameter.', async (uiLocales) => {
      request.query.ui_locales = uiLocales;

      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "ui_locales".', state: 'client_state' })
      );
    });

    it('should throw when requesting an unsupported ui locale.', async () => {
      request.query.ui_locales = 'unknown';

      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Unsupported UI Locale "unknown".', state: 'client_state' })
      );
    });

    it('should throw when requesting a ui locale with no ui locales registered at the authorization server.', async () => {
      const settings = <Settings>{ uiLocales: <string[]>[], acrValues: <string[]>[] };

      validator = Reflect.construct(AuthorizationRequestValidator, [
        scopeHandlerMock,
        settings,
        clientServiceMock,
        responseModesMocks,
        responseTypesMocks,
        displaysMocks,
      ]);

      request.query.ui_locales = 'pt-BR';

      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Unsupported UI Locale "pt-BR".', state: 'client_state' })
      );
    });

    it.each(invalidAcrValues)('should throw when providing an invalid "acr_values" parameter.', async (acrValues) => {
      request.query.acr_values = acrValues;

      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "acr_values".', state: 'client_state' })
      );
    });

    it('should throw when requesting an unsupported authentication context class reference.', async () => {
      request.query.acr_values = 'unknown';

      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({
          description: 'Unsupported Authentication Context Class Reference "unknown".',
          state: 'client_state',
        })
      );
    });

    it('should throw when requesting an authentication context class reference with no authentication context class references registered at the authorization server.', async () => {
      const settings = <Settings>{ uiLocales: <string[]>['en', 'pt-BR'], acrValues: <string[]>[] };

      validator = Reflect.construct(AuthorizationRequestValidator, [
        scopeHandlerMock,
        settings,
        clientServiceMock,
        responseModesMocks,
        responseTypesMocks,
        displaysMocks,
      ]);

      request.query.acr_values = 'urn:guarani:acr:2fa';

      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({
          description: 'Unsupported Authentication Context Class Reference "urn:guarani:acr:2fa".',
          state: 'client_state',
        })
      );
    });

    it('should return an authorization context.', async () => {
      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      const scopes: string[] = ['foo', 'bar', 'baz'];

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(scopes);

      await expect(validator.validate(request)).resolves.toStrictEqual<AuthorizationContext<AuthorizationRequest>>({
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        responseType: responseTypesMocks[0]!,
        client,
        redirectUri: new URL('https://client.example.com/oauth/callback'),
        scopes,
        state: 'client_state',
        responseMode: responseModesMocks[0]!,
        nonce: 'client_nonce',
        prompts: ['consent'],
        display: displaysMocks[1]!,
        maxAge: 300,
        loginHint: 'login_hint',
        idTokenHint: 'id_token_hint',
        uiLocales: ['pt-BR', 'en'],
        acrValues: ['urn:guarani:acr:2fa', 'urn:guarani:acr:1fa'],
      });
    });
  });
});
