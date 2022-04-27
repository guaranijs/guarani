import { Optional } from '@guarani/types';

import { AuthorizationServerOptions } from '../../lib/authorization-server/options/authorization-server.options';
import { AccessToken } from '../../lib/entities/access-token';
import { Client } from '../../lib/entities/client';
import { RefreshToken } from '../../lib/entities/refresh-token';
import { User } from '../../lib/entities/user';
import { InvalidGrantException } from '../../lib/exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../../lib/exceptions/invalid-request.exception';
import { InvalidScopeException } from '../../lib/exceptions/invalid-scope.exception';
import { RefreshTokenGrantType } from '../../lib/grant-types/refresh-token.grant-type';
import { ScopeHandler } from '../../lib/handlers/scope.handler';
import { RefreshTokenTokenParameters } from '../../lib/models/refresh-token.token-parameters';
import { TokenResponse } from '../../lib/models/token-response';
import { IAccessTokenService } from '../../lib/services/access-token.service.interface';
import { IRefreshTokenService } from '../../lib/services/refresh-token.service.interface';
import { GrantType } from '../../lib/types/grant-type';

const clients = <Client[]>[
  {
    id: 'client1',
    scopes: ['foo', 'bar', 'baz'],
    grantTypes: ['authorization_code', 'refresh_token'],
  },
  {
    id: 'client2',
    scopes: ['foo', 'bar', 'baz'],
    grantTypes: ['password'],
  },
];

const users = <User[]>[{ id: 'user1' }, { id: 'user2' }];

const refreshTokens = <RefreshToken[]>[
  {
    token: 'refresh_token_1',
    scopes: ['foo', 'bar'],
    isRevoked: false,
    issuedAt: new Date(),
    validAfter: new Date(),
    expiresAt: new Date(Date.now() + 86400000),
    client: clients[0],
    user: users[0],
  },
  {
    token: 'refresh_token_2',
    scopes: ['foo', 'baz'],
    isRevoked: false,
    issuedAt: new Date(),
    validAfter: new Date(),
    expiresAt: new Date(Date.now() + 3600000),
    client: clients[1],
    user: users[1],
  },
];

const authorizationServerOptionsMock = <AuthorizationServerOptions>{ scopes: ['foo', 'bar', 'baz', 'qux'] };

const scopeHandler = new ScopeHandler(authorizationServerOptionsMock);

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

const refreshTokenServiceMock: jest.Mocked<Partial<IRefreshTokenService>> = {
  createRefreshToken: jest.fn().mockImplementation(async (): Promise<RefreshToken> => {
    return <RefreshToken>{ token: 'new_refresh_token' };
  }),
  findRefreshToken: jest.fn().mockImplementation(async (token: string): Promise<Optional<RefreshToken>> => {
    return refreshTokens.find((refreshToken) => refreshToken.token === token);
  }),
  revokeRefreshToken: jest.fn(),
};

const grantType = new RefreshTokenGrantType(
  authorizationServerOptionsMock,
  scopeHandler,
  <IAccessTokenService>accessTokenServiceMock,
  <IRefreshTokenService>refreshTokenServiceMock
);

describe('Refresh Token Grant Type', () => {
  describe('name', () => {
    it('should have "refresh_token" as its name.', () => {
      expect(grantType.name).toBe<GrantType>('refresh_token');
    });
  });

  describe('handle()', () => {
    let parameters: RefreshTokenTokenParameters;

    beforeEach(() => {
      parameters = { grant_type: 'refresh_token', refresh_token: 'refresh_token_1' };
    });

    it('should reject not providing a "refresh_token" parameter.', async () => {
      Reflect.deleteProperty(parameters, 'refresh_token');
      await expect(grantType.handle(parameters, clients[0])).rejects.toThrow(InvalidRequestException);
    });

    it('should reject requesting an unsupported scope.', async () => {
      Reflect.set(parameters, 'scope', 'foo unknown bar');
      await expect(grantType.handle(parameters, clients[0])).rejects.toThrow(InvalidScopeException);
    });

    it('should reject when a refresh token is not found.', async () => {
      Reflect.set(parameters, 'refresh_token', 'unknown');
      await expect(grantType.handle(parameters, clients[0])).rejects.toThrow(InvalidGrantException);
    });

    it('should reject a mismathching client identifier.', async () => {
      await expect(grantType.handle(parameters, clients[1])).rejects.toThrow(InvalidGrantException);
    });

    it('should reject a refresh token not yet valid.', async () => {
      const oldValidAfter = refreshTokens[0].validAfter;

      Reflect.set(refreshTokens[0], 'validAfter', new Date(Date.now() + 3600000));
      await expect(grantType.handle(parameters, clients[0])).rejects.toThrow(InvalidGrantException);
      Reflect.set(refreshTokens[0], 'validAfter', oldValidAfter);
    });

    it('should reject an expired refresh token.', async () => {
      const oldExpiresAt = refreshTokens[0].expiresAt;

      Reflect.set(refreshTokens[0], 'expiresAt', new Date(Date.now() - 3600000));
      await expect(grantType.handle(parameters, clients[0])).rejects.toThrow(InvalidGrantException);
      Reflect.set(refreshTokens[0], 'expiresAt', oldExpiresAt);
    });

    it('should reject a revoked refresh token.', async () => {
      Reflect.set(refreshTokens[0], 'isRevoked', true);
      await expect(grantType.handle(parameters, clients[0])).rejects.toThrow(InvalidGrantException);
      Reflect.set(refreshTokens[0], 'isRevoked', false);
    });

    it('should reject requesting a scope not previously granted.', async () => {
      Reflect.set(parameters, 'scope', 'foo bar baz');
      await expect(grantType.handle(parameters, clients[0])).rejects.toThrow(InvalidGrantException);
    });

    it('should create a token response with the original scope and the same refresh token.', async () => {
      await expect(grantType.handle(parameters, clients[0])).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: refreshTokens[0].scopes.join(' '),
        refresh_token: refreshTokens[0].token,
      });
    });

    it('should create a token response with the requested scope and the same refresh token.', async () => {
      Reflect.set(parameters, 'scope', 'foo');

      await expect(grantType.handle(parameters, clients[0])).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo',
        refresh_token: refreshTokens[0].token,
      });
    });

    it('should create a token response with the original scope and a new refresh token.', async () => {
      const revokeSpy = jest.spyOn(refreshTokenServiceMock, 'revokeRefreshToken');
      const createSpy = jest.spyOn(refreshTokenServiceMock, 'createRefreshToken');

      Reflect.set(grantType['authorizationServerOptions'], 'enableRefreshTokenRotation', true);

      await expect(grantType.handle(parameters, clients[0])).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo bar',
        refresh_token: 'new_refresh_token',
      });

      expect(revokeSpy).toHaveBeenCalled();
      expect(createSpy).toHaveBeenCalled();

      const revokeOrder = revokeSpy.mock.invocationCallOrder[0];
      const createOrder = createSpy.mock.invocationCallOrder[0];

      expect(revokeOrder).toBeLessThan(createOrder);

      Reflect.deleteProperty(grantType['authorizationServerOptions'], 'enableRefreshTokenRotation');
    });

    it('should create a token response with the requested scope and a new refresh token.', async () => {
      const revokeSpy = jest.spyOn(refreshTokenServiceMock, 'revokeRefreshToken');
      const createSpy = jest.spyOn(refreshTokenServiceMock, 'createRefreshToken');

      Reflect.set(grantType['authorizationServerOptions'], 'enableRefreshTokenRotation', true);
      Reflect.set(parameters, 'scope', 'foo');

      await expect(grantType.handle(parameters, clients[0])).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo',
        refresh_token: 'new_refresh_token',
      });

      expect(revokeSpy).toHaveBeenCalled();
      expect(createSpy).toHaveBeenCalled();

      const revokeOrder = revokeSpy.mock.invocationCallOrder[0];
      const createOrder = createSpy.mock.invocationCallOrder[0];

      expect(revokeOrder).toBeLessThan(createOrder);

      Reflect.deleteProperty(grantType['authorizationServerOptions'], 'enableRefreshTokenRotation');
    });
  });
});
