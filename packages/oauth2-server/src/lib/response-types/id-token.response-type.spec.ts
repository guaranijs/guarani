import { DependencyInjectionContainer } from '@guarani/di';
import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { User } from '../entities/user.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { IdTokenHandler } from '../handlers/id-token.handler';
import { AuthorizationRequest } from '../messages/authorization-request';
import { IdTokenAuthorizationResponse } from '../messages/id-token.authorization-response';
import { IdTokenResponseType } from './id-token.response-type';

jest.mock('../handlers/id-token.handler');

const client = <Client>{ id: 'client_id' };
const user = <User>{ id: 'user_id' };

describe('ID Token Response Type', () => {
  let responseType: IdTokenResponseType;

  const idTokenHandlerMock = jest.mocked(IdTokenHandler.prototype, true);

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind(IdTokenHandler).toValue(idTokenHandlerMock);
    container.bind(IdTokenResponseType).toSelf().asSingleton();

    responseType = container.resolve(IdTokenResponseType);
  });

  describe('name', () => {
    it('should have "id_token" as its name.', () => {
      expect(responseType.name).toBe('id_token');
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
        response_type: 'id_token',
        scope: 'openid foo bar',
        state: 'client_state',
      };
    });

    it('should throw when using "query" as the "response_mode".', async () => {
      Reflect.set(parameters, 'response_mode', 'query');

      const consent = <Consent>{ client, parameters, scopes: ['openid', 'foo', 'bar'], user };

      await expect(responseType.handle(consent)).rejects.toThrow(
        new InvalidRequestException({
          description: 'Invalid response_mode "query" for response_type "id_token".',
          state: 'client_state',
        })
      );
    });

    it('should throw when not providing the "openid" scope.', async () => {
      Reflect.set(parameters, 'scope', 'foo bar');

      const consent = <Consent>{ client, parameters, scopes: ['foo', 'bar'], user };

      await expect(responseType.handle(consent)).rejects.toThrow(
        new InvalidRequestException({ description: 'Missing required scope "openid".', state: 'client_state' })
      );
    });

    it('should throw when not providing the "nonce" parameter.', async () => {
      Reflect.deleteProperty(parameters, 'nonce');

      const consent = <Consent>{ client, parameters, scopes: ['openid', 'foo', 'bar'], user };

      await expect(responseType.handle(consent)).rejects.toThrow(
        new InvalidRequestException({ description: 'Missing required parameter "nonce".', state: parameters.state })
      );
    });

    it('should create a token response with only the parameter "id_token" and no parameter "state".', async () => {
      Reflect.deleteProperty(parameters, 'state');

      const consent = <Consent>{ client, parameters, scopes: ['openid', 'foo', 'bar'], user };

      idTokenHandlerMock.generateIdToken.mockResolvedValueOnce('id_token');

      await expect(responseType.handle(consent)).resolves.toStrictEqual<IdTokenAuthorizationResponse>({
        id_token: 'id_token',
        state: undefined,
      });
    });

    it('should create a token response with only the parameter "id_token".', async () => {
      const consent = <Consent>{ client, parameters, scopes: ['openid', 'foo', 'bar'], user };

      idTokenHandlerMock.generateIdToken.mockResolvedValueOnce('id_token');

      await expect(responseType.handle(consent)).resolves.toStrictEqual<IdTokenAuthorizationResponse>({
        id_token: 'id_token',
        state: 'client_state',
      });
    });
  });
});
