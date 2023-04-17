import { DependencyInjectionContainer } from '@guarani/di';

import { ClientCredentialsTokenContext } from '../context/token/client-credentials.token.context';
import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { TokenResponse } from '../responses/token-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { ClientCredentialsGrantType } from './client-credentials.grant-type';
import { GrantTypeInterface } from './grant-type.interface';
import { GrantType } from './grant-type.type';

describe('Client Credentials Grant Type', () => {
  let container: DependencyInjectionContainer;
  let grantType: ClientCredentialsGrantType;

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind(ClientCredentialsGrantType).toSelf().asSingleton();

    grantType = container.resolve(ClientCredentialsGrantType);
  });

  describe('name', () => {
    it('should have "client_credentials" as its name.', () => {
      expect(grantType.name).toEqual<GrantType>('client_credentials');
    });
  });

  describe('handle()', () => {
    let context: ClientCredentialsTokenContext;

    beforeEach(() => {
      context = <ClientCredentialsTokenContext>{
        parameters: { grant_type: 'client_credentials' },
        grantType: jest.mocked<GrantTypeInterface>({ name: 'client_credentials', handle: jest.fn() }),
        client: <Client>{ id: 'client_id' },
        scopes: ['foo', 'bar', 'baz'],
      };
    });

    it('should create a token response with the requested scope.', async () => {
      Reflect.set(context, 'scopes', ['foo', 'bar']);

      const accessToken = <AccessToken>{
        handle: 'access_token',
        scopes: context.scopes,
        expiresAt: new Date(Date.now() + 300000),
      };

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);

      await expect(grantType.handle(context)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 300,
        scope: 'foo bar',
      });
    });

    it("should create a token response with the client's default scope.", async () => {
      const accessToken = <AccessToken>{
        handle: 'access_token',
        scopes: context.scopes,
        expiresAt: new Date(Date.now() + 300000),
      };

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);

      await expect(grantType.handle(context)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 300,
        scope: 'foo bar baz',
      });
    });
  });
});
