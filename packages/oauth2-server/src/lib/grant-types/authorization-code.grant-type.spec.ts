import { DependencyInjectionContainer } from '@guarani/di';

import { AccessToken } from '../entities/access-token.entity';
import { AuthorizationCode } from '../entities/authorization-code.entity';
import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InvalidGrantException } from '../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { AuthorizationCodeTokenRequest } from '../messages/authorization-code.token-request';
import { TokenResponse } from '../messages/token-response';
import { PkceMethod } from '../pkce/pkce-method.type';
import { PkceInterface } from '../pkce/pkce.interface';
import { PKCE } from '../pkce/pkce.token';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { AuthorizationCodeServiceInterface } from '../services/authorization-code.service.interface';
import { AUTHORIZATION_CODE_SERVICE } from '../services/authorization-code.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { AuthorizationCodeGrantType } from './authorization-code.grant-type';

describe('Authorization Code Grant Type', () => {
  let grantType: AuthorizationCodeGrantType;

  const authorizationCodeServiceMock = jest.mocked<AuthorizationCodeServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

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

  const pkceMethodsMocks = [
    jest.mocked<PkceInterface>({ name: 'S256', verify: jest.fn() }),
    jest.mocked<PkceInterface>({ name: 'plain', verify: jest.fn() }),
  ];

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind<AuthorizationCodeServiceInterface>(AUTHORIZATION_CODE_SERVICE).toValue(authorizationCodeServiceMock);
    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind<RefreshTokenServiceInterface>(REFRESH_TOKEN_SERVICE).toValue(refreshTokenServiceMock);
    container.bind(AuthorizationCodeGrantType).toSelf().asSingleton();

    pkceMethodsMocks.forEach((pkceMethod) => container.bind<PkceInterface>(PKCE).toValue(pkceMethod));

    grantType = container.resolve(AuthorizationCodeGrantType);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "authorization_code" as its name.', () => {
      expect(grantType.name).toBe('authorization_code');
    });
  });

  describe('constructor', () => {
    it('should reject not providing any pkce methods.', () => {
      expect(() => new AuthorizationCodeGrantType([], <any>{}, <any>{}, <any>{})).toThrow(TypeError);
    });
  });

  describe('handle()', () => {
    let parameters: AuthorizationCodeTokenRequest;

    beforeEach(() => {
      parameters = {
        grant_type: 'authorization_code',
        code: 'code',
        code_verifier: 'code_challenge',
        redirect_uri: 'https://example.com/callback',
      };
    });

    it('should throw when not providing a "code" parameter.', async () => {
      Reflect.deleteProperty(parameters, 'code');

      const client = <Client>{};

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "code".' })
      );

      expect(authorizationCodeServiceMock.revoke).not.toHaveBeenCalled();
    });

    it('should throw when not providing a "code_verifier" parameter.', async () => {
      Reflect.deleteProperty(parameters, 'code_verifier');

      const client = <Client>{};

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "code_verifier".' })
      );

      expect(authorizationCodeServiceMock.revoke).not.toHaveBeenCalled();
    });

    it('should throw when not providing a "redirect_uri" parameter.', async () => {
      Reflect.deleteProperty(parameters, 'redirect_uri');

      const client = <Client>{};

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "redirect_uri".' })
      );

      expect(authorizationCodeServiceMock.revoke).not.toHaveBeenCalled();
    });

    it('should throw when an authorization code is not found.', async () => {
      Reflect.set(parameters, 'code', 'unknown');

      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(null);

      const client = <Client>{};

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'Invalid Authorization Code.' })
      );

      expect(authorizationCodeServiceMock.revoke).not.toHaveBeenCalled();
    });

    it('should throw on a mismatching client identifier.', async () => {
      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(<AuthorizationCode>{
        client: { id: 'another_client_id' },
      });

      const client = <Client>{ id: 'client_id' };

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'Mismatching Client Identifier.' })
      );

      expect(authorizationCodeServiceMock.revoke).toHaveBeenCalledTimes(1);
    });

    it('should throw on an authorization code not yet valid.', async () => {
      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(<AuthorizationCode>{
        validAfter: new Date(Date.now() + 3600000),
        client: { id: 'client_id' },
      });

      const client = <Client>{ id: 'client_id' };

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'Authorization Code not yet valid.' })
      );

      expect(authorizationCodeServiceMock.revoke).toHaveBeenCalledTimes(1);
    });

    it('should throw on an expired authorization code.', async () => {
      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(<AuthorizationCode>{
        expiresAt: new Date(Date.now() - 300000),
        client: { id: 'client_id' },
      });

      const client = <Client>{ id: 'client_id' };

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'Expired Authorization Code.' })
      );

      expect(authorizationCodeServiceMock.revoke).toHaveBeenCalledTimes(1);
    });

    it('should throw on a revoked authorization code.', async () => {
      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(<AuthorizationCode>{
        isRevoked: true,
        expiresAt: new Date(Date.now() + 3600000),
        client: { id: 'client_id' },
      });

      const client = <Client>{ id: 'client_id' };

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'Revoked Authorization Code.' })
      );

      expect(authorizationCodeServiceMock.revoke).toHaveBeenCalledTimes(1);
    });

    it('should throw on a mismatching redirect uri.', async () => {
      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(<AuthorizationCode>{
        redirectUri: 'https://bad.example.com/callback',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 3600000),
        client: { id: 'client_id' },
      });

      const client = <Client>{ id: 'client_id', redirectUris: ['https://example.com/callback'] };

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'Mismatching Redirect URI.' })
      );

      expect(authorizationCodeServiceMock.revoke).toHaveBeenCalledTimes(1);
    });

    it('should throw when using an unsupported pkce method.', async () => {
      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(<AuthorizationCode>{
        redirectUri: 'https://example.com/callback',
        codeChallengeMethod: <PkceMethod>'unknown',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 3600000),
        client: { id: 'client_id' },
      });

      const client = <Client>{ id: 'client_id', redirectUris: ['https://example.com/callback'] };

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidRequestException({ description: 'Unsupported PKCE Method "unknown".' })
      );

      expect(authorizationCodeServiceMock.revoke).toHaveBeenCalledTimes(1);
    });

    it('should throw on a mismatching pkce code challenge.', async () => {
      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(<AuthorizationCode>{
        redirectUri: 'https://example.com/callback',
        codeChallenge: 'code_challenge',
        codeChallengeMethod: 'plain',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 3600000),
        client: { id: 'client_id' },
      });

      pkceMethodsMocks[1]!.verify.mockReturnValueOnce(false);

      const client = <Client>{ id: 'client_id', redirectUris: ['https://example.com/callback'] };

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'Invalid PKCE Code Challenge.' })
      );

      expect(authorizationCodeServiceMock.revoke).toHaveBeenCalledTimes(1);
    });

    it('should create a token response without a refresh token if its service is not provided.', async () => {
      const now = Date.now();

      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(<AuthorizationCode>{
        redirectUri: 'https://example.com/callback',
        codeChallenge: 'code_challenge',
        codeChallengeMethod: 'plain',
        isRevoked: false,
        expiresAt: new Date(now + 3600000),
        client: { id: 'client_id' },
      });

      accessTokenServiceMock.create.mockResolvedValueOnce(<AccessToken>{
        handle: 'access_token',
        expiresAt: new Date(now + 86400000),
        scopes: ['foo', 'bar'],
      });

      pkceMethodsMocks[1]!.verify.mockReturnValueOnce(true);

      const client = <Client>{
        id: 'client_id',
        grantTypes: ['authorization_code'],
        redirectUris: ['https://example.com/callback'],
      };

      Reflect.deleteProperty(grantType, 'refreshTokenService');

      await expect(grantType.handle(parameters, client)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'foo bar',
        refresh_token: undefined,
      });
    });

    it('should create a token response without a refresh token if the client does not use it.', async () => {
      const now = Date.now();

      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(<AuthorizationCode>{
        redirectUri: 'https://example.com/callback',
        codeChallenge: 'code_challenge',
        codeChallengeMethod: 'plain',
        isRevoked: false,
        expiresAt: new Date(now + 3600000),
        client: { id: 'client_id' },
      });

      accessTokenServiceMock.create.mockResolvedValueOnce(<AccessToken>{
        handle: 'access_token',
        expiresAt: new Date(now + 86400000),
        scopes: ['foo', 'bar'],
      });

      pkceMethodsMocks[1]!.verify.mockReturnValueOnce(true);

      const client = <Client>{
        id: 'client_id',
        grantTypes: ['authorization_code'],
        redirectUris: ['https://example.com/callback'],
      };

      await expect(grantType.handle(parameters, client)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'foo bar',
        refresh_token: undefined,
      });
    });

    it('should create a token response with a refresh token.', async () => {
      const now = Date.now();

      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(<AuthorizationCode>{
        redirectUri: 'https://example.com/callback',
        codeChallenge: 'code_challenge',
        codeChallengeMethod: 'plain',
        isRevoked: false,
        expiresAt: new Date(now + 3600000),
        client: { id: 'client_id' },
      });

      accessTokenServiceMock.create.mockResolvedValueOnce(<AccessToken>{
        handle: 'access_token',
        expiresAt: new Date(now + 86400000),
        scopes: ['foo', 'bar'],
      });

      refreshTokenServiceMock.create.mockResolvedValueOnce(<RefreshToken>{ handle: 'refresh_token' });

      pkceMethodsMocks[1]!.verify.mockReturnValueOnce(true);

      const client = <Client>{
        id: 'client_id',
        grantTypes: ['authorization_code', 'refresh_token'],
        redirectUris: ['https://example.com/callback'],
      };

      await expect(grantType.handle(parameters, client)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'foo bar',
        refresh_token: 'refresh_token',
      });
    });
  });
});
