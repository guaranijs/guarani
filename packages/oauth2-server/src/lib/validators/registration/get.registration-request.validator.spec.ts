import { DependencyInjectionContainer } from '@guarani/di';

import { ClientAuthorizationHandler } from '../../handlers/client-authorization.handler';
import { HttpMethod } from '../../http/http-method.type';
import { AccessTokenServiceInterface } from '../../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../../services/access-token.service.token';
import { GetRegistrationRequestValidator } from './get.registration-request.validator';

jest.mock('../../handlers/client-authorization.handler');

describe('Get Registration Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: GetRegistrationRequestValidator;

  const clientAuthorizationHandlerMock = jest.mocked(ClientAuthorizationHandler.prototype);

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(ClientAuthorizationHandler).toValue(clientAuthorizationHandlerMock);
    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind(GetRegistrationRequestValidator).toSelf().asSingleton();

    validator = container.resolve(GetRegistrationRequestValidator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('httpMethod', () => {
    it('should have "GET" as its value.', () => {
      expect(validator.httpMethod).toEqual<HttpMethod>('GET');
    });
  });

  describe('expectedScopes', () => {
    it('should have ["client:manage", "client:read"] as its value.', () => {
      expect(validator.expectedScopes).toEqual<string[]>(['client:manage', 'client:read']);
    });
  });
});
