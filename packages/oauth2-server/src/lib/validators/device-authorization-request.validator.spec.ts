import { DependencyInjectionContainer } from '@guarani/di';

import { DeviceAuthorizationContext } from '../context/device-authorization-context';
import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { ClientAuthenticationHandler } from '../handlers/client-authentication.handler';
import { ScopeHandler } from '../handlers/scope.handler';
import { HttpRequest } from '../http/http.request';
import { DeviceAuthorizationRequest } from '../requests/device-authorization-request';
import { DeviceAuthorizationRequestValidator } from './device-authorization-request.validator';

jest.mock('../handlers/client-authentication.handler');
jest.mock('../handlers/scope.handler');

const invalidScopes: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];

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

    it('should throw when the client fails to authenticate.', async () => {
      const error = new InvalidClientException('Lorem ipsum dolor sit amet...');
      clientAuthenticationHandlerMock.authenticate.mockRejectedValueOnce(error);
      await expect(validator.validate(request)).rejects.toThrow(error);
    });

    it.each(invalidScopes)('should throw when providing an invalid "scope" parameter.', async (scope) => {
      request.body.scope = scope;

      const client = <Client>{ id: 'client_id' };
      const error = new InvalidRequestException('Invalid parameter "scope".');

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrow(error);
    });

    it('should return a device authorization context.', async () => {
      const scopes: string[] = ['foo', 'bar'];
      const client = <Client>{ id: 'client_id', scopes };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(scopes);

      await expect(validator.validate(request)).resolves.toStrictEqual<DeviceAuthorizationContext>({
        parameters: request.body as DeviceAuthorizationRequest,
        client,
        scopes,
      });
    });
  });
});
