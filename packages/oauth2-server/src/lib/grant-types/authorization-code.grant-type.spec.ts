import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';

import { AuthorizationCodeTokenContext } from '../context/token/authorization-code.token-context';
import { AccessToken } from '../entities/access-token.entity';
import { AuthorizationCode } from '../entities/authorization-code.entity';
import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Login } from '../entities/login.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InvalidGrantException } from '../exceptions/invalid-grant.exception';
import { IdTokenHandler } from '../handlers/id-token.handler';
import { Logger } from '../logger/logger';
import { PkceInterface } from '../pkces/pkce.interface';
import { PKCE } from '../pkces/pkce.token';
import { TokenResponse } from '../responses/token-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { AuthorizationCodeServiceInterface } from '../services/authorization-code.service.interface';
import { AUTHORIZATION_CODE_SERVICE } from '../services/authorization-code.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { AuthorizationCodeGrantType } from './authorization-code.grant-type';
import { GrantTypeInterface } from './grant-type.interface';
import { GrantType } from './grant-type.type';

jest.mock('../handlers/id-token.handler');
jest.mock('../logger/logger');

describe('Authorization Code Grant Type', () => {
  let container: DependencyInjectionContainer;
  let grantType: AuthorizationCodeGrantType;

  const loggerMock = jest.mocked(Logger.prototype);

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

  const idTokenHandlerMock = jest.mocked(IdTokenHandler.prototype);

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
    container.bind<AuthorizationCodeServiceInterface>(AUTHORIZATION_CODE_SERVICE).toValue(authorizationCodeServiceMock);
    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind<RefreshTokenServiceInterface>(REFRESH_TOKEN_SERVICE).toValue(refreshTokenServiceMock);
    container.bind(IdTokenHandler).toValue(idTokenHandlerMock);
    container.bind(AuthorizationCodeGrantType).toSelf().asSingleton();

    pkceMethodsMocks.forEach((pkceMethod) => container.bind<PkceInterface>(PKCE).toValue(pkceMethod));

    grantType = container.resolve(AuthorizationCodeGrantType);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "authorization_code" as its name.', () => {
      expect(grantType.name).toEqual<GrantType>('authorization_code');
    });
  });

  describe('handle()', () => {
    let context: AuthorizationCodeTokenContext;
    let client: Client;
    let login: Login;
    let consent: Consent;
    let authorizationCode: AuthorizationCode;

    beforeEach(() => {
      const now = Date.now();

      client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        grantTypes: ['authorization_code', 'refresh_token'],
      });

      login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), {
        id: 'login_id',
        createdAt: new Date(Date.now()),
      });

      consent = Object.assign<Consent, Partial<Consent>>(Reflect.construct(Consent, []), {
        id: 'consent_id',
        scopes: ['foo', 'bar', 'baz'],
        client,
      });

      authorizationCode = Object.assign<AuthorizationCode, Partial<AuthorizationCode>>(
        Reflect.construct(AuthorizationCode, []),
        {
          id: 'authorization_code',
          isRevoked: false,
          parameters: {
            response_type: 'code',
            client_id: 'client_id',
            redirect_uri: 'https://client.example.com/oauth/callback',
            code_challenge: 'qoJXAtQ-gjzfDmoMrHt1a2AFVe1Tn3-HX0VC2_UtezA',
            code_challenge_method: 'S256',
            scope: 'foo bar baz',
            state: 'client_state',
            response_mode: 'form_post',
            nonce: 'client_nonce',
            prompt: 'consent',
            display: 'popup',
            max_age: '300',
            login_hint: 'login_hint',
            id_token_hint: 'id_token_hint',
            ui_locales: 'pt-BR en',
            acr_values: 'urn:guarani:acr:2fa urn:guarani:acr:1fa',
          },
          issuedAt: new Date(now),
          expiresAt: new Date(now + 300000),
          validAfter: new Date(now),
          login,
          consent,
        },
      );

      context = <AuthorizationCodeTokenContext>{
        parameters: {
          grant_type: 'authorization_code',
          code: 'authorization_code',
          code_verifier: 'code_challenge',
          redirect_uri: 'https://client.example.com/oauth/callback',
        },
        client,
        grantType: <GrantTypeInterface>{
          name: 'authorization_code',
          handle: jest.fn(),
        },
        authorizationCode,
        redirectUri: new URL('https://client.example.com/oauth/callback'),
        codeVerifier: 'code_challenge',
      };
    });

    it('should throw on a mismatching client identifier.', async () => {
      const anotherClient: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'another_client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        grantTypes: ['authorization_code', 'refresh_token'],
      });

      Reflect.set(consent, 'client', anotherClient);

      await expect(grantType.handle(context)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'Mismatching Client Identifier.',
      );

      expect(authorizationCodeServiceMock.revoke).toHaveBeenCalledTimes(1);
    });

    it('should throw on an authorization code not yet valid.', async () => {
      Reflect.set(authorizationCode, 'validAfter', new Date(Date.now() + 3600000));

      await expect(grantType.handle(context)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'Authorization Code not yet valid.',
      );

      expect(authorizationCodeServiceMock.revoke).toHaveBeenCalledTimes(1);
    });

    it('should throw on an expired authorization code.', async () => {
      Reflect.set(authorizationCode, 'expiresAt', new Date(Date.now() - 300000));

      await expect(grantType.handle(context)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'Expired Authorization Code.',
      );

      expect(authorizationCodeServiceMock.revoke).toHaveBeenCalledTimes(1);
    });

    it('should throw on a revoked authorization code.', async () => {
      Reflect.set(authorizationCode, 'isRevoked', true);

      await expect(grantType.handle(context)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'Revoked Authorization Code.',
      );

      expect(authorizationCodeServiceMock.revoke).toHaveBeenCalledTimes(1);
    });

    it('should throw on a mismatching redirect uri.', async () => {
      Reflect.set(context.parameters, 'redirect_uri', 'https://client.example.org/oauth/callback');
      Reflect.set(context, 'redirectUri', new URL('https://client.example.org/oauth/callback'));

      await expect(grantType.handle(context)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'Mismatching Redirect URI.',
      );

      expect(authorizationCodeServiceMock.revoke).toHaveBeenCalledTimes(1);
    });

    it('should throw on a mismatching pkce code challenge.', async () => {
      Reflect.set(context.parameters, 'code_verifier', 'another_code_challenge');
      Reflect.set(context, 'codeVerifier', 'another_code_challenge');

      pkceMethodsMocks[0]!.verify.mockReturnValueOnce(false);

      await expect(grantType.handle(context)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'Invalid PKCE Code Challenge.',
      );

      expect(authorizationCodeServiceMock.revoke).toHaveBeenCalledTimes(1);
    });

    it('should create a token response without a refresh token if its service is not provided.', async () => {
      container.delete<RefreshTokenServiceInterface>(REFRESH_TOKEN_SERVICE);
      container.delete(AuthorizationCodeGrantType);

      container.bind(AuthorizationCodeGrantType).toSelf().asSingleton();

      grantType = container.resolve(AuthorizationCodeGrantType);

      const accessToken: AccessToken = Object.assign<AccessToken, Partial<AccessToken>>(
        Reflect.construct(AccessToken, []),
        {
          id: 'access_token',
          scopes: consent.scopes,
          expiresAt: new Date(Date.now() + 86400000),
        },
      );

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);

      pkceMethodsMocks[0]!.verify.mockReturnValueOnce(true);

      await expect(grantType.handle(context)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'foo bar baz',
        refresh_token: undefined,
      });
    });

    it('should create a token response without a refresh token if the client does not use it.', async () => {
      Reflect.set(client, 'grantTypes', ['authorization_code']);

      const accessToken: AccessToken = Object.assign<AccessToken, Partial<AccessToken>>(
        Reflect.construct(AccessToken, []),
        {
          id: 'access_token',
          scopes: consent.scopes,
          expiresAt: new Date(Date.now() + 86400000),
        },
      );

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);

      pkceMethodsMocks[0]!.verify.mockReturnValueOnce(true);

      await expect(grantType.handle(context)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'foo bar baz',
        refresh_token: undefined,
      });
    });

    it('should create a token response with a refresh token.', async () => {
      const accessToken: AccessToken = Object.assign<AccessToken, Partial<AccessToken>>(
        Reflect.construct(AccessToken, []),
        {
          id: 'access_token',
          scopes: consent.scopes,
          expiresAt: new Date(Date.now() + 86400000),
        },
      );

      const refreshToken: RefreshToken = Object.assign<RefreshToken, Partial<RefreshToken>>(
        Reflect.construct(RefreshToken, []),
        { id: 'refresh_token' },
      );

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);
      refreshTokenServiceMock.create.mockResolvedValueOnce(refreshToken);

      pkceMethodsMocks[0]!.verify.mockReturnValueOnce(true);

      await expect(grantType.handle(context)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'foo bar baz',
        refresh_token: 'refresh_token',
      });
    });

    it('should create a token response with a refresh token and without an id token.', async () => {
      Reflect.set(authorizationCode.parameters, 'scope', 'openid profile email phone address');
      Reflect.set(consent, 'scopes', ['openid', 'profile', 'email', 'phone', 'address']);

      const accessToken: AccessToken = Object.assign<AccessToken, Partial<AccessToken>>(
        Reflect.construct(AccessToken, []),
        {
          id: 'access_token',
          scopes: consent.scopes,
          expiresAt: new Date(Date.now() + 86400000),
        },
      );

      const refreshToken: RefreshToken = Object.assign<RefreshToken, Partial<RefreshToken>>(
        Reflect.construct(RefreshToken, []),
        { id: 'refresh_token' },
      );

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);
      refreshTokenServiceMock.create.mockResolvedValueOnce(refreshToken);
      idTokenHandlerMock.generateIdToken.mockResolvedValueOnce('id_token');

      pkceMethodsMocks[0]!.verify.mockReturnValueOnce(true);

      await expect(grantType.handle(context)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'openid profile email phone address',
        refresh_token: 'refresh_token',
        id_token: 'id_token',
      });
    });
  });
});
