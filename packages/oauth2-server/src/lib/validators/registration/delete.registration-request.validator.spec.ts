import { DependencyInjectionContainer } from '@guarani/di';

import { ClientAuthorizationHandler } from '../../handlers/client-authorization.handler';
import { HttpMethod } from '../../http/http-method.type';
import { Logger } from '../../logger/logger';
import { AccessTokenServiceInterface } from '../../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../../services/access-token.service.token';
import { DeleteRegistrationRequestValidator } from './delete.registration-request.validator';

jest.mock('../../handlers/client-authorization.handler');
jest.mock('../../logger/logger');

describe('Delete Registration Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: DeleteRegistrationRequestValidator;

  const loggerMock = jest.mocked(Logger.prototype);

  const clientAuthorizationHandlerMock = jest.mocked(ClientAuthorizationHandler.prototype);

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
    container.bind(ClientAuthorizationHandler).toValue(clientAuthorizationHandlerMock);
    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind(DeleteRegistrationRequestValidator).toSelf().asSingleton();

    validator = container.resolve(DeleteRegistrationRequestValidator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('httpMethod', () => {
    it('should have "DELETE" as its value.', () => {
      expect(validator.httpMethod).toEqual<HttpMethod>('DELETE');
    });
  });

  describe('expectedScopes', () => {
    it('should have ["client:manage", "client:delete"] as its value.', () => {
      expect(validator.expectedScopes).toEqual<string[]>(['client:manage', 'client:delete']);
    });
  });
});
