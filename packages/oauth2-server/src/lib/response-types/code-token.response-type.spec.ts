import { DependencyInjectionContainer } from '@guarani/di';

import { AccessToken } from '../entities/access-token.entity';
import { AuthorizationCode } from '../entities/authorization-code.entity';
import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { CodeAuthorizationRequest } from '../messages/code.authorization-request';
import { CodeAuthorizationResponse } from '../messages/code.authorization-response';
import { TokenAuthorizationResponse } from '../messages/token.authorization-response';
import { PkceInterface } from '../pkces/pkce.interface';
import { PKCE } from '../pkces/pkce.token';
import { ResponseMode } from '../response-modes/response-mode.type';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { AuthorizationCodeServiceInterface } from '../services/authorization-code.service.interface';
import { AUTHORIZATION_CODE_SERVICE } from '../services/authorization-code.service.token';
import { CodeTokenResponseType } from './code-token.response-type';
import { ResponseType } from './response-type.type';

describe('Code Token Response Type', () => {
  let responseType: CodeTokenResponseType;

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  const authorizationCodeServiceMock = jest.mocked<AuthorizationCodeServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  const pkces = [
    jest.mocked<PkceInterface>({ name: 'S256', verify: jest.fn() }),
    jest.mocked<PkceInterface>({ name: 'plain', verify: jest.fn() }),
  ];

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind<AuthorizationCodeServiceInterface>(AUTHORIZATION_CODE_SERVICE).toValue(authorizationCodeServiceMock);
    pkces.forEach((pkce) => container.bind<PkceInterface>(PKCE).toValue(pkce));
    container.bind(CodeTokenResponseType).toSelf().asSingleton();

    responseType = container.resolve(CodeTokenResponseType);
  });

  describe('constructor', () => {
    it('should throw when not providing any pkce methods.', () => {
      expect(() => new CodeTokenResponseType(accessTokenServiceMock, authorizationCodeServiceMock, [])).toThrow(
        new TypeError('Missing PKCE Methods for response_type "code token".')
      );
    });
  });

  describe('name', () => {
    it('should have "code token" as its name.', () => {
      expect(responseType.name).toEqual<ResponseType>('code token');
    });
  });

  describe('defaultResponseMode', () => {
    it('should have "fragment" as its default response mode.', () => {
      expect(responseType.defaultResponseMode).toEqual<ResponseMode>('fragment');
    });
  });

  describe('handle()', () => {
    let parameters: CodeAuthorizationRequest;

    beforeEach(() => {
      parameters = <CodeAuthorizationRequest>{
        response_type: 'code token',
        scope: 'foo bar',
        code_challenge: 'code_challenge',
        code_challenge_method: 'plain',
        state: 'client_state',
      };
    });

    it('should throw when not providing a "code_challenge" parameter.', async () => {
      Reflect.deleteProperty(parameters, 'code_challenge');

      const client = <Client>{ id: 'client_id' };
      const user = <User>{ id: 'user_id' };

      const session = <Session>{};
      const consent = <Consent>{ client, user };

      await expect(responseType.handle(parameters, session, consent)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "code_challenge".', state: parameters.state })
      );
    });

    it('should throw when providing an unsupported "code_challenge_method".', async () => {
      Reflect.set(parameters, 'code_challenge_method', 'unknown');

      const client = <Client>{ id: 'client_id' };
      const user = <User>{ id: 'user_id' };

      const session = <Session>{};
      const consent = <Consent>{ client, user };

      await expect(responseType.handle(parameters, session, consent)).rejects.toThrow(
        new InvalidRequestException({
          description: 'Unsupported code_challenge_method "unknown".',
          state: parameters.state,
        })
      );
    });

    it('should throw when using "query" as the "response_mode".', async () => {
      Reflect.set(parameters, 'response_mode', 'query');

      const client = <Client>{ id: 'client_id' };
      const user = <User>{ id: 'user_id' };

      const session = <Session>{};
      const consent = <Consent>{ client, user };

      await expect(responseType.handle(parameters, session, consent)).rejects.toThrow(
        new InvalidRequestException({
          description: 'Invalid response_mode "query" for response_type "code token".',
          state: parameters.state,
        })
      );
    });

    it('should create a code token authorization response.', async () => {
      const client = <Client>{ id: 'client_id' };
      const user = <User>{ id: 'user_id' };

      const session = <Session>{};
      const consent = <Consent>{ client, scopes: ['foo', 'bar'], user };

      authorizationCodeServiceMock.create.mockResolvedValueOnce(<AuthorizationCode>{ code: 'authorization_code' });

      accessTokenServiceMock.create.mockImplementationOnce(async (scopes) => {
        return <AccessToken>{
          handle: 'access_token',
          scopes,
          expiresAt: new Date(Date.now() + 3600000),
        };
      });

      await expect(responseType.handle(parameters, session, consent)).resolves.toStrictEqual<
        CodeAuthorizationResponse & TokenAuthorizationResponse
      >({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'foo bar',
        code: 'authorization_code',
        state: parameters.state,
      });
    });
  });
});
