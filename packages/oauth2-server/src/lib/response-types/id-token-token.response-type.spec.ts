import { DependencyInjectionContainer } from '@guarani/di';
import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { User } from '../entities/user.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { IdTokenHandler } from '../handlers/id-token.handler';
import { AuthorizationRequest } from '../messages/authorization-request';
import { IdTokenAuthorizationResponse } from '../messages/id-token.authorization-response';
import { TokenAuthorizationResponse } from '../messages/token.authorization-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { IdTokenTokenResponseType } from './id-token-token.response-type';

jest.mock('../handlers/id-token.handler');

describe('ID Token Token Response Type', () => {
  let responseType: IdTokenTokenResponseType;

  const idTokenHandlerMock = jest.mocked(IdTokenHandler.prototype, true);

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind(IdTokenHandler).toValue(idTokenHandlerMock);
    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind(IdTokenTokenResponseType).toSelf().asSingleton();

    responseType = container.resolve(IdTokenTokenResponseType);
  });

  describe('name', () => {
    it('should have "id_token token" as its name.', () => {
      expect(responseType.name).toBe('id_token token');
    });
  });

  describe('defaultResponseMode', () => {
    it('should have "fragment" as its default response mode.', () => {
      expect(responseType.defaultResponseMode).toBe('fragment');
    });
  });

  describe('handle()', () => {
    let parameters: AuthorizationRequest;

    beforeEach(() => {
      parameters = <AuthorizationRequest>{
        nonce: 'nonce',
        response_type: 'id_token token',
        scope: 'openid foo bar',
        state: 'client_state',
      };
    });

    it('should throw when using "query" as the "response_mode".', async () => {
      Reflect.set(parameters, 'response_mode', 'query');

      const client = <Client>{ id: 'client_id' };
      const user = <User>{ id: 'user_id' };

      const consent = <Consent>{ client, parameters, scopes: ['openid', 'foo', 'bar'], user };

      await expect(responseType.handle(consent)).rejects.toThrow(
        new InvalidRequestException({
          description: 'Invalid response_mode "query" for response_type "id_token token".',
          state: 'client_state',
        })
      );
    });

    it('should throw when not providing the "openid" scope.', async () => {
      Reflect.set(parameters, 'scope', 'foo bar');

      const client = <Client>{ id: 'client_id' };
      const user = <User>{ id: 'user_id' };

      const consent = <Consent>{ client, parameters, scopes: ['foo', 'bar'], user };

      await expect(responseType.handle(consent)).rejects.toThrow(
        new InvalidRequestException({ description: 'Missing required scope "openid".', state: 'client_state' })
      );
    });

    it('should throw when not providing the "nonce" parameter.', async () => {
      Reflect.deleteProperty(parameters, 'nonce');

      const client = <Client>{ id: 'client_id' };
      const user = <User>{ id: 'user_id' };

      const consent = <Consent>{ client, parameters, scopes: ['openid', 'foo', 'bar'], user };

      await expect(responseType.handle(consent)).rejects.toThrow(
        new InvalidRequestException({ description: 'Missing required parameter "nonce".', state: parameters.state })
      );
    });

    it('should create a token response without the parameter "state".', async () => {
      Reflect.deleteProperty(parameters, 'state');

      const client = <Client>{ id: 'client_id' };
      const user = <User>{ id: 'user_id' };

      const consent = <Consent>{ client, parameters, scopes: ['openid', 'foo', 'bar'], user };

      idTokenHandlerMock.generateIdToken.mockResolvedValueOnce('id_token');

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{
          handle: 'access_token',
          scopes,
          expiresAt: new Date(Date.now() + 3600000),
        };
      });

      await expect(responseType.handle(consent)).resolves.toStrictEqual<
        TokenAuthorizationResponse & IdTokenAuthorizationResponse
      >({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid foo bar',
        refresh_token: undefined,
        id_token: 'id_token',
        state: undefined,
      });
    });

    it('should create a token response with all the parameters.', async () => {
      const client = <Client>{ id: 'client_id' };
      const user = <User>{ id: 'user_id' };

      const consent = <Consent>{ client, parameters, scopes: ['openid', 'foo', 'bar'], user };

      idTokenHandlerMock.generateIdToken.mockResolvedValueOnce('id_token');

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{
          handle: 'access_token',
          scopes,
          expiresAt: new Date(Date.now() + 3600000),
        };
      });

      await expect(responseType.handle(consent)).resolves.toStrictEqual<
        TokenAuthorizationResponse & IdTokenAuthorizationResponse
      >({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid foo bar',
        refresh_token: undefined,
        id_token: 'id_token',
        state: 'client_state',
      });
    });
  });
});
