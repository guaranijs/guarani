import { Optional } from '@guarani/types';
import { secretToken } from '@guarani/utils';

import { AccessTokenEntity } from '../../lib/entities/access-token.entity';
import { ClientEntity } from '../../lib/entities/client.entity';
import { RefreshTokenEntity } from '../../lib/entities/refresh-token.entity';
import { UserEntity } from '../../lib/entities/user.entity';
import { InvalidGrantException } from '../../lib/exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../../lib/exceptions/invalid-request.exception';
import { PasswordGrantType } from '../../lib/grant-types/password.grant-type';
import { PasswordParameters } from '../../lib/grant-types/types/password.parameters';
import { SupportedGrantType } from '../../lib/grant-types/types/supported-grant-type';
import { Request } from '../../lib/http/request';
import { AccessTokenService } from '../../lib/services/access-token.service';
import { RefreshTokenService } from '../../lib/services/refresh-token.service';
import { UserService } from '../../lib/services/user.service';
import { AccessTokenResponse } from '../../lib/types/access-token.response';

const users = <UserEntity[]>[
  { id: 'user1', username: 'username1', password: 'password1' },
  { id: 'user2', username: 'username2', password: 'password2' },
];

const userServiceMock = <UserService>{
  authenticate: async (username: string, password: string): Promise<Optional<UserEntity>> => {
    return users.find((user) => user.username === username && user.password === password);
  },
};

const accessTokenServiceMock = <AccessTokenService>{
  createAccessToken: async (
    _grant: SupportedGrantType,
    scopes: string[],
    client: ClientEntity,
    user: UserEntity,
    refreshToken: Optional<RefreshTokenEntity>
  ): Promise<AccessTokenEntity> => {
    const expiration = new Date();
    expiration.setUTCSeconds(expiration.getUTCSeconds() + 300);

    return {
      token: await secretToken(),
      tokenType: 'Bearer',
      scopes,
      isRevoked: false,
      expiresAt: expiration,
      client,
      user,
      refreshToken,
    };
  },
};

const refreshTokenServiceMock = <RefreshTokenService>{
  createRefreshToken: async (
    grant: SupportedGrantType,
    scopes: string[],
    client: ClientEntity,
    user: UserEntity
  ): Promise<RefreshTokenEntity> => {
    const expiration = new Date();
    expiration.setUTCSeconds(expiration.getUTCSeconds() + 3600);

    return { token: await secretToken(16), scopes, grant, isRevoked: false, expiresAt: expiration, client, user };
  },
};

const grantType = new PasswordGrantType(userServiceMock, accessTokenServiceMock, refreshTokenServiceMock);

const client = <ClientEntity>{
  id: 'client_id',
  secret: 'client_secret',
  scopes: ['foo', 'bar', 'baz'],
  authenticationMethod: 'client_secret_basic',
  responseTypes: [],
  grantTypes: ['password'],
  redirectUris: [new URL('https://example.com/callback')],
};

describe('Password Grant Type', () => {
  describe('name', () => {
    it('should have "password" as its name.', () => {
      expect(grantType.name).toBe<SupportedGrantType>('password');
    });
  });

  describe('checkParameters()', () => {
    let parameters: PasswordParameters;

    beforeEach(() => {
      parameters = { grant_type: 'password', username: '', password: '' };
    });

    it.each(['username', 'password'])('should reject not passing a required parameter.', (parameter) => {
      Reflect.deleteProperty(parameters, parameter);

      // @ts-expect-error Testing a private method.
      expect(() => grantType.checkParameters(parameters)).toThrow(InvalidRequestException);
    });

    it('should not reject when providing all required parameters.', () => {
      // @ts-expect-error Testing a private method.
      expect(() => grantType.checkParameters(parameters)).not.toThrow();
    });
  });

  describe('authenticate()', () => {
    const mismatchingCredentials: [string, string][] = [
      ['unknown', 'unknown'],
      ['username1', 'password2'],
      ['username2', 'foobar'],
    ];

    it.each(mismatchingCredentials)('should reject when a User is not found.', (username, password) => {
      // @ts-expect-error Testing a private method.
      expect(grantType.authenticate(username, password)).rejects.toThrow(InvalidGrantException);
    });

    it('should return a User.', () => {
      // @ts-expect-error Testing a private method.
      expect(grantType.authenticate('username1', 'password1')).resolves.toMatchObject(users[0]);
    });
  });

  describe('createTokenResponse()', () => {
    let request: Request;

    beforeEach(() => {
      request = new Request({ body: {}, headers: {}, method: 'post', query: {} });
      client.grantTypes = ['password'];
    });

    it('should create an Access Token Response with all the scopes of the Client.', () => {
      Reflect.set(request, 'body', { username: 'username1', password: 'password1' });

      expect(grantType.createTokenResponse(request, client)).resolves.toMatchObject<AccessTokenResponse>({
        access_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo bar baz',
      });
    });

    it('should create an Access Token Response with the requested scopes.', () => {
      const previousGrantTypes = client.grantTypes;

      Reflect.set(client, 'grantTypes', [...previousGrantTypes, 'refresh_token']);
      Reflect.set(request, 'body', { username: 'username2', password: 'password2', scope: 'foo baz' });

      expect(grantType.createTokenResponse(request, client)).resolves.toMatchObject<AccessTokenResponse>({
        access_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo baz',
        refresh_token: expect.any(String),
      });
    });
  });
});
