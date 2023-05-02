import { DependencyInjectionContainer } from '@guarani/di';

import { RefreshTokenTokenContext } from '../context/token/refresh-token.token.context';
import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InvalidGrantException } from '../exceptions/invalid-grant.exception';
import { TokenResponse } from '../responses/token-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { GrantTypeInterface } from './grant-type.interface';
import { GrantType } from './grant-type.type';
import { RefreshTokenGrantType } from './refresh-token.grant-type';

describe('Refresh Token Grant Type', () => {
  let container: DependencyInjectionContainer;
  let grantType: RefreshTokenGrantType;

  const settings = <Settings>{ enableRefreshTokenRotation: false };

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  const refreshTokenServiceMock = jest.mocked<RefreshTokenServiceInterface>(
    {
      create: jest.fn(),
      findOne: jest.fn(),
      revoke: jest.fn(),
      rotate: jest.fn(),
    },
    true
  );

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind<RefreshTokenServiceInterface>(REFRESH_TOKEN_SERVICE).toValue(refreshTokenServiceMock);
    container.bind(RefreshTokenGrantType).toSelf().asSingleton();

    grantType = container.resolve(RefreshTokenGrantType);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "refresh_token" as its name.', () => {
      expect(grantType.name).toEqual<GrantType>('refresh_token');
    });
  });

  describe('constructor', () => {
    it('should throw when the user service does not implement the method "findByResourceOwnerCredentials()".', () => {
      const settings = <Settings>{ enableRefreshTokenRotation: true };

      const refreshTokenServiceMock = jest.mocked<RefreshTokenServiceInterface>({
        create: jest.fn(),
        findOne: jest.fn(),
        revoke: jest.fn(),
      });

      container.delete<Settings>(SETTINGS);
      container.delete<RefreshTokenServiceInterface>(REFRESH_TOKEN_SERVICE);
      container.delete(RefreshTokenGrantType);

      container.bind<Settings>(SETTINGS).toValue(settings);
      container.bind<RefreshTokenServiceInterface>(REFRESH_TOKEN_SERVICE).toValue(refreshTokenServiceMock);
      container.bind(RefreshTokenGrantType).toSelf().asSingleton();

      expect(() => container.resolve(RefreshTokenGrantType)).toThrow(
        new TypeError('Missing implementation of required method "RefreshTokenServiceInterface.rotate".')
      );
    });
  });

  describe('handle()', () => {
    let context: RefreshTokenTokenContext;

    beforeEach(() => {
      const now = Date.now();

      context = <RefreshTokenTokenContext>{
        parameters: {
          grant_type: 'refresh_token',
          refresh_token: 'refresh_token',
        },
        grantType: jest.mocked<GrantTypeInterface>({ name: 'refresh_token', handle: jest.fn() }),
        client: <Client>{
          id: 'client_id',
          grantTypes: ['authorization_code', 'refresh_token'],
        },
        refreshToken: <RefreshToken>{
          handle: 'refresh_token',
          isRevoked: false,
          issuedAt: new Date(now),
          expiresAt: new Date(now + 86400000),
          validAfter: new Date(now),
          client: {
            id: 'client_id',
            grantTypes: ['authorization_code', 'refresh_token'],
          },
        },
        scopes: ['foo', 'bar', 'baz'],
      };
    });

    it('should throw when providing a mismathching client identifier.', async () => {
      Reflect.set(context.refreshToken.client, 'id', 'another_client_id');

      await expect(grantType.handle(context)).rejects.toThrow(
        new InvalidGrantException({ description: 'Mismatching Client Identifier.' })
      );
    });

    it('should throw when the refresh token not yet valid.', async () => {
      Reflect.set(context.refreshToken, 'validAfter', new Date(Date.now() + 86400000));

      await expect(grantType.handle(context)).rejects.toThrow(
        new InvalidGrantException({ description: 'Refresh Token not yet valid.' })
      );
    });

    it('should throw when the refresh token is expired.', async () => {
      Reflect.set(context.refreshToken, 'expiresAt', new Date(Date.now() - 86400000));

      await expect(grantType.handle(context)).rejects.toThrow(
        new InvalidGrantException({ description: 'Expired Refresh Token.' })
      );
    });

    it('should throw when the refresh token is revoked.', async () => {
      Reflect.set(context.refreshToken, 'isRevoked', true);

      await expect(grantType.handle(context)).rejects.toThrow(
        new InvalidGrantException({ description: 'Revoked Refresh Token.' })
      );
    });

    it('should create a token response with the original scope and the same refresh token.', async () => {
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
        refresh_token: 'refresh_token',
      });
    });

    it('should create a token response with the requested scope and the same refresh token.', async () => {
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
        refresh_token: 'refresh_token',
      });
    });

    it('should create a token response with the original scope and a new refresh token.', async () => {
      const settings = <Settings>{ enableRefreshTokenRotation: true };

      container.delete<Settings>(SETTINGS);
      container.delete(RefreshTokenGrantType);

      container.bind<Settings>(SETTINGS).toValue(settings);
      container.bind(RefreshTokenGrantType).toSelf().asSingleton();

      grantType = container.resolve(RefreshTokenGrantType);

      const accessToken = <AccessToken>{
        handle: 'access_token',
        scopes: context.scopes,
        expiresAt: new Date(Date.now() + 86400000),
      };

      const refreshToken = <RefreshToken>{ handle: 'new_refresh_token' };

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);
      refreshTokenServiceMock.rotate!.mockResolvedValueOnce(refreshToken);

      await expect(grantType.handle(context)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'foo bar baz',
        refresh_token: 'new_refresh_token',
      });
    });

    it('should create a token response with the requested scope and a new refresh token.', async () => {
      const settings = <Settings>{ enableRefreshTokenRotation: true };

      container.delete<Settings>(SETTINGS);
      container.delete(RefreshTokenGrantType);

      container.bind<Settings>(SETTINGS).toValue(settings);
      container.bind(RefreshTokenGrantType).toSelf().asSingleton();

      grantType = container.resolve(RefreshTokenGrantType);

      Reflect.set(context, 'scopes', ['foo', 'bar']);

      const accessToken = <AccessToken>{
        handle: 'access_token',
        scopes: context.scopes,
        expiresAt: new Date(Date.now() + 86400000),
      };

      const refreshToken = <RefreshToken>{ handle: 'new_refresh_token' };

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);
      refreshTokenServiceMock.rotate!.mockResolvedValueOnce(refreshToken);

      await expect(grantType.handle(context)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'foo bar',
        refresh_token: 'new_refresh_token',
      });
    });
  });
});
