import { DependencyInjectionContainer } from '@guarani/di';

import { EndpointInterface } from './endpoints/endpoint.interface';
import { ENDPOINT } from './endpoints/endpoint.token';
import { HttpRequest } from './http/http.request';
import { Logger } from './logger/logger';
import { AuthorizationServer } from './authorization-server';

jest.mock('./logger/logger');

describe('Authorization Server', () => {
  let container: DependencyInjectionContainer;
  let authorizationServer: AuthorizationServer;

  const loggerMock = jest.mocked(Logger.prototype);

  const endpointsMocks = [
    jest.mocked<EndpointInterface>({ httpMethods: ['POST'], name: 'token', path: '/oauth/token', handle: jest.fn() }),
  ];

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);

    endpointsMocks.forEach((endpointMock) => {
      container.bind<EndpointInterface>(ENDPOINT).toValue(endpointMock);
    });

    container.bind(AuthorizationServer).toSelf().asSingleton();

    authorizationServer = container.resolve(AuthorizationServer);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('endpoint()', () => {
    it('should throw when requesting an unsupported endpoint.', async () => {
      const request = <HttpRequest>{};

      await expect(authorizationServer.endpoint('authorization', request)).rejects.toThrowWithMessage(
        TypeError,
        'Unsupported Endpoint "authorization".',
      );
    });

    it('should execute the requested endpoint.', async () => {
      const request = <HttpRequest>{};

      await expect(authorizationServer.endpoint('token', request)).resolves.not.toThrow();

      expect(endpointsMocks[0]!.handle).toHaveBeenCalledTimes(1);
      expect(endpointsMocks[0]!.handle).toHaveBeenCalledWith(request);
    });
  });
});
