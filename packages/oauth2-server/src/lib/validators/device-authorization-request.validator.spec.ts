import { DependencyInjectionContainer } from '@guarani/di';

import { DeviceAuthorizationContext } from '../context/device-authorization.context';
import { Client } from '../entities/client.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidScopeException } from '../exceptions/invalid-scope.exception';
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

  const clientAuthenticationHandlerMock = jest.mocked(ClientAuthenticationHandler.prototype, true);
  const scopeHandlerMock = jest.mocked(ScopeHandler.prototype, true);

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

    it('should throw when the client fails to authenticate.', async () => {
      const error = new InvalidClientException({ description: 'Lorem ipsum dolor sit amet...' });

      clientAuthenticationHandlerMock.authenticate.mockRejectedValueOnce(error);

      await expect(validator.validate(request)).rejects.toThrow(error);
    });

    it('should throw when requesting an unsupported scope.', async () => {
      const client = <Client>{ id: 'client_id' };
      const error = new InvalidScopeException({ description: 'Unsupported scope "unknown".' });

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      scopeHandlerMock.checkRequestedScope.mockImplementationOnce(() => {
        throw error;
      });

      await expect(validator.validate(request)).rejects.toThrow(error);
    });

    it("should throw when the client requests a scope it's not allowed to.", async () => {
      request.body.scope = 'foo bar unknown';

      const client = <Client>{ id: 'client_id', scopes: ['foo', 'bar'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();

      await expect(validator.validate(request)).rejects.toThrow(
        new AccessDeniedException({ description: 'The Client is not allowed to request the scope "unknown".' })
      );
    });

    it('should return a device authorization context.', async () => {
      const scopes: string[] = ['foo', 'bar'];
      const client = <Client>{ id: 'client_id', scopes };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(scopes);

      await expect(validator.validate(request)).resolves.toStrictEqual<DeviceAuthorizationContext>({
        parameters: request.data,
        client,
        scopes,
      });
    });
  });
});
