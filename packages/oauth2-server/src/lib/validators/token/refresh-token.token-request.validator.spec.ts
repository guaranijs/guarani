import { Buffer } from 'buffer';

import { DependencyInjectionContainer } from '@guarani/di';

import { RefreshTokenTokenContext } from '../../context/token/refresh-token.token-context';
import { Client } from '../../entities/client.entity';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { InvalidGrantException } from '../../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { GrantTypeInterface } from '../../grant-types/grant-type.interface';
import { GRANT_TYPE } from '../../grant-types/grant-type.token';
import { GrantType } from '../../grant-types/grant-type.type';
import { ClientAuthenticationHandler } from '../../handlers/client-authentication.handler';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { RefreshTokenTokenRequest } from '../../requests/token/refresh-token.token-request';
import { RefreshTokenServiceInterface } from '../../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../../services/refresh-token.service.token';
import { RefreshTokenTokenRequestValidator } from './refresh-token.token-request.validator';

jest.mock('../../handlers/client-authentication.handler');
jest.mock('../../handlers/scope.handler');

const invalidRefreshTokens: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidScopes: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];

describe('Refresh Token Token Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: RefreshTokenTokenRequestValidator;

  const clientAuthenticationHandlerMock = jest.mocked(ClientAuthenticationHandler.prototype);
  const scopeHandlerMock = jest.mocked(ScopeHandler.prototype);

  const refreshTokenServiceMock = jest.mocked<RefreshTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
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
    container.bind<RefreshTokenServiceInterface>(REFRESH_TOKEN_SERVICE).toValue(refreshTokenServiceMock);

    grantTypesMocks.forEach((grantTypeMock) => {
      container.bind<GrantTypeInterface>(GRANT_TYPE).toValue(grantTypeMock);
    });

    container.bind(RefreshTokenTokenRequestValidator).toSelf().asSingleton();

    validator = container.resolve(RefreshTokenTokenRequestValidator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "refresh_token" as its value.', () => {
      expect(validator.name).toEqual<GrantType>('refresh_token');
    });
  });

  describe('validate()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: <RefreshTokenTokenRequest>{
          grant_type: 'refresh_token',
          refresh_token: 'refresh_token',
        },
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/token',
        query: {},
      });
    });

    it.each(invalidRefreshTokens)(
      'should throw when providing an invalid "refresh_token" parameter.',
      async (refreshToken) => {
        request.body.refresh_token = refreshToken;

        const client = <Client>{ id: 'client_id', grantTypes: ['authorization_code', 'refresh_token'] };

        clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidRequestException,
          'Invalid parameter "refresh_token".'
        );
      }
    );

    it('should throw when no refresh_token is found.', async () => {
      const client = <Client>{ id: 'client_id', grantTypes: ['authorization_code', 'refresh_token'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      refreshTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'Invalid Refresh Token.'
      );
    });

    it.each(invalidScopes)('should throw when providing an invalid "scope" parameter.', async (scope) => {
      request.body.scope = scope;

      const client = <Client>{ id: 'client_id', grantTypes: ['authorization_code', 'refresh_token'] };
      const refreshToken = <RefreshToken>{ handle: 'refresh_token' };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      refreshTokenServiceMock.findOne.mockResolvedValueOnce(refreshToken);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "scope".'
      );
    });

    it('should throw when the client requests a scope that was not previously granted.', async () => {
      request.body.scope = 'foo bar baz';

      const client = <Client>{
        id: 'client_id',
        grantTypes: ['authorization_code', 'refresh_token'],
        scopes: ['foo', 'bar', 'baz'],
      };

      const refreshToken = <RefreshToken>{ handle: 'refresh_token', scopes: ['foo', 'bar'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      refreshTokenServiceMock.findOne.mockResolvedValueOnce(refreshToken);

      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar', 'baz']);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'The scope "baz" was not previously granted.'
      );
    });

    it('should return a refresh token token context with the requested scopes.', async () => {
      request.body.scope = 'foo bar';

      const client = <Client>{
        id: 'client_id',
        grantTypes: ['authorization_code', 'refresh_token'],
        scopes: ['foo', 'bar', 'baz'],
      };

      const refreshToken = <RefreshToken>{ handle: 'refresh_token', scopes: ['foo', 'bar', 'baz'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      refreshTokenServiceMock.findOne.mockResolvedValueOnce(refreshToken);

      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(['foo', 'bar']);

      await expect(validator.validate(request)).resolves.toStrictEqual<RefreshTokenTokenContext>({
        parameters: request.body as RefreshTokenTokenRequest,
        client,
        grantType: grantTypesMocks[3]!,
        refreshToken,
        scopes: ['foo', 'bar'],
      });
    });

    it('should return a refresh token token context with the original scopes.', async () => {
      const client = <Client>{
        id: 'client_id',
        grantTypes: ['authorization_code', 'refresh_token'],
        scopes: ['foo', 'bar', 'baz'],
      };

      const refreshToken = <RefreshToken>{ handle: 'refresh_token', scopes: ['foo', 'bar', 'baz'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      refreshTokenServiceMock.findOne.mockResolvedValueOnce(refreshToken);
      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();

      await expect(validator.validate(request)).resolves.toStrictEqual<RefreshTokenTokenContext>({
        parameters: request.body as RefreshTokenTokenRequest,
        client,
        grantType: grantTypesMocks[3]!,
        refreshToken,
        scopes: refreshToken.scopes,
      });
    });
  });
});
