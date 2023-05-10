import { DependencyInjectionContainer } from '@guarani/di';

import { HttpMethod } from '../http/http-method.type';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { EndSessionRequestValidator } from '../validators/end-session-request.validator';
import { EndSessionEndpoint } from './end-session.endpoint';
import { Endpoint } from './endpoint.type';

jest.mock('../validators/end-session-request.validator');

describe('End Session Endpoint', () => {
  let container: DependencyInjectionContainer;
  let endpoint: EndSessionEndpoint;

  const validatorMock = jest.mocked(EndSessionRequestValidator.prototype, true);

  const settings = <Settings>{
    issuer: 'https://server.example.com',
    userInteraction: { errorUrl: '/oauth/error' },
    enableAuthorizationResponseIssuerIdentifier: false,
  };

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(EndSessionRequestValidator).toValue(validatorMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind(EndSessionEndpoint).toSelf().asSingleton();

    endpoint = container.resolve(EndSessionEndpoint);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "end_session" as its name.', () => {
      expect(endpoint.name).toEqual<Endpoint>('end_session');
    });
  });

  describe('path', () => {
    it('should have "/oauth/end_session" as its default path.', () => {
      expect(endpoint.path).toEqual('/oauth/end_session');
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
      container.delete(EndSessionEndpoint);

      container.bind<Settings>(SETTINGS).toValue(settings);
      container.bind(EndSessionEndpoint).toSelf().asSingleton();

      expect(() => container.resolve(EndSessionEndpoint)).toThrow(new TypeError('Missing User Interaction options.'));
    });
  });

  describe('handle()', () => {
    it.todo('needs tests.');
  });
});
