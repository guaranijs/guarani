import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import {
  EllipticCurveKey,
  JsonWebKeySet,
  JsonWebSignature,
  JsonWebSignatureAlgorithm,
  JsonWebTokenClaims,
  JsonWebTokenClaimsParameters,
  OctetSequenceKey,
} from '@guarani/jose';
import { removeNullishValues } from '@guarani/primitives';

import { JwtBearerTokenContext } from '../../context/token/jwt-bearer.token-context';
import { Client } from '../../entities/client.entity';
import { User } from '../../entities/user.entity';
import { InvalidGrantException } from '../../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { GrantTypeInterface } from '../../grant-types/grant-type.interface';
import { GRANT_TYPE } from '../../grant-types/grant-type.token';
import { GrantType } from '../../grant-types/grant-type.type';
import { ClientAuthenticationHandler } from '../../handlers/client-authentication.handler';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { JwtBearerTokenRequest } from '../../requests/token/jwt-bearer.token-request';
import { UserServiceInterface } from '../../services/user.service.interface';
import { USER_SERVICE } from '../../services/user.service.token';
import { Settings } from '../../settings/settings';
import { SETTINGS } from '../../settings/settings.token';
import { JwtBearerTokenRequestValidator } from './jwt-bearer.token-request.validator';

jest.mock('../../handlers/client-authentication.handler');
jest.mock('../../handlers/scope.handler');

const invalidTokenFormats: string[] = ['', 'a', '.a', '.a.b', 'a.b', 'a.b.c.d'];

describe('JWT Bearer Token Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: JwtBearerTokenRequestValidator;

  const clientAuthenticationHandlerMock = jest.mocked(ClientAuthenticationHandler.prototype);

  const scopeHandlerMock = jest.mocked(ScopeHandler.prototype);

  const settings = <Settings>{ issuer: 'https://server.example.com' };

  const userServiceMock = jest.mocked<UserServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    findByResourceOwnerCredentials: jest.fn(),
    getUserinfo: jest.fn(),
  });

  const grantTypesMocks = [
    jest.mocked<GrantTypeInterface>({ name: 'authorization_code', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'client_credentials', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'password', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'refresh_token', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'urn:ietf:params:oauth:grant-type:device_code', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'urn:ietf:params:oauth:grant-type:jwt-bearer', handle: jest.fn() }),
  ];

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(ClientAuthenticationHandler).toValue(clientAuthenticationHandlerMock);
    container.bind(ScopeHandler).toValue(scopeHandlerMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<UserServiceInterface>(USER_SERVICE).toValue(userServiceMock);

    grantTypesMocks.forEach((grantTypeMock) => {
      container.bind<GrantTypeInterface>(GRANT_TYPE).toValue(grantTypeMock);
    });

    container.bind(JwtBearerTokenRequestValidator).toSelf().asSingleton();

    validator = container.resolve(JwtBearerTokenRequestValidator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('algorithms', () => {
    it('should have ["ES256", "ES384", "ES512", "EdDSA", "HS256", "HS384", "HS512", "PS256", "PS384", "PS512", "RS256", "RS384", "RS512"] as its value.', () => {
      expect(validator['algorithms']).toEqual<Exclude<JsonWebSignatureAlgorithm, 'none'>[]>([
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
      expect(validator.name).toEqual<GrantType>('urn:ietf:params:oauth:grant-type:jwt-bearer');
    });
  });

  describe('validate()', () => {
    let parameters: JwtBearerTokenRequest;

    const requestFactory = (data: Partial<JwtBearerTokenRequest> = {}): HttpRequest => {
      removeNullishValues<JwtBearerTokenRequest>(Object.assign(parameters, data));

      return new HttpRequest({
        body: parameters,
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/token'),
      });
    };

    beforeEach(() => {
      parameters = <JwtBearerTokenRequest>{ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer' };
    });

    it('should throw when not providing the parameter "assertion".', async () => {
      const request = requestFactory({ assertion: undefined });

      const client = <Client>{ id: 'client_id', grantTypes: ['urn:ietf:params:oauth:grant-type:jwt-bearer'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "assertion".'
      );
    });

    it.each(invalidTokenFormats)('should throw when the provided assertion is invalid.', async (assertion) => {
      const request = requestFactory({ assertion });

      const client = <Client>{ id: 'client_id', grantTypes: ['urn:ietf:params:oauth:grant-type:jwt-bearer'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'The provided Assertion is invalid.'
      );
    });

    it('should throw when the assertion uses the json web signature algorithm "none".', async () => {
      const now = Math.floor(Date.now() / 1000);

      const claims: JsonWebTokenClaimsParameters = {
        iss: 'client_id',
        sub: 'user_id',
        aud: ['https://server.example.com/oauth/token'],
        iat: now,
        exp: now + 86400,
      };

      const key = new OctetSequenceKey({ kty: 'oct', k: 'cURNODBpZ3ZqYTRUZ190TnNFdVdEaGwyYk1NNl9OZ0pFbGRGaElFdXdxUQ' });

      const jws = new JsonWebSignature({ alg: 'none' }, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(key);

      const request = requestFactory({ assertion });

      const client = <Client>{ id: 'client_id', grantTypes: ['urn:ietf:params:oauth:grant-type:jwt-bearer'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'The Authorization Server disallows using the JSON Web Signature Algorithm "none".'
      );
    });

    it('should throw when the json web token claim "iss" is not provided.', async () => {
      const now = Math.floor(Date.now() / 1000);

      const claims: JsonWebTokenClaimsParameters = {
        sub: 'user_id',
        aud: ['https://server.example.com/oauth/token'],
        iat: now,
        exp: now + 86400,
      };

      const key = new OctetSequenceKey({ kty: 'oct', k: 'cURNODBpZ3ZqYTRUZ190TnNFdVdEaGwyYk1NNl9OZ0pFbGRGaElFdXdxUQ' });

      const jws = new JsonWebSignature({ alg: 'HS256', typ: 'JWT' }, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(key);

      const request = requestFactory({ assertion });

      const client = <Client>{ id: 'client_id', grantTypes: ['urn:ietf:params:oauth:grant-type:jwt-bearer'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'The provided Assertion is invalid.'
      );
    });

    it('should throw when the json web token claim "iss" is not the client\'s identifier.', async () => {
      const now = Math.floor(Date.now() / 1000);

      const claims: JsonWebTokenClaimsParameters = {
        iss: 'another_client_id',
        sub: 'user_id',
        aud: ['https://server.example.com/oauth/token'],
        iat: now,
        exp: now + 86400,
      };

      const key = new OctetSequenceKey({ kty: 'oct', k: 'cURNODBpZ3ZqYTRUZ190TnNFdVdEaGwyYk1NNl9OZ0pFbGRGaElFdXdxUQ' });

      const jws = new JsonWebSignature({ alg: 'HS256', typ: 'JWT' }, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(key);

      const request = requestFactory({ assertion });

      const client = <Client>{ id: 'client_id', grantTypes: ['urn:ietf:params:oauth:grant-type:jwt-bearer'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'The provided Assertion is invalid.'
      );
    });

    it('should throw when the json web token claim "sub" is not provided.', async () => {
      const now = Math.floor(Date.now() / 1000);

      const claims: JsonWebTokenClaimsParameters = {
        iss: 'client_id',
        aud: ['https://server.example.com/oauth/token'],
        iat: now,
        exp: now + 86400,
      };

      const key = new OctetSequenceKey({ kty: 'oct', k: 'cURNODBpZ3ZqYTRUZ190TnNFdVdEaGwyYk1NNl9OZ0pFbGRGaElFdXdxUQ' });

      const jws = new JsonWebSignature({ alg: 'HS256', typ: 'JWT' }, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(key);

      const request = requestFactory({ assertion });

      const client = <Client>{ id: 'client_id', grantTypes: ['urn:ietf:params:oauth:grant-type:jwt-bearer'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'The provided Assertion is invalid.'
      );
    });

    it('should throw when the json web token claim "aud" is not provided.', async () => {
      const now = Math.floor(Date.now() / 1000);

      const claims: JsonWebTokenClaimsParameters = {
        iss: 'client_id',
        sub: 'user_id',
        iat: now,
        exp: now + 86400,
      };

      const key = new OctetSequenceKey({ kty: 'oct', k: 'cURNODBpZ3ZqYTRUZ190TnNFdVdEaGwyYk1NNl9OZ0pFbGRGaElFdXdxUQ' });

      const jws = new JsonWebSignature({ alg: 'HS256', typ: 'JWT' }, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(key);

      const request = requestFactory({ assertion });

      const client = <Client>{ id: 'client_id', grantTypes: ['urn:ietf:params:oauth:grant-type:jwt-bearer'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'The provided Assertion is invalid.'
      );
    });

    it('should throw when the json web token claim "aud" is not the authorization server\'s token endpoint.', async () => {
      const now = Math.floor(Date.now() / 1000);

      const claims: JsonWebTokenClaimsParameters = {
        iss: 'client_id',
        sub: 'user_id',
        aud: ['https://server.example.com'],
        iat: now,
        exp: now + 86400,
      };

      const key = new OctetSequenceKey({ kty: 'oct', k: 'cURNODBpZ3ZqYTRUZ190TnNFdVdEaGwyYk1NNl9OZ0pFbGRGaElFdXdxUQ' });

      const jws = new JsonWebSignature({ alg: 'HS256', typ: 'JWT' }, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(key);

      const request = requestFactory({ assertion });

      const client = <Client>{ id: 'client_id', grantTypes: ['urn:ietf:params:oauth:grant-type:jwt-bearer'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'The provided Assertion is invalid.'
      );
    });

    it('should throw when the json web token claim "exp" is not provided.', async () => {
      const now = Math.floor(Date.now() / 1000);

      const claims: JsonWebTokenClaimsParameters = {
        iss: 'client_id',
        sub: 'user_id',
        aud: ['https://server.example.com/oauth/token'],
        iat: now,
      };

      const key = new OctetSequenceKey({ kty: 'oct', k: 'cURNODBpZ3ZqYTRUZ190TnNFdVdEaGwyYk1NNl9OZ0pFbGRGaElFdXdxUQ' });

      const jws = new JsonWebSignature({ alg: 'HS256', typ: 'JWT' }, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(key);

      const request = requestFactory({ assertion });

      const client = <Client>{ id: 'client_id', grantTypes: ['urn:ietf:params:oauth:grant-type:jwt-bearer'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'The provided Assertion is invalid.'
      );
    });

    it('should throw when the client does not have a secret.', async () => {
      const now = Math.floor(Date.now() / 1000);

      const claims: JsonWebTokenClaimsParameters = {
        iss: 'client_id',
        sub: 'user_id',
        aud: ['https://server.example.com/oauth/token'],
        iat: now,
        exp: now + 86400,
      };

      const key = new OctetSequenceKey({ kty: 'oct', k: 'cURNODBpZ3ZqYTRUZ190TnNFdVdEaGwyYk1NNl9OZ0pFbGRGaElFdXdxUQ' });

      const jws = new JsonWebSignature({ alg: 'HS256', typ: 'JWT' }, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(key);

      const request = requestFactory({ assertion });

      const client = <Client>{
        id: 'client_id',
        secret: null,
        grantTypes: ['urn:ietf:params:oauth:grant-type:jwt-bearer'],
      };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'The provided Assertion is invalid.'
      );
    });

    it("should throw when the client's secret is expired.", async () => {
      const now = Math.floor(Date.now() / 1000);

      const claims: JsonWebTokenClaimsParameters = {
        iss: 'client_id',
        sub: 'user_id',
        aud: ['https://server.example.com/oauth/token'],
        iat: now,
        exp: now + 86400,
      };

      const key = new OctetSequenceKey({ kty: 'oct', k: 'cURNODBpZ3ZqYTRUZ190TnNFdVdEaGwyYk1NNl9OZ0pFbGRGaElFdXdxUQ' });

      const jws = new JsonWebSignature({ alg: 'HS256', typ: 'JWT' }, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(key);

      const request = requestFactory({ assertion });

      const client = <Client>{
        id: 'client_id',
        secret: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ',
        secretExpiresAt: new Date(Date.now() - 3600000),
        grantTypes: ['urn:ietf:params:oauth:grant-type:jwt-bearer'],
      };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'The provided Assertion is invalid.'
      );
    });

    it('should throw when the client does not have a json web key set registered.', async () => {
      const now = Math.floor(Date.now() / 1000);

      const claims: JsonWebTokenClaimsParameters = {
        iss: 'client_id',
        sub: 'user_id',
        aud: ['https://server.example.com/oauth/token'],
        iat: now,
        exp: now + 86400,
      };

      const key = new EllipticCurveKey({
        kty: 'EC',
        crv: 'P-256',
        x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
        y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
        d: 'bwVX6Vx-TOfGKYOPAcu2xhaj3JUzs-McsC-suaHnFBo',
      });

      const jws = new JsonWebSignature(
        {
          alg: 'ES256',
          kid: 'LHM5p37TAesdI-tFqs7LOmDufKjrU0nq1jFRwI_7mvI',
          typ: 'JWT',
        },
        new JsonWebTokenClaims(claims).toBuffer()
      );

      const assertion = await jws.sign(key);

      const request = requestFactory({ assertion });

      const client = <Client>{
        id: 'client_id',
        secret: null,
        grantTypes: ['urn:ietf:params:oauth:grant-type:jwt-bearer'],
        jwks: null,
        jwksUri: null,
      };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'The provided Assertion is invalid.'
      );
    });

    it('should throw when the client does not have the requested json web key registered.', async () => {
      const now = Math.floor(Date.now() / 1000);

      const claims: JsonWebTokenClaimsParameters = {
        iss: 'client_id',
        sub: 'user_id',
        aud: ['https://server.example.com/oauth/token'],
        iat: now,
        exp: now + 86400,
      };

      const key = new EllipticCurveKey({
        kty: 'EC',
        crv: 'P-256',
        x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
        y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
        d: 'bwVX6Vx-TOfGKYOPAcu2xhaj3JUzs-McsC-suaHnFBo',
      });

      const jws = new JsonWebSignature(
        {
          alg: 'ES256',
          kid: 'ec-key',
          typ: 'JWT',
        },
        new JsonWebTokenClaims(claims).toBuffer()
      );

      const assertion = await jws.sign(key);

      const jwks = new JsonWebKeySet([key]);

      const request = requestFactory({ assertion });

      const client = <Client>{
        id: 'client_id',
        secret: null,
        grantTypes: ['urn:ietf:params:oauth:grant-type:jwt-bearer'],
        jwks: jwks.toJSON(),
        jwksUri: null,
      };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'The provided Assertion is invalid.'
      );
    });

    it('should throw when the requested json web key is not suitable for use in a json web signature.', async () => {
      const now = Math.floor(Date.now() / 1000);

      const claims: JsonWebTokenClaimsParameters = {
        iss: 'client_id',
        sub: 'user_id',
        aud: ['https://server.example.com/oauth/token'],
        iat: now,
        exp: now + 86400,
      };

      const key = new EllipticCurveKey({
        kty: 'EC',
        crv: 'P-256',
        x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
        y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
        d: 'bwVX6Vx-TOfGKYOPAcu2xhaj3JUzs-McsC-suaHnFBo',
      });

      const jws = new JsonWebSignature(
        {
          alg: 'ES256',
          kid: 'LHM5p37TAesdI-tFqs7LOmDufKjrU0nq1jFRwI_7mvI',
          typ: 'JWT',
        },
        new JsonWebTokenClaims(claims).toBuffer()
      );

      const assertion = await jws.sign(key);

      const jwks = new JsonWebKeySet([new EllipticCurveKey(key.toJSON(), { alg: 'ECDH-ES' })]);

      const request = requestFactory({ assertion });

      const client = <Client>{
        id: 'client_id',
        secret: null,
        grantTypes: ['urn:ietf:params:oauth:grant-type:jwt-bearer'],
        jwks: jwks.toJSON(),
        jwksUri: null,
      };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'The provided Assertion is invalid.'
      );
    });

    it('should throw when the requested json web key does not have the key operation "verify".', async () => {
      const now = Math.floor(Date.now() / 1000);

      const claims: JsonWebTokenClaimsParameters = {
        iss: 'client_id',
        sub: 'user_id',
        aud: ['https://server.example.com/oauth/token'],
        iat: now,
        exp: now + 86400,
      };

      const key = new EllipticCurveKey({
        kty: 'EC',
        crv: 'P-256',
        x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
        y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
        d: 'bwVX6Vx-TOfGKYOPAcu2xhaj3JUzs-McsC-suaHnFBo',
      });

      const jws = new JsonWebSignature(
        {
          alg: 'ES256',
          kid: 'LHM5p37TAesdI-tFqs7LOmDufKjrU0nq1jFRwI_7mvI',
          typ: 'JWT',
        },
        new JsonWebTokenClaims(claims).toBuffer()
      );

      const assertion = await jws.sign(key);

      const jwks = new JsonWebKeySet([new EllipticCurveKey(key.toJSON(), { key_ops: ['sign'] })]);

      const request = requestFactory({ assertion });

      const client = <Client>{
        id: 'client_id',
        secret: null,
        grantTypes: ['urn:ietf:params:oauth:grant-type:jwt-bearer'],
        jwks: jwks.toJSON(),
        jwksUri: null,
      };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'The provided Assertion is invalid.'
      );
    });

    it('should throw when the requested json web key does not have the use "sig".', async () => {
      const now = Math.floor(Date.now() / 1000);

      const claims: JsonWebTokenClaimsParameters = {
        iss: 'client_id',
        sub: 'user_id',
        aud: ['https://server.example.com/oauth/token'],
        iat: now,
        exp: now + 86400,
      };

      const key = new EllipticCurveKey({
        kty: 'EC',
        crv: 'P-256',
        x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
        y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
        d: 'bwVX6Vx-TOfGKYOPAcu2xhaj3JUzs-McsC-suaHnFBo',
      });

      const jws = new JsonWebSignature(
        {
          alg: 'ES256',
          kid: 'LHM5p37TAesdI-tFqs7LOmDufKjrU0nq1jFRwI_7mvI',
          typ: 'JWT',
        },
        new JsonWebTokenClaims(claims).toBuffer()
      );

      const assertion = await jws.sign(key);

      const jwks = new JsonWebKeySet([new EllipticCurveKey(key.toJSON(), { use: 'enc' })]);

      const request = requestFactory({ assertion });

      const client = <Client>{
        id: 'client_id',
        secret: null,
        grantTypes: ['urn:ietf:params:oauth:grant-type:jwt-bearer'],
        jwks: jwks.toJSON(),
        jwksUri: null,
      };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'The provided Assertion is invalid.'
      );
    });

    it('should throw when the user requested at the assertion is not found.', async () => {
      const now = Math.floor(Date.now() / 1000);

      const claims: JsonWebTokenClaimsParameters = {
        iss: 'client_id',
        sub: 'user_id',
        aud: ['https://server.example.com/oauth/token'],
        iat: now,
        exp: now + 86400,
      };

      const key = new EllipticCurveKey({
        kty: 'EC',
        crv: 'P-256',
        x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
        y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
        d: 'bwVX6Vx-TOfGKYOPAcu2xhaj3JUzs-McsC-suaHnFBo',
      });

      const jws = new JsonWebSignature(
        {
          alg: 'ES256',
          kid: 'LHM5p37TAesdI-tFqs7LOmDufKjrU0nq1jFRwI_7mvI',
          typ: 'JWT',
        },
        new JsonWebTokenClaims(claims).toBuffer()
      );

      const assertion = await jws.sign(key);

      const jwks = new JsonWebKeySet([key]);

      const request = requestFactory({ assertion });

      const client = <Client>{
        id: 'client_id',
        secret: null,
        grantTypes: ['urn:ietf:params:oauth:grant-type:jwt-bearer'],
        jwks: jwks.toJSON(),
        jwksUri: null,
      };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      userServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'The provided Assertion is invalid.'
      );
    });

    it('should return a jwt bearer token context with the requested scope.', async () => {
      const now = Math.floor(Date.now() / 1000);

      const claims: JsonWebTokenClaimsParameters = {
        iss: 'client_id',
        sub: 'user_id',
        aud: 'https://server.example.com/oauth/token',
        iat: now,
        exp: now + 86400,
      };

      const key = new EllipticCurveKey({
        kty: 'EC',
        crv: 'P-256',
        x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
        y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
        d: 'bwVX6Vx-TOfGKYOPAcu2xhaj3JUzs-McsC-suaHnFBo',
      });

      const jws = new JsonWebSignature(
        {
          alg: 'ES256',
          kid: 'LHM5p37TAesdI-tFqs7LOmDufKjrU0nq1jFRwI_7mvI',
          typ: 'JWT',
        },
        new JsonWebTokenClaims(claims).toBuffer()
      );

      const assertion = await jws.sign(key);

      const jwks = new JsonWebKeySet([key]);

      const request = requestFactory({ assertion, scope: 'foo bar' });

      const client = <Client>{
        id: 'client_id',
        secret: null,
        grantTypes: ['urn:ietf:params:oauth:grant-type:jwt-bearer'],
        scopes: ['foo', 'bar', 'baz'],
        jwks: jwks.toJSON(),
        jwksUri: null,
      };

      const user = <User>{ id: 'user_id' };

      const scopes = ['foo', 'bar'];

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      userServiceMock.findOne.mockResolvedValueOnce(user);

      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(scopes);

      await expect(validator.validate(request)).resolves.toStrictEqual<JwtBearerTokenContext>({
        parameters,
        client,
        grantType: grantTypesMocks[5]!,
        user,
        scopes,
      });
    });

    it("should return a jwt bearer token context with the client's default scope.", async () => {
      const now = Math.floor(Date.now() / 1000);

      const claims: JsonWebTokenClaimsParameters = {
        iss: 'client_id',
        sub: 'user_id',
        aud: ['https://server.example.com/oauth/token'],
        iat: now,
        exp: now + 86400,
      };

      const key = new EllipticCurveKey({
        kty: 'EC',
        crv: 'P-256',
        x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
        y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
        d: 'bwVX6Vx-TOfGKYOPAcu2xhaj3JUzs-McsC-suaHnFBo',
      });

      const jws = new JsonWebSignature(
        {
          alg: 'ES256',
          kid: 'LHM5p37TAesdI-tFqs7LOmDufKjrU0nq1jFRwI_7mvI',
          typ: 'JWT',
        },
        new JsonWebTokenClaims(claims).toBuffer()
      );

      const assertion = await jws.sign(key);

      const jwks = new JsonWebKeySet([key]);

      const request = requestFactory({ assertion, scope: 'foo bar' });

      const client = <Client>{
        id: 'client_id',
        secret: null,
        grantTypes: ['urn:ietf:params:oauth:grant-type:jwt-bearer'],
        scopes: ['foo', 'bar', 'baz'],
        jwks: jwks.toJSON(),
        jwksUri: null,
      };

      const user = <User>{ id: 'user_id' };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      userServiceMock.findOne.mockResolvedValueOnce(user);

      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(client.scopes);

      await expect(validator.validate(request)).resolves.toStrictEqual<JwtBearerTokenContext>({
        parameters,
        client,
        grantType: grantTypesMocks[5]!,
        user,
        scopes: client.scopes,
      });
    });
  });
});
