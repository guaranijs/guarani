import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';

import { ClientAuthenticationInterface } from '../client-authentication/client-authentication.interface';
import { CLIENT_AUTHENTICATION } from '../client-authentication/client-authentication.token';
import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { HttpRequest } from '../http/http.request';
import { Logger } from '../logger/logger';
import { ClientAuthenticationHandler } from './client-authentication.handler';

jest.mock('../logger/logger');

describe('Client Authentication Handler', () => {
  let container: DependencyInjectionContainer;
  let clientAuthenticationHandler: ClientAuthenticationHandler;

  const loggerMock = jest.mocked(Logger.prototype);

  const clientAuthenticationMethodsMocks = [
    jest.mocked<ClientAuthenticationInterface>({
      name: 'client_secret_basic',
      hasBeenRequested: jest.fn(),
      authenticate: jest.fn(),
    }),
    jest.mocked<ClientAuthenticationInterface>({
      name: 'client_secret_post',
      hasBeenRequested: jest.fn(),
      authenticate: jest.fn(),
    }),
    jest.mocked<ClientAuthenticationInterface>({
      name: 'none',
      hasBeenRequested: jest.fn(),
      authenticate: jest.fn(),
    }),
  ];

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);

    clientAuthenticationMethodsMocks.forEach((clientAuthentication) => {
      container.bind<ClientAuthenticationInterface>(CLIENT_AUTHENTICATION).toValue(clientAuthentication);
    });

    container.bind(ClientAuthenticationHandler).toSelf().asSingleton();

    clientAuthenticationHandler = container.resolve(ClientAuthenticationHandler);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('authenticate()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'POST',
        url: new URL('https://server.example.com/oauth/token'),
      });
    });

    it('should throw when not using a client authentication method.', async () => {
      clientAuthenticationMethodsMocks.forEach((method) => method.hasBeenRequested.mockReturnValueOnce(false));

      await expect(clientAuthenticationHandler.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'No Client Authentication Method detected.',
      );
    });

    it('should throw when using multiple client authentication methods.', async () => {
      clientAuthenticationMethodsMocks.forEach((method) => method.hasBeenRequested.mockReturnValueOnce(true));

      await expect(clientAuthenticationHandler.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'Multiple Client Authentication Methods detected.',
      );
    });

    it('should return an authenticated client.', async () => {
      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        secret: 'client_secret',
        authenticationMethod: 'client_secret_basic',
      });

      clientAuthenticationMethodsMocks[0]!.hasBeenRequested.mockReturnValueOnce(true);
      clientAuthenticationMethodsMocks[0]!.authenticate.mockResolvedValueOnce(client);

      await expect(clientAuthenticationHandler.authenticate(request)).resolves.toBe(client);
    });
  });
});
