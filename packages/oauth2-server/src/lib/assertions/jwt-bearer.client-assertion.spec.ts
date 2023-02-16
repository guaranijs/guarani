import { DependencyInjectionContainer } from '@guarani/di';
import {
  JsonWebKey,
  JsonWebSignature,
  JsonWebSignatureHeaderParameters,
  JsonWebTokenClaims,
  JsonWebTokenClaimsParameters,
} from '@guarani/jose';

import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { HttpRequest } from '../http/http.request';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { ClientAssertion } from './client-assertion.type';
import { JwtBearerClientAssertion } from './jwt-bearer.client-assertion';

const now = Math.floor(Date.now() / 1000);

const jwk = new JsonWebKey({ kty: 'oct', k: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ' });

const header: JsonWebSignatureHeaderParameters = { alg: 'HS256', typ: 'JWT' };
const claims: JsonWebTokenClaimsParameters = {
  iss: 'client_id',
  sub: 'client_id',
  aud: 'https://server.example.com/oauth/token',
  iat: now,
  exp: now + 86400,
  jti: 'unique_assertion_id',
};

const methodRequests: [Record<string, any>, boolean][] = [
  [{}, false],
  [{ client_assertion_type: '' }, false],
  [{ client_assertion_type: 'foo' }, false],
  [{ client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer' }, false],
];

const invalidTokenFormats: string[] = ['', 'a', '.a', '.a.b', 'a.b', 'a.b.c.d'];

describe('JWT Bearer Client Assertion Client Authentication Method', () => {
  let clientAssertion: JwtBearerClientAssertion;

  const clientServiceMock = jest.mocked<ClientServiceInterface>({
    findOne: jest.fn(),
  });

  const settings = <Settings>{
    issuer: 'https://server.example.com',
    clientAuthenticationSignatureAlgorithms: ['HS256'],
  };

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<ClientServiceInterface>(CLIENT_SERVICE).toValue(clientServiceMock);
    container.bind(JwtBearerClientAssertion).toSelf().asSingleton();

    clientAssertion = container.resolve(JwtBearerClientAssertion);
  });

  describe('clientAssertionType', () => {
    it('should have "urn:ietf:params:oauth:client-assertion-type:jwt-bearer" as its value.', () => {
      expect(clientAssertion.clientAssertionType).toEqual<ClientAssertion>(
        'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'
      );
    });
  });

  describe('hasBeenRequested()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = {
        body: { client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer', client_assertion: '' },
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/token',
        query: {},
      };
    });

    it.each(methodRequests)('should check if the authentication method has beed requested.', (body, expected) => {
      Reflect.set(request, 'body', body);

      expect(clientAssertion.hasBeenRequested(request)).toBe(expected);
    });

    it.each(invalidTokenFormats)(
      'should throw when the provided "client_assertion" is an invalid json web token.',
      (assertion) => {
        request.body.client_assertion = assertion;

        expect(() => clientAssertion.hasBeenRequested(request)).toThrow(
          new InvalidClientException({ description: 'Invalid JSON Web Token Client Assertion.' })
        );
      }
    );

    it('should return false when the provided token does not use an algorithm supported by the method.', async () => {
      const jws = new JsonWebSignature(header, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(jwk);

      request.body.client_assertion = assertion;

      Reflect.set(clientAssertion, 'algorithms', ['RS256']);

      expect(clientAssertion.hasBeenRequested(request)).toBe(false);

      Reflect.deleteProperty(clientAssertion, 'algorithms');
    });

    it('should return false when the provided token does not use an algorithm supported by the authorization server.', async () => {
      const jws = new JsonWebSignature(header, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(jwk);

      request.body.client_assertion = assertion;

      Reflect.set(clientAssertion, 'algorithms', ['HS256']);
      Reflect.set(settings, 'clientAuthenticationSignatureAlgorithms', ['RS256']);

      expect(clientAssertion.hasBeenRequested(request)).toBe(false);

      Reflect.set(settings, 'clientAuthenticationSignatureAlgorithms', ['HS256']);
      Reflect.deleteProperty(clientAssertion, 'algorithms');
    });

    it('should return true when the provided token passes the validation of the method.', async () => {
      const jws = new JsonWebSignature(header, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(jwk);

      request.body.client_assertion = assertion;

      Reflect.set(clientAssertion, 'algorithms', ['HS256']);

      expect(clientAssertion.hasBeenRequested(request)).toBe(true);

      Reflect.deleteProperty(clientAssertion, 'algorithms');
    });
  });

  describe('authenticate()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = {
        body: { client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer', client_assertion: '' },
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/token',
        query: {},
      };
    });

    it('should throw when the header algorithm is "none".', async () => {
      const jws = new JsonWebSignature({ ...header, alg: 'none' }, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(jwk);

      request.body.client_assertion = assertion;

      await expect(clientAssertion.authenticate(request)).rejects.toThrow(
        new InvalidClientException({ description: 'Invalid JSON Web Signature Algorithm "none".' })
      );
    });

    it.each(['iss', 'sub', 'aud', 'exp', 'jti'])(
      'should throw when a required claim is not provided.',
      async (claim) => {
        const claimValue = claims[claim];

        Reflect.deleteProperty(claims, claim);

        const jws = new JsonWebSignature(header, new JsonWebTokenClaims(claims).toBuffer());
        const assertion = await jws.sign(jwk);

        Object.assign(request.body, { client_assertion: assertion });

        await expect(clientAssertion.authenticate(request)).rejects.toThrow(
          new InvalidClientException({ description: 'Invalid JSON Web Token Client Assertion.' })
        );

        Reflect.set(claims, claim, claimValue);
      }
    );

    it('should throw when the "aud" claim does not point to the requested endpoint.', async () => {
      const jws = new JsonWebSignature(
        header,
        new JsonWebTokenClaims({ ...claims, aud: 'https://server.exampĺe.com' }).toBuffer()
      );
      const assertion = await jws.sign(jwk);

      Object.assign(request.body, { client_assertion: assertion });

      await expect(clientAssertion.authenticate(request)).rejects.toThrow(
        new InvalidClientException({ description: 'Invalid JSON Web Token Client Assertion.' })
      );
    });

    it('should throw when the "iss" and "sub" claims are not equal.', async () => {
      const jws = new JsonWebSignature(
        header,
        new JsonWebTokenClaims({ ...claims, iss: 'https://idp.example.com' }).toBuffer()
      );
      const assertion = await jws.sign(jwk);

      Object.assign(request.body, { client_assertion: assertion });

      await expect(clientAssertion.authenticate(request)).rejects.toThrow(
        new InvalidClientException({ description: 'The values of "iss" and "sub" are different.' })
      );
    });

    it('should throw when the client of the assertion is not registered.', async () => {
      const jws = new JsonWebSignature(header, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(jwk);

      clientServiceMock.findOne.mockResolvedValueOnce(null);

      Object.assign(request.body, { client_assertion: assertion });

      await expect(clientAssertion.authenticate(request)).rejects.toThrow(
        new InvalidClientException({ description: 'Invalid Client.' })
      );
    });

    it('should throw when the client of the assertion is not allowed to use this authentication method.', async () => {
      const jws = new JsonWebSignature(header, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(jwk);

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        authenticationMethod: 'client_secret_basic',
      });

      Reflect.set(clientAssertion, 'name', 'client_secret_jwt');
      Object.assign(request.body, { client_assertion: assertion });

      await expect(clientAssertion.authenticate(request)).rejects.toThrow(
        new InvalidClientException({
          description: 'This Client is not allowed to use the Authentication Method "client_secret_jwt".',
        })
      );

      Reflect.deleteProperty(clientAssertion, 'name');
    });

    it('should throw when the client of the assertion does not use the authentication signature algorithm.', async () => {
      const jws = new JsonWebSignature(header, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(jwk);

      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        authenticationMethod: 'client_secret_jwt',
        authenticationSigningAlgorithms: ['HS512'],
      });

      Reflect.set(clientAssertion, 'name', 'client_secret_jwt');
      Object.assign(request.body, { client_assertion: assertion });

      await expect(clientAssertion.authenticate(request)).rejects.toThrow(
        new InvalidClientException({
          description: 'This Client is not allowed to use the Authentication Method "client_secret_jwt".',
        })
      );

      Reflect.deleteProperty(clientAssertion, 'name');
    });

    it('should return the client represented by the client assertion.', async () => {
      const jws = new JsonWebSignature(header, new JsonWebTokenClaims(claims).toBuffer());
      const assertion = await jws.sign(jwk);

      const client = <Client>{
        id: 'client_id',
        authenticationMethod: 'client_secret_jwt',
        authenticationSigningAlgorithms: ['HS256'],
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      clientAssertion['getClientKey'] = async function () {
        return jwk;
      };

      Reflect.set(clientAssertion, 'name', 'client_secret_jwt');
      Object.assign(request.body, { client_assertion: assertion });

      await expect(clientAssertion.authenticate(request)).resolves.toBe(client);

      Reflect.deleteProperty(clientAssertion, 'name');
      Reflect.deleteProperty(clientAssertion, 'getClientKey');
    });
  });
});
