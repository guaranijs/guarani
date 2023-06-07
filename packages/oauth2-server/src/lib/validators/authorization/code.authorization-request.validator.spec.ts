import { DependencyInjectionContainer } from '@guarani/di';

import { Buffer } from 'buffer';
import { URL } from 'url';

import { CodeAuthorizationContext } from '../../context/authorization/code.authorization-context';
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
import { CodeAuthorizationRequestValidator } from './code.authorization-request.validator';

jest.mock('../../handlers/scope.handler');

const invalidCodeChallenges: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidCodeChallengeMethods: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];

describe('Code Authorization Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: CodeAuthorizationRequestValidator;

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

    container.bind(CodeAuthorizationRequestValidator).toSelf().asSingleton();

    validator = container.resolve(CodeAuthorizationRequestValidator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "code" as its value.', () => {
      expect(validator.name).toEqual<ResponseType>('code');
    });
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
        query: <CodeAuthorizationRequest>{
          response_type: 'code',
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
        },
      });
    });

    it.each(invalidCodeChallenges)(
      'should throw when providing an invalid "code_challenge" parameter.',
      async (codeChallenge) => {
        request.query.code_challenge = codeChallenge;

        const client = <Client>{
          id: 'client_id',
          redirectUris: ['https://client.example.com/oauth/callback'],
          responseTypes: ['code'],
          scopes: ['foo', 'bar', 'baz', 'qux'],
        };

        const scopes: string[] = ['foo', 'bar', 'baz'];

        clientServiceMock.findOne.mockResolvedValueOnce(client);
        scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(scopes);

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidRequestException,
          'Invalid parameter "code_challenge".'
        );
      }
    );

    it.each(invalidCodeChallengeMethods)(
      'should throw when providing an invalid "code_challenge_method" parameter.',
      async (codeChallengeMethod) => {
        request.query.code_challenge_method = codeChallengeMethod;

        const client = <Client>{
          id: 'client_id',
          redirectUris: ['https://client.example.com/oauth/callback'],
          responseTypes: ['code'],
          scopes: ['foo', 'bar', 'baz', 'qux'],
        };

        const scopes: string[] = ['foo', 'bar', 'baz'];

        clientServiceMock.findOne.mockResolvedValueOnce(client);
        scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(scopes);

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidRequestException,
          'Invalid parameter "code_challenge_method".'
        );
      }
    );

    it('should throw when requesting an unsupported code challenge method.', async () => {
      request.query.code_challenge_method = 'unknown';

      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      const scopes: string[] = ['foo', 'bar', 'baz'];

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(scopes);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Unsupported code_challenge_method "unknown".'
      );
    });

    it('should return a code authorization context.', async () => {
      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      const scopes: string[] = ['foo', 'bar', 'baz'];

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(scopes);

      await expect(validator.validate(request)).resolves.toStrictEqual<CodeAuthorizationContext>({
        parameters: request.query as CodeAuthorizationRequest,
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
        codeChallenge: 'qoJXAtQ-gjzfDmoMrHt1a2AFVe1Tn3-HX0VC2_UtezA',
        codeChallengeMethod: pkcesMocks[0]!,
      });
    });
  });
});
