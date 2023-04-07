import { DependencyInjectionContainer } from '@guarani/di';
import { EllipticCurveKey, JsonWebKeySet, RsaKey } from '@guarani/jose';

import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { Endpoint } from './endpoint.type';
import { JsonWebKeySetEndpoint } from './jsonwebkeyset.endpoint';

const ecKey = new EllipticCurveKey({
  kty: 'EC',
  crv: 'P-256',
  x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
  y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
  kid: 'ec-key',
});

const rsaKey = new RsaKey({
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
      expect(endpoint.name).toEqual<Endpoint>('jwks');
    });
  });

  describe('path', () => {
    it('should have "/oauth/jwks" as its default path.', () => {
      expect(endpoint.path).toEqual('/oauth/jwks');
    });
  });

  describe('httpMethods', () => {
    it('should have \'["GET"]\' as its supported http methods.', () => {
      expect(endpoint.httpMethods).toStrictEqual<HttpMethod[]>(['GET']);
    });
  });

  describe('handle()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        path: '/oauth/jwks',
        query: {},
      });
    });

    it('should return the json web key set containing the keys of the authorization server.', async () => {
      await expect(endpoint.handle(request)).resolves.toStrictEqual(new HttpResponse().json(jsonWebKeySet));
    });
  });
});
