import { DependencyInjectionContainer } from '@guarani/di';

import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { AuthorizationRequest } from '../requests/authorization/authorization-request';
import { ResponseMode } from '../response-modes/response-mode.type';
import { TokenAuthorizationResponse } from '../responses/authorization/token.authorization-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { ResponseType } from './response-type.type';
import { TokenResponseType } from './token.response-type';

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
      expect(responseType.name).toEqual<ResponseType>('token');
    });
  });

  describe('defaultResponseMode', () => {
    it('should have "fragment" as its default response mode.', () => {
      expect(responseType.defaultResponseMode).toEqual<ResponseMode>('fragment');
    });
  });

  describe('handle()', () => {
    let parameters: AuthorizationRequest;

    beforeEach(() => {
      parameters = <AuthorizationRequest>{ response_type: 'token', scope: 'foo bar', state: 'client_state' };
    });

    it('should throw when using "query" as the "response_mode".', async () => {
      Reflect.set(parameters, 'response_mode', 'query');

      const client = <Client>{ id: 'client_id' };
      const user = <User>{ id: 'user_id' };

      const session = <Session>{};
      const consent = <Consent>{ client, scopes: ['foo', 'bar'], user };

      await expect(responseType.handle(parameters, session, consent)).rejects.toThrow(
        new InvalidRequestException({
          description: 'Invalid response_mode "query" for response_type "token".',
          state: parameters.state,
        })
      );
    });

    it('should create a token authorization response.', async () => {
      const client = <Client>{ id: 'client_id' };
      const user = <User>{ id: 'user_id' };

      const session = <Session>{};
      const consent = <Consent>{ client, scopes: ['foo', 'bar'], user };

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{
          handle: 'access_token',
          scopes,
          expiresAt: new Date(Date.now() + 3600000),
        };
      });

      await expect(
        responseType.handle(parameters, session, consent)
      ).resolves.toStrictEqual<TokenAuthorizationResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'foo bar',
        state: 'client_state',
      });
    });
  });
});
