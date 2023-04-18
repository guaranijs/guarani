import { DependencyInjectionContainer } from '@guarani/di';

import { OutgoingHttpHeaders } from 'http';

import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { RevocationRequest } from '../requests/revocation-request';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { RevocationRequestValidator } from '../validators/revocation-request.validator';
import { Endpoint } from './endpoint.type';
import { RevocationEndpoint } from './revocation.endpoint';

jest.mock('../validators/revocation-request.validator');

describe('Revocation Endpoint', () => {
  let container: DependencyInjectionContainer;
  let endpoint: RevocationEndpoint;

  const validatorMock = jest.mocked(RevocationRequestValidator.prototype, true);

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
    let request: HttpRequest<RevocationRequest>;

    const defaultResponse = new HttpResponse().setHeaders({ 'Cache-Control': 'no-store', Pragma: 'no-cache' });

    beforeEach(() => {
      request = new HttpRequest<RevocationRequest>({
        body: { token: 'access_token' },
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/revoke',
        query: {},
      });
    });

    it('should not revoke when the client is not the owner of the token.', async () => {
      const client = <Client>{ id: 'client_id' };
      const token = <AccessToken>{ handle: 'access_token', client: { id: 'another_client_id' } };

      validatorMock.validate.mockResolvedValueOnce({
        parameters: request.data,
        client,
        token,
        tokenType: 'access_token',
      });

      await expect(endpoint.handle(request)).resolves.toStrictEqual(defaultResponse);

      expect(accessTokenServiceMock.revoke).not.toHaveBeenCalled();
      expect(refreshTokenServiceMock.revoke).not.toHaveBeenCalled();
    });

    it('should revoke an access token.', async () => {
      const client = <Client>{ id: 'client_id' };
      const token = <AccessToken>{ handle: 'access_token', client };

      validatorMock.validate.mockResolvedValueOnce({
        parameters: request.data,
        client,
        token,
        tokenType: 'access_token',
      });

      await expect(endpoint.handle(request)).resolves.toStrictEqual(defaultResponse);

      expect(accessTokenServiceMock.revoke).toHaveBeenCalledTimes(1);
      expect(refreshTokenServiceMock.revoke).not.toHaveBeenCalled();
    });

    it('should revoke a refresh token.', async () => {
      request.body.token = 'refresh_token';

      const client = <Client>{ id: 'client_id' };
      const token = <RefreshToken>{ handle: 'refresh_token', client };

      validatorMock.validate.mockResolvedValueOnce({
        parameters: request.data,
        client,
        token,
        tokenType: 'refresh_token',
      });

      await expect(endpoint.handle(request)).resolves.toStrictEqual(defaultResponse);

      expect(accessTokenServiceMock.revoke).not.toHaveBeenCalled();
      expect(refreshTokenServiceMock.revoke).toHaveBeenCalledTimes(1);
    });
  });
});
