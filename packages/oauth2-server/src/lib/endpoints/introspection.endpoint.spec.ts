import { DependencyInjectionContainer } from '@guarani/di';

import { OutgoingHttpHeaders } from 'http';

import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { User } from '../entities/user.entity';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { IntrospectionRequest } from '../requests/introspection-request';
import { IntrospectionResponse } from '../responses/introspection-response';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { IntrospectionRequestValidator } from '../validators/introspection-request.validator';
import { Endpoint } from './endpoint.type';
import { IntrospectionEndpoint } from './introspection.endpoint';

jest.mock('../validators/introspection-request.validator');

describe('Introspection Endpoint', () => {
  let container: DependencyInjectionContainer;
  let endpoint: IntrospectionEndpoint;

  const validatorMock = jest.mocked(IntrospectionRequestValidator.prototype, true);

  const settings = <Settings>{
    issuer: 'https://server.example.com',
    grantTypes: ['refresh_token'],
    enableRefreshTokenIntrospection: true,
  };

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(IntrospectionRequestValidator).toValue(validatorMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind(IntrospectionEndpoint).toSelf().asSingleton();

    endpoint = container.resolve(IntrospectionEndpoint);
  });

  describe('name', () => {
    it('should have "introspection" as its name.', () => {
      expect(endpoint.name).toEqual<Endpoint>('introspection');
    });
  });

  describe('path', () => {
    it('should have "/oauth/introspect" as its default path.', () => {
      expect(endpoint.path).toEqual('/oauth/introspect');
    });
  });

  describe('httpMethods', () => {
    it('should have \'["POST"]\' as its supported http methods.', () => {
      expect(endpoint.httpMethods).toStrictEqual<HttpMethod[]>(['POST']);
    });
  });

  describe('headers', () => {
    it('should have a default "headers" object for the http response.', () => {
      expect(endpoint['headers']).toStrictEqual<OutgoingHttpHeaders>({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      });
    });
  });

  describe('handle()', () => {
    let request: HttpRequest;

    const defaultResponse = new HttpResponse()
      .setHeaders({ 'Cache-Control': 'no-store', Pragma: 'no-cache' })
      .json({ active: false });

    beforeEach(() => {
      request = new HttpRequest({
        body: { token: 'access_token' },
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/introspect',
        query: {},
      });
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should return an inactive token response when the client is not the owner of the token.', async () => {
      const client = <Client>{ id: 'client_id' };
      const token = <AccessToken>{ handle: 'access_token', client: { id: 'another_client_id' } };

      validatorMock.validate.mockResolvedValueOnce({
        parameters: <IntrospectionRequest>request.body,
        client,
        token,
        tokenType: 'access_token',
      });

      await expect(endpoint.handle(request)).resolves.toStrictEqual(defaultResponse);
    });

    it('should return an inactive token response when the token is revoked.', async () => {
      const client = <Client>{ id: 'client_id' };
      const token = <AccessToken>{ handle: 'access_token', isRevoked: true, client };

      validatorMock.validate.mockResolvedValueOnce({
        parameters: <IntrospectionRequest>request.body,
        client,
        token,
        tokenType: 'access_token',
      });

      await expect(endpoint.handle(request)).resolves.toStrictEqual(defaultResponse);
    });

    it('should return an inactive token response when the token is not yet valid.', async () => {
      const client = <Client>{ id: 'client_id' };
      const token = <AccessToken>{
        handle: 'access_token',
        isRevoked: false,
        validAfter: new Date(Date.now() + 3600000),
        client,
      };

      validatorMock.validate.mockResolvedValueOnce({
        parameters: <IntrospectionRequest>request.body,
        client,
        token,
        tokenType: 'access_token',
      });

      await expect(endpoint.handle(request)).resolves.toStrictEqual(defaultResponse);
    });

    it('should return an inactive token response when the token is expired.', async () => {
      const client = <Client>{ id: 'client_id' };
      const token = <AccessToken>{
        handle: 'access_token',
        isRevoked: false,
        validAfter: new Date(Date.now() - 7200000),
        expiresAt: new Date(Date.now() - 3600000),
        client,
      };

      validatorMock.validate.mockResolvedValueOnce({
        parameters: <IntrospectionRequest>request.body,
        client,
        token,
        tokenType: 'access_token',
      });

      await expect(endpoint.handle(request)).resolves.toStrictEqual(defaultResponse);
    });

    it('should return the metadata of the requested token.', async () => {
      const now = Date.now();

      const client = <Client>{ id: 'client_id' };
      const user = <User>{ id: 'user_id' };

      const token = <AccessToken>{
        handle: 'access_token',
        scopes: ['foo', 'bar'],
        isRevoked: false,
        issuedAt: new Date(now),
        validAfter: new Date(now),
        expiresAt: new Date(now + 3600000),
        client,
        user,
      };

      validatorMock.validate.mockResolvedValueOnce({
        parameters: <IntrospectionRequest>request.body,
        client,
        token,
        tokenType: 'access_token',
      });

      const introspectionResponse = <IntrospectionResponse>{
        active: true,
        scope: 'foo bar',
        client_id: 'client_id',
        // username: undefined,
        token_type: 'Bearer',
        exp: Math.ceil((now + 3600000) / 1000),
        iat: Math.ceil((now - 3600000) / 1000),
        nbf: Math.ceil((now - 3600000) / 1000),
        sub: 'user_id',
        aud: 'client_id',
        iss: 'https://server.example.com',
        // jti: undefined,
      };

      await expect(endpoint.handle(request)).resolves.toStrictEqual(
        new HttpResponse().setHeaders(endpoint['headers']).json(introspectionResponse)
      );
    });
  });
});
