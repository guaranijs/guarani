import { AuthorizationCode } from '../../lib/entities/authorization-code';
import { Client } from '../../lib/entities/client';
import { User } from '../../lib/entities/user';
import { InvalidRequestException } from '../../lib/exceptions/invalid-request.exception';
import { Request } from '../../lib/http/request';
import { PkceMethod } from '../../lib/pkce/pkce-method';
import { SupportedResponseMode } from '../../lib/response-modes/types/supported-response-mode';
import { CodeResponseType } from '../../lib/response-types/code.response-type';
import { AuthorizationCodeResponse } from '../../lib/response-types/types/authorization-code.response';
import { SupportedResponseType } from '../../lib/response-types/types/supported-response-type';
import { AuthorizationCodeService } from '../../lib/services/authorization-code.service';

const pkceMethods: jest.Mocked<PkceMethod>[] = [
  { name: 'plain', verify: jest.fn() },
  { name: 'S256', verify: jest.fn() },
];

const authorizationCodeServiceMock: jest.Mocked<AuthorizationCodeService> = {
  findAuthorizationCode: jest.fn(),
  createAuthorizationCode: jest.fn(async (params, scopes, client, user): Promise<AuthorizationCode> => {
    return {
      token: 'code',
      redirectUri: 'https://example.com/callback',
      scopes,
      codeChallenge: params.code_challenge,
      codeChallengeMethod: params.code_challenge_method ?? null,
      audience: client.id,
      isRevoked: false,
      issuedAt: new Date(),
      validAfter: new Date(),
      expiresAt: new Date(Date.now() + 300000),
      client,
      user,
    };
  }),
  revokeAuthorizationCode: jest.fn(),
};

const responseType = new CodeResponseType(pkceMethods, authorizationCodeServiceMock);

const client: Client = {
  id: 'client_id',
  secret: 'client_secret',
  scopes: ['foo', 'bar', 'baz'],
  authenticationMethod: 'client_secret_basic',
  responseTypes: ['code'],
  grantTypes: ['authorization_code'],
  redirectUris: ['https://example.com/callback'],
};

const user: User = { id: 'user_id' };

describe('Code Response Type', () => {
  describe('constructor', () => {
    it('should reject not providing any PKCE Methods.', () => {
      expect(() => new CodeResponseType([], <any>{})).toThrow(TypeError);
    });
  });

  describe('name', () => {
    it('should have "code" as its name.', () => {
      expect(responseType.name).toBe<SupportedResponseType>('code');
    });
  });

  describe('defaultResponseMode', () => {
    it('should have "query" as its default Response Mode.', () => {
      expect(responseType.defaultResponseMode).toBe<SupportedResponseMode>('query');
    });
  });

  describe('checkParameters()', () => {
    it('should reject not providing a "code_challenge" parameter.', () => {
      // @ts-expect-error Testing a private method.
      expect(() => responseType.checkParameters({})).toThrow(InvalidRequestException);
    });

    it('should reject providing an unsupported "code_challenge_method".', () => {
      // @ts-expect-error Testing a private method; unsupported pkce method.
      expect(() => responseType.checkParameters({ code_challenge: '', code_challenge_method: 'unknown' })).toThrow(
        InvalidRequestException
      );
    });
  });

  describe('createAuthorizationResponse()', () => {
    const request = new Request({ body: {}, headers: {}, method: 'get', query: {} });

    beforeEach(() => {
      Reflect.set(request, 'query', {});
    });

    it('should reject not providing a "code_challenge".', async () => {
      await expect(responseType.createAuthorizationResponse(request, client, user)).rejects.toThrow(
        InvalidRequestException
      );
    });

    it('should reject not providing a supported "code_challenge_method".', async () => {
      request.query.code_challenge_method = 'unknown';
      await expect(responseType.createAuthorizationResponse(request, client, user)).rejects.toThrow(
        InvalidRequestException
      );
    });

    it('should create an Authorization Code Response.', async () => {
      Object.assign(request.query, {
        redirect_uri: 'https://example.com/callback',
        scope: 'foo bar',
        code_challenge: 'challenge',
        code_challenge_method: 'plain',
      });

      await expect(
        responseType.createAuthorizationResponse(request, client, user)
      ).resolves.toMatchObject<AuthorizationCodeResponse>({ code: 'code' });
    });

    it('should create an Authorization Code Response and pass the State unmodified.', async () => {
      Object.assign(request.query, {
        redirect_uri: 'https://example.com/callback',
        scope: 'foo bar',
        code_challenge: 'challenge',
        code_challenge_method: 'plain',
        state: 'client-state',
      });

      await expect(
        responseType.createAuthorizationResponse(request, client, user)
      ).resolves.toMatchObject<AuthorizationCodeResponse>({ code: 'code', state: 'client-state' });
    });
  });
});
