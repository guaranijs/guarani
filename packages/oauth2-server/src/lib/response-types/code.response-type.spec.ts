import { DependencyInjectionContainer } from '@guarani/di';

import { AuthorizationCode } from '../entities/authorization-code.entity';
import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { User } from '../entities/user.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { CodeAuthorizationRequest } from '../messages/code.authorization-request';
import { CodeAuthorizationResponse } from '../messages/code.authorization-response';
import { PkceInterface } from '../pkce/pkce.interface';
import { PKCE } from '../pkce/pkce.token';
import { AuthorizationCodeServiceInterface } from '../services/authorization-code.service.interface';
import { AUTHORIZATION_CODE_SERVICE } from '../services/authorization-code.service.token';
import { CodeResponseType } from './code.response-type';

const client = <Client>{ id: 'client_id' };
const user = <User>{ id: 'user_id' };

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
    it('should reject not providing any pkce methods.', () => {
      expect(() => new CodeResponseType(<AuthorizationCodeServiceInterface>authorizationCodeServiceMock, [])).toThrow(
        TypeError
      );
    });
  });

  describe('name', () => {
    it('should have "code" as its name.', () => {
      expect(responseType.name).toBe('code');
    });
  });

  describe('defaultResponseMode', () => {
    it('should have "query" as its default response mode.', () => {
      expect(responseType.defaultResponseMode).toBe('query');
    });
  });

  describe('handle()', () => {
    let parameters: CodeAuthorizationRequest;

    beforeEach(() => {
      parameters = { response_type: 'code', client_id: '', redirect_uri: '', scope: 'foo bar', code_challenge: '' };
    });

    it('should reject not providing a "code_challenge" parameter.', async () => {
      Reflect.deleteProperty(parameters, 'code_challenge');

      const consent = <Partial<Consent>>{ client, parameters, user };

      await expect(responseType.handle(<Consent>consent)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "code_challenge".' })
      );
    });

    it('should reject providing an unsupported "code_challenge_method".', async () => {
      Reflect.set(parameters, 'code_challenge_method', 'unknown');

      const consent = <Partial<Consent>>{ client, parameters, user };

      await expect(responseType.handle(<Consent>consent)).rejects.toThrow(
        new InvalidRequestException({ description: 'Unsupported code_challenge_method "unknown".' })
      );
    });

    it('should create a code authorization response.', async () => {
      const expected: CodeAuthorizationResponse = { code: 'authorization_code', state: undefined };
      const consent = <Partial<Consent>>{ client, parameters, user };

      authorizationCodeServiceMock.create.mockResolvedValueOnce(<AuthorizationCode>{ code: 'authorization_code' });

      await expect(responseType.handle(<Consent>consent)).resolves.toStrictEqual(expected);
    });

    it('should create a code authorization response and pass the state unmodified.', async () => {
      Reflect.set(parameters, 'state', 'client-state');

      const expected: CodeAuthorizationResponse = { code: 'authorization_code', state: 'client-state' };
      const consent = <Partial<Consent>>{ client, parameters, user };

      authorizationCodeServiceMock.create.mockResolvedValueOnce(<AuthorizationCode>{ code: 'authorization_code' });

      await expect(responseType.handle(<Consent>consent)).resolves.toStrictEqual(expected);
    });
  });
});
