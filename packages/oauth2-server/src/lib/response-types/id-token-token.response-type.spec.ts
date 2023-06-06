import { DependencyInjectionContainer } from '@guarani/di';

import { AuthorizationContext } from '../context/authorization/authorization-context';
import { DisplayInterface } from '../displays/display.interface';
import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Login } from '../entities/login.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { IdTokenHandler } from '../handlers/id-token.handler';
import { AuthorizationRequest } from '../requests/authorization/authorization-request';
import { ResponseModeInterface } from '../response-modes/response-mode.interface';
import { ResponseMode } from '../response-modes/response-mode.type';
import { IdTokenAuthorizationResponse } from '../responses/authorization/id-token.authorization-response';
import { TokenAuthorizationResponse } from '../responses/authorization/token.authorization-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { IdTokenTokenResponseType } from './id-token-token.response-type';
import { ResponseTypeInterface } from './response-type.interface';
import { ResponseType } from './response-type.type';

jest.mock('../handlers/id-token.handler');

describe('ID Token Token Response Type', () => {
  let container: DependencyInjectionContainer;
  let responseType: IdTokenTokenResponseType;

  const idTokenHandlerMock = jest.mocked(IdTokenHandler.prototype);

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(IdTokenHandler).toValue(idTokenHandlerMock);
    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind(IdTokenTokenResponseType).toSelf().asSingleton();

    responseType = container.resolve(IdTokenTokenResponseType);
  });

  describe('name', () => {
    it('should have "id_token token" as its name.', () => {
      expect(responseType.name).toEqual<ResponseType>('id_token token');
    });
  });

  describe('defaultResponseMode', () => {
    it('should have "fragment" as its default response mode.', () => {
      expect(responseType.defaultResponseMode).toEqual<ResponseMode>('fragment');
    });
  });

  describe('handle()', () => {
    let context: AuthorizationContext<AuthorizationRequest>;

    beforeEach(() => {
      context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: {
          response_type: 'id_token token',
          client_id: 'client_id',
          redirect_uri: 'https://client.example.com/oauth/callback',
          scope: 'openid foo bar',
          state: 'client_state',
          nonce: 'client_nonce',
        },
        cookies: {},
        responseType: jest.mocked<ResponseTypeInterface>({
          name: 'id_token token',
          defaultResponseMode: 'fragment',
          handle: jest.fn(),
        }),
        client: <Client>{ id: 'client_id' },
        redirectUri: new URL('https://client.example.com/oauth/callback'),
        scopes: ['openid', 'foo', 'bar'],
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
      };
    });

    it('should throw when not providing the "openid" scope.', async () => {
      Reflect.set(context.parameters, 'scope', 'foo bar');
      Reflect.set(context, 'scopes', ['foo', 'bar']);

      const login = <Login>{};
      const consent = <Consent>{
        scopes: ['foo', 'bar'],
        client: { id: 'client_id' },
        user: { id: 'user_id' },
      };

      await expect(responseType.handle(context, login, consent)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Missing required scope "openid".'
      );
    });

    it('should create an id token token authorization response.', async () => {
      const login = <Login>{};
      const consent = <Consent>{
        scopes: ['openid', 'foo', 'bar'],
        client: { id: 'client_id' },
        user: { id: 'user_id' },
      };

      const accessToken = <AccessToken>{
        handle: 'access_token',
        scopes: consent.scopes,
        expiresAt: new Date(Date.now() + 3600000),
      };

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);
      idTokenHandlerMock.generateIdToken.mockResolvedValueOnce('id_token');

      await expect(responseType.handle(context, login, consent)).resolves.toStrictEqual<
        TokenAuthorizationResponse & IdTokenAuthorizationResponse
      >({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid foo bar',
        id_token: 'id_token',
        state: 'client_state',
      });
    });
  });
});
