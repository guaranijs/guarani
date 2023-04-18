import { DependencyInjectionContainer } from '@guarani/di';

import { CodeAuthorizationContext } from '../context/authorization/code.authorization.context';
import { DisplayInterface } from '../displays/display.interface';
import { AccessToken } from '../entities/access-token.entity';
import { AuthorizationCode } from '../entities/authorization-code.entity';
import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Session } from '../entities/session.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { IdTokenHandler } from '../handlers/id-token.handler';
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

describe('Code ID Token Token Response Type', () => {
  let container: DependencyInjectionContainer;
  let responseType: CodeIdTokenTokenResponseType;

  const idTokenHandlerMock = jest.mocked(IdTokenHandler.prototype, true);

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

    beforeEach(() => {
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
        client: <Client>{ id: 'client_id' },
        redirectUri: new URL('https://client.example.com/oauth/callback'),
        scopes: ['openid', 'foo', 'bar'],
        codeChallenge: 'code_challenge',
        codeChallengeMethod: jest.mocked<PkceInterface>({ name: 'plain', verify: jest.fn() }),
        state: 'client_state',
        responseMode: jest.mocked<ResponseModeInterface>({ name: 'fragment', createHttpResponse: jest.fn() }),
        nonce: 'client_nonce',
        prompts: [],
        display: jest.mocked<DisplayInterface>({ name: 'page', createHttpResponse: jest.fn() }),
        uiLocales: [],
        acrValues: [],
      };
    });

    it('should throw if the scope "openid" is not provided.', async () => {
      Reflect.set(context.parameters, 'scope', 'foo bar');
      Reflect.set(context, 'scopes', ['foo', 'bar']);

      const session = <Session>{};
      const consent = <Consent>{ scopes: ['foo', 'bar'] };

      await expect(responseType.handle(context, session, consent)).rejects.toThrow(
        new InvalidRequestException({ description: 'Missing required scope "openid".', state: 'client_state' })
      );
    });

    it('should create a code id token token authorization response.', async () => {
      const session = <Session>{};
      const consent = <Consent>{ scopes: ['openid', 'foo', 'bar'] };

      const accessToken = <AccessToken>{
        handle: 'access_token',
        scopes: consent.scopes,
        expiresAt: new Date(Date.now() + 3600000),
      };

      const authorizationCode = <AuthorizationCode>{ code: 'authorization_code' };

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);
      authorizationCodeServiceMock.create.mockResolvedValueOnce(authorizationCode);
      idTokenHandlerMock.generateIdToken.mockResolvedValueOnce('id_token');

      await expect(responseType.handle(context, session, consent)).resolves.toStrictEqual<
        CodeAuthorizationResponse & IdTokenAuthorizationResponse & TokenAuthorizationResponse
      >({
        access_token: 'access_token',
        token_type: 'Bearer',
        scope: 'openid foo bar',
        expires_in: 3600,
        code: 'authorization_code',
        id_token: 'id_token',
        state: 'client_state',
      });
    });
  });
});
