import { AuthorizationServerOptions } from '../../lib/authorization-server/options/authorization-server.options';
import { AccessToken } from '../../lib/entities/access-token';
import { Client } from '../../lib/entities/client';
import { InvalidScopeException } from '../../lib/exceptions/invalid-scope.exception';
import { ClientCredentialsGrantType } from '../../lib/grant-types/client-credentials.grant-type';
import { ScopeHandler } from '../../lib/handlers/scope.handler';
import { ClientCredentialsTokenParameters } from '../../lib/models/client-credentials.token-parameter';
import { TokenResponse } from '../../lib/models/token-response';
import { IAccessTokenService } from '../../lib/services/access-token.service.interface';
import { GrantType } from '../../lib/types/grant-type';

const client = <Client>{ scopes: ['foo', 'bar', 'baz'] };

const accessTokenServiceMock: jest.Mocked<Partial<IAccessTokenService>> = {
  createAccessToken: jest.fn().mockImplementation(async (scopes: string[]): Promise<AccessToken> => {
    return <AccessToken>{
      token: 'access_token',
      tokenType: 'Bearer',
      scopes,
      expiresAt: new Date(Date.now() + 300000),
    };
  }),
};

const authorizationServerOptionsMock = <AuthorizationServerOptions>{ scopes: ['foo', 'bar', 'baz', 'qux'] };

const scopeHandler = new ScopeHandler(authorizationServerOptionsMock);

const grantType = new ClientCredentialsGrantType(scopeHandler, <IAccessTokenService>accessTokenServiceMock);

describe('Client Credentials Grant Type', () => {
  describe('name', () => {
    it('should have "client_credentials" as its name.', () => {
      expect(grantType.name).toBe<GrantType>('client_credentials');
    });
  });

  describe('handle()', () => {
    let parameters: ClientCredentialsTokenParameters;

    beforeEach(() => {
      parameters = { grant_type: 'client_credentials' };
    });

    it('should reject requesting an unsupported scope.', async () => {
      Reflect.set(parameters, 'scope', 'foo unknown bar');
      await expect(grantType.handle(parameters, client)).rejects.toThrow(InvalidScopeException);
    });

    it('should create a token response with a restricted scope.', async () => {
      Reflect.set(parameters, 'scope', 'foo qux baz');

      await expect(grantType.handle(parameters, client)).resolves.toMatchObject<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo baz',
      });
    });

    it('should create a token response with the requested scope.', async () => {
      Reflect.set(parameters, 'scope', 'baz foo');

      await expect(grantType.handle(parameters, client)).resolves.toMatchObject<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'baz foo',
      });
    });

    it('should create a token response with the default scope of the client.', async () => {
      await expect(grantType.handle(parameters, client)).resolves.toMatchObject<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo bar baz',
      });
    });
  });
});
