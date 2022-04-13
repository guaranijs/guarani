import { UUID } from '@guarani/uuid';

import { URL } from 'url';

import { AuthorizationCodeEntity } from '../../lib/entities/authorization-code.entity';
import { ClientEntity } from '../../lib/entities/client.entity';
import { UserEntity } from '../../lib/entities/user.entity';
import { InvalidRequestException } from '../../lib/exceptions/invalid-request.exception';
import { Request } from '../../lib/http/request';
import { PkceMethod } from '../../lib/pkce/pkce-method';
import { SupportedResponseMode } from '../../lib/response-modes/types/supported-response-mode';
import { CodeResponseType } from '../../lib/response-types/code.response-type';
import { AuthorizationCodeParameters } from '../../lib/response-types/types/authorization-code.parameters';
import { AuthorizationCodeResponse } from '../../lib/response-types/types/authorization-code.response';
import { SupportedResponseType } from '../../lib/response-types/types/supported-response-type';
import { AuthorizationCodeService } from '../../lib/services/authorization-code.service';

const pkceMethods: PkceMethod[] = [
  { name: 'plain', verify: jest.fn() },
  { name: 'S256', verify: jest.fn() },
];

const authorizationCodeServiceMock = <AuthorizationCodeService>{
  createAuthorizationCode: async (
    params: AuthorizationCodeParameters,
    scopes: string[],
    client: ClientEntity,
    user: UserEntity
  ): Promise<AuthorizationCodeEntity> => {
    const expiration = new Date();
    expiration.setUTCSeconds(expiration.getUTCSeconds() + 300);

    return {
      code: UUID.v4().toString(),
      redirectUri: new URL('https://example.com/callback'),
      scopes,
      codeChallenge: params.code_challenge,
      codeChallengeMethod: params.code_challenge_method,
      isRevoked: false,
      expiresAt: expiration,
      client,
      user,
    };
  },
};

const responseType = new CodeResponseType(pkceMethods, authorizationCodeServiceMock);

const client = <ClientEntity>{
  id: 'client_id',
  secret: 'client_secret',
  scopes: ['foo', 'bar', 'baz'],
  authenticationMethod: 'client_secret_basic',
  responseTypes: ['code'],
  grantTypes: ['authorization_code'],
  redirectUris: [new URL('https://example.com/callback')],
};

const user = <UserEntity>{ id: 'user_id' };

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

  describe('createAuthorizationResponse()', () => {
    let request: Request;

    beforeEach(() => {
      request = new Request({ body: {}, headers: {}, method: 'get', query: {} });
    });

    it('should reject not providing a "code_challenge".', () => {
      expect(responseType.createAuthorizationResponse(request, client, user)).rejects.toThrow(InvalidRequestException);
    });

    it('should reject not providing a supported "code_challenge_method".', () => {
      Reflect.set(request, 'query', { code_challenge_method: 'unknown' });
      expect(responseType.createAuthorizationResponse(request, client, user)).rejects.toThrow(InvalidRequestException);
    });

    it('should create an Authorization Code Response.', () => {
      Reflect.set(request, 'query', {
        redirect_uri: 'https://example.com/callback',
        scope: 'foo bar',
        code_challenge: 'challenge',
        code_challenge_method: 'plain',
      });

      expect(
        responseType.createAuthorizationResponse(request, client, user)
      ).resolves.toMatchObject<AuthorizationCodeResponse>({ code: expect.any(String) });
    });

    it('should create an Authorization Code Response and pass the State unmodified.', () => {
      Reflect.set(request, 'query', {
        redirect_uri: 'https://example.com/callback',
        scope: 'foo bar',
        code_challenge: 'challenge',
        code_challenge_method: 'plain',
        state: 'client-state',
      });

      expect(
        responseType.createAuthorizationResponse(request, client, user)
      ).resolves.toMatchObject<AuthorizationCodeResponse>({ code: expect.any(String), state: 'client-state' });
    });
  });
});
