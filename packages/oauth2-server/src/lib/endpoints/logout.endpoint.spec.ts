import { DependencyInjectionContainer } from '@guarani/di';

import { HttpMethod } from '../http/http-method.type';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { LogoutRequestValidator } from '../validators/logout-request.validator';
import { Endpoint } from './endpoint.type';
import { LogoutEndpoint } from './logout.endpoint';

jest.mock('../validators/logout-request.validator');

describe('Logout Endpoint', () => {
  let container: DependencyInjectionContainer;
  let endpoint: LogoutEndpoint;

  const validatorMock = jest.mocked(LogoutRequestValidator.prototype, true);

  const settings = <Settings>{
    issuer: 'https://server.example.com',
    userInteraction: { errorUrl: '/oauth/error' },
    enableAuthorizationResponseIssuerIdentifier: false,
  };

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(LogoutRequestValidator).toValue(validatorMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind(LogoutEndpoint).toSelf().asSingleton();

    endpoint = container.resolve(LogoutEndpoint);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "logout" as its name.', () => {
      expect(endpoint.name).toEqual<Endpoint>('logout');
    });
  });

  describe('path', () => {
    it('should have "/oauth/logout" as its default path.', () => {
      expect(endpoint.path).toEqual('/oauth/logout');
    });
  });

  describe('httpMethods', () => {
    it('should have \'["GET", "POST"]\' as its supported http methods.', () => {
      expect(endpoint.httpMethods).toStrictEqual<HttpMethod[]>(['GET', 'POST']);
    });
  });

  describe('constructor', () => {
    it('should throw when not providing a user interaction object.', () => {
      const settings = <Settings>{ issuer: 'https://server.example.com' };

      container.delete<Settings>(SETTINGS);
      container.delete(LogoutEndpoint);

      container.bind<Settings>(SETTINGS).toValue(settings);
      container.bind(LogoutEndpoint).toSelf().asSingleton();

      expect(() => container.resolve(LogoutEndpoint)).toThrow(new TypeError('Missing User Interaction options.'));
    });
  });

  describe('handle()', () => {
    it.todo('needs tests.');
  });
});
