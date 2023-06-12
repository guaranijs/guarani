import { Buffer } from 'buffer';
import { URL, URLSearchParams } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';
import { OneOrMany } from '@guarani/types';

import { DeviceCodeTokenContext } from '../../context/token/device-code.token-context';
import { Client } from '../../entities/client.entity';
import { DeviceCode } from '../../entities/device-code.entity';
import { InvalidGrantException } from '../../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { GrantTypeInterface } from '../../grant-types/grant-type.interface';
import { GRANT_TYPE } from '../../grant-types/grant-type.token';
import { GrantType } from '../../grant-types/grant-type.type';
import { ClientAuthenticationHandler } from '../../handlers/client-authentication.handler';
import { HttpRequest } from '../../http/http.request';
import { DeviceCodeTokenRequest } from '../../requests/token/device-code.token-request';
import { DeviceCodeServiceInterface } from '../../services/device-code.service.interface';
import { DEVICE_CODE_SERVICE } from '../../services/device-code.service.token';
import { DeviceCodeTokenRequestValidator } from './device-code.token-request.validator';

jest.mock('../../handlers/client-authentication.handler');

describe('Device Code Token Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: DeviceCodeTokenRequestValidator;

  const clientAuthenticationHandlerMock = jest.mocked(ClientAuthenticationHandler.prototype);

  const deviceCodeServiceMock = jest.mocked<DeviceCodeServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    shouldSlowDown: jest.fn(),
  });

  const grantTypesMocks = [
    jest.mocked<GrantTypeInterface>({ name: 'authorization_code', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'client_credentials', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'password', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'refresh_token', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'urn:ietf:params:oauth:grant-type:device_code', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'urn:ietf:params:oauth:grant-type:jwt-bearer', handle: jest.fn() }),
  ];

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(ClientAuthenticationHandler).toValue(clientAuthenticationHandlerMock);
    container.bind<DeviceCodeServiceInterface>(DEVICE_CODE_SERVICE).toValue(deviceCodeServiceMock);

    grantTypesMocks.forEach((grantTypeMock) => {
      container.bind<GrantTypeInterface>(GRANT_TYPE).toValue(grantTypeMock);
    });

    container.bind(DeviceCodeTokenRequestValidator).toSelf().asSingleton();

    validator = container.resolve(DeviceCodeTokenRequestValidator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "urn:ietf:params:oauth:grant-type:device_code" as its value.', () => {
      expect(validator.name).toEqual<GrantType>('urn:ietf:params:oauth:grant-type:device_code');
    });
  });

  describe('validate()', () => {
    let parameters: DeviceCodeTokenRequest;

    const requestFactory = (data: Partial<DeviceCodeTokenRequest> = {}): HttpRequest => {
      parameters = removeNullishValues<DeviceCodeTokenRequest>(Object.assign(parameters, data));

      const body = new URLSearchParams(parameters as Record<string, OneOrMany<string>>);

      return new HttpRequest({
        body: Buffer.from(body.toString(), 'utf8'),
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/token'),
      });
    };

    beforeEach(() => {
      parameters = { grant_type: 'urn:ietf:params:oauth:grant-type:device_code', device_code: 'device_code' };
    });

    it('should throw when not providing the parameter "device_code".', async () => {
      const request = requestFactory({ device_code: undefined });

      const client = <Client>{ id: 'client_id', grantTypes: ['urn:ietf:params:oauth:grant-type:device_code'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "device_code".'
      );
    });

    it('should throw when no device code is found.', async () => {
      const request = requestFactory();

      const client = <Client>{ id: 'client_id', grantTypes: ['urn:ietf:params:oauth:grant-type:device_code'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      deviceCodeServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'Invalid Device Code.'
      );
    });

    it('should return a device code token context.', async () => {
      const request = requestFactory();

      const client = <Client>{ id: 'client_id', grantTypes: ['urn:ietf:params:oauth:grant-type:device_code'] };
      const deviceCode = <DeviceCode>{ id: 'device_code' };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      deviceCodeServiceMock.findOne.mockResolvedValueOnce(deviceCode);

      await expect(validator.validate(request)).resolves.toStrictEqual<DeviceCodeTokenContext>({
        parameters: request.form(),
        client,
        grantType: grantTypesMocks[4]!,
        deviceCode,
      });
    });
  });
});
