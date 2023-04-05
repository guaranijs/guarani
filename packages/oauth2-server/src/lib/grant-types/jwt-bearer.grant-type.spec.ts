import { DependencyInjectionContainer } from '@guarani/di';
import {
  EllipticCurveKey,
  JsonWebSignature,
  JsonWebSignatureHeaderParameters,
  JsonWebTokenClaims,
  JsonWebTokenClaimsParameters,
  JsonWebSignatureAlgorithm,
  OctetSequenceKey,
  JsonWebKeyParameters,
} from '@guarani/jose';

import { Buffer } from 'buffer';

import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { InvalidGrantException } from '../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { InvalidScopeException } from '../exceptions/invalid-scope.exception';
import { ScopeHandler } from '../handlers/scope.handler';
import { JwtBearerTokenRequest } from '../requests/token/jwt-bearer.token-request';
import { TokenResponse } from '../responses/token-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { GrantType } from './grant-type.type';
import { JwtBearerGrantType } from './jwt-bearer.grant-type';

const now = Date.now();

const octKey = new OctetSequenceKey({
  kty: 'oct',
  k: Buffer.from('qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ', 'utf8').toString('base64url'),
});

const eckey = new EllipticCurveKey({
  kty: 'EC',
  crv: 'P-256',
  x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
  y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
  d: 'bwVX6Vx-TOfGKYOPAcu2xhaj3JUzs-McsC-suaHnFBo',
  kid: 'ec-key',
});

const octHeader: JsonWebSignatureHeaderParameters = { alg: 'HS256', typ: 'JWT' };
const ecHeader: JsonWebSignatureHeaderParameters = { alg: 'ES256', typ: 'JWT', kid: 'ec-key' };

const claims: JsonWebTokenClaimsParameters = {
  iss: 'client_id',
  sub: 'user_id',
  aud: 'https://server.example.com/oauth/token',
  iat: now,
  exp: now + 86400,
};

const invalidTokenFormats: string[] = ['', 'a', '.a', '.a.b', 'a.b', 'a.b.c.d'];

describe('JWT Bearer Grant Type', () => {
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
    const container = new DependencyInjectionContainer();

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

  describe('algorithms', () => {
    it('should have \'["ES256", "ES384", "ES512", "EdDSA", "HS256", "HS384", "HS512", "PS256", "PS384", "PS512", "RS256", "RS384", "RS512"]\' as its value', () => {
      expect(grantType['algorithms']).toEqual<Exclude<JsonWebSignatureAlgorithm, 'none'>[]>([
        'ES256',
        'ES384',
        'ES512',
        'EdDSA',
        'HS256',
        'HS384',
        'HS512',
        'PS256',
        'PS384',
        'PS512',
        'RS256',
        'RS384',
        'RS512',
      ]);
    });
  });

  describe('name', () => {
    it('should have "urn:ietf:params:oauth:grant-type:jwt-bearer" as its value.', () => {
      expect(grantType.name).toEqual<GrantType>('urn:ietf:params:oauth:grant-type:jwt-bearer');
    });
  });

  describe('handle()', () => {
    let parameters: JwtBearerTokenRequest;

    beforeEach(() => {
      parameters = { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: '' };
    });

    it('should throw when not providing an "assertion" parameter.', async () => {
      Reflect.deleteProperty(parameters, 'assertion');

      const client = <Client>{};

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "assertion".' })
      );
    });

    it('should throw when requesting an unsupported scope.', async () => {
      Reflect.set(parameters, 'scope', 'foo unknown bar');

      const client = <Client>{};

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidScopeException({ description: `Unsupported scope "unknown".` })
      );
    });

    it.each(invalidTokenFormats)('should throw when the provided assertion is invalid.', async (assertion) => {
      Reflect.set(parameters, 'assertion', assertion);

      const client = <Client>{};

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'The provided Assertion is invalid.' })
      );
    });

    it('should throw when the assertion uses the "none" json web signature algorithm.', async () => {
      const jws = new JsonWebSignature({ alg: 'none' }, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(octKey);

      Reflect.set(parameters, 'assertion', assertion);

      const client = <Client>{};

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({
          description: 'The Authorization Server disallows using the JSON Web Signature Algorithm "none".',
        })
      );
    });

    it('should throw when the "iss" claim is not provided.', async () => {
      Reflect.deleteProperty(claims, 'iss');

      const jws = new JsonWebSignature(octHeader, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(octKey);

      Reflect.set(parameters, 'assertion', assertion);

      const client = <Client>{ id: 'client_id' };

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'The provided Assertion is invalid.' })
      );

      Reflect.set(claims, 'iss', 'client_id');
    });

    it('should throw when the "iss" claim is not the client id.', async () => {
      Reflect.set(claims, 'iss', 'unknown_client');

      const jws = new JsonWebSignature(octHeader, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(octKey);

      Reflect.set(parameters, 'assertion', assertion);

      const client = <Client>{ id: 'client_id' };

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'The provided Assertion is invalid.' })
      );

      Reflect.set(claims, 'iss', 'client_id');
    });

    it('should throw when the "sub" claim is not provided.', async () => {
      Reflect.deleteProperty(claims, 'sub');

      const jws = new JsonWebSignature(octHeader, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(octKey);

      Reflect.set(parameters, 'assertion', assertion);

      const client = <Client>{ id: 'client_id' };

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'The provided Assertion is invalid.' })
      );

      Reflect.set(claims, 'sub', 'user_id');
    });

    it('should throw when the "aud" claim is not provided.', async () => {
      Reflect.deleteProperty(claims, 'aud');

      const jws = new JsonWebSignature(octHeader, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(octKey);

      Reflect.set(parameters, 'assertion', assertion);

      const client = <Client>{ id: 'client_id' };

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'The provided Assertion is invalid.' })
      );

      Reflect.set(claims, 'aud', 'https://server.example.com/oauth/token');
    });

    it('should throw when the "aud" claim is not the token endpoint.', async () => {
      Reflect.set(claims, 'aud', 'https://server.example.com');

      const jws = new JsonWebSignature(octHeader, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(octKey);

      Reflect.set(parameters, 'assertion', assertion);

      const client = <Client>{ id: 'client_id' };

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'The provided Assertion is invalid.' })
      );

      Reflect.set(claims, 'aud', 'https://server.example.com/oauth/token');
    });

    it('should throw when the "exp" claim is not provided.', async () => {
      Reflect.deleteProperty(claims, 'exp');

      const jws = new JsonWebSignature(octHeader, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(octKey);

      Reflect.set(parameters, 'assertion', assertion);

      const client = <Client>{ id: 'client_id' };

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'The provided Assertion is invalid.' })
      );

      Reflect.set(claims, 'exp', now + 86400);
    });

    it('should throw when the client does not have a secret.', async () => {
      const jws = new JsonWebSignature(octHeader, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(octKey);

      Reflect.set(parameters, 'assertion', assertion);

      const client = <Client>{ id: 'client_id' };

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'The provided Assertion is invalid.' })
      );
    });

    it('should throw when the client secret is expired.', async () => {
      const jws = new JsonWebSignature(octHeader, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(octKey);

      Reflect.set(parameters, 'assertion', assertion);

      const client = <Client>{
        id: 'client_id',
        secret: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ',
        secretExpiresAt: new Date(Date.now() - 3600000),
      };

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'The provided Assertion is invalid.' })
      );
    });

    it('should throw when the client does not have a jwks registered.', async () => {
      const jws = new JsonWebSignature(ecHeader, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(eckey);

      Reflect.set(parameters, 'assertion', assertion);

      const client = <Client>{ id: 'client_id' };

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'The provided Assertion is invalid.' })
      );
    });

    it('should throw when the client does not have the requested json web key registered.', async () => {
      const jws = new JsonWebSignature({ ...ecHeader, kid: 'rsa-key' }, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(eckey);

      Reflect.set(parameters, 'assertion', assertion);

      const client = <Client>{ id: 'client_id', jwks: { keys: [<JsonWebKeyParameters>eckey.toJSON()] } };

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'The provided Assertion is invalid.' })
      );
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
