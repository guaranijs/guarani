import { DependencyInjectionContainer } from '@guarani/di';
import { JsonWebKey, JsonWebKeySet } from '@guarani/jose';

import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { JsonWebKeySetEndpoint } from './jsonwebkeyset.endpoint';

const ecKey = new JsonWebKey({
  kty: 'EC',
  crv: 'P-256',
  x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
  y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
  kid: 'ec-key',
});

const rsaKey = new JsonWebKey({
  kty: 'RSA',
  n:
    'xjpFydzTbByzL5jhEa2yQO63dpS9d9SKaN107AR69skKiTR4uK1c4SzDt4YcurDB' +
    'yhgKNzeBo6Vq3IRrkrltp97LKWfeZdM-leGt8-UTZEWqrNf3UGOEj8kI6lbjiG-S' +
    'n_yNHcVA9qBV22norZkgXctHLeFbY6TmpD-I8_UiplZUHoc9KlYc7crCQRa-O7tK' +
    'FDULNTMjjifc0dmuYP7ZcYAZXmRmoOpQuDr8s7OZY7TAqN0btMfA7RpUCWLT6TMR' +
    'QPX8GcyTxfbkOrSTFueKMHVNdXDtl068XXJ9mkjORiEmwlzqSBoxdeLWcNf_u20S' +
    '5JG5iK0nsm1uZYu-02XN-w',
  e: 'AQAB',
  kid: 'rsa-key',
});

describe('JSON Web Key Set Endpoint', () => {
  let endpoint: JsonWebKeySetEndpoint;

  const jsonWebKeySet = new JsonWebKeySet([ecKey, rsaKey]);

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind(JsonWebKeySet).toValue(jsonWebKeySet);
    container.bind(JsonWebKeySetEndpoint).toSelf().asSingleton();

    endpoint = container.resolve(JsonWebKeySetEndpoint);
  });

  describe('name', () => {
    it('should have "jwks" as its name.', () => {
      expect(endpoint.name).toBe('jwks');
    });
  });

  describe('path', () => {
    it('should have "/oauth/jwks" as its default path.', () => {
      expect(endpoint.path).toBe('/oauth/jwks');
    });
  });

  describe('httpMethods', () => {
    it('should have \'["GET"]\' as its supported http methods.', () => {
      expect(endpoint.httpMethods).toStrictEqual(['GET']);
    });
  });

  describe('handle()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = {
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        path: '/oauth/jwks',
        query: {},
      };
    });

    it('should return the json web key set containing the keys of the authorization server.', async () => {
      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.from(JSON.stringify(jsonWebKeySet), 'utf8'),
        headers: { 'Content-Type': 'application/json' },
        statusCode: 200,
      });
    });
  });
});
