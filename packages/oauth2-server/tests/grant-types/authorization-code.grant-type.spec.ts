import { Optional } from '@guarani/types';

import { AccessToken } from '../../lib/entities/access-token';
import { AuthorizationCode } from '../../lib/entities/authorization-code';
import { Client } from '../../lib/entities/client';
import { RefreshToken } from '../../lib/entities/refresh-token';
import { User } from '../../lib/entities/user';
import { InvalidGrantException } from '../../lib/exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../../lib/exceptions/invalid-request.exception';
import { AuthorizationCodeGrantType } from '../../lib/grant-types/authorization-code.grant-type';
import { AuthorizationCodeTokenParameters } from '../../lib/models/authorization-code.token-parameters';
import { TokenResponse } from '../../lib/models/token-response';
import { IPkceMethod } from '../../lib/pkce/pkce-method.interface';
import { IAccessTokenService } from '../../lib/services/access-token.service.interface';
import { IAuthorizationCodeService } from '../../lib/services/authorization-code.service.interface';
import { IRefreshTokenService } from '../../lib/services/refresh-token.service.interface';
import { GrantType } from '../../lib/types/grant-type';

const clients = <Client[]>[
  {
    id: 'client_id',
    scopes: ['foo', 'bar', 'baz'],
    grantTypes: ['authorization_code', 'refresh_token'],
    redirectUris: ['https://example.com/callback'],
  },
  {
    id: 'client2',
    scopes: ['foo', 'bar', 'baz'],
    grantTypes: ['password'],
    redirectUris: ['https://foobar.com/callback'],
  },
];

const user = <User>{ id: 'user_id' };

const authorizationCodes = <AuthorizationCode[]>[
  {
    code: 'code',
    redirectUri: 'https://example.com/callback',
    scopes: ['foo', 'bar'],
    codeChallenge: 'code_challenge',
    codeChallengeMethod: 'plain',
    isRevoked: false,
    issuedAt: new Date(Date.now() - 15000),
    validAfter: new Date(Date.now() - 15000),
    expiresAt: new Date(Date.now() + 3600000),
    client: clients[0],
    user,
  },
];

const pkceMethods: jest.Mocked<IPkceMethod>[] = [{ name: 'plain', verify: jest.fn() }];

const authorizationCodeServiceMock: jest.Mocked<Partial<IAuthorizationCodeService>> = {
  findAuthorizationCode: jest.fn().mockImplementation(async (code: string): Promise<Optional<AuthorizationCode>> => {
    return authorizationCodes.find((authorizationCode) => authorizationCode.code === code);
  }),
  revokeAuthorizationCode: jest.fn(),
};

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
    return <RefreshToken>{ token: 'refresh_token' };
  }),
};

const grantType = new AuthorizationCodeGrantType(
  pkceMethods,
  <IAuthorizationCodeService>authorizationCodeServiceMock,
  <IAccessTokenService>accessTokenServiceMock,
  <IRefreshTokenService>refreshTokenServiceMock
);

describe('Authorization Code Grant Type', () => {
  describe('name', () => {
    it('should have "authorization_code" as its name.', () => {
      expect(grantType.name).toBe<GrantType>('authorization_code');
    });
  });

  describe('constructor', () => {
    it('should reject not providing any pkce methods.', () => {
      expect(() => new AuthorizationCodeGrantType([], <any>{}, <any>{}, <any>{})).toThrow(TypeError);
    });
  });

  describe('handle()', () => {
    const revokeSpy = jest.spyOn(authorizationCodeServiceMock, 'revokeAuthorizationCode');

    let parameters: AuthorizationCodeTokenParameters;

    beforeEach(() => {
      parameters = {
        grant_type: 'authorization_code',
        code: 'code',
        code_verifier: 'code_challenge',
        redirect_uri: 'https://example.com/callback',
      };

      pkceMethods[0].verify.mockRestore();
    });

    it('should reject not providing a "code" parameter.', async () => {
      Reflect.deleteProperty(parameters, 'code');

      await expect(grantType.handle(parameters, clients[0])).rejects.toThrow(InvalidRequestException);
      expect(revokeSpy).not.toHaveBeenCalled();
    });

    it('should reject not providing a "code_verifier" parameter.', async () => {
      Reflect.deleteProperty(parameters, 'code_verifier');

      await expect(grantType.handle(parameters, clients[0])).rejects.toThrow(InvalidRequestException);
      expect(revokeSpy).not.toHaveBeenCalled();
    });

    it('should reject not providing a "redirect_uri" parameter.', async () => {
      Reflect.deleteProperty(parameters, 'redirect_uri');

      await expect(grantType.handle(parameters, clients[0])).rejects.toThrow(InvalidRequestException);
      expect(revokeSpy).not.toHaveBeenCalled();
    });

    it('should reject when an authorization code is not found.', async () => {
      Reflect.set(parameters, 'code', 'unknown');

      await expect(grantType.handle(parameters, clients[0])).rejects.toThrow(InvalidGrantException);
      expect(revokeSpy).not.toHaveBeenCalled();
    });

    it('should reject a mismatching client identifier.', async () => {
      await expect(grantType.handle(parameters, clients[1])).rejects.toThrow(InvalidGrantException);
      expect(revokeSpy).toHaveBeenCalled();
    });

    it('should reject an authorization code not yet valid.', async () => {
      const oldValidAfter = authorizationCodes[0].validAfter;

      Reflect.set(authorizationCodes[0], 'validAfter', new Date(Date.now() + 3600000));

      await expect(grantType.handle(parameters, clients[0])).rejects.toThrow(InvalidGrantException);
      expect(revokeSpy).toHaveBeenCalled();

      Reflect.set(authorizationCodes[0], 'validAfter', oldValidAfter);
    });

    it('should reject an expired authorization code.', async () => {
      const oldExpiresAt = authorizationCodes[0].expiresAt;

      Reflect.set(authorizationCodes[0], 'expiresAt', new Date(Date.now() - 300000));

      await expect(grantType.handle(parameters, clients[0])).rejects.toThrow(InvalidGrantException);
      expect(revokeSpy).toHaveBeenCalled();

      Reflect.set(authorizationCodes[0], 'expiresAt', oldExpiresAt);
    });

    it('should reject a revoked authorization code.', async () => {
      Reflect.set(authorizationCodes[0], 'isRevoked', true);

      await expect(grantType.handle(parameters, clients[0])).rejects.toThrow(InvalidGrantException);
      expect(revokeSpy).toHaveBeenCalled();

      Reflect.set(authorizationCodes[0], 'isRevoked', false);
    });

    it('should reject a mismatching redirect uri.', async () => {
      const oldRedirectUri = authorizationCodes[0].redirectUri;

      Reflect.set(authorizationCodes[0], 'redirectUri', 'https://bad.example.com/callback');

      await expect(grantType.handle(parameters, clients[0])).rejects.toThrow(InvalidGrantException);
      expect(revokeSpy).toHaveBeenCalled();

      Reflect.set(authorizationCodes[0], 'redirectUri', oldRedirectUri);
    });

    it('should reject using an unsupported pkce method.', async () => {
      const oldCodeChallengeMethod = authorizationCodes[0].codeChallengeMethod;

      Reflect.set(authorizationCodes[0], 'codeChallengeMethod', 'S256');

      await expect(grantType.handle(parameters, clients[0])).rejects.toThrow(InvalidRequestException);
      expect(revokeSpy).toHaveBeenCalled();

      Reflect.set(authorizationCodes[0], 'codeChallengeMethod', oldCodeChallengeMethod);
    });

    it('should reject a mismatching pkce code challenge.', async () => {
      pkceMethods[0].verify.mockReturnValue(false);

      await expect(grantType.handle(parameters, clients[0])).rejects.toThrow(InvalidGrantException);
      expect(revokeSpy).toHaveBeenCalled();
    });

    it('should create a token response without a refresh token if its service is not provided.', async () => {
      pkceMethods[0].verify.mockReturnValue(true);

      Reflect.deleteProperty(grantType, 'refreshTokenService');

      await expect(grantType.handle(parameters, clients[0])).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo bar',
      });

      Reflect.set(grantType, 'refreshTokenService', refreshTokenServiceMock);
    });

    it('should create a token response without a refresh token if the client does not use it.', async () => {
      pkceMethods[0].verify.mockReturnValue(true);

      clients[0].grantTypes!.pop();

      await expect(grantType.handle(parameters, clients[0])).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo bar',
      });

      clients[0].grantTypes!.push('refresh_token');
    });

    it('should create a token response with a refresh token.', async () => {
      pkceMethods[0].verify.mockReturnValue(true);

      await expect(grantType.handle(parameters, clients[0])).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo bar',
        refresh_token: 'refresh_token',
      });
    });
  });
});
