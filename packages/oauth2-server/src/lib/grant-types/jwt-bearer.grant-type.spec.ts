import { DependencyInjectionContainer } from '@guarani/di';

import { JwtBearerTokenContext } from '../context/token/jwt-bearer.token-context';
import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { User } from '../entities/user.entity';
import { TokenResponse } from '../responses/token-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { GrantTypeInterface } from './grant-type.interface';
import { JwtBearerGrantType } from './jwt-bearer.grant-type';

describe('JWT Bearer Grant Type', () => {
  let container: DependencyInjectionContainer;
  let grantType: JwtBearerGrantType;

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind(JwtBearerGrantType).toSelf().asSingleton();

    grantType = container.resolve(JwtBearerGrantType);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('handle()', () => {
    let context: JwtBearerTokenContext;

    beforeEach(() => {
      context = <JwtBearerTokenContext>{
        parameters: {
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: '',
        },
        grantType: <GrantTypeInterface>{
          name: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          handle: jest.fn(),
        },
        client: <Client>{ id: 'client_id' },
        user: <User>{ id: 'user_id' },
        scopes: ['foo', 'bar', 'baz'],
      };
    });

    it('should create a token response with the requested scope.', async () => {
      Reflect.set(context, 'scopes', ['foo', 'bar']);

      const accessToken = <AccessToken>{
        handle: 'access_token',
        expiresAt: new Date(Date.now() + 300000),
        scopes: context.scopes,
      };

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);

      await expect(grantType.handle(context)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 300,
        scope: 'foo bar',
        refresh_token: undefined,
      });

      expect(accessTokenServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it("should create a token response with the client's default scope.", async () => {
      const accessToken = <AccessToken>{
        handle: 'access_token',
        expiresAt: new Date(Date.now() + 300000),
        scopes: context.scopes,
      };

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);

      await expect(grantType.handle(context)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 300,
        scope: 'foo bar baz',
        refresh_token: undefined,
      });

      expect(accessTokenServiceMock.create).toHaveBeenCalledTimes(1);
    });
  });
});
