import { AuthorizationServerOptions } from '../../lib/authorization-server/options/authorization-server.options';
import { AccessToken } from '../../lib/entities/access-token';
import { Client } from '../../lib/entities/client';
import { User } from '../../lib/entities/user';
import { InvalidRequestException } from '../../lib/exceptions/invalid-request.exception';
import { ScopeHandler } from '../../lib/handlers/scope.handler';
import { AuthorizationParameters } from '../../lib/models/authorization-parameters';
import { TokenAuthorizationResponse } from '../../lib/models/token.authorization-response';
import { TokenResponseType } from '../../lib/response-types/token.response-type';
import { IAccessTokenService } from '../../lib/services/access-token.service.interface';
import { ResponseMode } from '../../lib/types/response-mode';
import { ResponseType } from '../../lib/types/response-type';

const client = <Client>{ scopes: ['foo', 'bar'] };

const user = <User>{};

const authorizationServerOptionsMock = <AuthorizationServerOptions>{ scopes: ['foo', 'bar', 'baz', 'qux'] };

const scopeHandler = new ScopeHandler(authorizationServerOptionsMock);

const accessTokenServiceMock: jest.Mocked<Partial<IAccessTokenService>> = {
  createAccessToken: jest.fn().mockImplementation(async (scopes: string[]): Promise<AccessToken> => {
    return <AccessToken>{
      token: 'access_token',
      tokenType: 'Bearer',
      scopes,
      expiresAt: new Date(Date.now() + 3600000),
    };
  }),
};

const responseType = new TokenResponseType(scopeHandler, <IAccessTokenService>accessTokenServiceMock);

describe('Token Response Type', () => {
  describe('name', () => {
    it('should have "token" as its name.', () => {
      expect(responseType.name).toBe<ResponseType>('token');
    });
  });

  describe('defaultResponseMode', () => {
    it('should have "fragment" as its default response mode.', () => {
      expect(responseType.defaultResponseMode).toBe<ResponseMode>('fragment');
    });
  });

  describe('createAuthorizationResponse()', () => {
    let parameters: AuthorizationParameters;

    beforeEach(() => {
      parameters = { response_type: 'token', client_id: '', redirect_uri: '', scope: 'foo bar' };
    });

    it('should reject using "query" as the "response_mode".', async () => {
      Reflect.set(parameters, 'response_mode', 'query');
      await expect(responseType.handle(parameters, client, user)).rejects.toThrow(InvalidRequestException);
    });

    it('should create a token response with the default scope of the client.', async () => {
      await expect(responseType.handle(parameters, client, user)).resolves.toStrictEqual<TokenAuthorizationResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo bar',
      });
    });

    it('should create a token response with the default scope of the client and pass the state unmodified.', async () => {
      Reflect.set(parameters, 'state', 'client-state');

      await expect(responseType.handle(parameters, client, user)).resolves.toStrictEqual<TokenAuthorizationResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo bar',
        state: 'client-state',
      });
    });

    it('should create a token response with a restricted scope.', async () => {
      Reflect.set(parameters, 'scope', 'foo baz');

      await expect(responseType.handle(parameters, client, user)).resolves.toStrictEqual<TokenAuthorizationResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo',
      });
    });

    it('should create a token response with a restricted scope and pass the state unmodified.', async () => {
      Reflect.set(parameters, 'scope', 'foo baz');
      Reflect.set(parameters, 'state', 'client-state');

      await expect(responseType.handle(parameters, client, user)).resolves.toStrictEqual<TokenAuthorizationResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo',
        state: 'client-state',
      });
    });
  });
});
