import { DependencyInjectionContainer } from '@guarani/di';

import { OutgoingHttpHeaders } from 'http';

import { Client } from '../entities/client.entity';
import { DeviceCode } from '../entities/device-code.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidScopeException } from '../exceptions/invalid-scope.exception';
import { ClientAuthenticationHandler } from '../handlers/client-authentication.handler';
import { ScopeHandler } from '../handlers/scope.handler';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { DeviceAuthorizationRequest } from '../messages/device-authorization-request';
import { DeviceAuthorizationResponse } from '../messages/device-authorization-response';
import { DeviceCodeServiceInterface } from '../services/device-code.service.interface';
import { DEVICE_CODE_SERVICE } from '../services/device-code.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { DeviceAuthorizationEndpoint } from './device-authorization.endpoint';
import { Endpoint } from './endpoint.type';

jest.mock('../handlers/client-authentication.handler');
jest.mock('../handlers/scope.handler');

describe('Device Authorization Endpoint', () => {
  let endpoint: DeviceAuthorizationEndpoint;

  const clientAuthenticationHandlerMock = jest.mocked(ClientAuthenticationHandler.prototype, true);

  const scopeHandlerMock = jest.mocked(ScopeHandler.prototype, true);

  const deviceCodeServiceMock = jest.mocked<DeviceCodeServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    shouldSlowDown: jest.fn(),
    save: jest.fn(),
  });

  const settings = <Settings>{ scopes: ['foo', 'bar', 'baz', 'qux'], devicePollingInterval: 5 };

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind(ClientAuthenticationHandler).toValue(clientAuthenticationHandlerMock);
    container.bind(ScopeHandler).toValue(scopeHandlerMock);
    container.bind<DeviceCodeServiceInterface>(DEVICE_CODE_SERVICE).toValue(deviceCodeServiceMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind(DeviceAuthorizationEndpoint).toSelf().asSingleton();

    endpoint = container.resolve(DeviceAuthorizationEndpoint);
  });

  describe('name', () => {
    it('should have "device_authorization" as its name.', () => {
      expect(endpoint.name).toEqual<Endpoint>('device_authorization');
    });
  });

  describe('path', () => {
    it('should have "/oauth/device-authorization" as its default path.', () => {
      expect(endpoint.path).toEqual('/oauth/device-authorization');
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
    let request: HttpRequest<DeviceAuthorizationRequest>;

    beforeEach(() => {
      request = new HttpRequest<DeviceAuthorizationRequest>({
        body: {},
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/device-authorization',
        query: {},
      });
    });

    it('should return an error response when not using a client authentication method.', async () => {
      const error = new InvalidClientException({ description: 'No Client Authentication Method detected.' });

      clientAuthenticationHandlerMock.authenticate.mockRejectedValue(error);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: { 'Content-Type': 'application/json', ...endpoint['headers'] },
        statusCode: error.statusCode,
      });
    });

    it('should return an error response when using multiple client authentication methods.', async () => {
      const error = new InvalidClientException({ description: 'Multiple Client Authentication Methods detected.' });

      clientAuthenticationHandlerMock.authenticate.mockRejectedValue(error);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: { 'Content-Type': 'application/json', ...endpoint['headers'] },
        statusCode: error.statusCode,
      });
    });

    it("should return an error response when the provided secret does not match the client's one.", async () => {
      const error = new InvalidClientException({ description: 'Invalid Credentials.' }).setHeaders({
        'WWW-Authenticate': 'Basic',
      });

      clientAuthenticationHandlerMock.authenticate.mockRejectedValue(error);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: { 'Content-Type': 'application/json', ...endpoint['headers'], ...error.headers },
        statusCode: error.statusCode,
      });
    });

    it('should return an error response when requesting an unsupported scope.', async () => {
      Reflect.set(request.body, 'scope', 'unknown');

      const error = new InvalidScopeException({ description: 'Unsupported scope "unknown".' });

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(<Client>{ id: 'client_id' });

      scopeHandlerMock.checkRequestedScope.mockImplementationOnce(() => {
        throw error;
      });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: { 'Content-Type': 'application/json', ...endpoint['headers'], ...error.headers },
        statusCode: error.statusCode,
      });
    });

    it("should return an error response when the client requests a scope it's not allowed to.", async () => {
      Reflect.set(request.body, 'scope', 'qux');

      const error = new AccessDeniedException({ description: 'The Client is not allowed to request the scope "qux".' });

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        scopes: ['foo', 'bar', 'baz'],
      });

      scopeHandlerMock.checkRequestedScope.mockImplementationOnce(() => {
        throw error;
      });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: { 'Content-Type': 'application/json', ...endpoint['headers'], ...error.headers },
        statusCode: error.statusCode,
      });
    });

    it('should return a device authorization response.', async () => {
      const deviceAuthorizationResponse: DeviceAuthorizationResponse = {
        device_code: 'device_code',
        user_code: 'user_code',
        verification_uri: 'https://server.example.com/device',
        verification_uri_complete: 'https://server.example.com/device?user_code=user_code',
        expires_in: 300,
        interval: 5,
      };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(<Client>{ id: 'client_id' });

      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      deviceCodeServiceMock.create.mockResolvedValueOnce(<DeviceCode>{
        id: 'device_code',
        userCode: 'user_code',
        verificationUri: 'https://server.example.com/device',
        verificationUriComplete: 'https://server.example.com/device?user_code=user_code',
        expiresAt: new Date(Date.now() + 300000),
      });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.from(JSON.stringify(deviceAuthorizationResponse), 'utf8'),
        headers: { 'Content-Type': 'application/json', ...endpoint['headers'] },
        statusCode: 200,
      });
    });
  });
});
