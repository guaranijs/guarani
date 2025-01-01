import { stringify as stringifyQs } from 'querystring';
import { URL } from 'url';

import { JSON, removeNullishValues } from '@guarani/primitives';

import { AuthorizationContext } from '../../context/authorization/authorization-context';
import { DisplayInterface } from '../../displays/display.interface';
import { Display } from '../../displays/display.type';
import { Client } from '../../entities/client.entity';
import { AccessDeniedException } from '../../exceptions/access-denied.exception';
import { InvalidClientException } from '../../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { UnauthorizedClientException } from '../../exceptions/unauthorized-client.exception';
import { ClaimsHandler } from '../../handlers/claims.handler';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { Logger } from '../../logger/logger';
import { AuthorizationRequest } from '../../requests/authorization/authorization-request';
import { ResponseModeInterface } from '../../response-modes/response-mode.interface';
import { ResponseMode } from '../../response-modes/response-mode.type';
import { ResponseTypeInterface } from '../../response-types/response-type.interface';
import { ClientServiceInterface } from '../../services/client.service.interface';
import { Settings } from '../../settings/settings';
import { AuthorizationRequestClaimsParameter } from '../../types/authorization-request-claims-parameter.type';
import { AuthorizationRequestValidator } from './authorization-request.validator';

jest.mock('../../handlers/claims.handler');
jest.mock('../../handlers/scope.handler');
jest.mock('../../logger/logger');

const invalidMaxAges: any[] = ['', 'a', '0x12', '07', '-1', '-0x12', '-07'];

describe('Authorization Request Validator', () => {
  let validator: AuthorizationRequestValidator;

  const loggerMock = jest.mocked(Logger.prototype);

  const scopeHandlerMock = jest.mocked(ScopeHandler.prototype);

  const settings = <Settings>{
    uiLocales: ['en', 'pt-BR'],
    acrValues: ['urn:guarani:acr:1fa', 'urn:guarani:acr:2fa'],
    enableClaimsAuthorizationRequestParameter: true,
  };

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
      name: 'jwt',
      createHttpResponse: jest.fn(),
    }),
    jest.mocked<ResponseModeInterface>({
      name: 'query',
      createHttpResponse: jest.fn(),
    }),
    jest.mocked<ResponseModeInterface>({
      name: 'query.jwt',
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

  const claimsHandlerMock = jest.mocked(ClaimsHandler.prototype);

  beforeEach(() => {
    validator = Reflect.construct(AuthorizationRequestValidator, [
      loggerMock,
      scopeHandlerMock,
      settings,
      clientServiceMock,
      responseModesMocks,
      responseTypesMocks,
      displaysMocks,
      claimsHandlerMock,
    ]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    // TODO: Find a way to make this work
    it.skip('should throw when allowing the "claims" authorization request parameter without a claims handler.', () => {
      const settings = <Settings>{
        uiLocales: ['en', 'pt-BR'],
        acrValues: ['urn:guarani:acr:1fa', 'urn:guarani:acr:2fa'],
        enableClaimsAuthorizationRequestParameter: false,
      };

      expect(() =>
        Reflect.construct(AuthorizationRequestValidator, [
          loggerMock,
          scopeHandlerMock,
          settings,
          clientServiceMock,
          responseModesMocks,
          responseTypesMocks,
          displaysMocks,
        ]),
      ).toThrowWithMessage(
        TypeError,
        'Cannot use the "claims" Authorization Request parameter without a Claims Handler.',
      );
    });
  });

  describe('validate()', () => {
    let parameters: AuthorizationRequest;
    let claimsParameter: AuthorizationRequestClaimsParameter;

    const requestFactory = (data: Partial<AuthorizationRequest> = {}): HttpRequest => {
      removeNullishValues<AuthorizationRequest>(Object.assign(parameters, data));

      return new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        url: new URL(`https://server.example.com/oauth/authorize?${stringifyQs(parameters)}`),
      });
    };

    beforeEach(() => {
      claimsParameter = {
        userinfo: {
          null_option: null,
          essential_option: { essential: true },
          value_option: { value: 'value' },
          values_option: { values: ['value_0', 'value_1'] },
          essential_value_option: { essential: true, value: 'essential_value' },
          essential_values_option: { essential: true, values: ['essential_value_0', 'essential_value_1'] },
        },
      };

      parameters = {
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
        claims: JSON.stringify(claimsParameter),
      };
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

    it('should throw when the client is not allowed to request the provided "response_type".', async () => {
      const request = requestFactory();

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        responseTypes: ['id_token'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        UnauthorizedClientException,
        'This Client is not allowed to request the response_type "code".',
      );
    });

    it('should throw when not providing the parameter "redirect_uri".', async () => {
      const request = requestFactory({ redirect_uri: undefined });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        responseTypes: ['code'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "redirect_uri".',
      );
    });

    it('should throw when providing an invalid redirect uri.', async () => {
      const request = requestFactory({ redirect_uri: 'client.example.com/oauth/callback' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        responseTypes: ['code'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "redirect_uri".',
      );
    });

    it('should throw when the provided redirect uri has a fragment component.', async () => {
      const request = requestFactory({ redirect_uri: 'https://client.example.com/oauth/callback#foo=bar' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        responseTypes: ['code'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'The Redirect URI MUST NOT have a fragment component.',
      );
    });

    it('should throw when the client is not allowed to use the provided redirect uri.', async () => {
      const request = requestFactory();

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.org/oauth/callback'],
        responseTypes: ['code'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Invalid Redirect URI.',
      );
    });

    it('should throw when not providing the parameter "scope".', async () => {
      const request = requestFactory({ scope: undefined });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "scope".',
      );
    });

    it('should throw when requesting an unsupported response mode.', async () => {
      const request = requestFactory({ response_mode: 'unknown' as ResponseMode });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Unsupported response_mode "unknown".',
      );
    });

    it('should throw when the client requests the "jwt" response mode and the default response mode for the response type is not registered.', async () => {
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
          name: 'jwt',
          createHttpResponse: jest.fn(),
        }),
        jest.mocked<ResponseModeInterface>({
          name: 'query',
          createHttpResponse: jest.fn(),
        }),
      ];

      validator = Reflect.construct(AuthorizationRequestValidator, [
        loggerMock,
        scopeHandlerMock,
        settings,
        clientServiceMock,
        responseModesMocks,
        responseTypesMocks,
        displaysMocks,
        claimsHandlerMock,
      ]);

      const request = requestFactory({ response_mode: 'jwt' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Unsupported response_mode "query.jwt".',
      );
    });

    it('should throw when the client requests a "jwt" response mode without an authorization response signing algorithm.', async () => {
      const request = requestFactory({ response_mode: 'jwt' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
        authorizationSignedResponseAlgorithm: null,
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'This Client is not allowed to request the Response Mode "query.jwt".',
      );
    });

    it('should throw when requesting an unsupported prompt.', async () => {
      const request = requestFactory({ prompt: 'unknown' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Unsupported prompt "unknown".',
      );
    });

    it('should throw when requesting the prompt "none" together with another prompt.', async () => {
      const request = requestFactory({ prompt: 'none login consent' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'The prompt "none" must be used by itself.',
      );
    });

    it('should throw when requesting the prompts "create" and "login" together.', async () => {
      const request = requestFactory({ prompt: 'create login' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'The prompts "create" and "login" cannot be used together.',
      );
    });

    it('should throw when requesting the prompts "create" and "select_account" together.', async () => {
      const request = requestFactory({ prompt: 'create select_account' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'The prompts "create" and "select_account" cannot be used together.',
      );
    });

    it('should throw when requesting the prompts "login" and "select_account" together.', async () => {
      const request = requestFactory({ prompt: 'login select_account' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'The prompts "login" and "select_account" cannot be used together.',
      );
    });

    it('should throw when requesting an unsupported display.', async () => {
      const request = requestFactory({ display: 'unknown' as Display });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Unsupported display "unknown".',
      );
    });

    it.each(invalidMaxAges)('should throw when providing an invalid "max_age" parameter.', async (maxAge) => {
      const request = requestFactory({ max_age: maxAge });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "max_age".',
      );
    });

    it('should throw when requesting an unsupported ui locale.', async () => {
      const request = requestFactory({ ui_locales: 'unknown' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Unsupported UI Locale "unknown".',
      );
    });

    it('should throw when requesting a ui locale with no ui locales registered at the authorization server.', async () => {
      const settings = <Settings>{ uiLocales: <string[]>[], acrValues: <string[]>[] };

      validator = Reflect.construct(AuthorizationRequestValidator, [
        loggerMock,
        scopeHandlerMock,
        settings,
        clientServiceMock,
        responseModesMocks,
        responseTypesMocks,
        displaysMocks,
      ]);

      const request = requestFactory({ ui_locales: 'pt-BR' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Unsupported UI Locale "pt-BR".',
      );
    });

    it('should throw when requesting an unsupported authentication context class reference.', async () => {
      const request = requestFactory({ acr_values: 'unknown' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Unsupported Authentication Context Class Reference "unknown".',
      );
    });

    it('should throw when requesting an authentication context class reference with no authentication context class references registered at the authorization server.', async () => {
      const settings = <Settings>{ uiLocales: <string[]>['en', 'pt-BR'], acrValues: <string[]>[] };

      validator = Reflect.construct(AuthorizationRequestValidator, [
        loggerMock,
        scopeHandlerMock,
        settings,
        clientServiceMock,
        responseModesMocks,
        responseTypesMocks,
        displaysMocks,
      ]);

      const request = requestFactory({ acr_values: 'urn:guarani:acr:2fa' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Unsupported Authentication Context Class Reference "urn:guarani:acr:2fa".',
      );
    });

    it('should return an authorization context without the "offline_access" scope if not requested together with the "consent" prompt.', async () => {
      const request = requestFactory({ prompt: undefined });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux', 'offline_access'],
      });

      const scopes: string[] = ['foo', 'bar', 'baz', 'offline_access'];

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(scopes);
      claimsHandlerMock.checkRequestedClaims.mockReturnValueOnce(claimsParameter);

      await expect(validator.validate(request)).resolves.toStrictEqual<AuthorizationContext>({
        parameters,
        cookies: request.cookies,
        responseType: responseTypesMocks[0]!,
        client,
        redirectUri: new URL('https://client.example.com/oauth/callback'),
        scopes: ['foo', 'bar', 'baz'],
        state: 'client_state',
        responseMode: responseModesMocks[0]!,
        nonce: 'client_nonce',
        prompts: [],
        display: displaysMocks[1]!,
        maxAge: 300,
        loginHint: 'login_hint',
        idTokenHint: 'id_token_hint',
        uiLocales: ['pt-BR', 'en'],
        acrValues: ['urn:guarani:acr:2fa', 'urn:guarani:acr:1fa'],
        claims: claimsParameter,
      });
    });

    it('should return an authorization context without the "offline_access" scope if not requested together with a "code" response type.', async () => {
      const request = requestFactory({ response_type: 'token' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['token'],
        scopes: ['foo', 'bar', 'baz', 'qux', 'offline_access'],
      });

      const scopes: string[] = ['foo', 'bar', 'baz', 'offline_access'];

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(scopes);
      claimsHandlerMock.checkRequestedClaims.mockReturnValueOnce(claimsParameter);

      await expect(validator.validate(request)).resolves.toStrictEqual<AuthorizationContext>({
        parameters,
        cookies: request.cookies,
        responseType: responseTypesMocks[6]!,
        client,
        redirectUri: new URL('https://client.example.com/oauth/callback'),
        scopes: ['foo', 'bar', 'baz'],
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
        claims: claimsParameter,
      });
    });

    it('should return an authorization context.', async () => {
      const request = requestFactory();

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      });

      const scopes: string[] = ['foo', 'bar', 'baz'];

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(scopes);
      claimsHandlerMock.checkRequestedClaims.mockReturnValueOnce(claimsParameter);

      await expect(validator.validate(request)).resolves.toStrictEqual<AuthorizationContext>({
        parameters,
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
        claims: claimsParameter,
      });
    });
  });
});
