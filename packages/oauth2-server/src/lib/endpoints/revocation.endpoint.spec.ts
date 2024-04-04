import { Buffer } from 'buffer';
import { OutgoingHttpHeaders } from 'http';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';
import { Dictionary } from '@guarani/types';

import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { HttpRequest } from '../http/http.request';
import { HttpMethod } from '../http/http-method.type';
import { Logger } from '../logger/logger';
import { RevocationRequest } from '../requests/revocation-request';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { RevocationRequestValidator } from '../validators/revocation-request.validator';
import { Endpoint } from './endpoint.type';
import { RevocationEndpoint } from './revocation.endpoint';

jest.mock('../logger/logger');
jest.mock('../validators/revocation-request.validator');

describe('Revocation Endpoint', () => {
  let container: DependencyInjectionContainer;
  let endpoint: RevocationEndpoint;

  const loggerMock = jest.mocked(Logger.prototype);

  const validatorMock = jest.mocked(RevocationRequestValidator.prototype);

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

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
    container.bind(RevocationRequestValidator).toSelf().asSingleton();
    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind<RefreshTokenServiceInterface>(REFRESH_TOKEN_SERVICE).toValue(refreshTokenServiceMock);
    container.bind(RevocationEndpoint).toSelf().asSingleton();

    endpoint = container.resolve(RevocationEndpoint);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "revocation" as its name.', () => {
      expect(endpoint.name).toEqual<Endpoint>('revocation');
    });
  });

  describe('path', () => {
    it('should have "/oauth/revoke" as its default path.', () => {
      expect(endpoint.path).toEqual('/oauth/revoke');
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
    let parameters: RevocationRequest;

    const requestFactory = (data: Partial<RevocationRequest> = {}): HttpRequest => {
      removeNullishValues<RevocationRequest>(Object.assign(parameters, data));

      return new HttpRequest({
        body: parameters,
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/revoke'),
      });
    };

    beforeEach(() => {
      parameters = { token: 'access_token' };
    });

    it('should not revoke when the client is not the owner of the token.', async () => {
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
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ 'Cache-Control': 'no-store', Pragma: 'no-cache' });
      expect(response.body).toEqual(Buffer.alloc(0));

      expect(accessTokenServiceMock.revoke).not.toHaveBeenCalled();
      expect(refreshTokenServiceMock.revoke).not.toHaveBeenCalled();
    });

    it('should revoke an access token.', async () => {
      const request = requestFactory();

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      const token: AccessToken = Object.assign<AccessToken, Partial<AccessToken>>(Reflect.construct(AccessToken, []), {
        id: 'access_token',
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
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ 'Cache-Control': 'no-store', Pragma: 'no-cache' });
      expect(response.body).toEqual(Buffer.alloc(0));

      expect(accessTokenServiceMock.revoke).toHaveBeenCalledTimes(1);
      expect(refreshTokenServiceMock.revoke).not.toHaveBeenCalled();
    });

    it('should revoke a refresh token.', async () => {
      const request = requestFactory({ token: 'refresh_token' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      const token: RefreshToken = Object.assign<RefreshToken, Partial<RefreshToken>>(
        Reflect.construct(RefreshToken, []),
        { id: 'refresh_token', client },
      );

      validatorMock.validate.mockResolvedValueOnce({
        parameters,
        client,
        token,
      });

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(200);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ 'Cache-Control': 'no-store', Pragma: 'no-cache' });
      expect(response.body).toEqual(Buffer.alloc(0));

      expect(accessTokenServiceMock.revoke).not.toHaveBeenCalled();
      expect(refreshTokenServiceMock.revoke).toHaveBeenCalledTimes(1);
    });
  });
});
