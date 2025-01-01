import { stringify as stringifyQs } from 'querystring';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { JSON, removeNullishValues } from '@guarani/primitives';

import { DisplayInterface } from '../../displays/display.interface';
import { DISPLAY } from '../../displays/display.token';
import { Client } from '../../entities/client.entity';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { ClaimsHandler } from '../../handlers/claims.handler';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { Logger } from '../../logger/logger';
import { AuthorizationRequest } from '../../requests/authorization/authorization-request';
import { ResponseModeInterface } from '../../response-modes/response-mode.interface';
import { RESPONSE_MODE } from '../../response-modes/response-mode.token';
import { ResponseMode } from '../../response-modes/response-mode.type';
import { ResponseTypeInterface } from '../../response-types/response-type.interface';
import { RESPONSE_TYPE } from '../../response-types/response-type.token';
import { ResponseType } from '../../response-types/response-type.type';
import { ClientServiceInterface } from '../../services/client.service.interface';
import { CLIENT_SERVICE } from '../../services/client.service.token';
import { Settings } from '../../settings/settings';
import { SETTINGS } from '../../settings/settings.token';
import { AuthorizationRequestClaimsParameter } from '../../types/authorization-request-claims-parameter.type';
import { IdTokenAuthorizationRequestValidator } from './id-token.authorization-request.validator';

jest.mock('../../handlers/claims.handler');
jest.mock('../../handlers/scope.handler');
jest.mock('../../logger/logger');

const forbiddenResponseModes: ResponseMode[] = ['query', 'query.jwt'];

describe('ID Token Authorization Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: IdTokenAuthorizationRequestValidator;

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
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
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

    container.bind(ClaimsHandler).toValue(claimsHandlerMock);

    container.bind(IdTokenAuthorizationRequestValidator).toSelf().asSingleton();

    validator = container.resolve(IdTokenAuthorizationRequestValidator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "id_token" as its value.', () => {
      expect(validator.name).toEqual<ResponseType>('id_token');
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
        response_type: 'id_token',
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

    it.each(forbiddenResponseModes)('should throw when requesting a forbidden response mode.', async (responseMode) => {
      const request = requestFactory({ response_mode: responseMode });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['id_token'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      });

      const scopes: string[] = ['foo', 'bar', 'baz'];

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(scopes);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        `Invalid response_mode "${responseMode}" for response_type "id_token".`,
      );
    });

    it('should throw when not providing the parameter "nonce".', async () => {
      const request = requestFactory({ nonce: undefined });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['id_token'],
        scopes: ['foo', 'bar', 'baz', 'qux'],
      });

      const scopes: string[] = ['foo', 'bar', 'baz'];

      clientServiceMock.findOne.mockResolvedValueOnce(client);
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(scopes);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "nonce".',
      );
    });
  });
});
