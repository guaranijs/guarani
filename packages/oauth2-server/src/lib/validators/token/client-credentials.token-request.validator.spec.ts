import { Buffer } from 'buffer';
import { stringify as stringifyQs } from 'querystring';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';

import { ClientCredentialsTokenContext } from '../../context/token/client-credentials.token-context';
import { Client } from '../../entities/client.entity';
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

describe('Client Credentials Token Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: ClientCredentialsTokenRequestValidator;

  const clientAuthenticationHandlerMock = jest.mocked(ClientAuthenticationHandler.prototype);
  const scopeHandlerMock = jest.mocked(ScopeHandler.prototype);

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
    let parameters: ClientCredentialsTokenRequest;

    const requestFactory = (data: Partial<ClientCredentialsTokenRequest> = {}): HttpRequest => {
      removeNullishValues<ClientCredentialsTokenRequest>(Object.assign(parameters, data));

      return new HttpRequest({
        body: Buffer.from(stringifyQs(parameters), 'utf8'),
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/token'),
      });
    };

    beforeEach(() => {
      parameters = { grant_type: 'client_credentials' };
    });

    it('should return a client credentials token context with the requested scope.', async () => {
      const request = requestFactory({ scope: 'foo bar' });

      const client = <Client>{ id: 'client_id', grantTypes: ['client_credentials'], scopes: ['foo', 'bar', 'baz'] };
      const scopes = ['foo', 'bar'];

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(scopes);

      await expect(validator.validate(request)).resolves.toStrictEqual<ClientCredentialsTokenContext>({
        parameters,
        client,
        grantType: grantTypesMocks[1]!,
        scopes,
      });
    });

    it("should return a client credentials token context with the client's default scope.", async () => {
      const request = requestFactory();

      const client = <Client>{ id: 'client_id', grantTypes: ['client_credentials'], scopes: ['foo', 'bar', 'baz'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();
      scopeHandlerMock.getAllowedScopes.mockReturnValueOnce(client.scopes);

      await expect(validator.validate(request)).resolves.toStrictEqual<ClientCredentialsTokenContext>({
        parameters,
        client,
        grantType: grantTypesMocks[1]!,
        scopes: client.scopes,
      });
    });
  });
});
