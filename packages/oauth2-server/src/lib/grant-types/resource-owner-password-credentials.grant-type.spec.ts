import { DependencyInjectionContainer } from '@guarani/di';

import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InvalidGrantException } from '../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { InvalidScopeException } from '../exceptions/invalid-scope.exception';
import { ScopeHandler } from '../handlers/scope.handler';
import { ResourceOwnerPasswordCredentialsTokenRequest } from '../requests/token/resource-owner-password-credentials.token-request';
import { TokenResponse } from '../responses/token-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
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

  const userServiceMock = jest.mocked<UserServiceInterface>(
    {
      findOne: jest.fn(),
      findByResourceOwnerCredentials: jest.fn(),
    },
    true
  );

  const settings = <Settings>{ scopes: ['foo', 'bar', 'baz', 'qux'] };

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind<RefreshTokenServiceInterface>(REFRESH_TOKEN_SERVICE).toValue(refreshTokenServiceMock);
    container.bind<UserServiceInterface>(USER_SERVICE).toValue(userServiceMock);
    container.bind(ScopeHandler).toSelf().asSingleton();
    container.bind(ResourceOwnerPasswordCredentialsGrantType).toSelf().asSingleton();

    grantType = container.resolve(ResourceOwnerPasswordCredentialsGrantType);
  });

  describe('constructor', () => {
    it(`should reject not implementing user service's "findByResourceOwnerCredentials()".`, () => {
      container.delete<UserServiceInterface>(USER_SERVICE);
      container.delete(ResourceOwnerPasswordCredentialsGrantType);

      container.bind<UserServiceInterface>(USER_SERVICE).toValue({ findOne: jest.fn() });
      container.bind(ResourceOwnerPasswordCredentialsGrantType).toSelf().asSingleton();

      expect(() => container.resolve(ResourceOwnerPasswordCredentialsGrantType)).toThrow(
        new TypeError(
          'Missing implementation of required method "UserServiceInterface.findByResourceOwnerCredentials".'
        )
      );
    });
  });

  describe('name', () => {
    it('should have "password" as its name.', () => {
      expect(grantType.name).toEqual<GrantType>('password');
    });
  });

  describe('handle()', () => {
    let parameters: ResourceOwnerPasswordCredentialsTokenRequest;

    beforeEach(() => {
      parameters = { grant_type: 'password', username: 'username', password: 'password' };
    });

    it('should throw when not providing a "username" parameter.', async () => {
      Reflect.deleteProperty(parameters, 'username');

      const client = <Client>{
        id: 'client_id',
        grantTypes: ['password', 'refresh_token'],
        scopes: ['foo', 'bar'],
      };

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "username".' })
      );
    });

    it('should throw when not providing a "password" parameter.', async () => {
      Reflect.deleteProperty(parameters, 'password');

      const client = <Client>{
        id: 'client_id',
        grantTypes: ['password', 'refresh_token'],
        scopes: ['foo', 'bar'],
      };

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "password".' })
      );
    });

    it('should throw when requesting an unsupported scope.', async () => {
      Reflect.set(parameters, 'scope', 'foo unknown bar');

      const client = <Client>{
        id: 'client_id',
        grantTypes: ['password', 'refresh_token'],
        scopes: ['foo', 'bar'],
      };

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidScopeException({ description: 'Unsupported scope "unknown".' })
      );
    });

    it('should throw when an end-user is not found.', async () => {
      const client = <Client>{
        id: 'client_id',
        grantTypes: ['password', 'refresh_token'],
        scopes: ['foo', 'bar'],
      };

      userServiceMock.findByResourceOwnerCredentials!.mockResolvedValueOnce(null);

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'Invalid Credentials.' })
      );
    });

    it("should create a token response with the client's default scope and without a refresh token if its service is not provided.", async () => {
      Reflect.deleteProperty(grantType, 'refreshTokenService');

      const client = <Client>{
        id: 'client_id',
        grantTypes: ['password', 'refresh_token'],
        scopes: ['foo', 'bar'],
      };

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{ handle: 'access_token', scopes, expiresAt: new Date(Date.now() + 86400000) };
      });

      userServiceMock.findByResourceOwnerCredentials!.mockResolvedValueOnce({ id: 'user_id' });

      await expect(grantType.handle(parameters, client)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'foo bar',
      });

      Reflect.set(grantType, 'refreshTokenService', refreshTokenServiceMock);
    });

    it('should create a token response with the requested scope and without a refresh token if its service is not provided.', async () => {
      Reflect.deleteProperty(grantType, 'refreshTokenService');
      Reflect.set(parameters, 'scope', 'bar foo');

      const client = <Client>{
        id: 'client_id',
        grantTypes: ['password', 'refresh_token'],
        scopes: ['foo', 'bar'],
      };

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{ handle: 'access_token', scopes, expiresAt: new Date(Date.now() + 86400000) };
      });

      userServiceMock.findByResourceOwnerCredentials!.mockResolvedValueOnce({ id: 'user_id' });

      await expect(grantType.handle(parameters, client)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'bar foo',
      });

      Reflect.set(grantType, 'refreshTokenService', refreshTokenServiceMock);
    });

    it('should create a token response with a restricted scope and without a refresh token if its service is not provided.', async () => {
      Reflect.deleteProperty(grantType, 'refreshTokenService');
      Reflect.set(parameters, 'scope', 'bar qux foo');

      const client = <Client>{
        id: 'client_id',
        grantTypes: ['password', 'refresh_token'],
        scopes: ['foo', 'bar'],
      };

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{ handle: 'access_token', scopes, expiresAt: new Date(Date.now() + 86400000) };
      });

      userServiceMock.findByResourceOwnerCredentials!.mockResolvedValueOnce({ id: 'user_id' });

      await expect(grantType.handle(parameters, client)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'bar foo',
      });

      Reflect.set(grantType, 'refreshTokenService', refreshTokenServiceMock);
    });

    it("should create a token response with the client's default scope and without a refresh token if the client does not use it.", async () => {
      const client = <Client>{
        id: 'client_id',
        grantTypes: ['password'],
        scopes: ['bar', 'baz'],
      };

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{ handle: 'access_token', scopes, expiresAt: new Date(Date.now() + 86400000) };
      });

      userServiceMock.findByResourceOwnerCredentials!.mockResolvedValueOnce({ id: 'user_id' });

      await expect(grantType.handle(parameters, client)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'bar baz',
      });
    });

    it('should create a token response with the requested scope and without a refresh token if the client does not use it.', async () => {
      Reflect.set(parameters, 'scope', 'baz bar');

      const client = <Client>{
        id: 'client_id',
        grantTypes: ['password'],
        scopes: ['bar', 'baz'],
      };

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{ handle: 'access_token', scopes, expiresAt: new Date(Date.now() + 86400000) };
      });

      userServiceMock.findByResourceOwnerCredentials!.mockResolvedValueOnce({ id: 'user_id' });

      await expect(grantType.handle(parameters, client)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'baz bar',
      });
    });

    it('should create a token response with a restricted scope and without a refresh token if the client does not use it.', async () => {
      Reflect.set(parameters, 'scope', 'baz bar qux');

      const client = <Client>{
        id: 'client_id',
        grantTypes: ['password'],
        scopes: ['bar', 'baz'],
      };

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{ handle: 'access_token', scopes, expiresAt: new Date(Date.now() + 86400000) };
      });

      userServiceMock.findByResourceOwnerCredentials!.mockResolvedValueOnce({ id: 'user_id' });

      await expect(grantType.handle(parameters, client)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'baz bar',
      });
    });

    it("should create a token response with the client's default scope and with a refresh token.", async () => {
      const client = <Client>{
        id: 'client_id',
        grantTypes: ['password', 'refresh_token'],
        scopes: ['foo', 'bar'],
      };

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{ handle: 'access_token', scopes, expiresAt: new Date(Date.now() + 86400000) };
      });

      refreshTokenServiceMock.create.mockResolvedValueOnce(<RefreshToken>{ handle: 'refresh_token' });
      userServiceMock.findByResourceOwnerCredentials!.mockResolvedValueOnce({ id: 'user_id' });

      await expect(grantType.handle(parameters, client)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'foo bar',
        refresh_token: 'refresh_token',
      });
    });

    it('should create a token response with the requested scope and with a refresh token.', async () => {
      Reflect.set(parameters, 'scope', 'bar foo');

      const client = <Client>{
        id: 'client_id',
        grantTypes: ['password', 'refresh_token'],
        scopes: ['foo', 'bar'],
      };

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{ handle: 'access_token', scopes, expiresAt: new Date(Date.now() + 86400000) };
      });

      refreshTokenServiceMock.create.mockResolvedValueOnce(<RefreshToken>{ handle: 'refresh_token' });
      userServiceMock.findByResourceOwnerCredentials!.mockResolvedValueOnce({ id: 'user_id' });

      await expect(grantType.handle(parameters, client)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'bar foo',
        refresh_token: 'refresh_token',
      });
    });

    it('should create a token response with a restricted requested scope and with a refresh token.', async () => {
      Reflect.set(parameters, 'scope', 'baz bar foo');

      const client = <Client>{
        id: 'client_id',
        grantTypes: ['password', 'refresh_token'],
        scopes: ['foo', 'bar'],
      };

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{ handle: 'access_token', scopes, expiresAt: new Date(Date.now() + 86400000) };
      });

      refreshTokenServiceMock.create.mockResolvedValueOnce(<RefreshToken>{ handle: 'refresh_token' });
      userServiceMock.findByResourceOwnerCredentials!.mockResolvedValueOnce({ id: 'user_id' });

      await expect(grantType.handle(parameters, client)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'bar foo',
        refresh_token: 'refresh_token',
      });
    });
  });
});
