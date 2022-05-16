import { AuthorizationCode } from '../../lib/entities/authorization-code';
import { Client } from '../../lib/entities/client';
import { User } from '../../lib/entities/user';
import { InvalidRequestException } from '../../lib/exceptions/invalid-request.exception';
import { CodeAuthorizationParameters } from '../../lib/models/code.authorization-parameters';
import { CodeAuthorizationResponse } from '../../lib/models/code.authorization-response';
import { IPkceMethod } from '../../lib/pkce/pkce-method.interface';
import { CodeResponseType } from '../../lib/response-types/code.response-type';
import { IAuthorizationCodeService } from '../../lib/services/authorization-code.service.interface';
import { ResponseMode } from '../../lib/types/response-mode';
import { ResponseType } from '../../lib/types/response-type';

const authorizationCodeServiceMock: jest.Mocked<Partial<IAuthorizationCodeService>> = {
  createAuthorizationCode: jest.fn().mockImplementation(async (): Promise<AuthorizationCode> => {
    return <AuthorizationCode>{ code: 'authorization_code' };
  }),
};

const pkceMethodsMock: jest.Mocked<IPkceMethod>[] = [
  { name: 'plain', verify: jest.fn() },
  { name: 'S256', verify: jest.fn() },
];

const responseType = new CodeResponseType(<IAuthorizationCodeService>authorizationCodeServiceMock, pkceMethodsMock);

describe('Code Response Type', () => {
  describe('constructor', () => {
    it('should reject not providing any pkce methods.', () => {
      expect(() => new CodeResponseType(<IAuthorizationCodeService>authorizationCodeServiceMock, [])).toThrow(
        TypeError
      );
    });
  });

  describe('name', () => {
    it('should have "code" as its name.', () => {
      expect(responseType.name).toBe<ResponseType>('code');
    });
  });

  describe('defaultResponseMode', () => {
    it('should have "query" as its default response mode.', () => {
      expect(responseType.defaultResponseMode).toBe<ResponseMode>('query');
    });
  });

  describe('handle()', () => {
    // TODO: fix this.
    const client = <Client>{};
    const user = <User>{};

    let parameters: CodeAuthorizationParameters;

    beforeEach(() => {
      parameters = { response_type: 'code', client_id: '', redirect_uri: '', scope: 'foo bar', code_challenge: '' };
    });

    it('should reject not providing a "code_challenge" parameter.', async () => {
      Reflect.deleteProperty(parameters, 'code_challenge');
      await expect(responseType.handle(parameters, client, user)).rejects.toThrow(InvalidRequestException);
    });

    it('should reject providing an unsupported "code_challenge_method".', async () => {
      Reflect.set(parameters, 'code_challenge_method', 'unknown');
      await expect(responseType.handle(parameters, client, user)).rejects.toThrow(InvalidRequestException);
    });

    it('should create a code authorization response.', async () => {
      const expected = <CodeAuthorizationResponse>{ code: 'authorization_code' };
      await expect(responseType.handle(parameters, client, user)).resolves.toStrictEqual(expected);
    });

    it('should create a code authorization response and pass the state unmodified.', async () => {
      Reflect.set(parameters, 'state', 'client-state');
      const expected = <CodeAuthorizationResponse>{ code: 'authorization_code', state: 'client-state' };
      await expect(responseType.handle(parameters, client, user)).resolves.toStrictEqual(expected);
    });
  });
});
