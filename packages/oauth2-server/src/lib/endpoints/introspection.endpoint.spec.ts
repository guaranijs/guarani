import { OutgoingHttpHeaders } from 'http';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { JSON, removeNullishValues } from '@guarani/primitives';
import { Dictionary } from '@guarani/types';

import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { User } from '../entities/user.entity';
import { HttpRequest } from '../http/http.request';
import { HttpMethod } from '../http/http-method.type';
import { Logger } from '../logger/logger';
import { IntrospectionRequest } from '../requests/introspection-request';
import { IntrospectionResponse } from '../responses/introspection-response';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { IntrospectionRequestValidator } from '../validators/introspection-request.validator';
import { Endpoint } from './endpoint.type';
import { IntrospectionEndpoint } from './introspection.endpoint';

jest.mock('../logger/logger');
jest.mock('../validators/introspection-request.validator');

describe('Introspection Endpoint', () => {
  let container: DependencyInjectionContainer;
  let endpoint: IntrospectionEndpoint;

  const loggerMock = jest.mocked(Logger.prototype);
  const validatorMock = jest.mocked(IntrospectionRequestValidator.prototype);

  const settings = <Settings>{
    issuer: 'https://server.example.com',
    grantTypes: ['refresh_token'],
    enableRefreshTokenIntrospection: true,
  };

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
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
      expect(endpoint.httpMethods).toEqual<HttpMethod[]>(['POST']);
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
    let parameters: IntrospectionRequest;

    const requestFactory = (data: Partial<IntrospectionRequest> = {}): HttpRequest => {
      removeNullishValues<IntrospectionRequest>(Object.assign(parameters, data));

      return new HttpRequest({
        body: parameters,
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/introspect'),
      });
    };

    beforeEach(() => {
      parameters = { token: 'access_token' };
    });

    it('should return an inactive token response when the client is not the owner of the token.', async () => {
      const request = requestFactory();

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      const anotherClient: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'another_client_id',
      });

      const token: AccessToken = Object.assign<AccessToken, Partial<AccessToken>>(Reflect.construct(AccessToken, []), {
        id: 'access_token',
        client: anotherClient,
      });

      validatorMock.validate.mockResolvedValueOnce({
        parameters,
        client,
        token,
      });

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(200);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
        'Content-Type': 'application/json',
      });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual<IntrospectionResponse>({ active: false });
    });

    it('should return an inactive token response when the token is revoked.', async () => {
      const request = requestFactory();

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      const token: AccessToken = Object.assign<AccessToken, Partial<AccessToken>>(Reflect.construct(AccessToken, []), {
        id: 'access_token',
        isRevoked: true,
        client,
      });

      validatorMock.validate.mockResolvedValueOnce({
        parameters,
        client,
        token,
      });

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(200);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
        'Content-Type': 'application/json',
      });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual<IntrospectionResponse>({ active: false });
    });

    it('should return an inactive token response when the token is not yet valid.', async () => {
      const request = requestFactory();

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      const token: AccessToken = Object.assign<AccessToken, Partial<AccessToken>>(Reflect.construct(AccessToken, []), {
        id: 'access_token',
        isRevoked: false,
        validAfter: new Date(Date.now() + 3600000),
        client,
      });

      validatorMock.validate.mockResolvedValueOnce({
        parameters,
        client,
        token,
      });

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(200);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
        'Content-Type': 'application/json',
      });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual<IntrospectionResponse>({ active: false });
    });

    it('should return an inactive token response when the token is expired.', async () => {
      const request = requestFactory();

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      const token: AccessToken = Object.assign<AccessToken, Partial<AccessToken>>(Reflect.construct(AccessToken, []), {
        id: 'access_token',
        isRevoked: false,
        validAfter: new Date(Date.now() - 7200000),
        expiresAt: new Date(Date.now() - 3600000),
        client,
      });

      validatorMock.validate.mockResolvedValueOnce({
        parameters,
        client,
        token,
      });

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(200);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
        'Content-Type': 'application/json',
      });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual<IntrospectionResponse>({ active: false });
    });

    it('should return the metadata of the requested token.', async () => {
      const request = requestFactory();

      const now = Date.now();

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        subjectType: 'public',
      });

      const user: User = Object.assign<User, Partial<User>>(Reflect.construct(User, []), { id: 'user_id' });

      const token: AccessToken = Object.assign<AccessToken, Partial<AccessToken>>(Reflect.construct(AccessToken, []), {
        id: 'access_token',
        scopes: ['foo', 'bar'],
        isRevoked: false,
        issuedAt: new Date(now),
        validAfter: new Date(now),
        expiresAt: new Date(now + 3600000),
        client,
        user,
      });

      validatorMock.validate.mockResolvedValueOnce({
        parameters,
        client,
        token,
      });

      const introspectionResponse = removeNullishValues<IntrospectionResponse>({
        active: true,
        scope: 'foo bar',
        client_id: 'client_id',
        username: undefined,
        token_type: 'Bearer',
        exp: Math.floor((now + 3600000) / 1000),
        iat: Math.floor(now / 1000),
        nbf: Math.floor(now / 1000),
        sub: 'user_id',
        aud: ['client_id'],
        iss: 'https://server.example.com',
        jti: undefined,
      });

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(200);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
        'Content-Type': 'application/json',
      });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual<IntrospectionResponse>(introspectionResponse);
    });
  });
});
