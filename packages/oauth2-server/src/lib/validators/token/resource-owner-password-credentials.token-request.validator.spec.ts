import { Buffer } from 'buffer';

import { DependencyInjectionContainer } from '@guarani/di';

import { ResourceOwnerPasswordCredentialsTokenContext } from '../../context/token/resource-owner-password-credentials.token-context';
import { Client } from '../../entities/client.entity';
import { User } from '../../entities/user.entity';
import { InvalidGrantException } from '../../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { GrantTypeInterface } from '../../grant-types/grant-type.interface';
import { GRANT_TYPE } from '../../grant-types/grant-type.token';
import { GrantType } from '../../grant-types/grant-type.type';
import { ClientAuthenticationHandler } from '../../handlers/client-authentication.handler';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { ResourceOwnerPasswordCredentialsTokenRequest } from '../../requests/token/resource-owner-password-credentials.token-request';
import { UserServiceInterface } from '../../services/user.service.interface';
import { USER_SERVICE } from '../../services/user.service.token';
import { ResourceOwnerPasswordCredentialsTokenRequestValidator } from './resource-owner-password-credentials.token-request.validator';

jest.mock('../../handlers/client-authentication.handler');
jest.mock('../../handlers/scope.handler');

const invalidUsernames: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidPasswords: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidScopes: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];

describe('Resource Owner Password Credentials Token Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: ResourceOwnerPasswordCredentialsTokenRequestValidator;

  const clientAuthenticationHandlerMock = jest.mocked(ClientAuthenticationHandler.prototype);
  const scopeHandlerMock = jest.mocked(ScopeHandler.prototype);

  const userServiceMock = jest.mocked<UserServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    findByResourceOwnerCredentials: jest.fn(),
    getUserinfo: jest.fn(),
  });

  const grantTypesMocks = [
    jest.mocked<GrantTypeInterface>({ name: 'authorization_code', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'client_credentials', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'password', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'refresh_token', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'urn:ietf:params:oauth:grant-type:device_code', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'urn:ietf:params:oauth:grant-type:jwt-bearer', handle: jest.fn() }),
  ];

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(ClientAuthenticationHandler).toValue(clientAuthenticationHandlerMock);
    container.bind(ScopeHandler).toValue(scopeHandlerMock);
    container.bind<UserServiceInterface>(USER_SERVICE).toValue(userServiceMock);

    grantTypesMocks.forEach((grantTypeMock) => {
      container.bind<GrantTypeInterface>(GRANT_TYPE).toValue(grantTypeMock);
    });

    container.bind(ResourceOwnerPasswordCredentialsTokenRequestValidator).toSelf().asSingleton();

    validator = container.resolve(ResourceOwnerPasswordCredentialsTokenRequestValidator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "password" as its value.', () => {
      expect(validator.name).toEqual<GrantType>('password');
    });
  });

  describe('constructor', () => {
    it('should throw when the user service does not implement the method "findByResourceOwnerCredentials()".', () => {
      const userServiceMock = jest.mocked<UserServiceInterface>({
        create: jest.fn(),
        findOne: jest.fn(),
        getUserinfo: jest.fn(),
      });

      container.delete<UserServiceInterface>(USER_SERVICE);
      container.delete(ResourceOwnerPasswordCredentialsTokenRequestValidator);

      container.bind<UserServiceInterface>(USER_SERVICE).toValue(userServiceMock);
      container.bind(ResourceOwnerPasswordCredentialsTokenRequestValidator).toSelf().asSingleton();

      expect(() => container.resolve(ResourceOwnerPasswordCredentialsTokenRequestValidator)).toThrow(
        new TypeError(
          'Missing implementation of required method "UserServiceInterface.findByResourceOwnerCredentials".'
        )
      );
    });
  });

  describe('validate()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: <ResourceOwnerPasswordCredentialsTokenRequest>{
          grant_type: 'password',
          username: 'username',
          password: 'password',
        },
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/token',
        query: {},
      });
    });

    it.each(invalidUsernames)('should throw when providing an invalid "username" parameter.', async (username) => {
      request.body.username = username;

      const client = <Client>{ id: 'client_id', grantTypes: ['password'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "username".'
      );
    });

    it.each(invalidPasswords)('should throw when providing an invalid "password" parameter.', async (password) => {
      request.body.password = password;

      const client = <Client>{ id: 'client_id', grantTypes: ['password'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "password".'
      );
    });

    it('should throw when no user is found.', async () => {
      const client = <Client>{ id: 'client_id', grantTypes: ['password'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      userServiceMock.findByResourceOwnerCredentials!.mockResolvedValueOnce(null);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'Invalid Credentials.'
      );
    });

    it.each(invalidScopes)('should throw when providing an invalid "scope" parameter.', async (scope) => {
      request.body.scope = scope;

      const client = <Client>{ id: 'client_id', grantTypes: ['password'] };
      const user = <User>{ id: 'user_id', username: 'username', password: 'password' };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      userServiceMock.findByResourceOwnerCredentials!.mockResolvedValueOnce(user);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "scope".'
      );
    });

    it('should return a resource owner password credentials token context with the requested scope.', async () => {
      request.body.scope = 'foo bar';

      const client = <Client>{ id: 'client_id', grantTypes: ['password'], scopes: ['foo', 'bar', 'baz'] };
      const user = <User>{ id: 'user_id', username: 'username', password: 'password' };
      const scopes = ['foo', 'bar'];

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      userServiceMock.findByResourceOwnerCredentials!.mockResolvedValueOnce(user);

      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(scopes);

      await expect(validator.validate(request)).resolves.toStrictEqual<ResourceOwnerPasswordCredentialsTokenContext>({
        parameters: request.body as ResourceOwnerPasswordCredentialsTokenRequest,
        client,
        grantType: grantTypesMocks[2]!,
        user,
        scopes,
      });
    });

    it("should return a resource owner password credentials token context with the client's default scope.", async () => {
      const client = <Client>{ id: 'client_id', grantTypes: ['password'], scopes: ['foo', 'bar', 'baz'] };
      const user = <User>{ id: 'user_id', username: 'username', password: 'password' };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      userServiceMock.findByResourceOwnerCredentials!.mockResolvedValueOnce(user);

      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(client.scopes);

      await expect(validator.validate(request)).resolves.toStrictEqual<ResourceOwnerPasswordCredentialsTokenContext>({
        parameters: request.body as ResourceOwnerPasswordCredentialsTokenRequest,
        client,
        grantType: grantTypesMocks[2]!,
        user,
        scopes: client.scopes,
      });
    });
  });
});
