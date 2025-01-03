import { OutgoingHttpHeaders } from 'http';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { JSON } from '@guarani/primitives';
import { Dictionary } from '@guarani/types';

import { Client } from '../entities/client.entity';
import { DeviceCode } from '../entities/device-code.entity';
import { HttpRequest } from '../http/http.request';
import { HttpMethod } from '../http/http-method.type';
import { Logger } from '../logger/logger';
import { DeviceAuthorizationRequest } from '../requests/device-authorization-request';
import { DeviceAuthorizationResponse } from '../responses/device-authorization-response';
import { DeviceCodeServiceInterface } from '../services/device-code.service.interface';
import { DEVICE_CODE_SERVICE } from '../services/device-code.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { DeviceAuthorizationRequestValidator } from '../validators/device-authorization-request.validator';
import { DeviceAuthorizationEndpoint } from './device-authorization.endpoint';
import { Endpoint } from './endpoint.type';

jest.mock('../logger/logger');
jest.mock('../validators/device-authorization-request.validator');

describe('Device Authorization Endpoint', () => {
  let container: DependencyInjectionContainer;
  let endpoint: DeviceAuthorizationEndpoint;

  const loggerMock = jest.mocked(Logger.prototype);

  const validatorMock = jest.mocked(DeviceAuthorizationRequestValidator.prototype);

  const deviceCodeServiceMock = jest.mocked<DeviceCodeServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    shouldSlowDown: jest.fn(),
    save: jest.fn(),
  });

  const settings = <Settings>{
    issuer: 'https://server.example.com',
    scopes: ['foo', 'bar', 'baz', 'qux'],
    userInteraction: { deviceCodeUrl: '/device' },
    devicePollingInterval: 5,
  };

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
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
    it('should have "/oauth/device_authorization" as its default path.', () => {
      expect(endpoint.path).toEqual('/oauth/device_authorization');
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

  describe('constructor', () => {
    it('should throw when not providing a user interaction object.', () => {
      const settings = <Settings>{ issuer: 'https://server.example.com', scopes: ['foo', 'bar', 'baz', 'qux'] };

      container.delete<Settings>(SETTINGS);
      container.delete(DeviceAuthorizationEndpoint);

      container.bind<Settings>(SETTINGS).toValue(settings);
      container.bind(DeviceAuthorizationEndpoint).toSelf().asSingleton();

      expect(() => container.resolve(DeviceAuthorizationEndpoint)).toThrowWithMessage(
        TypeError,
        'Missing User Interaction options.',
      );
    });
  });

  describe('handle()', () => {
    const parameters: DeviceAuthorizationRequest = {};

    const requestFactory = (): HttpRequest => {
      return new HttpRequest({
        body: parameters,
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/device_authorization'),
      });
    };

    it('should return a device authorization response.', async () => {
      const request = requestFactory();

      const scopes: string[] = ['foo', 'bar'];

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        scopes,
      });

      const deviceCode: DeviceCode = Object.assign<DeviceCode, Partial<DeviceCode>>(Reflect.construct(DeviceCode, []), {
        id: 'device_code',
        userCode: 'user_code',
        expiresAt: new Date(Date.now() + 300000),
      });

      const deviceAuthorizationResponse: DeviceAuthorizationResponse = {
        device_code: 'device_code',
        user_code: 'user_code',
        verification_uri: 'https://server.example.com/device',
        verification_uri_complete: 'https://server.example.com/device?user_code=user_code',
        expires_in: 300,
        interval: 5,
      };

      validatorMock.validate.mockResolvedValueOnce({ parameters, client, scopes });

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
