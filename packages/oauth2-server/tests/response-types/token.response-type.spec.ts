import { secretToken } from '@guarani/utils';

import { URL } from 'url';

import { AccessTokenEntity } from '../../lib/entities/access-token.entity';
import { ClientEntity } from '../../lib/entities/client.entity';
import { UserEntity } from '../../lib/entities/user.entity';
import { InvalidRequestException } from '../../lib/exceptions/invalid-request.exception';
import { SupportedGrantType } from '../../lib/grant-types/types/supported-grant-type';
import { Request } from '../../lib/http/request';
import { SupportedResponseMode } from '../../lib/response-modes/types/supported-response-mode';
import { TokenResponseType } from '../../lib/response-types/token.response-type';
import { SupportedResponseType } from '../../lib/response-types/types/supported-response-type';
import { AccessTokenService } from '../../lib/services/access-token.service';
import { AccessTokenResponse } from '../../lib/types/access-token-response';

const accessTokenServiceMock = <AccessTokenService>{
  createAccessToken: async function (
    _grant: SupportedGrantType,
    scopes: string[],
    client: ClientEntity,
    user: UserEntity
  ): Promise<AccessTokenEntity> {
    return { token: await secretToken(), scopes, isExpired: false, lifetime: 300, createdAt: new Date(), client, user };
  },
};

const responseType = new TokenResponseType(accessTokenServiceMock);

const client = <ClientEntity>{
  id: 'client_id',
  scopes: ['foo', 'bar', 'baz'],
  authenticationMethod: 'none',
  responseTypes: ['token'],
  grantTypes: ['implicit'],
  redirectUris: [new URL('https://example.com/callback')],
};

const user = <UserEntity>{ id: 'user_id' };

describe('Token Response Type', () => {
  describe('name', () => {
    it('should have "token" as its name.', () => {
      expect(responseType.name).toBe<SupportedResponseType>('token');
    });
  });

  describe('defaultResponseMode', () => {
    it('should have "fragment" as its default Response Mode.', () => {
      expect(responseType.defaultResponseMode).toBe<SupportedResponseMode>('fragment');
    });
  });

  describe('createAuthorizationResponse()', () => {
    let request: Request;

    beforeEach(() => {
      request = new Request({ body: {}, headers: {}, method: 'get', query: {} });
    });

    it('should reject using "query" as the "response_mode".', () => {
      Reflect.set(request, 'query', { response_mode: 'query' });
      expect(responseType.createAuthorizationResponse(request, client, user)).rejects.toThrow(InvalidRequestException);
    });

    it('should create an Access Token Response.', () => {
      Reflect.set(request, 'query', { scope: 'foo bar' });
      expect(
        responseType.createAuthorizationResponse(request, client, user)
      ).resolves.toMatchObject<AccessTokenResponse>({
        access_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: 300,
        scope: 'foo bar',
      });
    });

    it('should create an Access Token Response and pass the State unmodified.', () => {
      Reflect.set(request, 'query', { scope: 'foo bar', state: 'client-state' });
      expect(
        responseType.createAuthorizationResponse(request, client, user)
      ).resolves.toMatchObject<AccessTokenResponse>({
        access_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: 300,
        scope: 'foo bar',
        state: 'client-state',
      });
    });
  });
});
