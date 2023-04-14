import { DependencyInjectionContainer } from '@guarani/di';

import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InvalidGrantException } from '../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { InvalidScopeException } from '../exceptions/invalid-scope.exception';
import { ScopeHandler } from '../handlers/scope.handler';
import { RefreshTokenTokenRequest } from '../requests/token/refresh-token.token-request';
import { TokenResponse } from '../responses/token-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { GrantType } from './grant-type.type';
import { RefreshTokenGrantType } from './refresh-token.grant-type';

describe('Refresh Token Grant Type', () => {
  let container: DependencyInjectionContainer;
  let grantType: RefreshTokenGrantType;

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

  const settings = <Settings>{ scopes: ['foo', 'bar', 'baz', 'qux'] };

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind<RefreshTokenServiceInterface>(REFRESH_TOKEN_SERVICE).toValue(refreshTokenServiceMock);
    container.bind(ScopeHandler).toSelf().asSingleton();
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

  describe('handle()', () => {
    let parameters: RefreshTokenTokenRequest;

    beforeEach(() => {
      parameters = { grant_type: 'refresh_token', refresh_token: 'refresh_token' };
    });

    it('should throw when not providing a "refresh_token" parameter.', async () => {
      Reflect.deleteProperty(parameters, 'refresh_token');

      const client = <Client>{ id: 'client_id' };

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "refresh_token".' })
      );
    });

    it('should throw when requesting an unsupported scope.', async () => {
      Reflect.set(parameters, 'scope', 'foo unknown bar');

      const client = <Client>{ id: 'client_id' };

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidScopeException({ description: 'Unsupported scope "unknown".' })
      );
    });

    it('should throw when a refresh token is not found.', async () => {
      const client = <Client>{ id: 'client_id' };

      refreshTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'Invalid Refresh Token.' })
      );
    });

    it('should throw when providing a mismathching client identifier.', async () => {
      const client = <Client>{ id: 'client_id' };

      refreshTokenServiceMock.findOne.mockResolvedValueOnce(<RefreshToken>{
        handle: 'refresh_token',
        client: { id: 'another_client_id' },
      });

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'Mismatching Client Identifier.' })
      );
    });

    it('should throw when a refresh token not yet valid.', async () => {
      const client = <Client>{ id: 'client_id' };

      refreshTokenServiceMock.findOne.mockResolvedValueOnce(<RefreshToken>{
        handle: 'refresh_token',
        validAfter: new Date(Date.now() + 3600000),
        client: { id: 'client_id' },
      });

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'Refresh Token not yet valid.' })
      );
    });

    it('should throw when using an expired refresh token.', async () => {
      const client = <Client>{ id: 'client_id' };

      refreshTokenServiceMock.findOne.mockResolvedValueOnce(<RefreshToken>{
        handle: 'refresh_token',
        expiresAt: new Date(Date.now() - 3600000),
        client: { id: 'client_id' },
      });

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'Expired Refresh Token.' })
      );
    });

    it('should throw when using a revoked refresh token.', async () => {
      const client = <Client>{ id: 'client_id' };

      refreshTokenServiceMock.findOne.mockResolvedValueOnce(<RefreshToken>{
        handle: 'refresh_token',
        isRevoked: true,
        expiresAt: new Date(Date.now() + 3600000),
        client: { id: 'client_id' },
      });

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'Revoked Refresh Token.' })
      );
    });

    it('should throw when requesting a scope not previously granted.', async () => {
      Reflect.set(parameters, 'scope', 'foo bar baz');

      const client = <Client>{ id: 'client_id' };

      refreshTokenServiceMock.findOne.mockResolvedValueOnce(<RefreshToken>{
        handle: 'refresh_token',
        isRevoked: false,
        scopes: ['foo', 'bar'],
        expiresAt: new Date(Date.now() + 3600000),
        client: { id: 'client_id' },
      });

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'The scope "baz" was not previously granted.' })
      );
    });

    it('should create a token response with the original scope and the same refresh token.', async () => {
      const client = <Client>{ id: 'client_id' };

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{ handle: 'access_token', scopes, expiresAt: new Date(Date.now() + 86400000) };
      });

      refreshTokenServiceMock.findOne.mockResolvedValueOnce(<RefreshToken>{
        handle: 'refresh_token',
        isRevoked: false,
        scopes: ['foo', 'bar'],
        expiresAt: new Date(Date.now() + 3600000),
        client: { id: 'client_id' },
      });

      await expect(grantType.handle(parameters, client)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'foo bar',
        refresh_token: 'refresh_token',
      });
    });

    it('should create a token response with the requested scope and the same refresh token.', async () => {
      Reflect.set(parameters, 'scope', 'foo');

      const client = <Client>{ id: 'client_id' };

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{ handle: 'access_token', scopes, expiresAt: new Date(Date.now() + 86400000) };
      });

      refreshTokenServiceMock.findOne.mockResolvedValueOnce(<RefreshToken>{
        handle: 'refresh_token',
        isRevoked: false,
        scopes: ['foo', 'bar'],
        expiresAt: new Date(Date.now() + 3600000),
        client: { id: 'client_id' },
      });

      await expect(grantType.handle(parameters, client)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'foo',
        refresh_token: 'refresh_token',
      });
    });

    it('should create a token response with the original scope and a new refresh token.', async () => {
      Reflect.set(settings, 'enableRefreshTokenRotation', true);

      const client = <Client>{ id: 'client_id' };

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{ handle: 'access_token', scopes, expiresAt: new Date(Date.now() + 86400000) };
      });

      refreshTokenServiceMock.create.mockResolvedValueOnce(<RefreshToken>{ handle: 'new_refresh_token' });

      refreshTokenServiceMock.findOne.mockResolvedValueOnce(<RefreshToken>{
        handle: 'refresh_token',
        isRevoked: false,
        scopes: ['foo', 'bar'],
        expiresAt: new Date(Date.now() + 3600000),
        client: { id: 'client_id' },
      });

      await expect(grantType.handle(parameters, client)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'foo bar',
        refresh_token: 'new_refresh_token',
      });

      expect(refreshTokenServiceMock.revoke).toHaveBeenCalledTimes(1);
      expect(refreshTokenServiceMock.create).toHaveBeenCalledTimes(1);

      const revokeOrder = refreshTokenServiceMock.revoke.mock.invocationCallOrder[0]!;
      const createOrder = refreshTokenServiceMock.create.mock.invocationCallOrder[0]!;

      expect(revokeOrder).toBeLessThan(createOrder);

      Reflect.deleteProperty(settings, 'enableRefreshTokenRotation');
    });

    it('should create a token response with the requested scope and a new refresh token.', async () => {
      Reflect.set(settings, 'enableRefreshTokenRotation', true);
      Reflect.set(parameters, 'scope', 'foo');

      const client = <Client>{ id: 'client_id' };

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{ handle: 'access_token', scopes, expiresAt: new Date(Date.now() + 86400000) };
      });

      refreshTokenServiceMock.create.mockResolvedValueOnce(<RefreshToken>{ handle: 'new_refresh_token' });

      refreshTokenServiceMock.findOne.mockResolvedValueOnce(<RefreshToken>{
        handle: 'refresh_token',
        isRevoked: false,
        scopes: ['foo', 'bar'],
        expiresAt: new Date(Date.now() + 3600000),
        client: { id: 'client_id' },
      });

      await expect(grantType.handle(parameters, client)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'foo',
        refresh_token: 'new_refresh_token',
      });

      expect(refreshTokenServiceMock.revoke).toHaveBeenCalledTimes(1);
      expect(refreshTokenServiceMock.create).toHaveBeenCalledTimes(1);

      const revokeOrder = refreshTokenServiceMock.revoke.mock.invocationCallOrder[0]!;
      const createOrder = refreshTokenServiceMock.create.mock.invocationCallOrder[0]!;

      expect(revokeOrder).toBeLessThan(createOrder);

      Reflect.deleteProperty(settings, 'enableRefreshTokenRotation');
    });
  });
});
