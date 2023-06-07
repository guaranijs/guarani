import { DependencyInjectionContainer } from '@guarani/di';
import { Dictionary } from '@guarani/types';

import { OutgoingHttpHeaders } from 'http';

import { Client } from '../entities/client.entity';
import { DeviceCode } from '../entities/device-code.entity';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { DeviceAuthorizationRequest } from '../requests/device-authorization-request';
import { DeviceAuthorizationResponse } from '../responses/device-authorization-response';
import { DeviceCodeServiceInterface } from '../services/device-code.service.interface';
import { DEVICE_CODE_SERVICE } from '../services/device-code.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { DeviceAuthorizationRequestValidator } from '../validators/device-authorization-request.validator';
import { DeviceAuthorizationEndpoint } from './device-authorization.endpoint';
import { Endpoint } from './endpoint.type';

jest.mock('../validators/device-authorization-request.validator');

describe('Device Authorization Endpoint', () => {
  let container: DependencyInjectionContainer;
  let endpoint: DeviceAuthorizationEndpoint;

  const validatorMock = jest.mocked(DeviceAuthorizationRequestValidator.prototype);

  const deviceCodeServiceMock = jest.mocked<DeviceCodeServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    shouldSlowDown: jest.fn(),
    save: jest.fn(),
  });

  const settings = <Settings>{ scopes: ['foo', 'bar', 'baz', 'qux'], devicePollingInterval: 5 };

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(DeviceAuthorizationRequestValidator).toValue(validatorMock);
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
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/device-authorization',
        query: {},
      });
    });

    it('should return a device authorization response.', async () => {
      const scopes: string[] = ['foo', 'bar'];
      const client = <Client>{ id: 'client_id', scopes };

      const deviceCode = <DeviceCode>{
        id: 'device_code',
        userCode: 'user_code',
        verificationUri: 'https://server.example.com/device',
        verificationUriComplete: 'https://server.example.com/device?user_code=user_code',
        expiresAt: new Date(Date.now() + 300000),
      };

      const deviceAuthorizationResponse: DeviceAuthorizationResponse = {
        device_code: 'device_code',
        user_code: 'user_code',
        verification_uri: 'https://server.example.com/device',
        verification_uri_complete: 'https://server.example.com/device?user_code=user_code',
        expires_in: 300,
        interval: 5,
      };

      validatorMock.validate.mockResolvedValueOnce({
        parameters: request.body as DeviceAuthorizationRequest,
        client,
        scopes,
      });

      deviceCodeServiceMock.create.mockResolvedValueOnce(deviceCode);

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(200);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
        'Content-Type': 'application/json',
      });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual(deviceAuthorizationResponse);
    });
  });
});
