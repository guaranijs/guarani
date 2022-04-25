import { Nullable } from '@guarani/types';
import { secretToken } from '@guarani/utils';

import { URL } from 'url';

import { AccessTokenEntity } from '../../lib/entities/access-token.entity';
import { AuthorizationCodeEntity } from '../../lib/entities/authorization-code.entity';
import { ClientEntity } from '../../lib/entities/client.entity';
import { RefreshTokenEntity } from '../../lib/entities/refresh-token.entity';
import { UserEntity } from '../../lib/entities/user.entity';
import { InvalidGrantException } from '../../lib/exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../../lib/exceptions/invalid-request.exception';
import { AuthorizationCodeGrantType } from '../../lib/grant-types/authorization-code.grant-type';
import { AuthorizationCodeParameters } from '../../lib/grant-types/types/authorization-code.parameters';
import { SupportedGrantType } from '../../lib/grant-types/types/supported-grant-type';
import { Request } from '../../lib/http/request';
import { PkceMethod } from '../../lib/pkce/pkce-method';
import { AccessTokenService } from '../../lib/services/access-token.service';
import { AuthorizationCodeService } from '../../lib/services/authorization-code.service';
import { RefreshTokenService } from '../../lib/services/refresh-token.service';
import { AccessTokenResponse } from '../../lib/types/access-token.response';

const clients: ClientEntity[] = [
  {
    id: 'client_id',
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

const user: UserEntity = { id: 'user_id' };

const authorizationCodes: AuthorizationCodeEntity[] = [
  {
    token: 'code',
    audience: clients[0].id,
    issuedAt: new Date(),
    validAfter: new Date(),
    redirectUri: 'https://example.com/callback',
    scopes: ['foo', 'bar'],
    codeChallenge: 'code_challenge',
    codeChallengeMethod: 'plain',
    isRevoked: false,
    expiresAt: new Date(Date.now() + 86400000),
    client: clients[0],
    user,
  },
];

const pkceMethods: jest.Mocked<PkceMethod>[] = [
  { name: 'plain', verify: jest.fn((challenge, verifier) => challenge === verifier) },
  { name: 'S256', verify: jest.fn() },
];

const authorizationCodeServiceMock: jest.Mocked<AuthorizationCodeService> = {
  createAuthorizationCode: jest.fn(),
  findAuthorizationCode: jest.fn(async (code: string): Promise<Nullable<AuthorizationCodeEntity>> => {
    return authorizationCodes.find((authorizationCode) => authorizationCode.token === code) ?? null;
  }),
  revokeAuthorizationCode: jest.fn(),
};

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
  findRefreshToken: jest.fn(),
};

const grantType = new AuthorizationCodeGrantType(
  pkceMethods,
  authorizationCodeServiceMock,
  accessTokenServiceMock,
  refreshTokenServiceMock
);

describe('Authorization Code Grant Type', () => {
  describe('constructor', () => {
    it('should reject not providing any PKCE Methods.', () => {
      expect(() => {
        return new AuthorizationCodeGrantType(
          [],
          authorizationCodeServiceMock,
          accessTokenServiceMock,
          refreshTokenServiceMock
        );
      }).toThrow(TypeError);
    });
  });

  describe('name', () => {
    it('should have "authorization_code" as its name.', () => {
      expect(grantType.name).toBe<SupportedGrantType>('authorization_code');
    });
  });

  describe('checkParameters()', () => {
    let parameters: AuthorizationCodeParameters;

    beforeEach(() => {
      parameters = { grant_type: 'authorization_code', code: '', code_verifier: '', redirect_uri: '' };
    });

    const requiredParameters = ['code', 'code_verifier', 'redirect_uri'];

    it.each(requiredParameters)('should reject not passing a required parameter.', (requiredParameter) => {
      Reflect.deleteProperty(parameters, requiredParameter);

      // @ts-expect-error Testing a private method.
      expect(() => grantType.checkParameters(parameters)).toThrow(InvalidRequestException);
    });

    it('should not reject when providing all required parameters.', () => {
      // @ts-expect-error Testing a private method.
      expect(() => grantType.checkParameters(parameters)).not.toThrow();
    });
  });

  describe('getAuthorizationCode()', () => {
    it('should reject when an Authorization Code is not found.', async () => {
      // @ts-expect-error Testing a private method.
      await expect(grantType.getAuthorizationCode('unknown')).rejects.toThrow(InvalidGrantException);
    });

    it('should return an instance of an Authorization Code.', async () => {
      // @ts-expect-error Testing a private method.
      await expect(grantType.getAuthorizationCode('code')).resolves.toMatchObject(authorizationCodes[0]);
    });
  });

  describe('getPkceMethod()', () => {
    it('should reject an unsupported PKCE Method.', () => {
      // @ts-expect-error Private method and invalid PKCE Method.
      expect(() => grantType.getPkceMethod('unknown')).toThrow(InvalidRequestException);
    });
  });

  describe('checkAuthorizationCode()', () => {
    let invalidAuthorizationCode: AuthorizationCodeEntity;

    const params = <AuthorizationCodeParameters>{
      code: 'code',
      code_verifier: 'code_challenge',
      redirect_uri: 'https://example.com/callback',
    };

    beforeEach(() => {
      invalidAuthorizationCode = Object.assign({}, authorizationCodes[0]);
    });

    it('should reject a mismatching Client Identifier.', () => {
      expect(() => {
        // @ts-expect-error Testing a private method.
        grantType.checkAuthorizationCode(invalidAuthorizationCode, params, clients[1]);
      }).toThrow(InvalidGrantException);
    });

    it('should reject an expired Authorization Code.', () => {
      Reflect.set(invalidAuthorizationCode, 'expiresAt', new Date(Date.now() - 300000));

      expect(() => {
        // @ts-expect-error Testing a private method.
        grantType.checkAuthorizationCode(invalidAuthorizationCode, params, clients[0]);
      }).toThrow(InvalidGrantException);
    });

    it('should reject a revoked Authorization Code.', () => {
      Reflect.set(invalidAuthorizationCode, 'isRevoked', true);

      expect(() => {
        // @ts-expect-error Testing a private method.
        grantType.checkAuthorizationCode(invalidAuthorizationCode, params, clients[0]);
      }).toThrow(InvalidGrantException);
    });

    it('should reject a mismatching Redirect URI.', () => {
      Reflect.set(invalidAuthorizationCode, 'redirectUri', new URL('https://bad.example.com/callback'));

      expect(() => {
        // @ts-expect-error Testing a private method.
        grantType.checkAuthorizationCode(invalidAuthorizationCode, params, clients[0]);
      }).toThrow(InvalidGrantException);
    });

    it('should reject a mismatching PKCE Code Challenge.', () => {
      Reflect.set(invalidAuthorizationCode, 'codeChallenge', 'sjpqhDnA3eVRWJPnyQweMjO4YW5jRHDyDcSSi882Cbw');

      expect(() => {
        // @ts-expect-error Testing a private method.
        grantType.checkAuthorizationCode(invalidAuthorizationCode, params, clients[0]);
      }).toThrow(InvalidGrantException);
    });

    it('should not reject when the Authorization Code is valid.', () => {
      // @ts-expect-error Testing a private method.
      expect(() => grantType.checkAuthorizationCode(authorizationCodes[0], params, clients[0])).not.toThrow();
    });
  });

  describe('createTokenResponse()', () => {
    const request = new Request({
      body: { code: 'code', code_verifier: 'code_challenge', redirect_uri: 'https://example.com/callback' },
      headers: {},
      method: 'post',
      query: {},
    });

    it('should create an Access Token Response with all the scopes of the Client.', async () => {
      await expect(grantType.createTokenResponse(request, clients[0])).resolves.toMatchObject<AccessTokenResponse>({
        access_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo bar',
      });
    });

    it('should create an Access Token Response with a Refresh Token.', async () => {
      clients[0].grantTypes.push('refresh_token');

      await expect(grantType.createTokenResponse(request, clients[0])).resolves.toMatchObject<AccessTokenResponse>({
        access_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo bar',
        refresh_token: expect.any(String),
      });

      clients[0].grantTypes.pop();
    });
  });
});
