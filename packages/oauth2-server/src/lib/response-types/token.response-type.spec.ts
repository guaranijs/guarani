import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';

import { AuthorizationContext } from '../context/authorization/authorization-context';
import { DisplayInterface } from '../displays/display.interface';
import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Login } from '../entities/login.entity';
import { User } from '../entities/user.entity';
import { Logger } from '../logger/logger';
import { ResponseModeInterface } from '../response-modes/response-mode.interface';
import { ResponseMode } from '../response-modes/response-mode.type';
import { TokenAuthorizationResponse } from '../responses/authorization/token.authorization-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { ResponseTypeInterface } from './response-type.interface';
import { ResponseType } from './response-type.type';
import { TokenResponseType } from './token.response-type';

jest.mock('../logger/logger');

describe('Token Response Type', () => {
  let container: DependencyInjectionContainer;
  let responseType: TokenResponseType;

  const loggerMock = jest.mocked(Logger.prototype);

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind(TokenResponseType).toSelf().asSingleton();

    responseType = container.resolve(TokenResponseType);
  });

  describe('name', () => {
    it('should have "token" as its name.', () => {
      expect(responseType.name).toEqual<ResponseType>('token');
    });
  });

  describe('defaultResponseMode', () => {
    it('should have "fragment" as its default response mode.', () => {
      expect(responseType.defaultResponseMode).toEqual<ResponseMode>('fragment');
    });
  });

  describe('handle()', () => {
    let context: AuthorizationContext;
    let client: Client;

    beforeEach(() => {
      client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      context = <AuthorizationContext>{
        parameters: {
          response_type: 'token',
          client_id: 'client_id',
          redirect_uri: 'https://client.example.com/oauth/callback',
          scope: 'foo bar',
          state: 'client_state',
          nonce: 'client_nonce',
        },
        cookies: {},
        responseType: jest.mocked<ResponseTypeInterface>({
          name: 'token',
          defaultResponseMode: 'fragment',
          handle: jest.fn(),
        }),
        client,
        redirectUri: new URL('https://client.example.com/oauth/callback'),
        scopes: ['foo', 'bar'],
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

    it('should create a token authorization response.', async () => {
      const login: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login_id' });

      const user: User = Object.assign<User, Partial<User>>(Reflect.construct(User, []), { id: 'user_id' });

      const consent: Consent = Object.assign<Consent, Partial<Consent>>(Reflect.construct(Consent, []), {
        id: 'consent_id',
        scopes: ['foo', 'bar'],
        client,
        user,
      });

      const accessToken: AccessToken = Object.assign<AccessToken, Partial<AccessToken>>(
        Reflect.construct(AccessToken, []),
        {
          id: 'access_token',
          scopes: consent.scopes,
          expiresAt: new Date(Date.now() + 3600000),
        },
      );

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);

      await expect(responseType.handle(context, login, consent)).resolves.toStrictEqual<TokenAuthorizationResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'foo bar',
        refresh_token: undefined,
      });
    });
  });
});
