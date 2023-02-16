import { DependencyInjectionContainer } from '@guarani/di';

import { AuthorizationCode } from '../entities/authorization-code.entity';
import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { User } from '../entities/user.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { AuthorizationRequest } from '../messages/authorization-request';
import { CodeAuthorizationRequest } from '../messages/code.authorization-request';
import { CodeAuthorizationResponse } from '../messages/code.authorization-response';
import { PkceInterface } from '../pkce/pkce.interface';
import { PKCE } from '../pkce/pkce.token';
import { ResponseMode } from '../response-modes/response-mode.type';
import { AuthorizationCodeServiceInterface } from '../services/authorization-code.service.interface';
import { AUTHORIZATION_CODE_SERVICE } from '../services/authorization-code.service.token';
import { CodeResponseType } from './code.response-type';
import { ResponseType } from './response-type.type';

describe('Code Response Type', () => {
  let responseType: CodeResponseType;

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

    container.bind<AuthorizationCodeServiceInterface>(AUTHORIZATION_CODE_SERVICE).toValue(authorizationCodeServiceMock);
    pkces.forEach((pkce) => container.bind<PkceInterface>(PKCE).toValue(pkce));
    container.bind(CodeResponseType).toSelf();

    responseType = container.resolve(CodeResponseType);
  });

  describe('constructor', () => {
    it('should throw when not providing any pkce methods.', () => {
      expect(() => new CodeResponseType(<AuthorizationCodeServiceInterface>authorizationCodeServiceMock, [])).toThrow(
        TypeError
      );
    });
  });

  describe('name', () => {
    it('should have "code" as its name.', () => {
      expect(responseType.name).toEqual<ResponseType>('code');
    });
  });

  describe('defaultResponseMode', () => {
    it('should have "query" as its default response mode.', () => {
      expect(responseType.defaultResponseMode).toEqual<ResponseMode>('query');
    });
  });

  describe('handle()', () => {
    let parameters: CodeAuthorizationRequest;

    beforeEach(() => {
      parameters = <CodeAuthorizationRequest>{
        response_type: 'code',
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

      const consent = <Consent>{ client, parameters: <AuthorizationRequest>parameters, user };

      await expect(responseType.handle(consent)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "code_challenge".', state: parameters.state })
      );
    });

    it('should throw when providing an unsupported "code_challenge_method".', async () => {
      Reflect.set(parameters, 'code_challenge_method', 'unknown');

      const client = <Client>{ id: 'client_id' };
      const user = <User>{ id: 'user_id' };

      const consent = <Consent>{ client, parameters: <AuthorizationRequest>parameters, user };

      await expect(responseType.handle(consent)).rejects.toThrow(
        new InvalidRequestException({
          description: 'Unsupported code_challenge_method "unknown".',
          state: parameters.state,
        })
      );
    });

    it('should create a code authorization response.', async () => {
      const client = <Client>{ id: 'client_id' };
      const user = <User>{ id: 'user_id' };

      const consent = <Consent>{ client, parameters: <AuthorizationRequest>parameters, user };

      authorizationCodeServiceMock.create.mockResolvedValueOnce(<AuthorizationCode>{ code: 'authorization_code' });

      await expect(responseType.handle(consent)).resolves.toStrictEqual<CodeAuthorizationResponse>({
        code: 'authorization_code',
        state: parameters.state,
      });
    });
  });
});
