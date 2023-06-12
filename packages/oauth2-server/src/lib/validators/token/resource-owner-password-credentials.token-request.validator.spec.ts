import { Buffer } from 'buffer';
import { URL, URLSearchParams } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';
import { OneOrMany } from '@guarani/types';

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
    let parameters: ResourceOwnerPasswordCredentialsTokenRequest;

    const requestFactory = (data: Partial<ResourceOwnerPasswordCredentialsTokenRequest> = {}): HttpRequest => {
      parameters = removeNullishValues<ResourceOwnerPasswordCredentialsTokenRequest>(Object.assign(parameters, data));

      const body = new URLSearchParams(parameters as Record<string, OneOrMany<string>>);

      return new HttpRequest({
        body: Buffer.from(body.toString(), 'utf8'),
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/token'),
      });
    };

    beforeEach(() => {
      parameters = { grant_type: 'password', username: 'username', password: 'password' };
    });

    it('should throw when not providing the parameter "username".', async () => {
      const request = requestFactory({ username: undefined });

      const client = <Client>{ id: 'client_id', grantTypes: ['password'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "username".'
      );
    });

    it('should throw when not providing the parameter "password".', async () => {
      const request = requestFactory({ password: undefined });

      const client = <Client>{ id: 'client_id', grantTypes: ['password'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "password".'
      );
    });

    it('should throw when no user is found.', async () => {
      const request = requestFactory();

      const client = <Client>{ id: 'client_id', grantTypes: ['password'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      userServiceMock.findByResourceOwnerCredentials!.mockResolvedValueOnce(null);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'Invalid Credentials.'
      );
    });

    it('should return a resource owner password credentials token context with the requested scope.', async () => {
      const request = requestFactory({ scope: 'foo bar' });

      const client = <Client>{ id: 'client_id', grantTypes: ['password'], scopes: ['foo', 'bar', 'baz'] };
      const user = <User>{ id: 'user_id', username: 'username', password: 'password' };
      const scopes = ['foo', 'bar'];

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      userServiceMock.findByResourceOwnerCredentials!.mockResolvedValueOnce(user);

      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(scopes);

      await expect(validator.validate(request)).resolves.toStrictEqual<ResourceOwnerPasswordCredentialsTokenContext>({
        parameters: request.form(),
        client,
        grantType: grantTypesMocks[2]!,
        user,
        scopes,
      });
    });

    it("should return a resource owner password credentials token context with the client's default scope.", async () => {
      const request = requestFactory();

      const client = <Client>{ id: 'client_id', grantTypes: ['password'], scopes: ['foo', 'bar', 'baz'] };
      const user = <User>{ id: 'user_id', username: 'username', password: 'password' };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      userServiceMock.findByResourceOwnerCredentials!.mockResolvedValueOnce(user);

      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(client.scopes);

      await expect(validator.validate(request)).resolves.toStrictEqual<ResourceOwnerPasswordCredentialsTokenContext>({
        parameters: request.form(),
        client,
        grantType: grantTypesMocks[2]!,
        user,
        scopes: client.scopes,
      });
    });
  });
});
