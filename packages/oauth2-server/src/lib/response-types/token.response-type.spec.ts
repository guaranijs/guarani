import { DependencyInjectionContainer } from '@guarani/di';

import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { User } from '../entities/user.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { AuthorizationRequest } from '../messages/authorization-request';
import { TokenAuthorizationResponse } from '../messages/token.authorization-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { TokenResponseType } from './token.response-type';

const client = <Client>{ id: 'client_id' };
const user = <User>{ id: 'user_id' };

describe('Token Response Type', () => {
  let responseType: TokenResponseType;

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind(TokenResponseType).toSelf().asSingleton();

    responseType = container.resolve(TokenResponseType);
  });

  describe('name', () => {
    it('should have "token" as its name.', () => {
      expect(responseType.name).toBe('token');
    });
  });

  describe('defaultResponseMode', () => {
    it('should have "fragment" as its default response mode.', () => {
      expect(responseType.defaultResponseMode).toBe('fragment');
    });
  });

  describe('createAuthorizationResponse()', () => {
    let parameters: AuthorizationRequest;

    beforeEach(() => {
      parameters = { response_type: 'token', client_id: '', redirect_uri: '', scope: 'foo bar' };
    });

    it('should reject using "query" as the "response_mode".', async () => {
      Reflect.set(parameters, 'response_mode', 'query');

      const consent = <Partial<Consent>>{ client, parameters, scopes: ['foo', 'bar'], user };

      await expect(responseType.handle(<Consent>consent)).rejects.toThrow(InvalidRequestException);
    });

    it('should create a token response with the default scope of the client.', async () => {
      const consent = <Partial<Consent>>{ client, parameters, scopes: ['foo', 'bar'], user };

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{
          handle: 'access_token',
          scopes,
          expiresAt: new Date(Date.now() + 3600000),
        };
      });

      await expect(responseType.handle(<Consent>consent)).resolves.toMatchObject<TokenAuthorizationResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'foo bar',
        refresh_token: undefined,
        state: undefined,
      });
    });

    it('should create a token response with the default scope of the client and pass the state unmodified.', async () => {
      Reflect.set(parameters, 'state', 'client_state');

      const consent = <Partial<Consent>>{ client, parameters, scopes: ['foo', 'bar'], user };

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{
          handle: 'access_token',
          scopes,
          expiresAt: new Date(Date.now() + 3600000),
        };
      });

      await expect(responseType.handle(<Consent>consent)).resolves.toMatchObject<TokenAuthorizationResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'foo bar',
        refresh_token: undefined,
        state: 'client_state',
      });
    });
  });
});
