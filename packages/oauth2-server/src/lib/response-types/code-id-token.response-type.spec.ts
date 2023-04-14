import { DependencyInjectionContainer } from '@guarani/di';

import { AuthorizationCode } from '../entities/authorization-code.entity';
import { Consent } from '../entities/consent.entity';
import { Session } from '../entities/session.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { IdTokenHandler } from '../handlers/id-token.handler';
import { PkceInterface } from '../pkces/pkce.interface';
import { PKCE } from '../pkces/pkce.token';
import { CodeAuthorizationRequest } from '../requests/authorization/code.authorization-request';
import { ResponseMode } from '../response-modes/response-mode.type';
import { CodeAuthorizationResponse } from '../responses/authorization/code.authorization-response';
import { IdTokenAuthorizationResponse } from '../responses/authorization/id-token.authorization-response';
import { AuthorizationCodeServiceInterface } from '../services/authorization-code.service.interface';
import { AUTHORIZATION_CODE_SERVICE } from '../services/authorization-code.service.token';
import { CodeIdTokenResponseType } from './code-id-token.response-type';
import { ResponseType } from './response-type.type';

jest.mock('../handlers/id-token.handler.ts');

describe('Code ID Token Response Type', () => {
  let container: DependencyInjectionContainer;
  let responseType: CodeIdTokenResponseType;

  const idTokenHandlerMock = jest.mocked(IdTokenHandler.prototype, true);

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
    container = new DependencyInjectionContainer();

    container.bind(IdTokenHandler).toValue(idTokenHandlerMock);
    container.bind<AuthorizationCodeServiceInterface>(AUTHORIZATION_CODE_SERVICE).toValue(authorizationCodeServiceMock);
    pkces.forEach((pkce) => container.bind<PkceInterface>(PKCE).toValue(pkce));
    container.bind(CodeIdTokenResponseType).toSelf().asSingleton();

    responseType = container.resolve(CodeIdTokenResponseType);
  });

  describe('name', () => {
    it('should have "code id_token" as its name.', () => {
      expect(responseType.name).toEqual<ResponseType>('code id_token');
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
        response_type: 'code id_token',
        scope: 'openid foo bar',
        code_challenge: 'code_challenge',
        code_challenge_method: 'plain',
        state: 'client_state',
        nonce: 'nonce',
      };
    });

    it('should throw when not providing a "code_challenge" parameter.', async () => {
      Reflect.deleteProperty(parameters, 'code_challenge');

      const session = <Session>{};
      const consent = <Consent>{ scopes: ['openid', 'foo', 'bar'] };

      await expect(responseType.handle(parameters, session, consent)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "code_challenge".', state: 'client_state' })
      );
    });

    it('should throw when providing an unsupported "code_challenge_challenge" parameter.', async () => {
      Reflect.set(parameters, 'code_challenge_method', 'unknown');

      const session = <Session>{};
      const consent = <Consent>{ scopes: ['openid', 'foo', 'bar'] };

      await expect(responseType.handle(parameters, session, consent)).rejects.toThrow(
        new InvalidRequestException({
          description: 'Unsupported code_challenge_method "unknown".',
          state: 'client_state',
        })
      );
    });

    it('should throw when requesting "query" as the "response_mode".', async () => {
      Reflect.set(parameters, 'response_mode', 'query');

      const session = <Session>{};
      const consent = <Consent>{ scopes: ['openid', 'foo', 'bar'] };

      await expect(responseType.handle(parameters, session, consent)).rejects.toThrow(
        new InvalidRequestException({
          description: 'Invalid response_mode "query" for response_type "code id_token".',
          state: 'client_state',
        })
      );
    });

    it('should throw when not providing a "nonce" parameter.', async () => {
      Reflect.deleteProperty(parameters, 'nonce');

      const session = <Session>{};
      const consent = <Consent>{ scopes: ['openid', 'foo', 'bar'] };

      await expect(responseType.handle(parameters, session, consent)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "nonce".', state: 'client_state' })
      );
    });

    it('should throw if the scope "openid" is not provided.', async () => {
      const session = <Session>{};
      const consent = <Consent>{ scopes: ['foo', 'bar'] };

      await expect(responseType.handle(parameters, session, consent)).rejects.toThrow(
        new InvalidRequestException({ description: 'Missing required scope "openid".', state: 'client_state' })
      );
    });

    it('should create a code id token authorization response.', async () => {
      const session = <Session>{};
      const consent = <Consent>{ scopes: ['openid', 'foo', 'bar'] };

      authorizationCodeServiceMock.create.mockResolvedValueOnce(<AuthorizationCode>{ code: 'authorization_code' });
      idTokenHandlerMock.generateIdToken.mockResolvedValueOnce('id_token');

      await expect(responseType.handle(parameters, session, consent)).resolves.toStrictEqual<
        CodeAuthorizationResponse & IdTokenAuthorizationResponse
      >({
        code: 'authorization_code',
        id_token: 'id_token',
        state: 'client_state',
      });
    });
  });
});
