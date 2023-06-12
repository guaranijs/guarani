import { Buffer } from 'buffer';
import { URL, URLSearchParams } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';
import { OneOrMany } from '@guarani/types';

import { DisplayInterface } from '../../displays/display.interface';
import { DISPLAY } from '../../displays/display.token';
import { Client } from '../../entities/client.entity';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { PkceInterface } from '../../pkces/pkce.interface';
import { PKCE } from '../../pkces/pkce.token';
import { CodeAuthorizationRequest } from '../../requests/authorization/code.authorization-request';
import { ResponseModeInterface } from '../../response-modes/response-mode.interface';
import { RESPONSE_MODE } from '../../response-modes/response-mode.token';
import { ResponseTypeInterface } from '../../response-types/response-type.interface';
import { RESPONSE_TYPE } from '../../response-types/response-type.token';
import { ResponseType } from '../../response-types/response-type.type';
import { ClientServiceInterface } from '../../services/client.service.interface';
import { CLIENT_SERVICE } from '../../services/client.service.token';
import { Settings } from '../../settings/settings';
import { SETTINGS } from '../../settings/settings.token';
import { CodeTokenAuthorizationRequestValidator } from './code-token.authorization-request.validator';

jest.mock('../../handlers/scope.handler');

describe('Code & Token Authorization Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: CodeTokenAuthorizationRequestValidator;

  const scopeHandlerMock = jest.mocked(ScopeHandler.prototype);

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

  const pkcesMocks = [
    jest.mocked<PkceInterface>({ name: 'S256', verify: jest.fn() }),
    jest.mocked<PkceInterface>({ name: 'plain', verify: jest.fn() }),
  ];

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(ScopeHandler).toValue(scopeHandlerMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<ClientServiceInterface>(CLIENT_SERVICE).toValue(clientServiceMock);

    responseModesMocks.forEach((responseModeMock) => {
      container.bind<ResponseModeInterface>(RESPONSE_MODE).toValue(responseModeMock);
    });

    responseTypesMocks.forEach((responseTypeMock) => {
      container.bind<ResponseTypeInterface>(RESPONSE_TYPE).toValue(responseTypeMock);
    });

    displaysMocks.forEach((displayMock) => {
      container.bind<DisplayInterface>(DISPLAY).toValue(displayMock);
    });

    pkcesMocks.forEach((pkceMock) => {
      container.bind<PkceInterface>(PKCE).toValue(pkceMock);
    });

    container.bind(CodeTokenAuthorizationRequestValidator).toSelf().asSingleton();

    validator = container.resolve(CodeTokenAuthorizationRequestValidator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "code token" as its value.', () => {
      expect(validator.name).toEqual<ResponseType>('code token');
    });
  });

  describe('validate()', () => {
    let parameters: CodeAuthorizationRequest;

    const requestFactory = (data: Partial<CodeAuthorizationRequest> = {}): HttpRequest => {
      parameters = removeNullishValues<CodeAuthorizationRequest>(Object.assign(parameters, data));

      const query = new URLSearchParams(parameters as Record<string, OneOrMany<string>>);

      return new HttpRequest({
        body: Buffer.alloc(0),
        cookies: {},
        headers: {},
        method: 'GET',
        url: new URL(`https://server.example.com/oauth/authorize?${query.toString()}`),
      });
    };

    beforeEach(() => {
      parameters = {
        response_type: 'code token',
        client_id: 'client_id',
        redirect_uri: 'https://client.example.com/oauth/callback',
        code_challenge: 'qoJXAtQ-gjzfDmoMrHt1a2AFVe1Tn3-HX0VC2_UtezA',
        code_challenge_method: 'S256',
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
      };
    });

    it('should throw when requesting the response mode "query".', async () => {
      const request = requestFactory({ response_mode: 'query' });

      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code token'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      const scopes: string[] = ['foo', 'bar', 'baz'];

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(scopes);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid response_mode "query" for response_type "code token".'
      );
    });
  });
});
