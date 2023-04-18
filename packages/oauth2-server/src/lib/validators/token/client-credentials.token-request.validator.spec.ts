import { DependencyInjectionContainer } from '@guarani/di';

import { Buffer } from 'buffer';

import { ClientCredentialsTokenContext } from '../../context/token/client-credentials.token.context';
import { Client } from '../../entities/client.entity';
import { AccessDeniedException } from '../../exceptions/access-denied.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { GrantTypeInterface } from '../../grant-types/grant-type.interface';
import { GRANT_TYPE } from '../../grant-types/grant-type.token';
import { GrantType } from '../../grant-types/grant-type.type';
import { ClientAuthenticationHandler } from '../../handlers/client-authentication.handler';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { ClientCredentialsTokenRequest } from '../../requests/token/client-credentials.token-request';
import { ClientCredentialsTokenRequestValidator } from './client-credentials.token-request.validator';

jest.mock('../../handlers/client-authentication.handler');
jest.mock('../../handlers/scope.handler');

const invalidScopes: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];

describe('Client Credentials Token Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: ClientCredentialsTokenRequestValidator;

  const clientAuthenticationHandlerMock = jest.mocked(ClientAuthenticationHandler.prototype, true);
  const scopeHandlerMock = jest.mocked(ScopeHandler.prototype, true);

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

    grantTypesMocks.forEach((grantTypeMock) => {
      container.bind<GrantTypeInterface>(GRANT_TYPE).toValue(grantTypeMock);
    });

    container.bind(ClientCredentialsTokenRequestValidator).toSelf().asSingleton();

    validator = container.resolve(ClientCredentialsTokenRequestValidator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "client_credentials" as its value.', () => {
      expect(validator.name).toEqual<GrantType>('client_credentials');
    });
  });

  describe('validate()', () => {
    let request: HttpRequest<ClientCredentialsTokenRequest>;

    beforeEach(() => {
      request = new HttpRequest<ClientCredentialsTokenRequest>({
        body: { grant_type: 'client_credentials' },
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/token',
        query: {},
      });
    });

    it.each(invalidScopes)('should throw when providing an invalid "scope" parameter.', async (scope) => {
      request.body.scope = scope;

      const client = <Client>{ id: 'client_id', grantTypes: ['client_credentials'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "scope".' })
      );
    });

    it("should throw when the client requests a scope it's not allowed to.", async () => {
      request.body.scope = 'foo bar qux';

      const client = <Client>{ id: 'client_id', grantTypes: ['client_credentials'], scopes: ['foo', 'bar', 'baz'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();

      await expect(validator.validate(request)).rejects.toThrow(
        new AccessDeniedException({ description: 'The Client is not allowed to request the scope "qux".' })
      );
    });

    it('should return a client credentials token context with the requested scope.', async () => {
      request.body.scope = 'foo bar';

      const client = <Client>{ id: 'client_id', grantTypes: ['client_credentials'], scopes: ['foo', 'bar', 'baz'] };
      const scopes = ['foo', 'bar'];

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(scopes);

      await expect(validator.validate(request)).resolves.toStrictEqual<ClientCredentialsTokenContext>({
        parameters: request.data,
        client,
        grantType: grantTypesMocks[1]!,
        scopes,
      });
    });

    it("should return a client credentials token context with the client's default scope.", async () => {
      const client = <Client>{ id: 'client_id', grantTypes: ['client_credentials'], scopes: ['foo', 'bar', 'baz'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(client.scopes);

      await expect(validator.validate(request)).resolves.toStrictEqual<ClientCredentialsTokenContext>({
        parameters: request.data,
        client,
        grantType: grantTypesMocks[1]!,
        scopes: client.scopes,
      });
    });
  });
});
