import { Nullable } from '@guarani/types';
import { secretToken } from '@guarani/utils';

import { AccessTokenEntity } from '../../lib/entities/access-token.entity';
import { ClientEntity } from '../../lib/entities/client.entity';
import { RefreshTokenEntity } from '../../lib/entities/refresh-token.entity';
import { UserEntity } from '../../lib/entities/user.entity';
import { InvalidGrantException } from '../../lib/exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../../lib/exceptions/invalid-request.exception';
import { RefreshTokenGrantType } from '../../lib/grant-types/refresh-token.grant-type';
import { SupportedGrantType } from '../../lib/grant-types/types/supported-grant-type';
import { Request } from '../../lib/http/request';
import { AccessTokenService } from '../../lib/services/access-token.service';
import { RefreshTokenService } from '../../lib/services/refresh-token.service';
import { AccessTokenResponse } from '../../lib/types/access-token.response';

const clients: ClientEntity[] = [
  {
    id: 'client1',
    secret: 'client_secret',
    scopes: ['foo', 'bar', 'baz'],
    authenticationMethod: 'client_secret_basic',
    responseTypes: ['code'],
    grantTypes: ['authorization_code'],
    redirectUris: ['https://example.com/callback'],
  },
  {
    id: 'client2',
    secret: 'secret_client',
    scopes: ['foo', 'bar', 'baz'],
    authenticationMethod: 'client_secret_basic',
    responseTypes: [],
    grantTypes: ['password'],
    redirectUris: ['https://foobar.com/callback'],
  },
];

const users: UserEntity[] = [{ id: 'user1' }, { id: 'user2' }];

const refreshTokens: RefreshTokenEntity[] = [
  {
    token: 'refresh_token_1',
    audience: clients[0].id,
    issuedAt: new Date(),
    validAfter: new Date(),
    scopes: ['foo', 'bar', 'baz'],
    grant: 'authorization_code',
    isRevoked: false,
    expiresAt: new Date(Date.now() + 86400000),
    client: clients[0],
    user: users[0],
  },
  {
    token: 'refresh_token_2',
    audience: clients[1].id,
    issuedAt: new Date(),
    validAfter: new Date(),
    scopes: ['foo', 'baz'],
    grant: 'password',
    isRevoked: false,
    expiresAt: new Date(Date.now() + 3600000),
    client: clients[1],
    user: users[1],
  },
];

const accessTokenServiceMock: jest.Mocked<AccessTokenService> = {
  createAccessToken: jest.fn(async (_grant, scopes, client, user, refreshToken): Promise<AccessTokenEntity> => {
    return {
      token: await secretToken(),
      audience: client.id,
      issuedAt: new Date(),
      validAfter: new Date(),
      tokenType: 'Bearer',
      scopes,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 300000),
      client,
      user: user!,
      refreshToken,
    };
  }),
};

const refreshTokenServiceMock: jest.Mocked<RefreshTokenService> = {
  createRefreshToken: jest.fn(async (grant, scopes, client, user): Promise<RefreshTokenEntity> => {
    return {
      token: await secretToken(16),
      audience: client.id,
      issuedAt: new Date(),
      validAfter: new Date(),
      scopes,
      grant,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 3600000),
      client,
      user,
    };
  }),
  findRefreshToken: jest.fn(async (token): Promise<Nullable<RefreshTokenEntity>> => {
    return refreshTokens.find((refreshToken) => refreshToken.token === token) ?? null;
  }),
};

const grantType = new RefreshTokenGrantType(accessTokenServiceMock, refreshTokenServiceMock);

describe('Refresh Token Grant Type', () => {
  describe('name', () => {
    it('should have "refresh_token" as its name.', () => {
      expect(grantType.name).toBe<SupportedGrantType>('refresh_token');
    });
  });

  describe('checkParameters()', () => {
    it('should reject not providing a "refresh_token" parameter.', () => {
      // @ts-expect-error Testing a private method.
      expect(() => grantType.checkParameters({})).toThrow(InvalidRequestException);
    });

    it('should not reject when providing a "refresh_token" parameter.', () => {
      // @ts-expect-error Testing a private method.
      expect(() => grantType.checkParameters({ refresh_token: 'foo' })).not.toThrow();
    });
  });

  describe('getRefreshToken()', () => {
    it('should reject when a Refresh Token is not found.', async () => {
      // @ts-expect-error Testing a private method.
      await expect(() => grantType.getRefreshToken('unknown')).rejects.toThrow(InvalidGrantException);
    });

    it('should return a Refresh Token.', async () => {
      // @ts-expect-error Testing a private method.
      await expect(grantType.getRefreshToken('refresh_token_1')).resolves.toMatchObject(refreshTokens[0]);
    });
  });

  describe('checkRefreshToken()', () => {
    let invalidRefreshToken: RefreshTokenEntity;

    beforeEach(() => {
      invalidRefreshToken = Object.assign({}, refreshTokens[0]);
    });

    it('should reject a mismatching Client Identifier.', () => {
      // @ts-expect-error Testing a private method.
      expect(() => grantType.checkRefreshToken(refreshTokens[1], clients[0])).toThrow(InvalidGrantException);
    });

    it('should reject an expired Refresh Token.', () => {
      Reflect.set(invalidRefreshToken, 'expiresAt', new Date(Date.now() - 3600000));

      // @ts-expect-error Testing a private method.
      expect(() => grantType.checkRefreshToken(invalidRefreshToken, clients[0])).toThrow(InvalidGrantException);
    });

    it('should reject a revoked Refresh Token.', () => {
      Reflect.set(invalidRefreshToken, 'isRevoked', true);

      // @ts-expect-error Testing a private method.
      expect(() => grantType.checkRefreshToken(invalidRefreshToken, clients[0])).toThrow(InvalidGrantException);
    });

    it('should not reject when the Refresh Token is valid.', () => {
      // @ts-expect-error Testing a private method.
      expect(() => grantType.checkRefreshToken(invalidRefreshToken, clients[0])).not.toThrow();
    });
  });

  describe('getScopes()', () => {
    it('should return the scopes of the Refresh Token when the Client does not request any on the Request.', () => {
      // @ts-expect-error Testing a private method.
      expect(grantType.getScopes(refreshTokens[1])).toEqual(expect.arrayContaining(['foo', 'baz']));
    });

    it('should reject when the Client requested a scope not previously granted.', () => {
      // @ts-expect-error Testing a private method.
      expect(() => grantType.getScopes(refreshTokens[1], 'foo bar')).toThrow(InvalidGrantException);
    });

    it('should return the requested subset of scopes of the Refresh Token.', () => {
      // @ts-expect-error Testing a private method.
      expect(grantType.getScopes(refreshTokens[0], 'baz bar')).toEqual(expect.arrayContaining(['baz', 'bar']));
    });
  });

  describe('createTokenResponse()', () => {
    const request = new Request({ body: {}, headers: {}, method: 'post', query: {} });

    beforeEach(() => {
      Reflect.set(request, 'body', {});
    });

    it('should create an Access Token Response with the same Refresh Token and unmodified scopes.', async () => {
      request.body.refresh_token = 'refresh_token_2';

      await expect(grantType.createTokenResponse(request, clients[1])).resolves.toMatchObject<AccessTokenResponse>({
        access_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo baz',
        refresh_token: refreshTokens[1].token,
      });
    });

    it('should create an Access Token Response with the same Refresh Token and a subset of its scopes.', async () => {
      Object.assign(request.body, { refresh_token: 'refresh_token_1', scope: 'baz bar' });

      await expect(grantType.createTokenResponse(request, clients[0])).resolves.toMatchObject<AccessTokenResponse>({
        access_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'baz bar',
        refresh_token: refreshTokens[0].token,
      });
    });
  });
});
