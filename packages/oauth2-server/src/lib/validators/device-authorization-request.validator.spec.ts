import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';

import { DeviceAuthorizationContext } from '../context/device-authorization-context';
import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { ClientAuthenticationHandler } from '../handlers/client-authentication.handler';
import { ScopeHandler } from '../handlers/scope.handler';
import { HttpRequest } from '../http/http.request';
import { DeviceAuthorizationRequest } from '../requests/device-authorization-request';
import { DeviceAuthorizationRequestValidator } from './device-authorization-request.validator';

jest.mock('../handlers/client-authentication.handler');
jest.mock('../handlers/scope.handler');

describe('Device Authorization Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: DeviceAuthorizationRequestValidator;

  const clientAuthenticationHandlerMock = jest.mocked(ClientAuthenticationHandler.prototype);
  const scopeHandlerMock = jest.mocked(ScopeHandler.prototype);

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(ClientAuthenticationHandler).toValue(clientAuthenticationHandlerMock);
    container.bind(ScopeHandler).toValue(scopeHandlerMock);
    container.bind(DeviceAuthorizationRequestValidator).toSelf().asSingleton();

    validator = container.resolve(DeviceAuthorizationRequestValidator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('validate()', () => {
    let parameters: DeviceAuthorizationRequest;

    const requestFactory = (data: Partial<DeviceAuthorizationRequest> = {}): HttpRequest => {
      removeNullishValues<DeviceAuthorizationRequest>(Object.assign(parameters, data));

      return new HttpRequest({
        body: parameters,
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/device_authorization'),
      });
    };

    beforeEach(() => {
      parameters = {};
    });

    it('should throw when the client fails to authenticate.', async () => {
      const request = requestFactory();

      const error = new InvalidClientException('Lorem ipsum dolor sit amet...');

      clientAuthenticationHandlerMock.authenticate.mockRejectedValueOnce(error);

      await expect(validator.validate(request)).rejects.toThrow(error);
    });

    it('should return a device authorization context with the requested scope.', async () => {
      const request = requestFactory({ scope: 'foo bar' });

      const scopes: string[] = ['foo', 'bar'];
      const client = <Client>{ id: 'client_id', scopes: ['foo', 'bar', 'baz'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(scopes);

      await expect(validator.validate(request)).resolves.toStrictEqual<DeviceAuthorizationContext>({
        parameters,
        client,
        scopes: ['foo', 'bar'],
      });
    });

    it('should return a device authorization context.', async () => {
      const request = requestFactory();

      const scopes: string[] = ['foo', 'bar', 'baz'];
      const client = <Client>{ id: 'client_id', scopes };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(scopes);

      await expect(validator.validate(request)).resolves.toStrictEqual<DeviceAuthorizationContext>({
        parameters,
        client,
        scopes,
      });
    });
  });
});
