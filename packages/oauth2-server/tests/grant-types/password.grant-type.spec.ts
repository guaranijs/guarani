import { secretToken } from '@guarani/utils';

import { AccessTokenEntity } from '../../lib/entities/access-token.entity';
import { ClientEntity } from '../../lib/entities/client.entity';
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

const client = <ClientEntity>{
  id: 'client_id',
  secret: 'client_secret',
  scopes: ['foo', 'bar', 'baz'],
  authenticationMethod: 'client_secret_basic',
  responseTypes: [],
  grantTypes: ['password'],
  redirectUris: [new URL('https://example.com/callback')],
};

const users = <UserEntity[]>[
  { id: 'user1', username: 'username1', password: 'password1' },
  { id: 'user2', username: 'username2', password: 'password2' },
];

const userServiceMock: jest.Mocked<UserService> = {
  findUser: jest.fn(),
  authenticate: jest.fn(async (username, password) => {
    return users.find((user) => user.username === username && user.password === password);
  }),
};

const accessTokenServiceMock: jest.Mocked<AccessTokenService> = {
  createAccessToken: jest.fn(async (_grant, scopes, client, user, refreshToken): Promise<AccessTokenEntity> => {
    return {
      token: await secretToken(),
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
  findRefreshToken: jest.fn(),
  createRefreshToken: jest.fn(async (grant, scopes, client, user) => {
    return {
      token: await secretToken(16),
      scopes,
      grant,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 3600000),
      client,
      user,
    };
  }),
};

const grantType = new PasswordGrantType(userServiceMock, accessTokenServiceMock, refreshTokenServiceMock);

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

    it.each(mismatchingCredentials)('should reject when a User is not found.', async (username, password) => {
      // @ts-expect-error Testing a private method.
      await expect(grantType.authenticate(username, password)).rejects.toThrow(InvalidGrantException);
    });

    it('should return a User.', async () => {
      // @ts-expect-error Testing a private method.
      await expect(grantType.authenticate('username1', 'password1')).resolves.toMatchObject(users[0]);
    });
  });

  describe('createTokenResponse()', () => {
    const request = new Request({ body: {}, headers: {}, method: 'post', query: {} });

    beforeEach(() => {
      Reflect.set(request, 'body', {});
    });

    it('should create an Access Token Response with all the scopes of the Client.', async () => {
      Object.assign(request.body, { username: 'username1', password: 'password1' });

      await expect(grantType.createTokenResponse(request, client)).resolves.toMatchObject<AccessTokenResponse>({
        access_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo bar baz',
      });
    });

    it('should create an Access Token Response with the requested scopes.', async () => {
      client.grantTypes.push('refresh_token');

      Object.assign(request.body, { username: 'username2', password: 'password2', scope: 'foo baz' });

      await expect(grantType.createTokenResponse(request, client)).resolves.toMatchObject<AccessTokenResponse>({
        access_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo baz',
        refresh_token: expect.any(String),
      });

      client.grantTypes.pop();
    });
  });
});
