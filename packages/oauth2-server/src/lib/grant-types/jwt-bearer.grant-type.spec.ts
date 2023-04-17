import { DependencyInjectionContainer } from '@guarani/di';
import {
  JsonWebSignature,
  JsonWebSignatureHeaderParameters,
  JsonWebTokenClaims,
  JsonWebTokenClaimsParameters,
  OctetSequenceKey,
} from '@guarani/jose';

import { Buffer } from 'buffer';

import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { ScopeHandler } from '../handlers/scope.handler';
import { JwtBearerTokenRequest } from '../requests/token/jwt-bearer.token-request';
import { TokenResponse } from '../responses/token-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { JwtBearerGrantType } from './jwt-bearer.grant-type';

const now = Date.now();

const octKey = new OctetSequenceKey({
  kty: 'oct',
  k: Buffer.from('qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ', 'utf8').toString('base64url'),
});

const octHeader: JsonWebSignatureHeaderParameters = { alg: 'HS256', typ: 'JWT' };

const claims: JsonWebTokenClaimsParameters = {
  iss: 'client_id',
  sub: 'user_id',
  aud: 'https://server.example.com/oauth/token',
  iat: now,
  exp: now + 86400,
};

describe('JWT Bearer Grant Type', () => {
  let container: DependencyInjectionContainer;
  let grantType: JwtBearerGrantType;

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  const userServiceMock = jest.mocked<UserServiceInterface>({
    findOne: jest.fn(),
  });

  const settings = <Settings>{ issuer: 'https://server.example.com', scopes: ['foo', 'bar', 'baz', 'qux'] };

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind<UserServiceInterface>(USER_SERVICE).toValue(userServiceMock);
    container.bind(ScopeHandler).toSelf().asSingleton();
    container.bind(JwtBearerGrantType).toSelf().asSingleton();

    grantType = container.resolve(JwtBearerGrantType);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('handle()', () => {
    let parameters: JwtBearerTokenRequest;

    beforeEach(() => {
      parameters = { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: '' };
    });

    it('should create a token response with a restricted scope.', async () => {
      const client = <Client>{
        id: 'client_id',
        secret: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ',
        scopes: ['foo', 'bar', 'baz'],
      };

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{ handle: 'access_token', scopes, expiresAt: new Date(Date.now() + 300000) };
      });

      userServiceMock.findOne.mockResolvedValueOnce({ id: 'user_id' });

      const jws = new JsonWebSignature(octHeader, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(octKey);

      Reflect.set(parameters, 'assertion', assertion);
      Reflect.set(parameters, 'scope', 'foo qux baz');

      await expect(grantType.handle(parameters, client)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 300,
        scope: 'foo baz',
      });

      expect(accessTokenServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should create a token response with the requested scope.', async () => {
      const client = <Client>{
        id: 'client_id',
        secret: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ',
        scopes: ['foo', 'bar', 'baz'],
      };

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{ handle: 'access_token', scopes, expiresAt: new Date(Date.now() + 300000) };
      });

      userServiceMock.findOne.mockResolvedValueOnce({ id: 'user_id' });

      const jws = new JsonWebSignature(octHeader, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(octKey);

      Reflect.set(parameters, 'assertion', assertion);
      Reflect.set(parameters, 'scope', 'baz foo');

      await expect(grantType.handle(parameters, client)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 300,
        scope: 'baz foo',
      });

      expect(accessTokenServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should create a token response with the default scope of the client.', async () => {
      const client = <Client>{
        id: 'client_id',
        secret: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ',
        scopes: ['foo', 'bar', 'baz'],
      };

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{ handle: 'access_token', scopes, expiresAt: new Date(Date.now() + 300000) };
      });

      userServiceMock.findOne.mockResolvedValueOnce({ id: 'user_id' });

      const jws = new JsonWebSignature(octHeader, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(octKey);

      Reflect.set(parameters, 'assertion', assertion);

      await expect(grantType.handle(parameters, client)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 300,
        scope: 'foo bar baz',
      });

      expect(accessTokenServiceMock.create).toHaveBeenCalledTimes(1);
    });
  });
});
