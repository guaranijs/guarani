import { DependencyInjectionContainer } from '@guarani/di';

import { ResourceOwnerPasswordCredentialsTokenContext } from '../context/token/resource-owner-password-credentials.token-context';
import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../entities/user.entity';
import { TokenResponse } from '../responses/token-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { GrantTypeInterface } from './grant-type.interface';
import { GrantType } from './grant-type.type';
import { ResourceOwnerPasswordCredentialsGrantType } from './resource-owner-password-credentials.grant-type';

describe('Resource Owner Password Credentials Grant Type', () => {
  let container: DependencyInjectionContainer;
  let grantType: ResourceOwnerPasswordCredentialsGrantType;

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  const refreshTokenServiceMock = jest.mocked<RefreshTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind<RefreshTokenServiceInterface>(REFRESH_TOKEN_SERVICE).toValue(refreshTokenServiceMock);
    container.bind(ResourceOwnerPasswordCredentialsGrantType).toSelf().asSingleton();

    grantType = container.resolve(ResourceOwnerPasswordCredentialsGrantType);
  });

  describe('name', () => {
    it('should have "password" as its value.', () => {
      expect(grantType.name).toEqual<GrantType>('password');
    });
  });

  describe('handle()', () => {
    let context: ResourceOwnerPasswordCredentialsTokenContext;

    beforeEach(() => {
      context = <ResourceOwnerPasswordCredentialsTokenContext>{
        parameters: {
          grant_type: 'password',
          username: 'username',
          password: 'password',
        },
        grantType: jest.mocked<GrantTypeInterface>({ name: 'password', handle: jest.fn() }),
        client: <Client>{ id: 'client_id', grantTypes: ['password', 'refresh_token'] },
        user: <User>{ id: 'user_id' },
        scopes: ['foo', 'bar', 'baz'],
      };
    });

    it('should create a token response with the requested scope and without a refresh token if its service is not provided.', async () => {
      container.delete<RefreshTokenServiceInterface>(REFRESH_TOKEN_SERVICE);
      container.delete(ResourceOwnerPasswordCredentialsGrantType);

      container.bind(ResourceOwnerPasswordCredentialsGrantType).toSelf().asSingleton();

      grantType = container.resolve(ResourceOwnerPasswordCredentialsGrantType);

      Reflect.set(context, 'scopes', ['foo', 'bar']);

      const accessToken = <AccessToken>{
        handle: 'access_token',
        scopes: context.scopes,
        expiresAt: new Date(Date.now() + 86400000),
      };

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);

      await expect(grantType.handle(context)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'foo bar',
      });
    });

    it("should create a token response with the client's default scope and without a refresh token if its service is not provided.", async () => {
      container.delete<RefreshTokenServiceInterface>(REFRESH_TOKEN_SERVICE);
      container.delete(ResourceOwnerPasswordCredentialsGrantType);

      container.bind(ResourceOwnerPasswordCredentialsGrantType).toSelf().asSingleton();

      grantType = container.resolve(ResourceOwnerPasswordCredentialsGrantType);

      const accessToken = <AccessToken>{
        handle: 'access_token',
        scopes: context.scopes,
        expiresAt: new Date(Date.now() + 86400000),
      };

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);

      await expect(grantType.handle(context)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'foo bar baz',
      });
    });

    it('should create a token response with the requested scope and without a refresh token if the client does not use it.', async () => {
      Reflect.set(context, 'scopes', ['foo', 'bar']);

      const accessToken = <AccessToken>{
        handle: 'access_token',
        scopes: context.scopes,
        expiresAt: new Date(Date.now() + 86400000),
      };

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);

      await expect(grantType.handle(context)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'foo bar',
      });
    });

    it("should create a token response with the client's default scope and without a refresh token if the client does not use it.", async () => {
      const accessToken = <AccessToken>{
        handle: 'access_token',
        scopes: context.scopes,
        expiresAt: new Date(Date.now() + 86400000),
      };

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);

      await expect(grantType.handle(context)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'foo bar baz',
      });
    });

    it('should create a token response with the requested scope and with a refresh token.', async () => {
      Reflect.set(context, 'scopes', ['foo', 'bar']);

      const accessToken = <AccessToken>{
        handle: 'access_token',
        scopes: context.scopes,
        expiresAt: new Date(Date.now() + 86400000),
      };

      const refreshToken = <RefreshToken>{ handle: 'refresh_token' };

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);
      refreshTokenServiceMock.create.mockResolvedValueOnce(refreshToken);

      await expect(grantType.handle(context)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'foo bar',
        refresh_token: 'refresh_token',
      });
    });

    it("should create a token response with the client's default scope and with a refresh token.", async () => {
      const accessToken = <AccessToken>{
        handle: 'access_token',
        scopes: context.scopes,
        expiresAt: new Date(Date.now() + 86400000),
      };

      const refreshToken = <RefreshToken>{ handle: 'refresh_token' };

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);
      refreshTokenServiceMock.create.mockResolvedValueOnce(refreshToken);

      await expect(grantType.handle(context)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'foo bar baz',
        refresh_token: 'refresh_token',
      });
    });
  });
});
