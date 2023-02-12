import { DependencyInjectionContainer } from '@guarani/di';

import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { InvalidScopeException } from '../exceptions/invalid-scope.exception';
import { ScopeHandler } from '../handlers/scope.handler';
import { ClientCredentialsTokenRequest } from '../messages/client-credentials.token-request';
import { TokenResponse } from '../messages/token-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { ClientCredentialsGrantType } from './client-credentials.grant-type';

describe('Client Credentials Grant Type', () => {
  let grantType: ClientCredentialsGrantType;

  const client = <Client>{ scopes: ['foo', 'bar', 'baz'] };

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  const settings = <Settings>{ scopes: ['foo', 'bar', 'baz', 'qux'] };

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind(ScopeHandler).toSelf().asSingleton();
    container.bind(ClientCredentialsGrantType).toSelf().asSingleton();

    grantType = container.resolve(ClientCredentialsGrantType);
  });

  describe('name', () => {
    it('should have "client_credentials" as its name.', () => {
      expect(grantType.name).toBe('client_credentials');
    });
  });

  describe('handle()', () => {
    let parameters: ClientCredentialsTokenRequest;

    beforeEach(() => {
      parameters = { grant_type: 'client_credentials' };
    });

    it('should reject requesting an unsupported scope.', async () => {
      Reflect.set(parameters, 'scope', 'foo unknown bar');

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidScopeException({ description: 'Unsupported scope "unknown".' })
      );
    });

    it('should create a token response with a restricted scope.', async () => {
      Reflect.set(parameters, 'scope', 'foo qux baz');

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{ handle: 'access_token', scopes, expiresAt: new Date(Date.now() + 300000) };
      });

      await expect(grantType.handle(parameters, client)).resolves.toMatchObject<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 300,
        scope: 'foo baz',
      });
    });

    it('should create a token response with the requested scope.', async () => {
      Reflect.set(parameters, 'scope', 'baz foo');

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{ handle: 'access_token', scopes, expiresAt: new Date(Date.now() + 300000) };
      });

      await expect(grantType.handle(parameters, client)).resolves.toMatchObject<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 300,
        scope: 'baz foo',
      });
    });

    it('should create a token response with the default scope of the client.', async () => {
      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{ handle: 'access_token', scopes, expiresAt: new Date(Date.now() + 300000) };
      });

      await expect(grantType.handle(parameters, client)).resolves.toMatchObject<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 300,
        scope: 'foo bar baz',
      });
    });
  });
});
