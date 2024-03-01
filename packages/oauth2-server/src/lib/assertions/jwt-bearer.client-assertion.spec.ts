import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import {
  JsonWebKey,
  JsonWebSignature,
  JsonWebSignatureHeaderParameters,
  JsonWebTokenClaims,
  JsonWebTokenClaimsParameters,
  OctetSequenceKey,
} from '@guarani/jose';
import { removeNullishValues } from '@guarani/primitives';
import { Dictionary, OneOrMany } from '@guarani/types';

import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { HttpRequest } from '../http/http.request';
import { Logger } from '../logger/logger';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { ClientAssertion } from './client-assertion.type';
import { JwtBearerClientAssertion } from './jwt-bearer.client-assertion';
import { JwtBearerClientAssertionParameters } from './jwt-bearer.client-assertion.parameters';

jest.mock('../logger/logger');

const now = Math.floor(Date.now() / 1000);

const jwk = new OctetSequenceKey({ kty: 'oct', k: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ' });

const header: JsonWebSignatureHeaderParameters = { alg: 'HS256', typ: 'JWT' };
const claims: JsonWebTokenClaimsParameters = {
  iss: 'client_id',
  sub: 'client_id',
  aud: ['https://server.example.com/oauth/token'],
  iat: now,
  exp: now + 86400,
  jti: 'unique_assertion_id',
};

const methodRequests: [Dictionary<OneOrMany<string>>, boolean][] = [
  [{}, false],
  [{ client_assertion_type: '' }, false],
  [{ client_assertion_type: 'foo' }, false],
  [{ client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer' }, false],
  [{ client_assertion: 'foo', client_assertion_type: '' }, false],
  [{ client_assertion: 'foo', client_assertion_type: 'foo' }, false],
  [{ client_assertion: '', client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer' }, false],
  [{ client_assertion: 'a', client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer' }, false],
  [{ client_assertion: '.a', client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer' }, false],
  [
    { client_assertion: '.a.b', client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer' },
    false,
  ],
  [{ client_assertion: 'a.b', client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer' }, false],
  [
    { client_assertion: 'a.b.c.d', client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer' },
    false,
  ],
  [
    { client_assertion: 'a.b.c', client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer' },
    true,
  ],
];

describe('JWT Bearer Client Assertion Client Authentication Method', () => {
  let container: DependencyInjectionContainer;
  let clientAssertion: JwtBearerClientAssertion;

  const loggerMock = jest.mocked(Logger.prototype);

  const clientServiceMock = jest.mocked<ClientServiceInterface>({
    findOne: jest.fn(),
  });

  const settings = <Settings>{
    issuer: 'https://server.example.com',
    clientAuthenticationSignatureAlgorithms: ['HS256', 'RS256'],
  };

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<ClientServiceInterface>(CLIENT_SERVICE).toValue(clientServiceMock);
    container.bind(JwtBearerClientAssertion).toSelf().asSingleton();

    clientAssertion = container.resolve(JwtBearerClientAssertion);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('clientAssertionType', () => {
    it('should have "urn:ietf:params:oauth:client-assertion-type:jwt-bearer" as its value.', () => {
      expect(clientAssertion.clientAssertionType).toEqual<ClientAssertion>(
        'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      );
    });
  });

  describe('hasBeenRequested()', () => {
    let parameters: JwtBearerClientAssertionParameters;

    const requestFactory = (data: Partial<JwtBearerClientAssertionParameters> = {}): HttpRequest => {
      removeNullishValues<JwtBearerClientAssertionParameters>(Object.assign(parameters, data));

      return new HttpRequest({
        body: parameters,
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/token'),
      });
    };

    beforeEach(() => {
      parameters = {
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: '',
      };
    });

    it.each(methodRequests)('should check if the authentication method has beed requested.', (body, expected) => {
      const request = requestFactory(body);
      expect(clientAssertion.hasBeenRequested(request)).toEqual(expected);
    });
  });

  describe('authenticate()', () => {
    let parameters: JwtBearerClientAssertionParameters;

    const requestFactory = (data: Partial<JwtBearerClientAssertionParameters> = {}): HttpRequest => {
      removeNullishValues<JwtBearerClientAssertionParameters>(Object.assign(parameters, data));

      return new HttpRequest({
        body: parameters,
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/token'),
      });
    };

    beforeEach(() => {
      parameters = {
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: '',
      };
    });

    it('should throw when the header algorithm is "none".', async () => {
      const jws = new JsonWebSignature({ ...header, alg: 'none' }, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(jwk);

      const request = requestFactory({ client_assertion: assertion });

      await expect(clientAssertion.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'The Authorization Server disallows using the JSON Web Signature Algorithm "none".',
      );
    });

    it("should throw when the token's jws algorithm is not supported by the authorization server.", async () => {
      const ecKey = await JsonWebKey.generate('EC', { curve: 'P-256' });
      const jws = new JsonWebSignature({ ...header, alg: 'ES256' }, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(ecKey);

      const request = requestFactory({ client_assertion: assertion });

      await expect(clientAssertion.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'Unsupported JSON Web Signature Algorithm "ES256".',
      );
    });

    it("should throw when the token's jws algorithm is not supported by the client authentication method.", async () => {
      Reflect.set(clientAssertion, 'name', 'client_secret_jwt');
      Reflect.set(clientAssertion, 'algorithms', ['HS256']);

      const rsaKey = await JsonWebKey.generate('RSA', { modulus: 2048 });
      const jws = new JsonWebSignature({ ...header, alg: 'RS256' }, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(rsaKey);

      const request = requestFactory({ client_assertion: assertion });

      await expect(clientAssertion.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'Unsupported JSON Web Signature Algorithm "RS256" for Authentication Method "client_secret_jwt".',
      );
    });

    it.each(['iss', 'sub', 'aud', 'exp', 'jti'])(
      'should throw when a required claim is not provided.',
      async (claim) => {
        Reflect.set(clientAssertion, 'algorithms', ['HS256']);

        const claimValue = claims[claim];

        Reflect.deleteProperty(claims, claim);

        const jws = new JsonWebSignature(header, new JsonWebTokenClaims(claims).toBuffer());
        const assertion = await jws.sign(jwk);

        const request = requestFactory({ client_assertion: assertion });

        await expect(clientAssertion.authenticate(request)).rejects.toThrowWithMessage(
          InvalidClientException,
          'Invalid JSON Web Token Client Assertion.',
        );

        Reflect.set(claims, claim, claimValue);
      },
    );

    it('should throw when the "aud" claim does not point to the requested endpoint.', async () => {
      const jws = new JsonWebSignature(
        header,
        new JsonWebTokenClaims({ ...claims, aud: 'https://server.example.com' }).toBuffer(),
      );

      const assertion = await jws.sign(jwk);

      const request = requestFactory({ client_assertion: assertion });

      Reflect.set(clientAssertion, 'algorithms', ['HS256']);

      await expect(clientAssertion.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'Invalid JSON Web Token Client Assertion.',
      );
    });

    it('should throw when the "aud" claim does not point to the requested endpoint.', async () => {
      const jws = new JsonWebSignature(
        header,
        new JsonWebTokenClaims({ ...claims, aud: ['https://server.example.com'] }).toBuffer(),
      );

      const assertion = await jws.sign(jwk);

      const request = requestFactory({ client_assertion: assertion });

      Reflect.set(clientAssertion, 'algorithms', ['HS256']);

      await expect(clientAssertion.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'Invalid JSON Web Token Client Assertion.',
      );
    });

    it('should throw when the "iss" and "sub" claims are not equal.', async () => {
      const jws = new JsonWebSignature(
        header,
        new JsonWebTokenClaims({ ...claims, iss: 'https://idp.example.com' }).toBuffer(),
      );

      const assertion = await jws.sign(jwk);

      const request = requestFactory({ client_assertion: assertion });

      Reflect.set(clientAssertion, 'algorithms', ['HS256']);

      await expect(clientAssertion.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'The values of "iss" and "sub" are different.',
      );
    });

    it('should throw when the client of the assertion does not exist.', async () => {
      const jws = new JsonWebSignature(header, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(jwk);

      clientServiceMock.findOne.mockResolvedValueOnce(null);

      const request = requestFactory({ client_assertion: assertion });

      Reflect.set(clientAssertion, 'algorithms', ['HS256']);

      await expect(clientAssertion.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'Invalid Client.',
      );
    });

    it('should throw when the client of the assertion is not allowed to use this authentication method.', async () => {
      const jws = new JsonWebSignature(header, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(jwk);

      const request = requestFactory({ client_assertion: assertion });

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        authenticationMethod: 'client_secret_basic',
      });

      Reflect.set(clientAssertion, 'name', 'client_secret_jwt');
      Reflect.set(clientAssertion, 'algorithms', ['HS256']);

      await expect(clientAssertion.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'This Client is not allowed to use the Authentication Method "client_secret_jwt".',
      );
    });

    it('should throw when the client of the assertion does not use the authentication signature algorithm.', async () => {
      const jws = new JsonWebSignature(header, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(jwk);

      const request = requestFactory({ client_assertion: assertion });

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        authenticationMethod: 'client_secret_jwt',
        authenticationSigningAlgorithm: 'HS512',
      });

      Reflect.set(clientAssertion, 'name', 'client_secret_jwt');
      Reflect.set(clientAssertion, 'algorithms', ['HS256']);

      await expect(clientAssertion.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'This Client is not allowed to use the Authentication Method "client_secret_jwt".',
      );
    });

    it('should return the client represented by the client assertion.', async () => {
      const jws = new JsonWebSignature(header, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(jwk);

      const request = requestFactory({ client_assertion: assertion });

      const client = <Client>{
        id: 'client_id',
        authenticationMethod: 'client_secret_jwt',
        authenticationSigningAlgorithm: 'HS256',
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      Reflect.set(clientAssertion, 'name', 'client_secret_jwt');
      Reflect.set(clientAssertion, 'algorithms', ['HS256']);

      clientAssertion['getClientKey'] = async function () {
        return jwk;
      };

      await expect(clientAssertion.authenticate(request)).resolves.toBe(client);
    });
  });
});
