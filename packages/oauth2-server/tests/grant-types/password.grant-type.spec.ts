import { Optional } from '@guarani/types';
import { AuthorizationServerOptions } from '../../lib/authorization-server/options/authorization-server.options';

import { AccessToken } from '../../lib/entities/access-token';
import { Client } from '../../lib/entities/client';
import { RefreshToken } from '../../lib/entities/refresh-token';
import { User } from '../../lib/entities/user';
import { InvalidGrantException } from '../../lib/exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../../lib/exceptions/invalid-request.exception';
import { InvalidScopeException } from '../../lib/exceptions/invalid-scope.exception';
import { PasswordGrantType } from '../../lib/grant-types/password.grant-type';
import { ScopeHandler } from '../../lib/handlers/scope.handler';
import { PasswordTokenParameters } from '../../lib/models/password.token-parameters';
import { TokenResponse } from '../../lib/models/token-response';
import { IAccessTokenService } from '../../lib/services/access-token.service.interface';
import { IRefreshTokenService } from '../../lib/services/refresh-token.service.interface';
import { IUserService } from '../../lib/services/user.service.interface';
import { GrantType } from '../../lib/types/grant-type';

const clients = <Client[]>[
  {
    id: 'client_id',
    grantTypes: ['password', 'refresh_token'],
    scopes: ['foo', 'bar'],
  },
  {
    id: 'id_client',
    grantTypes: ['password'],
    scopes: ['bar', 'baz'],
  },
];

const users = <User[]>[
  { id: 'user1', username: 'username1', password: 'password1' },
  { id: 'user2', username: 'username2', password: 'password2' },
];

const accessTokenServiceMock: jest.Mocked<Partial<IAccessTokenService>> = {
  createAccessToken: jest.fn().mockImplementation(async (scopes: string[]): Promise<AccessToken> => {
    return <AccessToken>{
      token: 'access_token',
      tokenType: 'Bearer',
      scopes,
      expiresAt: new Date(Date.now() + 86400000),
    };
  }),
};

const userServiceMock: jest.Mocked<Partial<IUserService>> = {
  findByResourceOwnerCredentials: jest
    .fn()
    .mockImplementation(async (username: string, password: string): Promise<Optional<User>> => {
      return users.find((user) => user.username === username && user.password === password);
    }),
};

const refreshTokenServiceMock: jest.Mocked<Partial<IRefreshTokenService>> = {
  createRefreshToken: jest.fn().mockImplementation(async (): Promise<RefreshToken> => {
    return <RefreshToken>{ token: 'refresh_token' };
  }),
};

const authorizationServerOptionsMock = <AuthorizationServerOptions>{ scopes: ['foo', 'bar', 'baz', 'qux'] };

const scopeHandler = new ScopeHandler(authorizationServerOptionsMock);

const grantType = new PasswordGrantType(
  scopeHandler,
  <IAccessTokenService>accessTokenServiceMock,
  <IUserService>userServiceMock,
  <IRefreshTokenService>refreshTokenServiceMock
);

describe('Password Grant Type', () => {
  describe('name', () => {
    it('should have "password" as its name.', () => {
      expect(grantType.name).toBe<GrantType>('password');
    });
  });

  describe('constructor', () => {
    it('should reject not providing a user service.', () => {
      expect(() => new PasswordGrantType(<any>{}, <any>null, <any>{})).toThrow(TypeError);
    });

    it(`should reject not implementing user service's "findByResourceOwnerCredentials()".`, () => {
      expect(() => new PasswordGrantType(<any>{}, <any>{}, <any>{})).toThrow(TypeError);
    });
  });

  describe('handle()', () => {
    let parameters: PasswordTokenParameters;

    beforeEach(() => {
      parameters = { grant_type: 'password', username: '', password: '' };
    });

    it('should reject not providing a "username" parameter.', async () => {
      Reflect.deleteProperty(parameters, 'username');
      await expect(grantType.handle(parameters, clients[0])).rejects.toThrow(InvalidRequestException);
    });

    it('should reject not providing a "password" parameter.', async () => {
      Reflect.deleteProperty(parameters, 'password');
      await expect(grantType.handle(parameters, clients[0])).rejects.toThrow(InvalidRequestException);
    });

    it('should reject requesting an unsupported scope.', async () => {
      Reflect.set(parameters, 'scope', 'foo unknown bar');
      await expect(grantType.handle(parameters, clients[0])).rejects.toThrow(InvalidScopeException);
    });

    const mismatchingCredentials: [string, string][] = [
      ['unknown', 'unknown'],
      ['username1', 'password2'],
      ['username2', 'foobar'],
    ];

    it.each(mismatchingCredentials)('should reject when an end-user is not found.', async (username, password) => {
      Object.assign(parameters, { username, password });
      await expect(grantType.handle(parameters, clients[0])).rejects.toThrow(InvalidGrantException);
    });

    it("should create a token response with the client's default scope and without a refresh Token if its service is not provided.", async () => {
      Reflect.deleteProperty(grantType, 'refreshTokenService');
      Object.assign(parameters, { username: 'username1', password: 'password1' });

      await expect(grantType.handle(parameters, clients[0])).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo bar',
      });

      Reflect.set(grantType, 'refreshTokenService', refreshTokenServiceMock);
    });

    it('should create a token response with the requested scope and without a refresh token if its service is not provided.', async () => {
      Reflect.deleteProperty(grantType, 'refreshTokenService');
      Object.assign(parameters, { username: 'username1', password: 'password1', scope: 'bar foo' });

      await expect(grantType.handle(parameters, clients[0])).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'bar foo',
      });

      Reflect.set(grantType, 'refreshTokenService', refreshTokenServiceMock);
    });

    it('should create a token response with a restricted scope and without a refresh token if its service is not provided.', async () => {
      Reflect.deleteProperty(grantType, 'refreshTokenService');
      Object.assign(parameters, { username: 'username1', password: 'password1', scope: 'bar qux foo' });

      await expect(grantType.handle(parameters, clients[0])).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'bar foo',
      });

      Reflect.set(grantType, 'refreshTokenService', refreshTokenServiceMock);
    });

    it("should create a token response with the client's default scope and without a refresh token if the client does not use it.", async () => {
      Object.assign(parameters, { username: 'username1', password: 'password1' });

      await expect(grantType.handle(parameters, clients[1])).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'bar baz',
      });
    });

    it('should create a token response with the requested scope and without a refresh token if the client does not use it.', async () => {
      Object.assign(parameters, { username: 'username1', password: 'password1', scope: 'baz bar' });

      await expect(grantType.handle(parameters, clients[1])).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'baz bar',
      });
    });

    it('should create a token response with a restricted scope and without a refresh token if the client does not use it.', async () => {
      Object.assign(parameters, { username: 'username1', password: 'password1', scope: 'baz bar qux' });

      await expect(grantType.handle(parameters, clients[1])).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'baz bar',
      });
    });

    it("should create a token response with the client's default scope and with a refresh token.", async () => {
      Object.assign(parameters, { username: 'username2', password: 'password2' });

      await expect(grantType.handle(parameters, clients[0])).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo bar',
        refresh_token: 'refresh_token',
      });
    });

    it('should create a token response with the requested scope and with a refresh token.', async () => {
      Object.assign(parameters, { username: 'username2', password: 'password2', scope: 'bar foo' });

      await expect(grantType.handle(parameters, clients[0])).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'bar foo',
        refresh_token: 'refresh_token',
      });
    });

    it('should create a token response with a restricted requested scope and with a refresh token.', async () => {
      Object.assign(parameters, { username: 'username2', password: 'password2', scope: 'baz bar foo' });

      await expect(grantType.handle(parameters, clients[0])).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'bar foo',
        refresh_token: 'refresh_token',
      });
    });
  });
});
