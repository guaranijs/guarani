import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';

import { CodeAuthorizationContext } from '../context/authorization/code.authorization-context';
import { DisplayInterface } from '../displays/display.interface';
import { AccessToken } from '../entities/access-token.entity';
import { AuthorizationCode } from '../entities/authorization-code.entity';
import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Login } from '../entities/login.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { IdTokenHandler } from '../handlers/id-token.handler';
import { Logger } from '../logger/logger';
import { PkceInterface } from '../pkces/pkce.interface';
import { ResponseModeInterface } from '../response-modes/response-mode.interface';
import { ResponseMode } from '../response-modes/response-mode.type';
import { CodeAuthorizationResponse } from '../responses/authorization/code.authorization-response';
import { IdTokenAuthorizationResponse } from '../responses/authorization/id-token.authorization-response';
import { TokenAuthorizationResponse } from '../responses/authorization/token.authorization-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { AuthorizationCodeServiceInterface } from '../services/authorization-code.service.interface';
import { AUTHORIZATION_CODE_SERVICE } from '../services/authorization-code.service.token';
import { CodeIdTokenTokenResponseType } from './code-id-token-token.response-type';
import { ResponseTypeInterface } from './response-type.interface';
import { ResponseType } from './response-type.type';

jest.mock('../handlers/id-token.handler.ts');
jest.mock('../logger/logger');

describe('Code ID Token Token Response Type', () => {
  let container: DependencyInjectionContainer;
  let responseType: CodeIdTokenTokenResponseType;

  const loggerMock = jest.mocked(Logger.prototype);

  const idTokenHandlerMock = jest.mocked(IdTokenHandler.prototype);

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  const authorizationCodeServiceMock = jest.mocked<AuthorizationCodeServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
    container.bind(IdTokenHandler).toValue(idTokenHandlerMock);
    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind<AuthorizationCodeServiceInterface>(AUTHORIZATION_CODE_SERVICE).toValue(authorizationCodeServiceMock);
    container.bind(CodeIdTokenTokenResponseType).toSelf().asSingleton();

    responseType = container.resolve(CodeIdTokenTokenResponseType);
  });

  describe('name', () => {
    it('should have "code id_token token" as its name.', () => {
      expect(responseType.name).toEqual<ResponseType>('code id_token token');
    });
  });

  describe('defaultResponseMode', () => {
    it('should have "fragment" as its default response mode.', () => {
      expect(responseType.defaultResponseMode).toEqual<ResponseMode>('fragment');
    });
  });

  describe('handle()', () => {
    let context: CodeAuthorizationContext;
    let client: Client;

    beforeEach(() => {
      client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      context = <CodeAuthorizationContext>{
        parameters: {
          response_type: 'code id_token token',
          client_id: 'client_id',
          redirect_uri: 'https://client.example.com/oauth/callback',
          scope: 'openid foo bar',
          code_challenge: 'code_challenge',
          code_challenge_method: 'plain',
          state: 'client_state',
          nonce: 'client_nonce',
        },
        cookies: {},
        responseType: jest.mocked<ResponseTypeInterface>({
          name: 'code id_token token',
          defaultResponseMode: 'fragment',
          handle: jest.fn(),
        }),
        client,
        redirectUri: new URL('https://client.example.com/oauth/callback'),
        scopes: ['openid', 'foo', 'bar'],
        codeChallenge: 'code_challenge',
        codeChallengeMethod: jest.mocked<PkceInterface>({ name: 'plain', verify: jest.fn() }),
        state: 'client_state',
        responseMode: jest.mocked<ResponseModeInterface>({ name: 'fragment', createHttpResponse: jest.fn() }),
        nonce: 'client_nonce',
        prompts: [],
        display: jest.mocked<DisplayInterface>({ name: 'page', createHttpResponse: jest.fn() }),
        maxAge: null,
        loginHint: null,
        idTokenHint: null,
        uiLocales: [],
        acrValues: [],
        claims: {
          userinfo: {
            null_option: null,
            essential_option: { essential: true },
            value_option: { value: 'value' },
            values_option: { values: ['value_0', 'value_1'] },
            essential_value_option: { essential: true, value: 'essential_value' },
            essential_values_option: { essential: true, values: ['essential_value_0', 'essential_value_1'] },
          },
        },
      };
    });

    it('should throw if the scope "openid" is not provided.', async () => {
      Reflect.set(context.parameters, 'scope', 'foo bar');
      Reflect.set(context, 'scopes', ['foo', 'bar']);

      const login: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login_id' });

      const consent: Consent = Object.assign<Consent, Partial<Consent>>(Reflect.construct(Consent, []), {
        id: 'consent_id',
        scopes: ['foo', 'bar'],
      });

      await expect(responseType.handle(context, login, consent)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Missing required scope "openid".',
      );
    });

    it('should create a code id token token authorization response.', async () => {
      const login: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login_id' });

      const consent: Consent = Object.assign<Consent, Partial<Consent>>(Reflect.construct(Consent, []), {
        id: 'consent_id',
        scopes: ['openid', 'foo', 'bar'],
      });

      const accessToken: AccessToken = Object.assign<AccessToken, Partial<AccessToken>>(
        Reflect.construct(AccessToken, []),
        {
          id: 'access_token',
          scopes: consent.scopes,
          expiresAt: new Date(Date.now() + 3600000),
        },
      );

      const authorizationCode: AuthorizationCode = Object.assign<AuthorizationCode, Partial<AuthorizationCode>>(
        Reflect.construct(AuthorizationCode, []),
        { id: 'authorization_code' },
      );

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);
      authorizationCodeServiceMock.create.mockResolvedValueOnce(authorizationCode);
      idTokenHandlerMock.generateIdToken.mockResolvedValueOnce('id_token');

      await expect(responseType.handle(context, login, consent)).resolves.toStrictEqual<
        CodeAuthorizationResponse & IdTokenAuthorizationResponse & TokenAuthorizationResponse
      >({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid foo bar',
        refresh_token: undefined,
        code: 'authorization_code',
        id_token: 'id_token',
      });
    });
  });
});
