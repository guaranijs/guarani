import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';

import { ClientAuthorizationInterface } from '../client-authorization/client-authorization.interface';
import { CLIENT_AUTHORIZATION } from '../client-authorization/client-authorization.token';
import { AccessToken } from '../entities/access-token.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { HttpRequest } from '../http/http.request';
import { Logger } from '../logger/logger';
import { ClientAuthorizationHandler } from './client-authorization.handler';

jest.mock('../logger/logger');

describe('Client Authorization Handler', () => {
  let container: DependencyInjectionContainer;
  let clientAuthorizationHandler: ClientAuthorizationHandler;

  const loggerMock = jest.mocked(Logger.prototype);

  const clientAuthorizationMethodsMocks = [
    jest.mocked<ClientAuthorizationInterface>({
      name: 'authorization_header_bearer',
      hasBeenRequested: jest.fn(),
      authorize: jest.fn(),
    }),
    jest.mocked<ClientAuthorizationInterface>({
      name: 'form_encoded_body',
      hasBeenRequested: jest.fn(),
      authorize: jest.fn(),
    }),
    jest.mocked<ClientAuthorizationInterface>({
      name: 'uri_query',
      hasBeenRequested: jest.fn(),
      authorize: jest.fn(),
    }),
  ];

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);

    clientAuthorizationMethodsMocks.forEach((clientAuthorization) => {
      container.bind<ClientAuthorizationInterface>(CLIENT_AUTHORIZATION).toValue(clientAuthorization);
    });

    container.bind(ClientAuthorizationHandler).toSelf().asSingleton();

    clientAuthorizationHandler = container.resolve(ClientAuthorizationHandler);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('authorize()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        url: new URL('https://server.example.com/oauth/userinfo'),
      });
    });

    it('should throw when not using a client authorization method.', async () => {
      clientAuthorizationMethodsMocks.forEach((method) => method.hasBeenRequested.mockReturnValueOnce(false));

      await expect(clientAuthorizationHandler.authorize(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'No Client Authorization Method detected.',
      );
    });

    it('should throw when using multiple client authorization methods.', async () => {
      clientAuthorizationMethodsMocks.forEach((method) => method.hasBeenRequested.mockReturnValueOnce(true));

      await expect(clientAuthorizationHandler.authorize(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Multiple Client Authorization Methods detected.',
      );
    });

    it('should return an authorized client.', async () => {
      const accessToken = <AccessToken>{ handle: 'access_token' };

      clientAuthorizationMethodsMocks[0]!.hasBeenRequested.mockReturnValueOnce(true);
      clientAuthorizationMethodsMocks[0]!.authorize.mockResolvedValueOnce(accessToken);

      await expect(clientAuthorizationHandler.authorize(request)).resolves.toBe(accessToken);
    });
  });
});
